// Netlify Function: regenerar (con streaming)
// Proxy a la API de Anthropic con streaming SSE.
// Esto evita timeouts y permite que el cliente vea la respuesta en vivo.

export default async (req, context) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', { headers: corsHeaders() });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders('application/json')
    });
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY no configurada');
    return new Response(JSON.stringify({ error: 'API key no configurada en el servidor' }), {
      status: 500,
      headers: corsHeaders('application/json')
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: corsHeaders('application/json')
    });
  }

  const { prompt, sessionId } = body;
  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Falta el prompt' }), {
      status: 400,
      headers: corsHeaders('application/json')
    });
  }
  if (prompt.length > 50000) {
    return new Response(JSON.stringify({ error: 'Prompt demasiado largo' }), {
      status: 400,
      headers: corsHeaders('application/json')
    });
  }

  console.log(`[regenerar] Streaming start. Prompt: ${prompt.length} chars, session: ${sessionId || 'none'}`);

  // Llamamos a Anthropic con stream: true
  let anthropicResponse;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      })
    });
  } catch (err) {
    console.error('[regenerar] Fetch error:', err);
    return new Response(JSON.stringify({ error: 'No se pudo conectar a Anthropic: ' + err.message }), {
      status: 502,
      headers: corsHeaders('application/json')
    });
  }

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    console.error('Anthropic API error:', anthropicResponse.status, errorText);
    let userMsg = `API de Anthropic devolvió error ${anthropicResponse.status}.`;
    if (anthropicResponse.status === 401) userMsg = 'API key inválida o revocada.';
    else if (anthropicResponse.status === 429) userMsg = 'Sin saldo o rate limit. Verificá console.anthropic.com.';
    else if (anthropicResponse.status === 400) userMsg = 'Request inválido. ' + errorText.slice(0, 200);
    return new Response(JSON.stringify({ error: userMsg, details: errorText.slice(0, 500) }), {
      status: anthropicResponse.status,
      headers: corsHeaders('application/json')
    });
  }

  // Re-emitimos el stream de Anthropic al cliente.
  // Convertimos el SSE de Anthropic en un formato más simple: text deltas separados por newlines.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicResponse.body.getReader();
      let buffer = '';
      let fullText = '';
      let usage = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const event = JSON.parse(data);
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                const chunk = event.delta.text;
                fullText += chunk;
                // Mandamos el chunk al cliente como JSON-line
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: chunk }) + '\n'));
              } else if (event.type === 'message_delta' && event.usage) {
                usage = { ...usage, ...event.usage };
              } else if (event.type === 'message_start' && event.message?.usage) {
                usage = event.message.usage;
              }
            } catch (parseErr) {
              // Ignorar líneas que no se pueden parsear
            }
          }
        }

        // Final: mandamos un evento de "done" con el usage
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'done',
          fullLength: fullText.length,
          usage
        }) + '\n'));

        console.log(`[regenerar] Stream done. Length: ${fullText.length}, usage: ${JSON.stringify(usage)}`);
        controller.close();
      } catch (err) {
        console.error('[regenerar] Stream error:', err);
        try {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: err.message
          }) + '\n'));
        } catch {}
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders('application/x-ndjson'),
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no'  // No buffering en Netlify
    }
  });
};

function corsHeaders(contentType) {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}
