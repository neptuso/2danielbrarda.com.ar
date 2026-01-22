const fs = require('fs');

const searchTerms = ['Brasil', 'Uruguay', 'DIAMOND', 'Roosevelt'];

function analyzeFile(filename, terms) {
    const data = fs.readFileSync(filename, 'utf8');
    const records = data.split(/\r?\n(?=")/);
    const results = [];
    for (let record of records) {
        if (terms.some(term => record.toLowerCase().includes(term.toLowerCase()))) {
            results.push(record);
        }
    }
    return results;
}

const postMatches = analyzeFile('wp_posts.csv', searchTerms);
const metaMatches = analyzeFile('wp_postmeta.csv', searchTerms);

const postIds = new Set();
postMatches.forEach(record => {
    const idMatch = record.match(/^"(\d+)"/);
    if (idMatch) postIds.add(idMatch[1]);
});

metaMatches.forEach(record => {
    const parts = record.split('","');
    if (parts.length > 1) {
        const postId = parts[1].replace(/"/g, '');
        if (/^\d+$/.test(postId)) postIds.add(postId);
    }
});

const metaData = fs.readFileSync('wp_postmeta.csv', 'utf8');
const metaRecords = metaData.split(/\r?\n(?=")/);

const collection = {};
for (let record of metaRecords) {
    const parts = record.split('","');
    if (parts.length > 2) {
        const postId = parts[1].replace(/"/g, '');
        if (postIds.has(postId)) {
            if (!collection[postId]) collection[postId] = {};
            const key = parts[2].replace(/"/g, '');
            let val = parts.slice(3).join('","').replace(/"$/, '').replace(/^"/, '');
            collection[postId][key] = val;
        }
    }
}

// Get titles from wp_posts
const postsData = fs.readFileSync('wp_posts.csv', 'utf8');
const postRecords = postsData.split(/\r?\n(?=")/);
for (let record of postRecords) {
    const idMatch = record.match(/^"(\d+)"/);
    if (idMatch && postIds.has(idMatch[1])) {
        const parts = record.split('","');
        if (parts.length > 5) {
            if (!collection[idMatch[1]]) collection[idMatch[1]] = {};
            collection[idMatch[1]].title = parts[5];
            collection[idMatch[1]].post_type = parts[20];
        }
    }
}

const finalResults = [];
for (let id in collection) {
    const prop = collection[id];
    const address = prop['REAL_HOMES_property_address'] || '';
    const title = prop['title'] || '';

    // Check if it's really Brasil or Uruguay (not just street name)
    const isBrasil = address.toLowerCase().includes('brasil') || title.toLowerCase().includes('brasil');
    const isUruguay = address.toLowerCase().includes('uruguay') || title.toLowerCase().includes('uruguay');

    // We also want Roosevelt and DIAMOND
    const isRoosevelt = address.toLowerCase().includes('roosevelt') || title.toLowerCase().includes('roosevelt');
    const isDiamond = address.toLowerCase().includes('diamond') || title.toLowerCase().includes('diamond');

    if (isBrasil || isUruguay || isRoosevelt || isDiamond) {
        finalResults.push({
            id,
            title,
            address,
            price: prop['REAL_HOMES_property_price'],
            location: prop['REAL_HOMES_property_location'],
            post_type: prop['post_type']
        });
    }
}

fs.writeFileSync('found_properties.json', JSON.stringify(finalResults, null, 2));
console.log(`Saved ${finalResults.length} properties to found_properties.json`);
console.log(JSON.stringify(finalResults, null, 2));
