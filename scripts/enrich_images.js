const fs = require('fs');

const recovered = JSON.parse(fs.readFileSync('recovered_properties.json', 'utf8'));
const recoveredIds = new Set(recovered.map(p => p.id));

const metaData = fs.readFileSync('wp_postmeta.csv', 'utf8');
const metaRecords = metaData.split(/\r?\n(?=")/);
const thumbIds = {};

metaRecords.forEach(record => {
    const parts = record.split('","');
    if (parts.length > 2) {
        const postId = parts[1].replace(/"/g, '');
        if (recoveredIds.has(postId)) {
            const key = parts[2].replace(/"/g, '');
            if (key === '_thumbnail_id') {
                thumbIds[parts[3].replace(/"/g, '')] = postId;
            }
        }
    }
});

const postsData = fs.readFileSync('wp_posts.csv', 'utf8');
const postRecords = postsData.split(/\r?\n(?=")/);

const imageUrls = {};
postRecords.forEach(record => {
    const idMatch = record.match(/^"(\d+)"/);
    if (idMatch && thumbIds[idMatch[1]]) {
        const parts = record.split('","');
        if (parts.length > 18) {
            const propId = thumbIds[idMatch[1]];
            imageUrls[propId] = parts[18]; // guid usually has the URL
        }
    }
});

recovered.forEach(p => {
    if (imageUrls[p.id]) {
        p.main_image = imageUrls[p.id];
    }
});

fs.writeFileSync('recovered_properties_with_images.json', JSON.stringify(recovered, null, 2));
console.log(`Enriched ${Object.keys(imageUrls).length} properties with main image URLs.`);
