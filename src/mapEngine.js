// ─── Map Engine ───
// Generates rectangular loop map tiles and renders the board as DOM

import { SETTINGS } from './data/settings.js';

/**
 * Generate tile array for a rectangular loop map.
 * @param {object} mapData - Map data from maps.js
 * @returns {Array<object>} tiles
 */
export function generateTiles(mapData) {
    const totalTiles = mapData.tiles;
    const sideLength = totalTiles / 4;
    const g = sideLength + 1; // gridSize
    // Corners: top-left(0), top-right(g-1), bottom-right(g + g-2), bottom-left(g + 2*(g-1) - 1)
    const corners = [0, g - 1, g + (g - 2), g + 2 * (g - 1) - 1];

    const tiles = [];
    for (let i = 0; i < totalTiles; i++) {
        const tile = {
            index: i,
            type: 'empty',   // empty | start | corner
            object: null,     // null | 'monster' | 'chest' | 'event'
            objectData: null, // extra data for the object
            position: getTilePosition(i, sideLength),
        };

        if (i === 0) {
            tile.type = 'start';
        } else if (corners.includes(i) && i !== 0) {
            tile.type = 'corner';
        }

        tiles.push(tile);
    }

    return tiles;
}

/**
 * Calculate (row, col) position for a tile index on the rectangular loop.
 * The grid is (sideLength+1) × (sideLength+1) = gridSize × gridSize.
 * Perimeter = 4 * (gridSize - 1) = 4 * sideLength tiles.
 *
 * Traversal: top L→R, right T→B, bottom R→L, left B→T.
 *
 * Visual (sideLength=6, gridSize=7, 24 tiles):
 *    0  1  2  3  4  5  6
 *   23                  7
 *   22                  8
 *   21                  9
 *   20                 10
 *   19                 11
 *   18 17 16 15 14 13 12
 */
export function getTilePosition(index, sideLength) {
    const g = sideLength + 1; // gridSize

    // Top edge: g tiles → row=0, col=0..g-1
    if (index < g) {
        return { row: 0, col: index };
    }
    // Right edge: g-1 tiles → col=g-1, row=1..g-1
    if (index < g + (g - 1)) {
        return { row: index - g + 1, col: g - 1 };
    }
    // Bottom edge: g-1 tiles → row=g-1, col=g-2..0
    if (index < g + (g - 1) + (g - 1)) {
        const offset = index - g - (g - 1);
        return { row: g - 1, col: g - 2 - offset };
    }
    // Left edge: g-2 tiles → col=0, row=g-2..1
    const offset = index - g - (g - 1) - (g - 1);
    return { row: g - 2 - offset, col: 0 };
}

/**
 * Render the board into a container element.
 * @param {string} [theme] - Optional map theme class (e.g. 'forest', 'mine')
 */
export function renderBoard(tiles, sideLength, container, theme) {
    const gridSize = sideLength + 1;
    container.innerHTML = '';
    container.className = 'board-grid' + (theme ? ` board-theme-${theme}` : '');
    container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    // Create an empty grid (null = "inside" cells)
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

    // Place tiles into grid
    tiles.forEach((tile) => {
        grid[tile.position.row][tile.position.col] = tile;
    });

    // Render grid cells
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const tile = grid[r][c];
            if (tile) {
                const el = createTileElement(tile);
                container.appendChild(el);
            } else {
                // Inner empty cell
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
}

function createTileElement(tile) {
    const el = document.createElement('div');
    el.className = `tile tile-${tile.type}`;
    el.dataset.index = tile.index;
    el.id = `tile-${tile.index}`;
    // Fog of War visibility
    if (tile.visibility) {
        el.dataset.visibility = tile.visibility;
    }

    // Index label
    const indexLabel = document.createElement('span');
    indexLabel.className = 'tile-index';
    indexLabel.textContent = tile.index;
    el.appendChild(indexLabel);

    // Type icon
    if (tile.type === 'start') {
        const icon = document.createElement('span');
        icon.className = 'tile-type-icon';
        icon.textContent = '🏠';
        el.appendChild(icon);
    } else if (tile.type === 'corner') {
        const icon = document.createElement('span');
        icon.className = 'tile-type-icon';
        icon.textContent = '❓';
        el.appendChild(icon);
    }

    // Object overlay (restoring upon resume)
    const objEl = document.createElement('span');
    objEl.className = 'tile-object';
    objEl.id = `tile-obj-${tile.index}`;

    if (tile.object) {
        const icons = { monster: '💀', chest: '📦', event: '❓' };
        objEl.textContent = icons[tile.object] || '';
        el.classList.add(`has-${tile.object}`);
    }

    el.appendChild(objEl);

    return el;
}

/**
 * Update tile object display.
 */
export function setTileObject(index, objectType) {
    const objEl = document.getElementById(`tile-obj-${index}`);
    const tileEl = document.getElementById(`tile-${index}`);
    if (!objEl || !tileEl) return;

    tileEl.classList.remove('has-monster', 'has-chest', 'has-event');

    if (!objectType) {
        objEl.textContent = '';
        return;
    }

    const icons = { monster: '💀', chest: '📦', event: '❓' };
    objEl.textContent = icons[objectType] || '';
    tileEl.classList.add(`has-${objectType}`);
}

/**
 * Move the player token to a tile with animation.
 */
export function movePlayerToken(index, sideLength, animate = true) {
    const token = document.getElementById('playerToken');
    const tileEl = document.getElementById(`tile-${index}`);
    if (!token || !tileEl) return;

    // Highlight current tile
    document.querySelectorAll('.tile.tile-current').forEach((t) => t.classList.remove('tile-current'));
    tileEl.classList.add('tile-current');

    // Position the token on top of the tile
    const board = token.parentElement;
    const boardRect = board.getBoundingClientRect();
    const tileRect = tileEl.getBoundingClientRect();

    const left = tileRect.left - boardRect.left + tileRect.width / 2;
    const top = tileRect.top - boardRect.top + tileRect.height / 2;

    if (animate) {
        token.style.transition = 'left 0.3s ease, top 0.3s ease';
    } else {
        token.style.transition = 'none';
    }

    token.style.left = `${left}px`;
    token.style.top = `${top}px`;
}

/**
 * Set player portrait on the token.
 */
export function setPlayerPortrait(portrait) {
    const token = document.getElementById('playerToken');
    if (token) token.innerHTML = portrait;
}

/**
 * Update the visibility state of all tiles on the board.
 * @param {Array<object>} tiles - The updated tiles array from dungeonState
 */
export function updateBoardVisibility(tiles) {
    tiles.forEach(tile => {
        const el = document.getElementById(`tile-${tile.index}`);
        if (el) {
            el.dataset.visibility = tile.visibility;
        }
    });
}
