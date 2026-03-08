import { TILES } from './src/data/tiles.js';

function checkConnectivity(layout) {
    let startCell = null;
    let totalOnes = 0;
    for (let r = 0; r < layout.length; r++) {
        for (let c = 0; c < layout[r].length; c++) {
            if (layout[r][c] === 1) {
                totalOnes++;
                if (!startCell) startCell = {r, c};
            }
        }
    }

    if (!startCell) return true;

    const visited = new Set();
    const queue = [startCell];
    visited.add(`${startCell.r},${startCell.c}`);

    while (queue.length > 0) {
        const {r, c} = queue.shift();
        
        const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
        for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < layout.length && nc >= 0 && nc < layout[0].length) {
                if (layout[nr][nc] === 1 && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    queue.push({r: nr, c: nc});
                }
            }
        }
    }

    return visited.size === totalOnes ? true : `Connected: ${visited.size}/${totalOnes}`;
}

for (const id in TILES) {
    const tile = TILES[id];
    const status = checkConnectivity(tile.layout);
    if (status !== true) {
        console.log(`Tile ID ${id} (${tile.theme} ${tile.tileType}) disconnected: ${status}`);
    } else {
        // Also check if exits match layout
        for (const dir in tile.exits) {
            tile.exits[dir].forEach(exit => {
                let r, c;
                if (dir === 'top') { r = 0; c = exit.col; }
                if (dir === 'bottom') { r = tile.layout.length - 1; c = exit.col; }
                if (dir === 'left') { r = exit.row; c = 0; }
                if (dir === 'right') { r = exit.row; c = tile.layout[0].length - 1; }
                
                if (r >= 0 && r < tile.layout.length && c >= 0 && c < tile.layout[0].length) {
                    if (tile.layout[r][c] !== 1) {
                        console.log(`Tile ID ${id} exit warning: ${dir} exit at r=${r}, c=${c} is '0'`);
                    }
                } else {
                     console.log(`Tile ID ${id} exit error: ${dir} exit out of bounds r=${r}, c=${c}`);
                }
            });
        }
    }
}
