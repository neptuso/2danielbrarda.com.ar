const fs = require('fs');

const jsonData = JSON.parse(fs.readFileSync('data/listado_propiedades_2025-12-30.json', 'utf8'));
const existingIds = new Set(jsonData.map(p => p.id.toString()));

const postsData = fs.readFileSync('wp_posts.csv', 'utf8');
const records = postsData.split(/\r?\n(?=")/);

const idsToInspect = ['21207', '22776', '23779', '23801', '24546'];
const collection = {};
idsToInspect.forEach(id => collection[id] = {});

const metaData = fs.readFileSync('wp_postmeta.csv', 'utf8');
const metaRecords = metaData.split(/\r?\n(?=")/);

metaRecords.forEach(record => {
    const parts = record.split('","');
    if (parts.length > 2) {
        const postId = parts[1].replace(/"/g, '');
        if (idsToInspect.includes(postId)) {
            const key = parts[2].replace(/"/g, '');
            let val = parts.slice(3).join('","').replace(/"$/, '').replace(/^"/, '');
            collection[postId][key] = val;
        }
    }
});

records.forEach(record => {
    const idMatch = record.match(/^"(\d+)"/);
    if (idMatch && idsToInspect.includes(idMatch[1])) {
        const parts = record.split('","');
        collection[idMatch[1]].post_title = parts[5];
    }
});

console.log(JSON.stringify(collection, null, 2));
