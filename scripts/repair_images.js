const fs = require('fs');
const path = require('path');

const jsPath = 'js/propertiesData.js';
const postsPath = 'wp_posts.csv';

console.log('Iniciando reparación de imágenes...');

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
    // 1. Cargar datos actuales
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    const data = JSON.parse(jsContent.replace('const propertiesData = ', '').replace(/;$/, ''));
    console.log(`Procesando ${data.length} propiedades.`);

    // 2. Mapear adjuntos de WordPress
    const postsData = fs.readFileSync(postsPath, 'utf8');
    const records = postsData.split(/\r?\n(?=")/);
    const attachmentMap = {}; // parentId -> [urls]

    records.forEach((record, index) => {
        if (index === 0) return;
        const row = parseCSVLine(record);
        if (row.length > 20) {
            const id = row[0];
            const parentId = row[17];
            const guid = row[18];
            const type = row[20];

            if (type === 'attachment' && parentId && parentId !== '0') {
                if (!attachmentMap[parentId]) attachmentMap[parentId] = [];
                attachmentMap[parentId].push(guid);
            }
        }
    });
    console.log(`Mapeados adjuntos para ${Object.keys(attachmentMap).length} objetos.`);

    // 3. Reparar y Estandarizar
    let repairedCount = 0;
    const finalData = data.map(p => {
        // Unificar dominio y forzar HTTPS
        const fixUrl = (url) => {
            if (!url) return '';
            // Si es relativa, intentar inferir (aunque es difícil sin fecha)
            if (!url.startsWith('http')) {
                // Si ya falló, no podemos hacer mucho sin más info, 
                // pero si tenemos el mapa de adjuntos lo usaremos luego
                return url;
            }
            return url.replace(/http:\/\/c1960610\.ferozo\.com/g, 'https://www.danielbrarda.com.ar')
                .replace(/http:\/\/danielbrarda\.com\.ar/g, 'https://www.danielbrarda.com.ar')
                .replace(/https:\/\/danielbrarda\.com\.ar/g, 'https://www.danielbrarda.com.ar');
        };

        // Si no tiene imágenes o las que tiene no funcionan (son relativas)
        if (!p.imagenes || p.imagenes.length === 0 || (p.imagenes[0] && !p.imagenes[0].url.startsWith('http'))) {
            if (attachmentMap[p.id]) {
                p.imagenes = attachmentMap[p.id].map((url, idx) => ({
                    id: `${p.id}_img_${idx}`,
                    url: fixUrl(url)
                }));
                repairedCount++;
            }
        } else {
            // Arreglar URLs existentes
            p.imagenes = p.imagenes.map(img => ({
                ...img,
                url: fixUrl(img.url)
            }));
        }

        // También arreglar el campo 'imagen' si existe
        if (p.imagen) p.imagen = fixUrl(p.imagen);

        return p;
    });

    // 4. Guardar
    const output = `const propertiesData = ${JSON.stringify(finalData, null, 2)};`;
    fs.writeFileSync(jsPath, output);
    console.log(`\n¡Reparación completada!`);
    console.log(`Propiedades con nuevas imágenes encontradas: ${repairedCount}`);
    console.log(`Archivo ${jsPath} actualizado.`);

} catch (err) {
    console.error('Error:', err);
}
