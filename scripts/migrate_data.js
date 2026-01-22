const fs = require('fs');
const path = require('path');

// Use paths relative to this script's directory
const rootDir = path.join(__dirname, '..');
const propertiesDataPath = path.join(rootDir, 'js', 'propertiesData.js');
const outputDir = path.join(rootDir, 'data');
const outputPath = path.join(outputDir, 'properties.json');

console.log(`Reading data from: ${propertiesDataPath}`);

try {
    const propertiesDataContent = fs.readFileSync(propertiesDataPath, 'utf8');

    // Extract the array using cleaning logic
    const jsonString = propertiesDataContent
        .replace('const propertiesData =', '')
        .trim()
        .replace(/;$/, '');

    const data = JSON.parse(jsonString);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Successfully migrated ${data.length} properties to ${outputPath}`);
} catch (error) {
    console.error('Error during migration:', error);
}
