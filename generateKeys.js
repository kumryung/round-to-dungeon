import fs from 'fs';
import { EVENTS_GENERAL, EVENTS_THEME } from './src/data/events.js';

async function generateFullEventTree() {
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

    const tree = {};
    for (const k of requiredKeys) {
        const parts = k.split('.');
        if (parts[0] === 'events') {
            const eventId = parts[1];
            const prop = parts[2];
            if (!tree[eventId]) tree[eventId] = {};
            tree[eventId][prop] = `TBD_${eventId}_${prop}`;
        }
    }

    let formatted = '        events: {\n';
    for (const [eventId, props] of Object.entries(tree)) {
        formatted += `            ${eventId}: {\n`;
        for (const [prop, val] of Object.entries(props)) {
            formatted += `                ${prop}: "${val}",\n`;
        }
        formatted += `            },\n`;
    }
    formatted += '        },\n';

    fs.writeFileSync('full_events_block.txt', formatted);
    console.log('Saved full events block');
}
generateFullEventTree().catch(console.error);
