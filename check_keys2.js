const fs = require('fs');
const eventsText = fs.readFileSync('c:/Work/round-the-dungeon/src/data/events.js', 'utf8');
const koText = fs.readFileSync('c:/Work/round-the-dungeon/src/locales/ko.js', 'utf8');

const regex = /(?:nameKey|descKey|labelKey|logKey):\s*'([^']+)'/g;
const keys = new Set();
let match;
while ((match = regex.exec(eventsText)) !== null) {
    keys.add(match[1]);
}

const missing = [];
for (const key of keys) {
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];

    // Check if the exact key string exists in ko.js, e.g., "events.treehouse.name"
    // We already know koText is relatively small (100KB).
    if (!koText.includes(lastPart + ":") &&
        !koText.includes("'" + lastPart + "':") &&
        !koText.includes('"' + lastPart + '":')) {
        missing.push(key);
    }
}

fs.writeFileSync('c:/Work/round-the-dungeon/missing_utf8.json', JSON.stringify(missing, null, 2), 'utf8');
console.log('done');
