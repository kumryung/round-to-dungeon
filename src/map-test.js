// ─── Map Generation Test Page ───
// Standalone test page for map generation debugging.
// Access via: http://localhost:5173/map-test.html

import './style.css';
import { TILES, TILE_TYPES } from './data/tiles.js';
import { MAPS } from './data/maps.js';
import { buildDungeonMap } from './mapEngine.js';

// ─── State ───
let currentMap = null;
let currentDungeon = null;
let selectedFloor = 0;

// Camera State
let currentScale = 1;
let currentPanX = 0;
let currentPanY = 0;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;
let initialPanX = 0;
let initialPanY = 0;

// Handle edge cases for external mouse release
window.addEventListener('mouseup', () => {
    isDragging = false;
    const vp = document.getElementById('mtGridViewport');
    if (vp) vp.classList.remove('dragging');
});
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startDragX;
    const dy = e.clientY - startDragY;
    currentPanX = initialPanX + dx;
    currentPanY = initialPanY + dy;
    
    const grid = document.getElementById('mtGrid');
    if (grid) grid.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentScale})`;
});

// ─── Utilities ───
function getThemes() {
    const themes = new Set();
    MAPS.forEach(m => themes.add(m.theme));
    return [...themes];
}

function getTileStats() {
    const stats = {};
    Object.values(TILES).forEach(t => {
        if (!stats[t.theme]) stats[t.theme] = {};
        if (!stats[t.theme][t.tileType]) stats[t.theme][t.tileType] = 0;
        stats[t.theme][t.tileType]++;
    });
    return stats;
}

function validateTileLayout(tileDef) {
    // BFS to check all 1-cells are connected
    const layout = tileDef.layout;
    const cells = [];
    for (let r = 0; r < layout.length; r++) {
        for (let c = 0; c < layout[0].length; c++) {
            if (layout[r][c] === 1) cells.push([r, c]);
        }
    }
    if (cells.length === 0) return { connected: true, issues: [] };

    const visited = new Set();
    const q = [cells[0]];
    visited.add(`${cells[0][0]},${cells[0][1]}`);

    while (q.length > 0) {
        const [r, c] = q.shift();
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr, nc = c + dc;
            const key = `${nr},${nc}`;
            if (!visited.has(key) && nr >= 0 && nr < layout.length && nc >= 0 && nc < layout[0].length && layout[nr][nc] === 1) {
                visited.add(key);
                q.push([nr, nc]);
            }
        }
    }

    const issues = [];
    if (visited.size !== cells.length) {
        issues.push(`연결 끊김: ${visited.size}/${cells.length} 셀만 연결됨`);
    }

    // Check exits point to valid edge cells
    for (const dir in tileDef.exits) {
        for (const exit of tileDef.exits[dir]) {
            let r, c;
            if (dir === 'top') { r = 0; c = exit.col; }
            else if (dir === 'bottom') { r = layout.length - 1; c = exit.col; }
            else if (dir === 'left') { r = exit.row; c = 0; }
            else if (dir === 'right') { r = exit.row; c = layout[0].length - 1; }

            if (r !== undefined && c !== undefined) {
                if (r < 0 || r >= layout.length || c < 0 || c >= layout[0].length) {
                    issues.push(`Exit ${dir}: 좌표 범위 초과 (${r},${c})`);
                } else if (layout[r][c] !== 1) {
                    issues.push(`Exit ${dir}: 빈 셀을 가리킴 (${r},${c})`);
                }
            }
        }
    }

    return { connected: visited.size === cells.length, issues };
}

function validateFloorConnectivity(floorMap) {
    // BFS from hub to end
    const { cells, adjacency, hubCellIndex, endCellIndex } = floorMap;
    const visited = new Set();
    const q = [hubCellIndex];
    visited.add(hubCellIndex);

    while (q.length > 0) {
        const curr = q.shift();
        const neighbors = adjacency[curr] || [];
        for (const n of neighbors) {
            if (!visited.has(n)) {
                visited.add(n);
                q.push(n);
            }
        }
    }

    return {
        reachable: visited.has(endCellIndex),
        reachableCells: visited.size,
        totalCells: cells.length,
        isolatedCells: cells.length - visited.size,
    };
}

// ─── Render ───

function renderApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="map-test-page">
        <header class="mt-header">
            <h1>🗺️ Map Test</h1>
            <p class="mt-subtitle">맵 생성 테스트 및 디버깅 도구</p>
        </header>

        <div class="mt-body">
            <aside class="mt-sidebar">
                <div class="mt-panel">
                    <h3>🔍 타일 검증</h3>
                    <div id="tileValidation"></div>
                </div>
            </aside>

            <main class="mt-main">
                <div class="mt-controls">
                    <div class="mt-control-group">
                        <label>맵 선택</label>
                        <select id="mapSelect" class="mt-select">
                            ${MAPS.map(m => `<option value="${m.id}">${m.icon} ${m.name} (Lv.${m.mapLv} / ${m.theme})</option>`).join('')}
                        </select>
                    </div>
                    <div class="mt-control-group">
                        <button id="btnGenerate" class="mt-btn mt-btn-primary">🎲 맵 생성</button>
                        <button id="btnRegenerate" class="mt-btn mt-btn-secondary" disabled>🔄 재생성</button>
                    </div>
                </div>

                <div id="mapResult" class="mt-result"></div>
            </main>
        </div>
        
        <div class="mt-panel mt-footer-panel">
            <h3>📊 타일 데이터 현황</h3>
            <div id="tileStats" class="mt-table-wrapper"></div>
        </div>
    </div>
    `;

    // Bind events
    document.getElementById('btnGenerate').addEventListener('click', generateMap);
    document.getElementById('btnRegenerate').addEventListener('click', generateMap);

    renderTileStats();
    renderTileValidation();
}

function renderTileStats() {
    const container = document.getElementById('tileStats');
    const stats = getTileStats();
    const themes = getThemes();

    let html = '<table class="mt-table"><thead><tr><th>테마</th>';
    const allTypes = TILE_TYPES;
    allTypes.forEach(t => { html += `<th>${t}</th>`; });
    html += '<th>합계</th></tr></thead><tbody>';

    themes.forEach(theme => {
        const themeStats = stats[theme] || {};
        const hasAny = Object.keys(themeStats).length > 0;
        html += `<tr class="${hasAny ? '' : 'mt-row-missing'}">`;
        html += `<td><strong>${theme}</strong></td>`;
        let total = 0;
        allTypes.forEach(type => {
            const count = themeStats[type] || 0;
            total += count;
            const isRequired = ['hub', 'exit', 'stairs', 'corridor'].includes(type);
            const cls = count > 0 ? 'mt-cell-ok' : (isRequired ? 'mt-cell-error' : 'mt-cell-warn');
            html += `<td class="${cls}">${count}</td>`;
        });
        html += `<td><strong>${total}</strong></td></tr>`;
    });

    // Also show themes that maps reference but have no tiles
    const mapThemes = new Set(MAPS.map(m => m.theme));
    mapThemes.forEach(theme => {
        if (!stats[theme]) {
            html += `<tr class="mt-row-missing"><td><strong>${theme}</strong></td>`;
            allTypes.forEach(() => { html += '<td class="mt-cell-error">0</td>'; });
            html += '<td><strong>0</strong></td></tr>';
        }
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderTileValidation() {
    const container = document.getElementById('tileValidation');
    let html = '';
    let hasIssues = false;

    Object.entries(TILES).forEach(([id, tile]) => {
        const result = validateTileLayout(tile);
        if (result.issues.length > 0) {
            hasIssues = true;
            html += `<div class="mt-issue">
                <strong>ID ${id} (${tile.name})</strong>
                <span class="mt-badge mt-badge-theme">${tile.theme}</span>
                <span class="mt-badge">${tile.tileType}</span>
                <ul>${result.issues.map(i => `<li>⚠️ ${i}</li>`).join('')}</ul>
            </div>`;
        }
    });

    if (!hasIssues) {
        html = '<p class="mt-ok">✅ 모든 타일 검증 통과!</p>';
    }

    container.innerHTML = html;
}

function generateMap() {
    const mapId = document.getElementById('mapSelect').value;
    currentMap = MAPS.find(m => m.id === mapId);
    if (!currentMap) return;

    document.getElementById('btnRegenerate').disabled = false;

    try {
        currentDungeon = buildDungeonMap(currentMap);
        selectedFloor = 0;
        
        currentScale = 1;
        currentPanX = 0;
        currentPanY = 0;
        
        renderMapResult();
        setTimeout(centerOnHub, 10);
    } catch (err) {
        const container = document.getElementById('mapResult');
        container.innerHTML = `<div class="mt-error">❌ 생성 실패: ${err.message}</div>`;
        console.error(err);
    }
}

function centerOnHub() {
    if (!currentDungeon) return;
    const floorMap = currentDungeon.floors[selectedFloor];
    const hubCell = floorMap.cells.find(c => c.index === floorMap.hubCellIndex);
    
    if (hubCell) {
        const viewport = document.getElementById('mtGridViewport');
        if (!viewport) return;
        const vRect = viewport.getBoundingClientRect();
        
        // 50px cell + 1px gap = 51px
        const cellX = hubCell.gc * 51 + 25;
        const cellY = hubCell.gr * 51 + 25;
        
        currentScale = 1;
        currentPanX = (vRect.width / 2) - cellX;
        currentPanY = (vRect.height / 2) - cellY;
        
        const grid = document.getElementById('mtGrid');
        if (grid) grid.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentScale})`;
    }
}

function renderMapResult() {
    const container = document.getElementById('mapResult');
    if (!currentDungeon) return;

    // Floor tabs
    let tabsHtml = '<div class="mt-floor-tabs">';
    currentDungeon.floors.forEach((floor, i) => {
        tabsHtml += `<button class="mt-floor-tab ${i === selectedFloor ? 'active' : ''}" data-floor="${i}">${floor.floor}층</button>`;
    });
    tabsHtml += '</div>';

    const floorMap = currentDungeon.floors[selectedFloor];
    const connectivity = validateFloorConnectivity(floorMap);

    // Info panel
    let infoHtml = `
    <div class="mt-info-grid">
        <div class="mt-info-card">
            <span class="mt-info-label">맵</span>
            <span class="mt-info-value">${currentMap.icon} ${currentMap.name}</span>
        </div>
        <div class="mt-info-card">
            <span class="mt-info-label">테마</span>
            <span class="mt-info-value">${currentMap.theme}</span>
        </div>
        <div class="mt-info-card">
            <span class="mt-info-label">그리드 크기</span>
            <span class="mt-info-value">${floorMap.gridWidth} × ${floorMap.gridHeight}</span>
        </div>
        <div class="mt-info-card">
            <span class="mt-info-label">셀 수</span>
            <span class="mt-info-value">${floorMap.cells.length}</span>
        </div>
        <div class="mt-info-card">
            <span class="mt-info-label">Hub → End</span>
            <span class="mt-info-value ${connectivity.reachable ? 'mt-val-ok' : 'mt-val-error'}">
                ${connectivity.reachable ? '✅ 연결됨' : '❌ 끊어짐'}
            </span>
        </div>
        <div class="mt-info-card">
            <span class="mt-info-label">도달 가능 셀</span>
            <span class="mt-info-value ${connectivity.isolatedCells > 0 ? 'mt-val-warn' : 'mt-val-ok'}">
                ${connectivity.reachableCells}/${connectivity.totalCells}
                ${connectivity.isolatedCells > 0 ? ` (${connectivity.isolatedCells}개 고립)` : ''}
            </span>
        </div>
    </div>
    `;

    // Grid render
    const gridHtml = renderGrid(floorMap);

    // Cell list
    let cellListHtml = '<div class="mt-cell-list"><h4>셀 상세 정보</h4><div class="mt-cell-scroll">';
    floorMap.cells.forEach(cell => {
        const adj = floorMap.adjacency[cell.index] || [];
        const tags = [];
        if (cell.isStart) tags.push('<span class="mt-badge mt-badge-start">START</span>');
        if (cell.isEnd) tags.push('<span class="mt-badge mt-badge-end">END</span>');
        if (cell.object) tags.push(`<span class="mt-badge mt-badge-obj">${cell.object}</span>`);

        cellListHtml += `
        <div class="mt-cell-item" data-cell-index="${cell.index}">
            <span class="mt-cell-idx">#${cell.index}</span>
            <span class="mt-cell-pos">(${cell.gr},${cell.gc})</span>
            <span class="mt-cell-type">${cell.tileType}</span>
            <span class="mt-cell-adj">→ [${adj.join(',')}]</span>
            ${tags.join('')}
        </div>`;
    });
    cellListHtml += '</div></div>';

    container.innerHTML = tabsHtml + infoHtml + gridHtml + cellListHtml;

    // Floor tab events
    container.querySelectorAll('.mt-floor-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedFloor = parseInt(tab.dataset.floor);
            renderMapResult();
            setTimeout(centerOnHub, 10);
        });
    });

    // Cell hover highlight
    container.querySelectorAll('.mt-cell-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const idx = item.dataset.cellIndex;
            const gridCell = container.querySelector(`.mt-grid-cell[data-index="${idx}"]`);
            if (gridCell) gridCell.classList.add('mt-highlight');
        });
        item.addEventListener('mouseleave', () => {
            container.querySelectorAll('.mt-grid-cell.mt-highlight').forEach(c => c.classList.remove('mt-highlight'));
        });
    });

    // Viewport Interactions (Pan & Zoom)
    const viewport = document.getElementById('mtGridViewport');
    if (viewport) {
        viewport.addEventListener('mousedown', (e) => {
            // Only left click
            if(e.button !== 0) return;
            isDragging = true;
            startDragX = e.clientX;
            startDragY = e.clientY;
            initialPanX = currentPanX;
            initialPanY = currentPanY;
            viewport.classList.add('dragging');
        });

        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomSensitivity = 0.0015;
            const delta = e.deltaY * zoomSensitivity;
            let newScale = currentScale - delta;
            newScale = Math.max(0.1, Math.min(newScale, 5)); // Allow heavy zoom

            const scaleRatio = newScale / currentScale;
            currentPanX = mouseX - (mouseX - currentPanX) * scaleRatio;
            currentPanY = mouseY - (mouseY - currentPanY) * scaleRatio;
            currentScale = newScale;

            const grid = document.getElementById('mtGrid');
            if (grid) grid.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentScale})`;
        }, { passive: false });
    }

    // Center Hub Event
    const btnCenter = document.getElementById('btnCenterHub');
    if (btnCenter) {
        btnCenter.addEventListener('click', centerOnHub);
    }
}

function renderGrid(floorMap) {
    const { gridWidth, gridHeight, cells, hubCellIndex, endCellIndex, adjacency } = floorMap;

    // Build grid lookup
    const gridArr = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null));
    cells.forEach(cell => {
        if (cell.gr >= 0 && cell.gr < gridHeight && cell.gc >= 0 && cell.gc < gridWidth) {
            gridArr[cell.gr][cell.gc] = cell;
        }
    });

    // Compute BFS path from hub to end for highlighting
    const path = bfsPath(hubCellIndex, endCellIndex, adjacency);
    const pathSet = new Set(path);

    let html = `<div class="mt-grid-container">`;
    html += `<div class="mt-grid-viewport" id="mtGridViewport">`;
    html += `<div class="mt-grid" id="mtGrid" style="grid-template-columns: repeat(${gridWidth}, 50px); grid-template-rows: repeat(${gridHeight}, 50px); transform: translate(${currentPanX}px, ${currentPanY}px) scale(${currentScale});">`;

    for (let r = 0; r < gridHeight; r++) {
        for (let c = 0; c < gridWidth; c++) {
            const cell = gridArr[r][c];
            if (cell) {
                const classes = ['mt-grid-cell'];
                classes.push(`mt-type-${cell.tileType}`);
                if (cell.index === hubCellIndex) classes.push('mt-cell-hub');
                if (cell.index === endCellIndex) classes.push('mt-cell-end');
                if (pathSet.has(cell.index)) classes.push('mt-cell-path');
                if (cell.object) classes.push(`mt-cell-obj-${cell.object}`);

                // Check adjacency for border rendering
                const adj = adjacency[cell.index] || [];
                const adjSet = new Set(adj);
                const hasTop = gridArr[r - 1]?.[c] && adjSet.has(gridArr[r - 1][c].index);
                const hasBottom = gridArr[r + 1]?.[c] && adjSet.has(gridArr[r + 1][c].index);
                const hasLeft = gridArr[r]?.[c - 1] && adjSet.has(gridArr[r][c - 1].index);
                const hasRight = gridArr[r]?.[c + 1] && adjSet.has(gridArr[r][c + 1].index);

                if (!hasTop) classes.push('mt-wall-top');
                if (!hasBottom) classes.push('mt-wall-bottom');
                if (!hasLeft) classes.push('mt-wall-left');
                if (!hasRight) classes.push('mt-wall-right');

                let content = '';
                if (cell.index === hubCellIndex) content = '🏠';
                else if (cell.index === endCellIndex) content = cell.tileType === 'exit' ? '🚪' : '🪜';
                else if (cell.object === 'boss') content = '👑';
                else if (cell.object === 'monster') content = '💀';

                html += `<div class="${classes.join(' ')}" data-index="${cell.index}" title="#${cell.index} ${cell.tileType} (${cell.gr},${cell.gc})">
                    <span class="mt-grid-idx">${cell.index}</span>
                    <span class="mt-grid-icon">${content}</span>
                    <span class="mt-grid-type">${cell.tileType[0].toUpperCase()}</span>
                </div>`;
            } else {
                html += `<div class="mt-grid-empty"></div>`;
            }
        }
    }
    html += '</div>'; // End mt-grid
    
    html += `<button id="btnCenterHub" class="mt-btn-center" title="내 위치 (Hub)로 이동">🎯</button>`;
    html += '</div>'; // End mt-grid-viewport

    // Legend
    html += `
    <div class="mt-legend">
        <span><span class="mt-legend-swatch mt-type-hub"></span> hub</span>
        <span><span class="mt-legend-swatch mt-type-corridor"></span> corridor</span>
        <span><span class="mt-legend-swatch mt-type-arena"></span> arena</span>
        <span><span class="mt-legend-swatch mt-type-storage"></span> storage</span>
        <span><span class="mt-legend-swatch mt-type-lab"></span> lab</span>
        <span><span class="mt-legend-swatch mt-type-rest"></span> rest</span>
        <span><span class="mt-legend-swatch mt-type-shrine"></span> shrine</span>
        <span><span class="mt-legend-swatch mt-type-trap"></span> trap</span>
        <span><span class="mt-legend-swatch mt-type-stairs"></span> stairs</span>
        <span><span class="mt-legend-swatch mt-type-exit"></span> exit</span>
        <span>🟦 경로</span>
    </div>`;

    html += '</div>';
    return html;
}

function bfsPath(start, end, adjacency) {
    const visited = new Map(); // cell -> parent
    const q = [start];
    visited.set(start, null);

    while (q.length > 0) {
        const curr = q.shift();
        if (curr === end) break;
        const neighbors = adjacency[curr] || [];
        for (const n of neighbors) {
            if (!visited.has(n)) {
                visited.set(n, curr);
                q.push(n);
            }
        }
    }

    if (!visited.has(end)) return [];

    // Reconstruct path
    const path = [];
    let curr = end;
    while (curr !== null) {
        path.unshift(curr);
        curr = visited.get(curr);
    }
    return path;
}

// ─── Styles ───
const style = document.createElement('style');
style.textContent = `
/* ─── Override Global Game Styles ─── */
html, body, #app {
    height: auto !important;
    min-height: 100vh;
    overflow: auto !important;
}

/* ─── Map Test Page Styles ─── */
.map-test-page {
    width: 100%;
    min-height: 100vh;
    background: var(--bg-darkest, #0a0a0f);
    color: var(--text, #e0dce8);
    font-family: 'Noto Sans KR', sans-serif;
}

.mt-header {
    text-align: center;
    padding: 20px;
    background: linear-gradient(180deg, #12121c, #0a0a0f);
    border-bottom: 1px solid #2a2a4a;
}
.mt-header h1 {
    font-family: 'Cinzel', serif;
    font-size: 28px;
    color: #d4a843;
    margin: 0;
}
.mt-subtitle {
    color: #8888aa;
    font-size: 13px;
    margin-top: 4px;
}

.mt-body {
    display: flex;
    gap: 16px;
    padding: 16px;
    min-height: 500px;
    max-width: 100vw;
    box-sizing: border-box;
}

.mt-sidebar {
    width: 380px;
    min-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mt-main {
    flex: 1;
    min-width: 0;
}

.mt-panel {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 10px;
    padding: 16px;
}
.mt-footer-panel {
    margin: 16px;
    margin-top: 0;
}
.mt-panel h3 {
    font-family: 'Cinzel', serif;
    font-size: 15px;
    color: #d4a843;
    margin-bottom: 12px;
}

/* ─── Controls ─── */
.mt-controls {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    margin-bottom: 16px;
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 10px;
    padding: 16px;
}
.mt-control-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.mt-control-group label {
    font-size: 12px;
    color: #8888aa;
    font-weight: 500;
}
.mt-select {
    background: #12121c;
    border: 1px solid #2a2a4a;
    color: #e0dce8;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    min-width: 300px;
}
.mt-select:focus { outline: 1px solid #d4a843; }

.mt-btn {
    padding: 8px 20px;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}
.mt-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mt-btn-primary {
    background: linear-gradient(135deg, #d4a843, #f0c850);
    color: #0a0a0f;
    border-color: #d4a843;
}
.mt-btn-primary:hover:not(:disabled) { box-shadow: 0 0 12px rgba(212,168,67,0.4); }
.mt-btn-secondary {
    background: #1a1a2e;
    color: #9370db;
    border-color: #5a3e8a;
}
.mt-btn-secondary:hover:not(:disabled) { background: #22223a; box-shadow: 0 0 8px rgba(147,112,219,0.3); }

/* ─── Table ─── */
.mt-table-wrapper {
    width: 100%;
    overflow-x: auto;
}
.mt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    white-space: nowrap;
}
.mt-table th, .mt-table td {
    padding: 5px 6px;
    border: 1px solid #2a2a4a;
    text-align: center;
}
.mt-table th {
    background: #12121c;
    color: #d4a843;
    font-size: 11px;
    font-weight: 600;
}
.mt-cell-ok { color: #50c878; font-weight: 700; }
.mt-cell-error { color: #e04050; background: rgba(224,64,80,0.08); font-weight: 700; }
.mt-cell-warn { color: #8888aa; }
.mt-row-missing { background: rgba(224,64,80,0.04); }

/* ─── Validation ─── */
.mt-issue {
    background: rgba(224,64,80,0.06);
    border: 1px solid rgba(224,64,80,0.2);
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
    font-size: 12px;
}
.mt-issue strong { color: #f0c850; }
.mt-issue ul { margin: 6px 0 0 16px; color: #e04050; }
.mt-badge {
    display: inline-block;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: #22223a;
    color: #8888aa;
    margin-left: 4px;
}
.mt-badge-theme { background: #1a2e1a; color: #50c878; }
.mt-badge-start { background: #2e2a1a; color: #d4a843; }
.mt-badge-end { background: #2e1a1a; color: #e04050; }
.mt-badge-obj { background: #1a1a2e; color: #9370db; }
.mt-ok { color: #50c878; font-size: 13px; }

/* ─── Floor Tabs ─── */
.mt-floor-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
}
.mt-floor-tab {
    padding: 6px 16px;
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px 6px 0 0;
    color: #8888aa;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}
.mt-floor-tab.active {
    background: #22223a;
    color: #d4a843;
    border-bottom-color: transparent;
}

/* ─── Info Grid ─── */
.mt-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
}
.mt-info-card {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.mt-info-label { font-size: 11px; color: #8888aa; }
.mt-info-value { font-size: 14px; font-weight: 600; color: #e0dce8; }
.mt-val-ok { color: #50c878; }
.mt-val-error { color: #e04050; }
.mt-val-warn { color: #f0c850; }

/* ─── Grid ─── */
.mt-grid-container {
    background: #12121c;
    border: 1px solid #2a2a4a;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
}
.mt-grid-viewport {
    position: relative;
    width: 100%;
    height: 600px;
    background: #0a0a0f;
    border-radius: 6px;
    overflow: hidden;
    cursor: grab;
    border: 1px solid #1a1a2e;
}
.mt-grid-viewport.dragging {
    cursor: grabbing;
}
.mt-grid {
    display: grid;
    gap: 1px;
    transform-origin: 0 0;
    will-change: transform;
}
.mt-grid-cell {
    position: relative;
    width: 50px;
    height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s;
    min-width: 0;
    overflow: hidden;
    border: 1px solid transparent;
}
.mt-grid-cell:hover { z-index: 2; transform: scale(1.1); box-shadow: 0 0 8px rgba(212,168,67,0.4); }
.mt-grid-cell.mt-highlight { box-shadow: 0 0 12px rgba(147,112,219,0.6) !important; z-index: 3; transform: scale(1.15); }

.mt-grid-idx {
    position: absolute;
    top: 2px;
    left: 2px;
    font-size: 8px;
    color: rgba(255,255,255,0.4);
    line-height: 1;
}
.mt-grid-icon { font-size: 18px; line-height: 1; margin-bottom: 2px; }
.mt-grid-type {
    font-size: 8px;
    color: rgba(255,255,255,0.5);
    position: absolute;
    bottom: 2px;
    right: 2px;
}

.mt-grid-empty {
    width: 50px;
    height: 50px;
    background: rgba(10,10,15,0.4);
    border-radius: 2px;
}

.mt-btn-center {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #22223a;
    border: 2px solid #5a3e8a;
    color: #fff;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.6);
    z-index: 10;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.mt-btn-center:hover {
    background: #5a3e8a;
    transform: scale(1.1);
}
.mt-btn-center:active {
    transform: scale(0.95);
}

/* Tile type colors */
.mt-type-hub       { background: rgba(212,168,67,0.25); border-color: rgba(212,168,67,0.4); }
.mt-type-corridor   { background: rgba(80,80,120,0.2); border-color: rgba(80,80,120,0.3); }
.mt-type-arena      { background: rgba(224,64,80,0.15); border-color: rgba(224,64,80,0.3); }
.mt-type-storage    { background: rgba(212,168,67,0.12); border-color: rgba(212,168,67,0.2); }
.mt-type-lab        { background: rgba(80,144,224,0.15); border-color: rgba(80,144,224,0.3); }
.mt-type-rest       { background: rgba(80,200,120,0.15); border-color: rgba(80,200,120,0.3); }
.mt-type-shrine     { background: rgba(147,112,219,0.15); border-color: rgba(147,112,219,0.3); }
.mt-type-trap       { background: rgba(224,120,40,0.15); border-color: rgba(224,120,40,0.3); }
.mt-type-stairs     { background: rgba(100,200,220,0.15); border-color: rgba(100,200,220,0.3); }
.mt-type-exit       { background: rgba(224,64,80,0.2); border-color: rgba(224,64,80,0.4); }

/* Special cells */
.mt-cell-hub { box-shadow: inset 0 0 8px rgba(212,168,67,0.3); }
.mt-cell-end { box-shadow: inset 0 0 8px rgba(224,64,80,0.3); }
.mt-cell-path { box-shadow: inset 0 0 6px rgba(80,144,224,0.4); }

/* Object highlights */
.mt-cell-obj-boss { box-shadow: inset 0 0 8px rgba(147,112,219,0.5); }
.mt-cell-obj-monster { box-shadow: inset 0 0 6px rgba(224,64,80,0.3); }

/* Wall borders (thick edges where no adjacent cell) */
.mt-wall-top    { border-top: 2px solid rgba(255,255,255,0.15); }
.mt-wall-bottom { border-bottom: 2px solid rgba(255,255,255,0.15); }
.mt-wall-left   { border-left: 2px solid rgba(255,255,255,0.15); }
.mt-wall-right  { border-right: 2px solid rgba(255,255,255,0.15); }

/* ─── Legend ─── */
.mt-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
    font-size: 11px;
    color: #8888aa;
    justify-content: center;
}
.mt-legend span { display: flex; align-items: center; gap: 4px; }
.mt-legend-swatch {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(255,255,255,0.1);
}
.mt-legend-swatch.mt-type-hub       { background: rgba(212,168,67,0.35); }
.mt-legend-swatch.mt-type-corridor   { background: rgba(80,80,120,0.35); }
.mt-legend-swatch.mt-type-arena      { background: rgba(224,64,80,0.25); }
.mt-legend-swatch.mt-type-storage    { background: rgba(212,168,67,0.2); }
.mt-legend-swatch.mt-type-lab        { background: rgba(80,144,224,0.25); }
.mt-legend-swatch.mt-type-rest       { background: rgba(80,200,120,0.25); }
.mt-legend-swatch.mt-type-shrine     { background: rgba(147,112,219,0.25); }
.mt-legend-swatch.mt-type-trap       { background: rgba(224,120,40,0.25); }
.mt-legend-swatch.mt-type-stairs     { background: rgba(100,200,220,0.25); }
.mt-legend-swatch.mt-type-exit       { background: rgba(224,64,80,0.3); }

/* ─── Cell List ─── */
.mt-cell-list {
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 10px;
    padding: 12px;
}
.mt-cell-list h4 {
    font-size: 13px;
    color: #d4a843;
    margin-bottom: 8px;
}
.mt-cell-scroll {
    max-height: 300px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.mt-cell-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s;
}
.mt-cell-item:hover { background: rgba(147,112,219,0.1); }
.mt-cell-idx { color: #5a3e8a; font-weight: 700; min-width: 30px; }
.mt-cell-pos { color: #8888aa; min-width: 50px; }
.mt-cell-type { color: #50c878; min-width: 60px; }
.mt-cell-adj { color: #555577; font-size: 11px; }

/* ─── Error ─── */
.mt-error {
    background: rgba(224,64,80,0.1);
    border: 1px solid rgba(224,64,80,0.3);
    border-radius: 8px;
    padding: 16px;
    color: #e04050;
    font-size: 14px;
}

/* ─── Scrollbar ─── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #3a3a5a; }
`;
document.head.appendChild(style);

// ─── Init ───
renderApp();
