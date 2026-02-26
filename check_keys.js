import fs from 'fs';

const eventsText = fs.readFileSync('src/data/events.js', 'utf8');
const koText = fs.readFileSync('src/locales/ko.js', 'utf8');

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

    // Check if the last part of the key exists as a property in ko.js
    const searchRegex = new RegExp(`['"]?` + lastPart + `['"]?\\s*:`, 'i');
    if (!searchRegex.test(koText)) {
        missing.push(key);
    }
}

console.log('---MISSING_KEYS_START---');
console.log(JSON.stringify(missing, null, 2));
console.log('---MISSING_KEYS_END---');
