# Demo 360° — Garufa Parrilla Argentina · ViewMetricaMX

Proyecto estático (HTML/CSS/JS + Three.js vía CDN). Sin backend, sin base de datos, sin login.

## Qué cambió respecto al demo del Nissan

- **Estructura de áreas + puntos**: en vez de una foto por botón, cada área del restaurante (`AREAS` en `script.js`) puede tener una o varias fotos ("puntos"). Cuando un área tiene más de una, aparecen puntos discretos (●) junto al nombre del área dentro del visor — clic en cualquiera para cambiar de vista sin salir del área.
- **5 áreas**: ENTRADA (1 vista) · CAVA (2 vistas) · SALÓN PRINCIPAL (2 vistas) · INTERIOR (2 vistas) · TOILETS (1 vista).
- **Bug corregido**: en el `script.js` que me compartiste, `userHasInteracted` y `lastInteraction` se usaban sin declararse (`let`), lo que lanzaba un error silencioso en cada fotograma del render loop y probablemente era la causa real de la pantalla negra que tuvimos que perseguir tanto tiempo en el demo del Nissan. Aquí quedan declaradas correctamente.
- **Fotos optimizadas**: las 8 imágenes originales pesaban entre 1.7MB y 32MB (3 de ellas eran de 11,904×5,952px — el mismo tamaño que causó el problema de renderizado antes). Todas se redujeron a 4096×2048px, ~0.7-1MB cada una.

## WhatsApp

Ya está configurado con el número que traía tu `index.html` (528714005421) y un mensaje ajustado a Garufa. Si necesitas cambiarlo, edita el inicio de `script.js`:

```js
const WHATSAPP_NUMBER = "528714005421";
```

## Logo

Tu `index.html` más reciente usaba `assets/viewmetrica-logo.png` como logo en el header. No tengo ese archivo, así que usé el logo de texto (círculo + "VIEWMETRICA MX") del demo original. Si quieres el logo en imagen, súbeme `viewmetrica-logo.png` y lo integro.

## Publicar

Mismas tres opciones de siempre (Netlify Drop, GitHub Pages, Vercel) — instrucciones completas en el README del proyecto del Nissan si las necesitas de nuevo.

## Estructura

```
viewmetrica-garufa-demo/
├── index.html
├── style.css
├── script.js
└── assets/
    ├── garufa-parrilla-argentina-torreon-entrada_360.jpg
    ├── garufa-parrilla-argentina-torreon-interior_cava_360.jpg
    ├── garufa-parrilla-argentina-torreon-interior_cava01_360.jpg
    ├── garufa-parrilla-argentina-torreon-interior_principal_360.jpg
    ├── garufa-parrilla-argentina-torreon-interior_principal_01_360.jpg
    ├── garufa-parrilla-argentina-torreon-interior01_360.jpg
    ├── garufa-parrilla-argentina-torreon-interior02_360.jpg
    └── garufa-parrilla-argentina-torreon-toilets_360.jpg
```
