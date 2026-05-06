# 🔧 Setup: Regeneración automática con API de Anthropic

Esta guía te lleva paso a paso para activar los botones **⚡ Regenerar automático** que evitan tener que copiar/pegar prompts en Claude.ai.

**Tiempo total: ~10 minutos**

---

## Paso 1: Crear cuenta en Anthropic y conseguir API key

1. Andá a **https://console.anthropic.com**
2. Click en **"Sign up"** y registrate con tu email (o con Google)
3. Vas a tener que verificar email y agregar número de teléfono
4. Una vez adentro, andá a **Settings → Billing → Plans & billing**
5. Click en **"Add credits"** y cargá un mínimo de **$5 USD** con tarjeta
   - Esto te dura meses para tu uso. Calculá ~$0.10 por regeneración
   - Anthropic NO cobra suscripción, solo pagás lo que consumís
6. Después, andá a **Settings → API keys**
7. Click **"Create Key"**
8. Nombre: `plan-comida` (cualquiera está bien)
9. **Copiá la key** que te dan — empieza con `sk-ant-...`
   ⚠️ Solo se muestra una vez, copiala bien. Si la perdés, creás una nueva.

---

## Paso 2: Configurar la key en Netlify

1. Andá a **https://app.netlify.com** → entrá a tu sitio (el de plan-comida)
2. Click en **"Site configuration"** (o "Site settings")
3. En el menú lateral: **"Environment variables"**
4. Click en **"Add a variable"** → **"Add a single variable"**
5. Completá:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Values:** pegá la key que copiaste en el paso 1 (la que empieza con `sk-ant-...`)
   - **Scopes:** dejá los defaults (Functions)
6. Click **"Create variable"**

---

## Paso 3: Subir los archivos nuevos a Netlify

Desde el zip nuevo (`plan-comida.zip`), tenés estos archivos:

```
plan-comida/
├── index.html              ← actualizado
├── manifest.json
├── sw.js                   ← actualizado (cache v10)
├── icon-192.png
├── icon-512.png
├── netlify.toml            ← NUEVO (config de Netlify)
└── netlify/
    └── functions/
        └── regenerar.js    ← NUEVO (la function)
```

**Importante**: la estructura de carpetas tiene que mantenerse. La carpeta `netlify/functions/regenerar.js` es la que hace la magia.

**Para subir:**

1. En Netlify, andá a la pestaña **"Deploys"** de tu sitio
2. Arrastrá la carpeta entera (descomprimida) al drop zone que dice "Drag and drop your site folder here"
3. Esperá ~30 segundos. Netlify detecta la function automáticamente y la deploya
4. Cuando termine, deberías ver en los logs algo tipo:
   - "Function regenerar created"
   - "Site deployed"

---

## Paso 4: Probar

1. Abrí la app en tu celular (cerrala y reabrila para que tome la nueva versión)
2. Andá a la pestaña **"↻ Regenerar"**
3. Tocá **"⚡ Regenerar automático"**
4. Esperá 30-60 segundos
5. Tendría que aparecerte un modal con el menú nuevo generado por Claude

Si funciona: ¡felicitaciones, todo listo!

---

## Si algo no anda

### "Error al regenerar el menú: HTTP 500" o "API key no configurada"

- Verificá que la variable `ANTHROPIC_API_KEY` está en Netlify (paso 2)
- Asegurate de que el nombre es **exactamente** `ANTHROPIC_API_KEY` (mayúsculas y guion bajo)
- Después de agregarla, **redeployá** el sitio: en Netlify → Deploys → Trigger deploy → "Deploy site"

### "HTTP 401" o "invalid API key"

- La key está mal copiada. Volvé a console.anthropic.com → API keys → creá una nueva → pegala en Netlify

### "HTTP 429" o "rate limit"

- Estás haciendo demasiadas llamadas seguidas. Esperá 1 minuto y probá de nuevo

### "credit balance is too low"

- Te quedaste sin saldo. Andá a console.anthropic.com → Billing → Add credits

### Problema de conexión / Failed to fetch

- ¿La app está abierta en `localhost`? Las functions solo funcionan en el deploy de Netlify
- Verificá que hay internet
- Verificá en Netlify → Functions que `regenerar` aparece en la lista de funciones deployadas

---

## Cuánto te va a salir

Aproximadamente:

- **Regenerar menú** (semanas 1+2 con recetas): ~$0.08-0.15 por vez
- **Plan semanal con tu pantry**: ~$0.05-0.10 por vez
- **Receta combinada**: ~$0.02-0.05 por vez

Si regenerás cada 2 semanas + 2-3 planes/recetas por mes:
**~$0.50-1.00 USD por mes total.**

Podés monitorear el gasto en console.anthropic.com → Usage.

---

## Tip de seguridad

Si alguna vez compartís la URL de la app con mucha gente, considerá:

1. **Rotar la key** cada cierto tiempo (eliminás la vieja en console.anthropic.com y creás una nueva)
2. **Setear un límite mensual** en Anthropic: Settings → Billing → "Set usage limit"

Esto te protege de un escenario hipotético donde alguien abuse del botón Regenerar.
