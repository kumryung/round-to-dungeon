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

    // Track all occupied cell coordinates globally to prevent overlaps
    const occupied = new Set();

    // Start by placing the start tile at 0,0
    const startTileDef = getRandomTileByThemeAndType(theme, floorConfig.startType);
    if (!startTileDef) throw new Error(`Cannot find start tile for theme ${theme} type ${floorConfig.startType}`);

    const placedTiles = [];
    placedTiles.push({
        id: 'tile_0',
        def: startTileDef,
        globalRow: 0,
        globalCol: 0,
        isStart: true,
        isEnd: false
    });
    markOccupied(startTileDef, 0, 0, occupied);

    // Valid tile types for the middle of the floor (not hub, not exit, not stairs usually)
    const midTypes = TILE_TYPES.filter(t => t !== 'hub' && t !== 'exit' && t !== 'stairs');

    let currentTiles = 1;

    const openExits = []; // { sourceTileId, dir, r, c }

    function addExits(placedTile) {
        const { def, globalRow, globalCol } = placedTile;
        const height = def.layout.length;
        const width = def.layout[0].length;

        for (const dir in def.exits) {
            def.exits[dir].forEach(exit => {
                let nextR, nextC;
                if (dir === 'top') {
                    nextR = globalRow - 1;
                    nextC = globalCol + exit.col;
                } else if (dir === 'bottom') {
                    nextR = globalRow + height;
                    nextC = globalCol + exit.col;
                } else if (dir === 'left') {
                    nextR = globalRow + exit.row;
                    nextC = globalCol - 1;
                } else if (dir === 'right') {
                    nextR = globalRow + exit.row;
                    nextC = globalCol + width;
                }
                openExits.push({
                    sourceTileId: placedTile.id,
                    dir: dir,
                    r: nextR,
                    c: nextC
                });
            });
        }
    }

    addExits(placedTiles[0]);

    // Add middle tiles
    let attempts = 0;
    const maxAttempts = targetTiles * 20; // prevent infinite loops
    while (currentTiles < targetTiles - 1 && openExits.length > 0 && attempts < maxAttempts) {
        attempts++;
        // Pick a random open exit
        const exitIdx = Math.floor(Math.random() * openExits.length);
        const targetExit = openExits[exitIdx];

        // Pick a random mid tile
        const nextDef = getRandomTileFromPool(theme, midTypes);
        if (!nextDef) continue;

        // Find which local exit on the new tile connects to our open exit's opposite direction
        const connectDir = getOppositeDirection(targetExit.dir);
        if (!nextDef.exits[connectDir] || nextDef.exits[connectDir].length === 0) {
            continue; // Tile doesn't have a matching entrance, skip
        }

        const entrance = nextDef.exits[connectDir][0];
        const height = nextDef.layout.length;
        const width = nextDef.layout[0].length;

        // Calculate globalRow, globalCol based on aligning the entrance to targetExit.r, targetExit.c
        let globalRow, globalCol;

        // The bridge sits exactly at the target open exit cell
        const bridgeR = targetExit.r;
        const bridgeC = targetExit.c;

        if (connectDir === 'top') {
            globalRow = bridgeR + 1;
            globalCol = bridgeC - entrance.col;
        } else if (connectDir === 'bottom') {
            globalRow = bridgeR - height;
            globalCol = bridgeC - entrance.col;
        } else if (connectDir === 'left') {
            globalRow = bridgeR - entrance.row;
            globalCol = bridgeC + 1;
        } else if (connectDir === 'right') {
            globalRow = bridgeR - entrance.row;
            globalCol = bridgeC - width;
        }

        // *** Overlap check – skip if any cell is already occupied ***
        const bridgeDef = { layout: [[1]], exits: {}, tileType: 'corridor' };
        if (checkOverlap(bridgeDef, bridgeR, bridgeC, occupied)) {
            // If we can't build a bridge, remove this exit to prevent infinite loops on a blocked path
            openExits.splice(exitIdx, 1);
            continue;
        }
        if (checkOverlap(nextDef, globalRow, globalCol, occupied)) {
            // Temporary failure, keep the exit in the pool to try a smaller tile next time
            continue;
        }

        // Success! Remove the exit and mark occupied
        openExits.splice(exitIdx, 1);

        markOccupied(bridgeDef, bridgeR, bridgeC, occupied);
        markOccupied(nextDef, globalRow, globalCol, occupied);

        placedTiles.push({
            id: `bridge_${currentTiles}`,
            def: bridgeDef,
            globalRow: bridgeR,
            globalCol: bridgeC,
            isStart: false,
            isEnd: false
        });

        const newTile = {
            id: `tile_${currentTiles}`,
            def: nextDef,
            globalRow: globalRow,
            globalCol: globalCol,
            isStart: false,
            isEnd: false
        };
        placedTiles.push(newTile);
        addExits(newTile);
        currentTiles++;
    }

    // Finally add the end tile
    const endTileDef = getRandomTileByThemeAndType(theme, floorConfig.endType);
    let endTilePlaced = false;

    if (openExits.length > 0 && endTileDef) {
        for (let i = openExits.length - 1; i >= 0; i--) {
            const targetExit = openExits[i];
            const connectDir = getOppositeDirection(targetExit.dir);
            if (endTileDef.exits[connectDir] && endTileDef.exits[connectDir].length > 0) {
                const entrance = endTileDef.exits[connectDir][0];
                const height = endTileDef.layout.length;
                const width = endTileDef.layout[0].length;

                let globalRow, globalCol;

                // The bridge sits exactly at the target open exit cell
                const bridgeR = targetExit.r;
                const bridgeC = targetExit.c;

                if (connectDir === 'top') {
                    globalRow = bridgeR + 1;
                    globalCol = bridgeC - entrance.col;
                } else if (connectDir === 'bottom') {
                    globalRow = bridgeR - height;
                    globalCol = bridgeC - entrance.col;
                } else if (connectDir === 'left') {
                    globalRow = bridgeR - entrance.row;
                    globalCol = bridgeC + 1;
                } else if (connectDir === 'right') {
                    globalRow = bridgeR - entrance.row;
                    globalCol = bridgeC - width;
                }

                // Check overlap for bridge and end tile
                const bridgeDef = { layout: [[1]], exits: {}, tileType: 'corridor' };
                if (checkOverlap(bridgeDef, bridgeR, bridgeC, occupied)) continue;
                if (checkOverlap(endTileDef, globalRow, globalCol, occupied)) continue;

                markOccupied(bridgeDef, bridgeR, bridgeC, occupied);
                markOccupied(endTileDef, globalRow, globalCol, occupied);

                placedTiles.push({
                    id: `bridge_end`,
                    def: bridgeDef,
                    globalRow: bridgeR,
                    globalCol: bridgeC,
                    isStart: false,
                    isEnd: false
                });

                placedTiles.push({
                    id: 'tile_end',
                    def: endTileDef,
                    globalRow: globalRow,
                    globalCol: globalCol,
                    isStart: false,
                    isEnd: true
                });
                endTilePlaced = true;
                break;
            }
        }
    }

    if (!endTilePlaced) {
        // Fallback if no matching connection: place it at offset
        const lastTile = placedTiles[placedTiles.length - 1];
        const fallbackRow = lastTile.globalRow + lastTile.def.layout.length + 2;
        const fallbackCol = lastTile.globalCol;
        // Don't check overlap for fallback — it's a last resort
        placedTiles.push({
            id: 'tile_end',
            def: endTileDef,
            globalRow: fallbackRow,
            globalCol: fallbackCol,
            isStart: false,
            isEnd: true
        });
    }

    // Now, build the logical 1D cell array and adjacency list
    return compileFloorData(floorConfig.floor, placedTiles);
}

function compileFloorData(floorNum, placedTiles) {
    const cells = [];
    const cellMap = new Map(); // "r,c" -> cell object

    let minR = Infinity, maxR = -Infinity;
    let minC = Infinity, maxC = -Infinity;

    // 1. Create all cells (skip duplicates at same coordinate)
    placedTiles.forEach(pt => {
        const layout = pt.def.layout;
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

    // 2. Build adjacency list based on physical proximity (4-way)
    const adjacency = {};
    cells.forEach(cell => {
        const neighbors = [];
        const ds = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // top, bottom, left, right
        ds.forEach(d => {
            const nr = cell.gr + d[0];
            const nc = cell.gc + d[1];
            const ncell = cellMap.get(`${nr},${nc}`);
            if (ncell) {
                neighbors.push(ncell.index);
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
