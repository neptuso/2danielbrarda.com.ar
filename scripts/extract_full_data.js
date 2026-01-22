const fs = require('fs');
const path = require('path');

const postsPath = 'wp_posts.csv';
const metaPath = 'wp_postmeta.csv';
const outputPath = 'data/listado_completo_con_descripciones.json';

console.log('Iniciando extracción masiva...');

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

// Un parser más robusto que maneje comillas dobles y saltos de línea dentro de campos
function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { // Escaped quote ""
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
    const postsData = fs.readFileSync(postsPath, 'utf8');
    // Split logic for multi-line CSV: a quote followed by ID and author... hard to split by newline
    // Actually, wp_posts.csv records usually start with "ID","author"
    const postRecords = postsData.split(/\r?\n(?=")/);

    const descriptions = {};
    const titles = {};

    console.log(`Analizando ${postRecords.length} potenciales registros en wp_posts...`);

    postRecords.forEach((record, index) => {
        if (index === 0) return; // Header
        const row = parseCSVLine(record);
        if (row.length > 20) {
            const id = row[0];
            const content = row[4];
            const title = row[5];
            const type = row[20];

            if (type === 'property') {
                descriptions[id] = cleanHTML(content);
                titles[id] = title;
            }
        }
    });

    console.log(`Identificadas ${Object.keys(descriptions).length} propiedades.`);

    const metaData = fs.readFileSync(metaPath, 'utf8');
    const metaRecords = metaData.split(/\r?\n(?=")/);
    const propertiesMeta = {};

    console.log('Procesando metadatos...');

    metaRecords.forEach((record, index) => {
        if (index === 0) return;
        const row = parseCSVLine(record);
        if (row.length >= 4) {
            const postId = row[1];
            if (descriptions[postId]) {
                if (!propertiesMeta[postId]) propertiesMeta[postId] = {};
                const key = row[2];
                const val = row[3];

                if (key === 'REAL_HOMES_property_bedrooms') propertiesMeta[postId].dormitorios = val;
                if (key === 'REAL_HOMES_property_bathrooms') propertiesMeta[postId].banos = val;
                if (key === 'REAL_HOMES_property_garage') propertiesMeta[postId].garajes = val;
                if (key === 'REAL_HOMES_property_size') propertiesMeta[postId].superficie = val;
                if (key === 'REAL_HOMES_property_price') propertiesMeta[postId].precio = val;
                if (key === 'REAL_HOMES_property_address') propertiesMeta[postId].direccion = val;
                if (key === 'REAL_HOMES_property_location') propertiesMeta[postId].coordenadas = val;
            }
        }
    });

    const finalData = [];
    for (let id in descriptions) {
        const meta = propertiesMeta[id] || {};
        finalData.push({
            id: id,
            titulo: titles[id],
            descripcion: descriptions[id],
            precio: meta.precio || '',
            direccion: meta.direccion || '',
            coordenadas: meta.coordenadas || '',
            dormitorios: meta.dormitorios || '',
            banos: meta.banos || '',
            garajes: meta.garajes || '',
            superficie: meta.superficie || ''
        });
    }

    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    console.log(`Generado: ${outputPath} con ${finalData.length} entradas.`);

    const example = finalData.find(p => p.id === '21458');
    if (example) {
        console.log('\n--- EXTRACCIÓN EXITOSA ---');
        console.log(`ID: ${example.id}`);
        console.log(`Título: ${example.titulo}`);
        console.log(`Descripción: ${example.descripcion.substring(0, 100)}...`);
    }

} catch (err) {
    console.error(err);
}
