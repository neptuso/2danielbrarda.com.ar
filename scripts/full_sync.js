const fs = require('fs');
const path = require('path');

const originalJsonPath = 'data/listado_propiedades_2025-12-30.json';
const postsPath = 'wp_posts.csv';
const metaPath = 'wp_postmeta.csv';
const outputJsPath = 'js/propertiesData.js';

console.log('Iniciando sincronización completa de datos...');

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
    let allProperties = [];
    if (fs.existsSync(originalJsonPath)) {
        allProperties = JSON.parse(fs.readFileSync(originalJsonPath, 'utf8'));
    }
    const propMap = {};
    allProperties.forEach(p => propMap[p.id] = p);
    console.log(`Cargadas ${allProperties.length} propiedades base.`);

    // 2. Cargar Descripciones y NUEVAS propiedades de CSV
    const postsData = fs.readFileSync(postsPath, 'utf8');
    const postRecords = postsData.split(/\r?\n(?=")/);
    let newCount = 0;
    let descCount = 0;

    postRecords.forEach((record, index) => {
        if (index === 0) return;
        const row = parseCSVLine(record);
        if (row.length > 20) {
            const id = row[0];
            const content = row[4];
            const title = row[5];
            const type = row[20];

            if (type === 'property') {
                if (!propMap[id]) {
                    // Es una propiedad nueva!
                    const newProp = {
                        id: id,
                        titulo: title,
                        descripcion: cleanHTML(content),
                        estado_publicacion: row[7],
                        imagenes: []
                    };
                    allProperties.push(newProp);
                    propMap[id] = newProp;
                    newCount++;
                } else {
                    // Actualizar descripción de existente
                    propMap[id].descripcion = cleanHTML(content);
                    descCount++;
                }
            }
        }
    });
    console.log(`Encontradas ${descCount} descripciones para existentes y ${newCount} propiedades nuevas.`);

    // 3. Cargar Metadatos de CSV
    const metaData = fs.readFileSync(metaPath, 'utf8');
    const metaRecords = metaData.split(/\r?\n(?=")/);

    metaRecords.forEach((record, index) => {
        if (index === 0) return;
        const row = parseCSVLine(record);
        if (row.length >= 4) {
            const postId = row[1];
            if (propMap[postId]) {
                const key = row[2];
                const val = row[3];
                const p = propMap[postId];

                if (key === 'REAL_HOMES_property_bedrooms') p.dormitorios = val;
                if (key === 'REAL_HOMES_property_bathrooms') p.banos = val;
                if (key === 'REAL_HOMES_property_garage') p.garajes = val;
                if (key === 'REAL_HOMES_property_size') p.superficie_m2 = val;
                if (key === 'REAL_HOMES_property_price') p.precio = val;
                if (key === 'REAL_HOMES_property_address') p.direccion = val;
                if (key === 'REAL_HOMES_property_location') p.coordenadas = val;
            }
        }
    });

    // 4. Guardar resultado final
    const finalJs = `const propertiesData = ${JSON.stringify(allProperties, null, 2)};`;
    fs.writeFileSync(outputJsPath, finalJs);
    console.log(`\n¡Sincronización terminada! Archivo ${outputJsPath} actualizado.`);
    console.log(`Total propiedades finales: ${allProperties.length}`);

} catch (err) {
    console.error('Error:', err);
}
