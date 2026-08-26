# 🪄 Escuela de Magia: En busca de la Varita Encantada

Juego educativo de matemáticas para niños. React 18 + Vite + Tailwind CSS.

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

Abre http://localhost:5173 en el navegador. El juego funciona tanto en
horizontal como en vertical, en móvil, tablet y escritorio.

## Build para producción

```bash
npm run build
```

Los archivos quedan en `/dist`. Sirve la carpeta con cualquier servidor estático (Netlify, Vercel, GitHub Pages, etc.).

## Preview del build

```bash
npm run preview
```

## Fondos opcionales

Coloca imágenes en `/public/backgrounds/` con los nombres `floor-01.jpg` hasta `floor-12.jpg` (ratio 16:9, 1920×1080px). Si no existen, el juego usa fondos CSS animados automáticamente.

Prompts para generarlas con IA están en `docs/arquitectura-juego.md` (Anexo B).

## Estructura del proyecto

```
src/
  context/GameContext.jsx   → Estado global + localStorage
  data/
    skins.js                → 60 ítems de ropa y complementos
    jokes.js                → 25 chistes del Director Mago
    levels.js               → Config de 12 plantas del castillo
  engine/mathEngine.js      → Generador de preguntas matemáticas
  components/               → Componentes reutilizables
  screens/                  → Pantallas del juego
```
