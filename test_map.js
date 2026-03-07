import { buildDungeonMap } from './src/mapEngine.js';
import { MAPS } from './src/data/maps.js';

try {
    const mapData = MAPS[0]; // Forest
    const map = buildDungeonMap(mapData);
    console.log("Map generated:", map.mapId);
    map.floors.forEach((f, i) => {
        console.log(`Floor ${i+1}: gridWidth=${f.gridWidth}, gridHeight=${f.gridHeight}, numCells=${f.cells.length}`);
    });
} catch (e) {
    console.error(e);
}
