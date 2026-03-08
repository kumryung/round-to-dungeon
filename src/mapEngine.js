import { TILES, TILE_TYPES } from './data/tiles.js';
import { SETTINGS } from './data/settings.js';

// ─── Grid & Map Generation ───

function getRandomTileByThemeAndType(theme, tileType) {
    let candidates = Object.values(TILES).filter(t => t.theme === theme && t.tileType === tileType);
    if (candidates.length === 0) {
        // Fallback to 'forest' theme if specific theme tiles are missing
        candidates = Object.values(TILES).filter(t => t.theme === 'forest' && t.tileType === tileType);
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function getRandomTileFromPool(theme, allowedTypes, excludeTypes = []) {
    let candidates = Object.values(TILES).filter(t =>
        t.theme === theme &&
        allowedTypes.includes(t.tileType) &&
        !excludeTypes.includes(t.tileType)
    );
    if (candidates.length === 0) {
        // Fallback to 'forest' theme
        candidates = Object.values(TILES).filter(t =>
            t.theme === 'forest' &&
            allowedTypes.includes(t.tileType) &&
            !excludeTypes.includes(t.tileType)
        );
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function getOppositeDirection(dir) {
    const map = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    return map[dir];
}

/**
 * Get all global cell coordinates a tile would occupy at a given position
 */
function getTileFootprint(tileDef, globalRow, globalCol) {
    const coords = [];
    const layout = tileDef.layout;
    for (let r = 0; r < layout.length; r++) {
        for (let c = 0; c < layout[0].length; c++) {
            if (layout[r][c] === 1) {
                coords.push(`${globalRow + r},${globalCol + c}`);
            }
        }
    }
    return coords;
}

/**
 * Check if a tile placement would overlap with already-occupied cells
 */
function checkOverlap(tileDef, globalRow, globalCol, occupiedSet) {
    const footprint = getTileFootprint(tileDef, globalRow, globalCol);
    for (const key of footprint) {
        if (occupiedSet.has(key)) return true;
    }
    return false;
}

/**
 * Mark cells as occupied
 */
function markOccupied(tileDef, globalRow, globalCol, occupiedSet) {
    const footprint = getTileFootprint(tileDef, globalRow, globalCol);
    for (const key of footprint) {
        occupiedSet.add(key);
    }
}

/**
 * Builds a multi-floor dungeon map based on mapData config
 */
export function buildDungeonMap(mapData) {
    const theme = mapData.theme;
    const dungeonMap = {
        mapId: mapData.id,
        theme: theme,
        floors: [],
        currentFloor: 0,
    };

    mapData.floors.forEach(floorConfig => {
        const floorMap = autoGenerateFloor(theme, floorConfig);
        dungeonMap.floors.push(floorMap);
    });

    // Debug: log generated map structure
    console.log('[MapEngine] Built dungeon map:', dungeonMap.mapId);
    dungeonMap.floors.forEach((f, i) => {
        console.log(`  Floor ${i + 1}: grid=${f.gridWidth}x${f.gridHeight}, cells=${f.cells.length}, hub=${f.hubCellIndex}, end=${f.endCellIndex}`);
        // Log a text representation of the grid
        const grid = Array.from({ length: f.gridHeight }, () => Array(f.gridWidth).fill('.'));
        f.cells.forEach(c => {
            const ch = c.isStart ? 'S' : c.isEnd ? 'E' : c.tileType[0].toUpperCase();
            grid[c.gr][c.gc] = ch;
        });
        grid.forEach((row, ri) => {
            console.log(`    ${ri}: ${row.join(' ')}`);
        });
    });

    return dungeonMap;
}

/**
 * Generates a logical grid of cells for a single floor
 */
function autoGenerateFloor(theme, floorConfig) {
    const minTiles = floorConfig.tileCount[0];
    const maxTiles = floorConfig.tileCount[1];
    const targetTiles = Math.floor(Math.random() * (maxTiles - minTiles + 1)) + minTiles;

    // Retry loop for connectivity failures
    const maxGenerationRetries = 10;
    
    for (let tryNum = 1; tryNum <= maxGenerationRetries; tryNum++) {
        const floorMap = tryGenerateFloor(theme, floorConfig, targetTiles, tryNum);
        
        // Final Pathfinding Validation (Hub -> End)
        if (floorMap.hubCellIndex !== undefined && floorMap.endCellIndex !== undefined) {
            if (validatePathExists(floorMap.hubCellIndex, floorMap.endCellIndex, floorMap.adjacency)) {
                console.log(`[MapEngine] ✅ Floor generation successful on try ${tryNum} (Target: ${targetTiles} tiles). Path from Hub to End confirmed.`);
                return floorMap;
            } else {
                console.warn(`[MapEngine] ⚠️ Generation try ${tryNum} failed: Hub and End are not connected.`);
            }
        } else {
            console.warn(`[MapEngine] ⚠️ Generation try ${tryNum} failed: Missing Hub or End cell.`);
        }
    }
    
    console.error(`[MapEngine] ❌ Failed to generate a valid connected floor after ${maxGenerationRetries} attempts.`);
    // Fallback: Just return the last attempt
    return tryGenerateFloor(theme, floorConfig, targetTiles, 0); 
}

/**
 * Attempts one generation pass using a Clockwise Spiral algorithm
 */
function tryGenerateFloor(theme, floorConfig, targetTiles, tryNum) {
    // 1. Initial State
    const occupied = new Set();
    const placedTiles = [];
    const openExits = []; // { sourceTileId, dir, r, c, sourceR, sourceC }
    const validConnections = new Set(); // { "r1,c1-r2,c2" }
    const startTileDef = getRandomTileByThemeAndType(theme, floorConfig.startType);
    if (!startTileDef) throw new Error(`Cannot find start tile for theme ${theme} type ${floorConfig.startType}`);

    placedTiles.push({ 
        id: 'tile_0', 
        def: startTileDef, 
        globalRow: 0, 
        globalCol: 0, 
        isStart: true, 
        isEnd: false,
        connectedExits: new Set(),
        layout: JSON.parse(JSON.stringify(startTileDef.layout))
    });
    markOccupied(startTileDef, 0, 0, occupied);

    // Clockwise direction iteration (top -> right -> bottom -> left)
    const CLOCKWISE_DIRS = ['top', 'right', 'bottom', 'left'];

    function pushExits(placedTile) {
        const { def, globalRow, globalCol } = placedTile;
        const height = def.layout.length;
        const width = def.layout[0].length;

        // Push exits in clockwise order relative to the tile layout loop
        CLOCKWISE_DIRS.forEach(dir => {
            if (def.exits[dir]) {
                def.exits[dir].forEach(exit => {
                    let nextR, nextC;
                    let sourceR, sourceC;
                    if (dir === 'top') { nextR = globalRow - 1; nextC = globalCol + exit.col; sourceR = globalRow; sourceC = globalCol + exit.col; }
                    else if (dir === 'bottom') { nextR = globalRow + height; nextC = globalCol + exit.col; sourceR = globalRow + height - 1; sourceC = globalCol + exit.col; }
                    else if (dir === 'left') { nextR = globalRow + exit.row; nextC = globalCol - 1; sourceR = globalRow + exit.row; sourceC = globalCol; }
                    else if (dir === 'right') { nextR = globalRow + exit.row; nextC = globalCol + width; sourceR = globalRow + exit.row; sourceC = globalCol + width - 1; }
                    
                    openExits.push({ sourceTileId: placedTile.id, dir: dir, r: nextR, c: nextC, sourceR, sourceC });
                });
            }
        });
    }

    pushExits(placedTiles[0]);

    const midTypes = TILE_TYPES.filter(t => t !== 'hub' && t !== 'exit' && t !== 'stairs');
    let currentTiles = 1;

    // 2. Middle Tile placement loop
    while (currentTiles < targetTiles - 1 && openExits.length > 0) {
        // Pop the first exit in queue (acts as BFS spreading outwards)
        const targetExit = openExits.shift();

        // Randomize tile pool order for variety
        const shuffledTypes = [...midTypes].sort(() => Math.random() - 0.5);
        let placed = false;

        for (const midType of shuffledTypes) {
            const nextDefList = Object.values(TILES).filter(t => t.theme === theme && t.tileType === midType);
            nextDefList.sort(() => Math.random() - 0.5); // Shuffle variations of the same type
            
            for (const nextDef of nextDefList) {
                const connectDir = getOppositeDirection(targetExit.dir);
                if (!nextDef.exits[connectDir] || nextDef.exits[connectDir].length === 0) continue;

                // Test every entrance on this face
                for (const entrance of nextDef.exits[connectDir]) {
                    const height = nextDef.layout.length;
                    const width = nextDef.layout[0].length;

                    let globalRow, globalCol;
                    if (connectDir === 'top') { globalRow = targetExit.r; globalCol = targetExit.c - entrance.col; }
                    else if (connectDir === 'bottom') { globalRow = targetExit.r - height + 1; globalCol = targetExit.c - entrance.col; }
                    else if (connectDir === 'left') { globalRow = targetExit.r - entrance.row; globalCol = targetExit.c; }
                    else if (connectDir === 'right') { globalRow = targetExit.r - entrance.row; globalCol = targetExit.c - width + 1; }

                    if (!checkOverlap(nextDef, globalRow, globalCol, occupied)) {
                        markOccupied(nextDef, globalRow, globalCol, occupied);
                        
                        const newTile = {
                            id: `tile_${currentTiles}`,
                            def: nextDef,
                            globalRow: globalRow,
                            globalCol: globalCol,
                            isStart: false,
                            isEnd: false,
                            connectedExits: new Set(),
                            layout: JSON.parse(JSON.stringify(nextDef.layout))
                        };
                        placedTiles.push(newTile);
                        
                        // Register structural connection for pruning
                        const sourceTile = placedTiles.find(pt => pt.id === targetExit.sourceTileId);
                        if (sourceTile) sourceTile.connectedExits.add(targetExit.dir);
                        newTile.connectedExits.add(connectDir);
                        
                        validConnections.add(`${targetExit.sourceR},${targetExit.sourceC}-${targetExit.r},${targetExit.c}`);
                        validConnections.add(`${targetExit.r},${targetExit.c}-${targetExit.sourceR},${targetExit.sourceC}`);
                        
                        pushExits(newTile); // Push new exits to queue
                        
                        currentTiles++;
                        placed = true;
                        break; // Entrance placed
                    }
                }
                if (placed) break; // Variation placed
            }
            if (placed) break; // Type placed
        }
    }

    // 3. Place End Tile (Exit/Stairs)
    const endTileDef = getRandomTileByThemeAndType(theme, floorConfig.endType);
    let endTilePlaced = false;

    if (endTileDef) {
        // Try to place on the very last open exits first (furthest outward edge)
        for (let i = openExits.length - 1; i >= 0; i--) {
            const targetExit = openExits[i];
            const connectDir = getOppositeDirection(targetExit.dir);
            if (endTileDef.exits[connectDir] && endTileDef.exits[connectDir].length > 0) {
                for (const entrance of endTileDef.exits[connectDir]) {
                    const height = endTileDef.layout.length;
                    const width = endTileDef.layout[0].length;
                    let globalRow, globalCol;

                    if (connectDir === 'top') { globalRow = targetExit.r; globalCol = targetExit.c - entrance.col; }
                    else if (connectDir === 'bottom') { globalRow = targetExit.r - height + 1; globalCol = targetExit.c - entrance.col; }
                    else if (connectDir === 'left') { globalRow = targetExit.r - entrance.row; globalCol = targetExit.c; }
                    else if (connectDir === 'right') { globalRow = targetExit.r - entrance.row; globalCol = targetExit.c - width + 1; }

                    if (!checkOverlap(endTileDef, globalRow, globalCol, occupied)) {
                        markOccupied(endTileDef, globalRow, globalCol, occupied);
                        const newTile = {
                            id: 'tile_end',
                            def: endTileDef,
                            globalRow: globalRow,
                            globalCol: globalCol,
                            isStart: false,
                            isEnd: true,
                            connectedExits: new Set(),
                            layout: JSON.parse(JSON.stringify(endTileDef.layout))
                        };
                        placedTiles.push(newTile);
                        
                        const sourceTile = placedTiles.find(pt => pt.id === targetExit.sourceTileId);
                        if (sourceTile) sourceTile.connectedExits.add(targetExit.dir);
                        newTile.connectedExits.add(connectDir);
                        
                        validConnections.add(`${targetExit.sourceR},${targetExit.sourceC}-${targetExit.r},${targetExit.c}`);
                        validConnections.add(`${targetExit.r},${targetExit.c}-${targetExit.sourceR},${targetExit.sourceC}`);
                        
                        endTilePlaced = true;
                        break;
                    }
                }
            }
            if (endTilePlaced) break;
        }

        // 4. Fallback Placement for End Tile (if trapped)
        if (!endTilePlaced && placedTiles.length > 0) {
            console.warn(`[MapEngine] Trapped end tile! Forcing placement for try ${tryNum}.`);
            // Force it down far below to prevent overlapping, although BFS will fail and cause it to retry (which is good)
            const lastTile = placedTiles[placedTiles.length - 1];
            placedTiles.push({
                id: 'tile_end',
                def: endTileDef,
                globalRow: lastTile.globalRow + lastTile.def.layout.length + 5,
                globalCol: lastTile.globalCol,
                isStart: false,
                isEnd: true,
                connectedExits: new Set(),
                layout: JSON.parse(JSON.stringify(endTileDef.layout))
            });
        }
    }

    // 4.4 Cross-link Adjacent Tiles (Create Cycles and Intertwine)
    const MAX_BRIDGE_DIST = 10; // allow stretching paths up to 10 cells to organically intertwine

    const initialTiles = [...placedTiles];
    let bridgeCount = 0;

    initialTiles.forEach(pt => {
        ['top', 'right', 'bottom', 'left'].forEach(dir => {
            if (pt.def.exits[dir] && pt.def.exits[dir].length > 0 && !pt.connectedExits.has(dir)) {
                
                // Track if we successfully bridged from this face
                let faceBridged = false;

                pt.def.exits[dir].forEach(exit => {
                    const height = pt.layout.length;
                    const width = pt.layout[0].length;
                    
                    let startR, startC, exitR, exitC, dr = 0, dc = 0;
                    if (dir === 'top') { startR = pt.globalRow - 1; startC = pt.globalCol + exit.col; exitR = pt.globalRow; exitC = pt.globalCol + exit.col; dr = -1; dc = 0; }
                    else if (dir === 'bottom') { startR = pt.globalRow + height; startC = pt.globalCol + exit.col; exitR = pt.globalRow + height - 1; exitC = pt.globalCol + exit.col; dr = 1; dc = 0; }
                    else if (dir === 'left') { startR = pt.globalRow + exit.row; startC = pt.globalCol - 1; exitR = pt.globalRow + exit.row; exitC = pt.globalCol; dr = 0; dc = -1; }
                    else if (dir === 'right') { startR = pt.globalRow + exit.row; startC = pt.globalCol + width; exitR = pt.globalRow + exit.row; exitC = pt.globalCol + width - 1; dr = 0; dc = 1; }
                    
                    let hitCoords = null;
                    const bridgeCells = [];
                    
                    for (let dist = 0; dist < MAX_BRIDGE_DIST; dist++) {
                        const currR = startR + dr * dist;
                        const currC = startC + dc * dist;
                        
                        // Check if this cell is occupied by ANY '1' cell in ANY tile
                        let hitAny = false;
                        for (const other of placedTiles) {
                            // ignore self for the first few steps to avoid immediate self-collision
                            if (other.id === pt.id && dist < 2) continue; 
                            
                            const r = currR - other.globalRow;
                            const c = currC - other.globalCol;
                            if (r >= 0 && r < other.layout.length && c >= 0 && c < other.layout[0].length) {
                                if (other.layout[r][c] === 1) {
                                    hitAny = true;
                                    break;
                                }
                            }
                        }
                        
                        if (hitAny) {
                            hitCoords = { r: currR, c: currC };
                            break;
                        } else {
                            bridgeCells.push({ r: currR, c: currC });
                        }
                    }
                    
                    if (hitCoords) {
                        // Found another path! Build the bridge cells
                        let prevR = exitR;
                        let prevC = exitC;
                        bridgeCells.forEach(bCell => {
                            placedTiles.push({
                                id: `bridge_${bridgeCount++}`,
                                def: { tileType: 'corridor', theme: theme, exits: {} },
                                globalRow: bCell.r,
                                globalCol: bCell.c,
                                isStart: false,
                                isEnd: false,
                                connectedExits: new Set(),
                                layout: [[1]]
                            });
                            
                            validConnections.add(`${prevR},${prevC}-${bCell.r},${bCell.c}`);
                            validConnections.add(`${bCell.r},${bCell.c}-${prevR},${prevC}`);
                            prevR = bCell.r;
                            prevC = bCell.c;
                        });
                        
                        validConnections.add(`${prevR},${prevC}-${hitCoords.r},${hitCoords.c}`);
                        validConnections.add(`${hitCoords.r},${hitCoords.c}-${prevR},${prevC}`);
                        faceBridged = true;
                    }
                });

                if (faceBridged) {
                    pt.connectedExits.add(dir);
                }
            }
        });
    });

    // 4.5 Prune Unused Exits (To completely eliminate dead-end stumps for perfect path loops)
    placedTiles.forEach(pt => {
        ['top', 'right', 'bottom', 'left'].forEach(dir => {
            if (pt.def.exits && pt.def.exits[dir] && pt.def.exits[dir].length > 0 && !pt.connectedExits.has(dir)) {
                pt.def.exits[dir].forEach(exit => {
                    const h = pt.layout.length;
                    const w = pt.layout[0].length;
                    if (dir === 'top' && exit.col < w) pt.layout[0][exit.col] = 0;
                    else if (dir === 'bottom' && exit.col < w) pt.layout[h - 1][exit.col] = 0;
                    else if (dir === 'left' && exit.row < h) pt.layout[exit.row][0] = 0;
                    else if (dir === 'right' && exit.row < h) pt.layout[exit.row][w - 1] = 0;
                });
            }
        });
    });

    // 5. Build Graph & Return
    return compileFloorData(floorConfig.floor || 1, placedTiles, validConnections);
}

function validatePathExists(startIndex, endIndex, adjacency) {
    if (startIndex === undefined || endIndex === undefined) return false;
    const visited = new Set();
    const queue = [startIndex];
    visited.add(startIndex);

    while (queue.length > 0) {
        const curr = queue.shift();
        if (curr === endIndex) return true;
        
        const neighbors = adjacency[curr] || [];
        for (const next of neighbors) {
            if (!visited.has(next)) {
                visited.add(next);
                queue.push(next);
            }
        }
    }
    return false;
}

function compileFloorData(floorNum, placedTiles, validConnections) {
    const cells = [];
    const cellMap = new Map(); // "r,c" -> cell object

    let minR = Infinity, maxR = -Infinity;
    let minC = Infinity, maxC = -Infinity;

    // 1. Create all cells (skip duplicates at same coordinate)
    placedTiles.forEach(pt => {
        const layout = pt.layout;
        for (let r = 0; r < layout.length; r++) {
            for (let c = 0; c < layout[0].length; c++) {
                if (layout[r][c] === 1) {
                    const gr = pt.globalRow + r;
                    const gc = pt.globalCol + c;
                    const key = `${gr},${gc}`;

                    // Skip duplicate coordinates (shouldn't happen with overlap check, but be safe)
                    if (cellMap.has(key)) continue;

                    minR = Math.min(minR, gr);
                    maxR = Math.max(maxR, gr);
                    minC = Math.min(minC, gc);
                    maxC = Math.max(maxC, gc);

                    const cell = {
                        index: cells.length,
                        tileId: pt.id,
                        tileType: pt.def.tileType,
                        tileDefId: pt.def.id,
                        theme: pt.def.theme,
                        localRow: r,
                        localCol: c,
                        gr: gr,
                        gc: gc,
                        isStart: pt.isStart,
                        isEnd: pt.isEnd,
                        object: null,
                        objectData: null,
                        visibility: 'hidden' // hidden, fog, visible
                    };
                    cells.push(cell);
                    cellMap.set(key, cell);
                }
            }
        }
    });

    // 2. Build adjacency list based on physical proximity (4-way) AND tight tile logic
    const adjacency = {};
    cells.forEach(cell => {
        const neighbors = [];
        const ds = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // top, bottom, left, right
        ds.forEach(d => {
            const nr = cell.gr + d[0];
            const nc = cell.gc + d[1];
            const ncell = cellMap.get(`${nr},${nc}`);
            if (ncell) {
                // Only connect if they belong to the same tile layout, OR explicitly defined cross-tile links
                if (cell.tileId === ncell.tileId) {
                    neighbors.push(ncell.index);
                } else if (validConnections && validConnections.has(`${cell.gr},${cell.gc}-${ncell.gr},${ncell.gc}`)) {
                    neighbors.push(ncell.index);
                }
            }
        });
        adjacency[cell.index] = neighbors;
    });

    // 3. Normalize coordinates so min is 0,0
    cells.forEach(c => {
        c.gr -= minR;
        c.gc -= minC;
    });

    const gridWidth = maxC - minC + 1;
    const gridHeight = maxR - minR + 1;

    // 4. Find the hub cell: prefer the CENTER cell of the start tile
    const startTile = placedTiles.find(pt => pt.isStart);
    let hubCellIndex = 0;
    if (startTile) {
        const layoutH = startTile.def.layout.length;
        const layoutW = startTile.def.layout[0].length;
        const centerR = startTile.globalRow + Math.floor(layoutH / 2);
        const centerC = startTile.globalCol + Math.floor(layoutW / 2);
        const centerKey = `${centerR},${centerC}`;
        // cellMap still has un-normalized coords, but we already normalized the cells.
        // We need to search by un-normalized coords. Let's find by matching gr + minR, gc + minC.
        const found = cells.find(c => (c.gr + minR) === centerR && (c.gc + minC) === centerC);
        if (found) {
            hubCellIndex = found.index;
        } else {
            // Fallback: first cell with isStart
            const fallback = cells.find(c => c.isStart);
            hubCellIndex = fallback ? fallback.index : 0;
        }
    }

    // 5. Find the end cell: prefer center of end tile
    const endTile = placedTiles.find(pt => pt.isEnd);
    let endCellIndex = cells.length - 1;
    if (endTile) {
        const layoutH = endTile.def.layout.length;
        const layoutW = endTile.def.layout[0].length;
        const centerR = endTile.globalRow + Math.floor(layoutH / 2);
        const centerC = endTile.globalCol + Math.floor(layoutW / 2);
        const found = cells.find(c => (c.gr + minR) === centerR && (c.gc + minC) === centerC);
        if (found) {
            endCellIndex = found.index;
        } else {
            const fallback = cells.find(c => c.isEnd);
            endCellIndex = fallback ? fallback.index : cells.length - 1;
        }
    }

    // --- 6. Boss (Guarantee placement on END cell only if it's an exit) ---
    // This assumes 'exit' is the tileType for the end tile that can have a boss.
    // If the end tile is just a regular room, the boss might not be placed here.
    const endCell = cells.find(c => c.index === endCellIndex);
    if (endCell && endCell.tileType === 'exit') { // Assuming 'exit' is the tileType for the end tile
        endCell.object = 'boss';
        endCell.objectData = {
            type: 'boss',
            theme: endCell.theme, // Use the theme of the end cell
            level: floorNum * 2 // Use floorNum for level calculation
        };
    }

    console.log(`[MapEngine] Floor ${floorNum}: hubCell=${hubCellIndex} at (${cells[hubCellIndex]?.gr},${cells[hubCellIndex]?.gc}), endCell=${endCellIndex} at (${cells[endCellIndex]?.gr},${cells[endCellIndex]?.gc})`);

    return {
        floor: floorNum,
        cells,
        adjacency,
        gridWidth,
        gridHeight,
        hubCellIndex,
        endCellIndex
    };
}

export function getAdjacentCells(floorMap, cellIndex) {
    return floorMap.adjacency[cellIndex] || [];
}

// ─── Rendering ───

// Module-level cache of cell DOM elements keyed by cell index
const cellElements = new Map();

export function renderFloorMap(floorMap, container, theme) {
    container.innerHTML = '';
    cellElements.clear();

    // Keep board-container as base class, add board-grid and theme
    container.className = 'board-container board-grid' + (theme ? ` board-theme-${theme}` : '');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${floorMap.gridWidth}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${floorMap.gridHeight}, 1fr)`;

    // Create a physical DOM grid
    const gridArr = Array.from({ length: floorMap.gridHeight }, () => Array(floorMap.gridWidth).fill(null));

    floorMap.cells.forEach(cell => {
        if (cell.gr >= 0 && cell.gr < floorMap.gridHeight && cell.gc >= 0 && cell.gc < floorMap.gridWidth) {
            gridArr[cell.gr][cell.gc] = cell;
        } else {
            console.error(`[MapEngine] Cell ${cell.index} out of bounds: gr=${cell.gr}, gc=${cell.gc}, grid=${floorMap.gridWidth}x${floorMap.gridHeight}`);
        }
    });

    for (let r = 0; r < floorMap.gridHeight; r++) {
        for (let c = 0; c < floorMap.gridWidth; c++) {
            const cell = gridArr[r][c];
            if (cell) {
                const el = createCellElement(cell, floorMap.hubCellIndex, floorMap.endCellIndex);
                container.appendChild(el);
                cellElements.set(cell.index, el); // Cache direct reference
            } else {
                const spacer = document.createElement('div');
                spacer.className = 'board-inner-cell';
                container.appendChild(spacer);
            }
        }
    }



    const playerToken = document.createElement('div');
    playerToken.className = 'player-token';
    playerToken.id = 'playerToken';
    container.appendChild(playerToken);

    // Post-render verification
    const hubIdx = floorMap.hubCellIndex;
    const hubCell = floorMap.cells.find(c => c.index === hubIdx);
    const hubEl = cellElements.get(hubIdx);
    const hubById = document.getElementById(`cell-${hubIdx}`);
    console.log(`[MapEngine] Rendered floor: ${floorMap.gridWidth}x${floorMap.gridHeight} grid, ${floorMap.cells.length} active cells, ${cellElements.size} cached elements`);
    console.log(`[MapEngine] Hub cell index=${hubIdx}, cell exists=${!!hubCell}, gr=${hubCell?.gr}, gc=${hubCell?.gc}, cached element=${!!hubEl}, getElementById=${!!hubById}`);
    if (hubCell && !hubEl) {
        console.error(`[MapEngine] Hub cell ${hubIdx} was NOT rendered! Check if gr/gc is within grid bounds.`);
    }
}

function createCellElement(cell, hubIdx, endIdx) {
    const el = document.createElement('div');
    el.className = `tile tile-${cell.tileType}`;
    el.dataset.index = cell.index;
    el.id = `cell-${cell.index}`;

    if (cell.visibility) {
        el.dataset.visibility = cell.visibility;
    }

    if (cell.isStart) el.classList.add('tile-start');

    // Show icon ONLY on the specific center hub/end cell indices
    if (cell.index === hubIdx) {
        const icon = document.createElement('span');
        icon.className = 'tile-type-icon';
        icon.textContent = '🏠';
        el.appendChild(icon);
    } else if (cell.index === endIdx) {
        const icon = document.createElement('span');
        icon.className = 'tile-type-icon';
        icon.textContent = cell.tileType === 'exit' ? '🚪' : '🪜';
        el.appendChild(icon);
    }

    // Object overlay (monster, chest, event)
    const objEl = document.createElement('span');
    objEl.className = 'tile-object';
    objEl.id = `cell-obj-${cell.index}`;

    if (cell.object) {
        const icons = { monster: '💀', chest: '📦', event: '❓', boss: '👑' };
        objEl.textContent = icons[cell.object] || '';
        el.classList.add(`has-${cell.object}`);
    }

    el.appendChild(objEl);

    return el;
}

export function setTileObject(index, objectType) {
    const cellEl = cellElements.get(index) || document.getElementById(`cell-${index}`);
    if (!cellEl) return;

    const objEl = cellEl.querySelector('.tile-object');
    if (!objEl) return;

    cellEl.classList.remove('has-monster', 'has-chest', 'has-event', 'has-boss');

    if (!objectType) {
        objEl.textContent = '';
        return;
    }

    const icons = { monster: '💀', chest: '📦', event: '❓', boss: '👑' };
    objEl.textContent = icons[objectType] || '';
    cellEl.classList.add(`has-${objectType}`);
}

export function movePlayerToken(index, animate = true) {
    const token = document.getElementById('playerToken');
    const cellEl = cellElements.get(index) || document.getElementById(`cell-${index}`);

    if (!token || !cellEl) {
        console.warn(`[MapEngine] movePlayerToken FAILED: token=${!!token}, cell-${index}=${!!cellEl}, cache size=${cellElements.size}`);
        // Log all cached keys for debugging
        console.warn(`[MapEngine] Cached cell indices: [${[...cellElements.keys()].join(', ')}]`);
        return;
    }

    // Highlight current tile
    document.querySelectorAll('.tile.tile-current').forEach((t) => t.classList.remove('tile-current'));
    cellEl.classList.add('tile-current');

    // Wait for layout to complete
    if (cellEl.offsetWidth === 0 || cellEl.offsetHeight === 0) {
        setTimeout(() => movePlayerToken(index, animate), 50);
        return;
    }

    // offsetLeft/offsetTop are relative to offsetParent (board-grid which has position:relative)
    const left = cellEl.offsetLeft + cellEl.offsetWidth / 2;
    const top = cellEl.offsetTop + cellEl.offsetHeight / 2;

    if (animate) {
        token.style.transition = 'left 0.3s ease, top 0.3s ease';
    } else {
        token.style.transition = 'none';
    }

    token.style.left = `${left}px`;
    token.style.top = `${top}px`;

    console.log(`[MapEngine] Token at cell ${index} -> offset (${left.toFixed(0)}, ${top.toFixed(0)}), cellEl size=${cellEl.offsetWidth}x${cellEl.offsetHeight}`);
}

export function setPlayerPortrait(portrait) {
    const token = document.getElementById('playerToken');
    if (token) token.innerHTML = portrait;
}

export function updateBoardVisibility(cells) {
    cells.forEach(cell => {
        const el = cellElements.get(cell.index) || document.getElementById(`cell-${cell.index}`);
        if (el) {
            el.dataset.visibility = cell.visibility;
        }
    });
}
