# Daniel Brarda Inmobiliaria - Gestión de Catálogo

Este proyecto es una plataforma web moderna para la visualización y gestión de propiedades inmobiliarias. Cuenta con un sistema automatizado para recuperar y enriquecer datos directamente desde exportaciones de WordPress (CSV).

## 📋 Descripción del Proyecto

La aplicación permite visualizar un catálogo de propiedades con mapas interactivos, filtros avanzados y fichas de detalle. Lo más destacado es su pipeline de datos, que procesa archivos `wp_posts.csv` y `wp_postmeta.csv` para reconstruir la base de datos de propiedades, incluyendo:
- Descripciones completas (previamente ocultas).
- Metadatos técnicos (habitaciones, baños, superficies).
- Coordenadas geográficas exactas.
- Integración directa con WhatsApp para consultas.

## 🛠️ Requerimientos del Sistema

Para ejecutar este proyecto necesitas tener instalado:
- **Node.js** (Versión 14 o superior recomendada).
- **NPM** (Incluido con Node.js).
- Un navegador moderno (Chrome, Edge, Firefox).

## ⚙️ Estructura de Datos (Pipeline)

El proyecto utiliza un flujo de datos en tres etapas:
1. **Fuentes:** Archivos `.csv` exportados de WordPress en la raíz.
2. **Procesamiento:** Script `scripts/full_sync.js` que limpia HTML, une tablas y genera JSON.
3. **Frontend:** Archivo `js/propertiesData.js` que sirve como motor de datos para la web.

## 🚀 Cómo Ejecutar el Proyecto

Sigue estos pasos en tu terminal (PowerShell o CMD):

### 1. Preparación
Si es la primera vez que ejecutas el proyecto, instala las dependencias:
```powershell
npm install
```

### 2. Sincronización de Datos (Importante)
Cada vez que actualices los archivos CSV o quieras asegurarte de que el catálogo esté al día con las descripciones completas, ejecuta:
```powershell
npm run sync
```
*Este comando consolidará las 154 propiedades detectadas actualmente.*

### 3. Ejecución del Servidor
Para ver la web localmente:
```powershell
npm start
```
Luego accede a: [http://localhost:3000](http://localhost:3000)

## 🛠️ Scripts Disponibles (`npm run ...`)

- `npm start`: Inicia el servidor de producción con Express.
- `npm run dev`: Inicia el servidor en modo desarrollo (se reinicia al hacer cambios).
- **`npm run sync`**: El comando principal para procesar los CSV y actualizar el catálogo.
- `npm run extract`: Extrae solo los datos básicos (ID y Título) a un JSON intermedio.

---
*Desarrollado para Daniel Brarda Servicios & Propiedades.*
