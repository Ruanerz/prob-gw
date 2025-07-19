# prob-gw

Este repositorio contiene una colección de páginas estáticas relacionadas con Guild Wars 2. Ahora se incluye un sencillo sistema de build basado en **Webpack** para agrupar todos los scripts de cada página.

## Instalación

1. Asegúrate de tener Node.js instalado.
2. Instala las dependencias del proyecto:

```bash
npm install
```

## Generar los bundles

Ejecuta el comando de build para crear los archivos en `dist/`:

```bash
npm run build
```

Se generará un archivo `core.js` con la funcionalidad común y un bundle por página. Por ejemplo:

- `dist/core.js`
- `dist/item.bundle.js`
- `dist/compare-craft.bundle.js`

## Uso en las páginas

Las plantillas HTML se han actualizado para cargar únicamente los bundles necesarios. Un ejemplo en `item.html`:

```html
<script defer src="dist/core.js"></script>
<script defer src="dist/item.bundle.js"></script>
```

Con esto se reduce drásticamente el número de etiquetas `<script>` en cada página y las importaciones se simplifican.
