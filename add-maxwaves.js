import fs from 'fs';
const path = 'c:/Work/round-the-dungeon/src/data/maps.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/tiles:\s*(\d+),/g, (match, p1) => {
    const tiles = parseInt(p1);
    const wave = Math.max(3, Math.round(tiles / 4));
    return "tiles: " + tiles + ",\n        maxWave: " + wave + ",";
});

fs.writeFileSync(path, content, 'utf8');
console.log("Updated maps.js with maxWaves");
