import fs from 'fs';
import ko from './src/locales/ko.js';

const eventsText = fs.readFileSync('src/data/events.js', 'utf8');
const regex = /(?:nameKey|descKey|labelKey|logKey):\s*'([^']+)'/g;
const keys = new Set();
let match;
while ((match = regex.exec(eventsText)) !== null) {
    keys.add(match[1]);
}

const missing = [];
for (const key of keys) {
    const parts = key.split('.');
    let current = ko;
    let found = true;
    for (const part of parts) {
        if (current && current[part] !== undefined) {
            current = current[part];
        } else {
            found = false;
            break;
        }
    }
    if (!found) missing.push(key);
}
console.log('---MISSING_KEYS_START---');
console.log(JSON.stringify(missing, null, 2));
console.log('---MISSING_KEYS_END---');

