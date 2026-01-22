const fs = require('fs');

// 1. Get IDs from JSON
const jsonData = JSON.parse(fs.readFileSync('data/listado_propiedades_2025-12-30.json', 'utf8'));
const existingIds = new Set(jsonData.map(p => p.id.toString()));

console.log(`Existing properties in JSON: ${existingIds.size}`);

// 2. Get IDs from wp_posts.csv
const postsData = fs.readFileSync('wp_posts.csv', 'utf8');
const records = postsData.split(/\r?\n(?=")/);

const missingProperties = [];
const searchTerms = ['Brasil', 'Uruguay', 'DIAMOND', 'Roosevelt'];

records.forEach(record => {
    // Check if it's a "property" post_type
    if (record.includes(',"property",')) {
        const idMatch = record.match(/^"(\d+)"/);
        if (idMatch) {
            const id = idMatch[1];
            if (!existingIds.has(id)) {
                // It's missing from the JSON!
                missingProperties.push({
                    id,
                    raw: record
                });
            }
        }
    }
});

console.log(`\nFound ${missingProperties.length} properties in wp_posts NOT in JSON.`);
console.log(`Filtering missing ones for: ${searchTerms.join(', ')}`);

const interestingMissing = [];
missingProperties.forEach(p => {
    if (searchTerms.some(term => p.raw.toLowerCase().includes(term.toLowerCase()))) {
        interestingMissing.push(p.id);
    }
});

console.log(`\nInteresting Missing IDs: ${interestingMissing.join(', ')}`);

// Let's get more details for these interesting missing ones
if (interestingMissing.length > 0) {
    const metaData = fs.readFileSync('wp_postmeta.csv', 'utf8');
    const metaRecords = metaData.split(/\r?\n(?=")/);

    const collection = {};
    interestingMissing.forEach(id => collection[id] = {});

    metaRecords.forEach(record => {
        const parts = record.split('","');
        if (parts.length > 2) {
            const postId = parts[1].replace(/"/g, '');
            if (collection[postId]) {
                const key = parts[2].replace(/"/g, '');
                let val = parts.slice(3).join('","').replace(/"$/, '').replace(/^"/, '');
                collection[postId][key] = val;
            }
        }
    });

    interestingMissing.forEach(id => {
        const p = collection[id];
        console.log(`\n--- Missing Property ID ${id} ---`);
        console.log(`Address: ${p['REAL_HOMES_property_address'] || 'N/A'}`);
        console.log(`Location: ${p['REAL_HOMES_property_location'] || 'N/A'}`);
        const pStr = JSON.stringify(p).toLowerCase();
        const searchHit = searchTerms.filter(t => pStr.includes(t.toLowerCase())).join(', ');
        console.log(`Search Hit: ${searchHit || 'N/A'}`);
    });
}
