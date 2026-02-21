import fs from 'fs';
import { EVENTS_GENERAL, EVENTS_THEME } from './src/data/events.js';

async function extractKeys() {
    const allEvents = [...EVENTS_GENERAL, ...Object.values(EVENTS_THEME).flat()];
    const requiredKeys = new Set();

    allEvents.forEach(e => {
        if (e.nameKey) requiredKeys.add(e.nameKey);
        if (e.descKey) requiredKeys.add(e.descKey);
        if (e.choices) {
            e.choices.forEach(c => {
                if (c.labelKey) requiredKeys.add(c.labelKey);
                if (c.outcomes) {
                    c.outcomes.forEach(o => {
                        if (o.logKey) requiredKeys.add(o.logKey);
                    });
                }
            });
        }
    });

    const missingFromKo = [];
    const koRaw = fs.readFileSync('./src/locales/ko.js', 'utf8');

    for (const key of requiredKeys) {
        if (!koRaw.includes(key.split('.').pop() + '\"') && !koRaw.includes(key.split('.').pop() + '\'') && !koRaw.includes(key.split('.').pop() + ':')) {
            missingFromKo.push(key);
        }
    }

    // Build nested object
    const tree = {};
    for (const k of missingFromKo) {
        // k is like 'events.for_beast.name'
        const parts = k.split('.');
        if (parts[0] === 'events') {
            const eventId = parts[1];
            const prop = parts[2];
            if (!tree[eventId]) tree[eventId] = {};
            tree[eventId][prop] = `TBD_${eventId}_${prop}`;
        }
    }

    // Format map
    let formatted = '';
    for (const [eventId, props] of Object.entries(tree)) {
        formatted += `            ${eventId}: {\n`;
        for (const [prop, val] of Object.entries(props)) {
            formatted += `                ${prop}: "${val}",\n`;
        }
        formatted += `            },\n`;
    }

    fs.writeFileSync('missing_keys.json', formatted);
    console.log('Saved ' + missingFromKo.length + ' missing keys to missing_keys.json');
}
extractKeys().catch(console.error);
