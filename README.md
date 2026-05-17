# 3D Generator

Offline-fähiger Browser-Generator für 3D-druckbare Teile (STL-Export, Bambu-ready).

## Setup

```bash
npm install
npm run dev
```

## Deployment (Vercel)

1. Repo auf GitHub pushen
2. Vercel → "Add New Project" → GitHub Repo auswählen
3. Framework: **Vite** (wird automatisch erkannt)
4. Deploy → fertig

## Neue Form hinzufügen

Einfach einen neuen Eintrag in `src/shapes/registry.js` einfügen:

```js
meine_form: {
  label: 'Meine Form',
  fields: [
    { id: 'width', label: 'Breite', min: 1, max: 500, default: 20 },
    // weitere Felder ...
  ],
  buildGeometry({ width }) {
    // Three.js Geometrie zurückgeben
    return {
      geometry: new THREE.BoxGeometry(width, width, width),
      positionY: width / 2,
      cameraR: width * 3,
    }
  },
  calcVolume({ width }) {
    return width ** 3
  },
},
```

## Stack

- React 18 + Vite
- Three.js r128 (3D-Rendering + STL-Export)
