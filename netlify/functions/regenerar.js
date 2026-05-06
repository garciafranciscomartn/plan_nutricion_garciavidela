// Netlify Function: regenerar
// Proxy seguro a la API de Anthropic. La API key vive solo en el servidor.
//
// Endpoint: POST /.netlify/functions/regenerar
// Body: { prompt: string, sessionId?: string }
// Returns: { content: string } o { error: string }

exports.handler = async (event) => {
  // Solo permitir POST
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ''
    };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Validar API key configurada
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'API key no configurada en el servidor' })
    };
  }

  // Parsear body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Body inválido' })
    };
  }

  const { prompt, sessionId } = body;
  if (!prompt || typeof prompt !== 'string') {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Falta el prompt' })
    };
  }
  if (prompt.length > 50000) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Prompt demasiado largo' })
    };
  }

  // Llamar a la API de Anthropic
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: `API de Anthropic devolvió error ${response.status}. Verificá tu saldo y tu API key.`,
          details: errorText.slice(0, 500)
        })
      };
    }

    const data = await response.json();
    // Extraer el texto de la respuesta
    const content = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        content,
        usage: data.usage || null,
        sessionId: sessionId || null
      })
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Error interno: ' + err.message })
    };
  }
};

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
