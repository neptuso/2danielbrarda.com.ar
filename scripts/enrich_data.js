const fs = require('fs');
const path = require('path');

const originalJsonPath = 'data/listado_propiedades_2025-12-30.json';
const postsPath = 'wp_posts.csv';
const metaPath = 'wp_postmeta.csv';
const outputJsPath = 'js/propertiesData.js';

console.log('Iniciando enriquecimiento de datos...');

function cleanHTML(html) {
    if (!html) return '';
    return html
        .replace(/<!--.*?-->/g, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim();
}

function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur);
    return result;
}

try {
    // 1. Cargar JSON original
    let allProperties = JSON.parse(fs.readFileSync(originalJsonPath, 'utf8'));
    const propMap = {};
    allProperties.forEach(p => propMap[p.id] = p);
    console.log(`Cargadas ${allProperties.length} propiedades del JSON original.`);

    // 2. Cargar Descripciones de CSV
    const postsData = fs.readFileSync(postsPath, 'utf8');
    const postRecords = postsData.split(/\r?\n(?=")/);
    let descCount = 0;

    postRecords.forEach((record, index) => {
        if (index === 0) return;
        const row = parseCSVLine(record);
        if (row.length > 20) {
            const id = row[0];
            const content = row[4];
            if (propMap[id]) {
                propMap[id].descripcion = cleanHTML(content);
                descCount++;
            }
        }
    });
    console.log(`Encontradas ${descCount} descripciones en el CSV.`);

    // 3. Cargar Metadatos de CSV (solo los que falten o para actualizar)
    const metaData = fs.readFileSync(metaPath, 'utf8');
    const metaRecords = metaData.split(/\r?\n(?=")/);
    let metaCount = 0;

    metaRecords.forEach((record, index) => {
        if (index === 0) return;
        const row = parseCSVLine(record);
        if (row.length >= 4) {
            const postId = row[1];
            if (propMap[postId]) {
                const key = row[2];
                const val = row[3];
                const p = propMap[postId];

                // Solo si el campo está vacío en el JSON original
                if (key === 'REAL_HOMES_property_bedrooms' && !p.dormitorios) p.dormitorios = val;
                if (key === 'REAL_HOMES_property_bathrooms' && !p.banos) p.banos = val;
                if (key === 'REAL_HOMES_property_garage' && !p.garajes) p.garajes = val;
                if (key === 'REAL_HOMES_property_size' && (!p.superficie_m2 && !p.superficie)) p.superficie_m2 = val;
                if (key === 'REAL_HOMES_property_price' && !p.precio) p.precio = val;
                metaCount++;
            }
        }
    });

    // 4. Guardar resultado final
    const finalJs = `const propertiesData = ${JSON.stringify(allProperties, null, 2)};`;
    fs.writeFileSync(outputJsPath, finalJs);
    console.log(`\n¡ÉXITO! Archivo ${outputJsPath} actualizado.`);
    console.log(`Total propiedades preservadas: ${allProperties.length}`);

} catch (err) {
    console.error('Error:', err);
}
