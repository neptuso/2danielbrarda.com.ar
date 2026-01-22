# Sistema de Gestión de Propiedades - Daniel Brarda

Este proyecto consiste en una plataforma web para la visualización y gestión de propiedades inmobiliarias, con un motor de búsqueda dinámico, integración con mapas y un pipeline de migración de datos desde WordPress.

## 📂 Estructura del Proyecto

- `/data`: Contiene los archivos JSON maestros utilizados por el frontend.
- `/js`: Lógica de la aplicación web (Leaflet maps, filtros de búsqueda).
- `/css`: Estilos visuales de la plataforma.
- `/scripts`: (Propuesto) Herramientas de análisis y recuperación de datos.
- `/img`: Activos visuales y fotografías de propiedades.
- `index.html`, `propiedades.html`, `detalle.html`: Páginas principales de la web.

## 🛠️ Pipeline de Datos

El sistema utiliza datos provenientes de un volcado de WordPress en formato CSV:
1. `wp_posts.csv`: Contiene la información principal de los posts (títulos, estados, tipos).
2. `wp_postmeta.csv`: Contiene la metadata detallada (precios, direcciones, coordenadas).
3. `wp_terms.csv`: Taxonomías y categorías.

### Recuperación de Datos
Se han desarrollado herramientas para identificar inconsistencias entre la base de datos SQL (CSVs) y el listado JSON actual.
- **Script de Recuperación:** Permite extraer propiedades que no fueron exportadas correctamente, especialmente aquellas ubicadas fuera de la región principal (Brasil, Uruguay).

## 🚀 Instalación y Uso

1. Clonar el repositorio.
2. Para el desarrollo local, se recomienda usar un servidor estático:
   ```bash
   # Ejemplo usando Node.js
   node server.js
   ```
3. Los datos pueden actualizarse ejecutando los scripts de migración:
   ```bash
   node migrate_data.js
   ```

## 📝 Notas Técnicas
- **Frontend:** HTML5, CSS3, Vanilla JS.
- **Mapas:** Leaflet.js.
- **Procesamiento de Datos:** Node.js (File System API).
