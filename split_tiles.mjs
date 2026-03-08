import fs from 'fs';
import path from 'path';

// Read the massive tiles.js
const code = fs.readFileSync('src/data/tiles.js', 'utf8');

// We know the structure is:
// export const TILE_TYPES = [...];
// export const TILES = { ... };
// We can use the Function constructor to evaluate it, but we need to strip 'export const'
let evalCode = code.replace(/export const/g, 'const');
evalCode += '\nreturn { TILE_TYPES, TILES };';

// Evaluate robustly
const { TILE_TYPES, TILES } = new Function(evalCode)();

const themes = {};
// Distribute tiles by theme
for (const id in TILES) {
    const t = TILES[id];
    const theme = t.theme || 'common';
    if (!themes[theme]) themes[theme] = {};
    themes[theme][id] = t;
}

// Write out each theme file
for (const theme in themes) {
    const filename = `src/data/tiles/tiles_${theme}.js`;
    let out = `// ─── ${theme.toUpperCase()} Theme Tiles ───\n`;
    out += `export const TILES_${theme.toUpperCase()} = {\n`;
    
    // We want to format layout and exits compactly so it's not a millions lines
    for (const id in themes[theme]) {
        const t = themes[theme][id];
        let layoutStr = '[\n';
        if (t.layout) {
            t.layout.forEach(row => {
                layoutStr += `            [${row.join(',')}],\n`;
            });
            layoutStr += '        ]';
        } else {
            layoutStr = '[]';
        }
        
        let exitsStr = JSON.stringify(t.exits).replace(/"/g, ''); // Simple way, assuming no strings in exits keys/vals
        
        out += `    ${id}: {
        id: ${t.id}, tileType: '${t.tileType}', theme: '${t.theme}', name: '${t.name}', icon: '${t.icon}',
        layout: ${layoutStr},
        exits: ${JSON.stringify(t.exits)},
        eventSpawn: ${JSON.stringify(t.eventSpawn)},
        mobSpawn: ${JSON.stringify(t.mobSpawn)},
    },\n`;
    }
    out += '};\n';
    fs.writeFileSync(filename, out, 'utf8');
    console.log(`Created ${filename} with ${Object.keys(themes[theme]).length} tiles.`);
}

// Rewrite main tiles.js
let newMainJs = `// ─── Constants and Main Tile Registry ───\n`;
newMainJs += `export const TILE_TYPES = ${JSON.stringify(TILE_TYPES, null, 4)};\n\n`;

// Add imports
for (const theme in themes) {
    const ThemeName = theme.toUpperCase();
    newMainJs += `import { TILES_${ThemeName} } from './tiles/tiles_${theme}.js';\n`;
}

newMainJs += `\nexport const TILES = {\n`;
for (const theme in themes) {
    newMainJs += `    ...TILES_${theme.toUpperCase()},\n`;
}
newMainJs += `};\n`;

fs.writeFileSync('src/data/tiles.js', newMainJs, 'utf8');
console.log('Successfully refactored tiles.js');
