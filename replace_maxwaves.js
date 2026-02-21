import fs from 'fs';
const path = 'c:/Work/round-the-dungeon/src/data/maps.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/tiles:\s*(\d+),\s*maxWave:\s*(\d+),/g, (match, p1, p2) => {
    const tiles = parseInt(p1);
    // User requested max tier map (approx 60 tiles) to require ~100 dice rolls.
    // Average dice roll is 2.5 (1d4). Total distance for 100 rolls = 250 tiles.
    // 250 / 60 = ~4.16 waves.
    // So maxWave should scale to about 4 or 5 at the high end.
    // Formula: Math.max(3, Math.floor(tiles / 12)) 
    // Tiles 20-47 -> 3 waves (60-141 distance, ~24-56 rolls)
    // Tiles 48-59 -> 4 waves (192-236 distance, ~76-94 rolls)
    // Tiles 60-64 -> 5 waves (300-320 distance, ~120-128 rolls)
    const wave = Math.max(3, Math.floor(tiles / 12));
    return "tiles: " + tiles + ",\n        maxWave: " + wave + ",";
});

fs.writeFileSync(path, content, 'utf8');
console.log("Updated maps.js with ~100 roll balanced maxWaves");
