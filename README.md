# Plan de Alimentación — Deployment

## Qué es esto
Una PWA (Progressive Web App): una app web que se instala en el celular como app nativa, funciona offline, y se actualiza sola cuando le das un nuevo menú.

## Archivos del proyecto
```
plan-comida/
├── index.html       ← La app (todo en uno)
├── manifest.json    ← Configuración para que se instale como app
├── sw.js            ← Service worker (offline + caché)
├── icon-192.png     ← Ícono para Android
└── icon-512.png     ← Ícono para Android (alta resolución)
```

---

## Opción A — Vercel desde la web (más fácil, sin instalar nada)

Esta es la recomendada. **5 minutos, todo desde el navegador.**

### 1. Crear cuenta en Vercel
- Andá a https://vercel.com/signup
- Sign up **con GitHub** (si tenés) o con email. Es gratis, sin tarjeta.

### 2. Subir los archivos
Vercel tiene una opción para subir un proyecto arrastrando archivos:

**Camino fácil (sin GitHub):**
1. Una vez logueado, andá a https://vercel.com/new
2. Bajá hasta donde dice **"Deploy a template"** o buscá **"Import third-party Git repository"**.
3. Si no aparece directamente la opción de drag & drop, lo más simple es:
   - Crear una cuenta gratis en GitHub (https://github.com)
   - Crear un repositorio nuevo, vacío, llamado `plan-comida`
   - Subir los 5 archivos al repo (botón "Add file → Upload files", arrastrar la carpeta entera)
   - Volver a Vercel → "Import Git Repository" → seleccionar el repo → Deploy

### 3. Esperar el deploy (~30 segundos)
Vercel te va a dar una URL tipo `plan-comida-xyz.vercel.app`. Esa es tu app.

### 4. Instalarla en el celular
**iPhone (Safari):**
1. Abrí la URL en Safari
2. Tocá el botón de "Compartir" (cuadrado con flecha)
3. "Añadir a pantalla de inicio"
4. Listo: queda con ícono propio en el celular

**Android (Chrome):**
1. Abrí la URL en Chrome
2. Te va a aparecer un banner "Instalar app" — tocalo
3. Si no aparece: menú (⋮) → "Instalar app" o "Añadir a pantalla de inicio"

---

## Opción B — Netlify Drop (todavía más simple, sin GitHub)

1. Andá a https://app.netlify.com/drop
2. Crear cuenta gratis con email
3. **Arrastrá la carpeta `plan-comida` entera** al recuadro de la página
4. Listo: te dan una URL en ~10 segundos
5. Para cambiar el subdominio: en el dashboard, "Domain settings" → "Change site name"

Esta es la **más simple** si querés evitarte GitHub. **Recomendada si nunca usaste estas herramientas.**

---

## Opción C — Vercel CLI (si tenés terminal)

```bash
npm install -g vercel
cd plan-comida
vercel
```

Te pide login (con GitHub/email), confirma el directorio, y deploya. Cada cambio futuro es solo `vercel --prod`.

---

## Cómo actualizar el menú cada semana

Cuando me pidas un nuevo menú semanal en Claude, te voy a dar:
1. Un nuevo `index.html` actualizado
2. Lo reemplazás en el repo de GitHub (o lo arrastrás de nuevo a Netlify Drop)
3. La app en el celular se actualiza sola la próxima vez que la abras (gracias al service worker)

---

## Compartir con tu pareja

Una vez deployada, **mandale la URL por WhatsApp**. Que la abra en su celular y la instale igual que vos. Los dos celulares acceden a la misma app. Los tildados en la lista de compras son **locales a cada dispositivo** (cada uno ve sus propios tildados — útil si uno hace una compra y el otro la otra).

---

## Notas técnicas

- **Funciona offline:** una vez que la abrís por primera vez, podés usarla sin internet
- **Datos guardados:** los tildados de la lista de compras se guardan en `localStorage` (en el celular, no en un servidor)
- **No tiene backend:** no se necesita base de datos ni servidor — es 100% estática
- **Costo:** $0 (Vercel y Netlify tienen tier gratis muy generoso para esto)

---

## Si querés ir más allá: sincronizar entre celulares

Como está ahora, los tildados de la lista de compras son por dispositivo. Si querés que vos y tu pareja vean los mismos tildados en tiempo real (útil si estás en el súper y tu pareja quiere agregar algo), avisame y le agrego sincronización con Firebase (gratis hasta cierto uso) o algo similar.
