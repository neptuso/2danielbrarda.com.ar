const fs = require('fs');

function findProperty(pattern) {
    const data = fs.readFileSync('wp_posts.csv', 'utf8');
    const records = data.split('\n"'); // Crude split for multi-line CSV

    for (let record of records) {
        if (record.includes(pattern)) {
            console.log("MATCH FOUND:");
            console.log(record.substring(0, 500));
            console.log("---");
        }
    }
}

findProperty("Brasil");
findProperty("Uruguay");
