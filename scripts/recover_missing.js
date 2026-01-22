const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const jsonPath = path.join(rootDir, 'data', 'listado_propiedades_2025-12-30.json');
const postsPath = path.join(rootDir, 'wp_posts.csv');
const metaPath = path.join(rootDir, 'wp_postmeta.csv');
const outputPath = path.join(rootDir, 'recovered_properties.json');

// 1. Get IDs from JSON
if (!fs.existsSync(jsonPath)) {
    console.error(`JSON file not found: ${jsonPath}`);
    process.exit(1);
}

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const existingIds = new Set(jsonData.map(p => p.id.toString()));

// 2. Load CSVs
console.log('Loading CSV data...');
const postsData = fs.readFileSync(postsPath, 'utf8');
const metaData = fs.readFileSync(metaPath, 'utf8');

const postRecords = postsData.split(/\r?\n(?=")/);
const metaRecords = metaData.split(/\r?\n(?=")/);

// 3. Find missing property IDs
const missingIds = [];
postRecords.forEach(record => {
    if (record.includes(',"property",')) {
        const idMatch = record.match(/^"(\d+)"/);
        if (idMatch) {
            const id = idMatch[1];
            if (!existingIds.has(id)) {
                missingIds.push(id);
            }
        }
    }
});

console.log(`Found ${missingIds.length} missing property IDs.`);

// 4. Extract metadata for missing IDs
const missingMetadata = {};
missingIds.forEach(id => missingMetadata[id] = { id });

metaRecords.forEach(record => {
    const parts = record.split('","');
    if (parts.length > 2) {
        const postId = parts[1].replace(/"/g, '');
        if (missingMetadata[postId]) {
            const key = parts[2].replace(/"/g, '');
            let val = parts.slice(3).join('","').replace(/"$/, '').replace(/^"/, '');
            missingMetadata[postId][key] = val;
        }
    }
});

// 5. Build final objects
const recovered = [];
missingIds.forEach(id => {
    const m = missingMetadata[id];
    const obj = {
        id: id,
        title: "",
        address: m['REAL_HOMES_property_address'] || "",
        price: m['REAL_HOMES_property_price'] || "",
        location: m['REAL_HOMES_property_location'] || ""
    };

    for (let record of postRecords) {
        if (record.startsWith(`"${id}"`)) {
            const parts = record.split('","');
            if (parts.length > 5) {
                obj.title = parts[5];
            }
            break;
        }
    }

    if (obj.title) obj.title = obj.title.split('",')[0].replace(/^"/, '');
    if (obj.address) obj.address = obj.address.split('",')[0].replace(/^"/, '');

    recovered.push(obj);
});

fs.writeFileSync(outputPath, JSON.stringify(recovered, null, 2));

const abroad = recovered.filter(p =>
    p.address.toLowerCase().includes('brasil') ||
    p.address.toLowerCase().includes('uruguay') ||
    p.title.toLowerCase().includes('brasil') ||
    p.title.startsWith('BRICKELL') ||
    p.title.toLowerCase().includes('uruguay') ||
    (p.location && (p.location.startsWith('-27') || p.location.startsWith('-34')))
);

console.log(`\nRecovered ${recovered.length} properties total.`);
console.log(`${abroad.length} properties found in Brasil/Uruguay/Abroad.`);
console.log(`Full list saved to: ${outputPath}`);
