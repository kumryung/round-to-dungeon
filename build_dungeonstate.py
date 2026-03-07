import re

# Read original
with open('c:/Work/round-the-dungeon/src/dungeonState.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We want to extract EXP / Status / Sanity helpers directly so we don't have to rewrite them.
def extract_section(start_marker, end_marker=None):
    if not end_marker:
        start = text.find(start_marker)
        if start == -1: return ""
        return text[start:]
    start = text.find(start_marker)
    if start == -1: return ""
    end = text.find(end_marker, start)
    if end == -1: return text[start:]
    return text[start:end]

exp_section = extract_section("// ─── EXP / Level ───", "// ─── Visibility")
sanity_helpers = extract_section("// ─── Sanity helpers ───")

# The rest we will generate
new_content = """// ─── Dungeon State ───
// Manages runtime state during dungeon gameplay (separate from global gameState)

import { setTileObject, movePlayerToken } from './mapEngine.js';
import { SETTINGS } from './data/settings.js';
import { setActiveDungeon } from './gameState.js';
import { getInventory } from './inventory.js';
import { getCombatState } from './combatEngine.js';
import { updateDungeonStatus } from './gameState.js';
import { t } from './i18n.js';
import { getWeightStatus } from './inventory.js';
import { TILES } from './data/tiles.js';

let ds = {};

export function initDungeonState(dungeonMap, mapData, wanderer) {
    const maxHp = 50 + ((wanderer.vit || 0) * 5);
    ds = {
        dungeonMap,
        mapData,
        wanderer: { ...wanderer },
        currentFloorIndex: 0,
        turn: 0,
        playerPosition: dungeonMap.floors[0].hubCellIndex, // index of current cell
        phase: 'spawn', // spawn -> move | action
        currentHp: maxHp,
        maxHp: maxHp,
        sanity: SETTINGS.initialSanity,
        maxSanity: SETTINGS.maxSanity,
        statusEffects: [],
        exp: wanderer.exp || 0,
        level: wanderer.level || 1,
        expToNext: SETTINGS.expTable[(wanderer.level || 1) - 1] || SETTINGS.expTable[SETTINGS.expTable.length - 1],
        freeStatPoints: wanderer.statPoints || 0,
        encounteredEvents: [],
        monstersDefeated: 0,
        eventsEncountered: 0,
        logCallback: null,
        updateCallback: null,
    };

    enterCurrentFloor();
    return ds;
}

export function loadDungeonState(savedDs) {
    ds = savedDs;
    ds.logCallback = null;
    ds.updateCallback = null;
    return ds;
}

export function getDungeonState() { return ds; }
export function setLogCallback(cb) { ds.logCallback = cb; }
export function setUpdateCallback(cb) { ds.updateCallback = cb; }

function log(msg) {
    if (ds.logCallback) ds.logCallback(msg);
}

export function triggerUpdate() {
    const inv = getInventory();
    if (inv) {
        ds.inventory = { slots: inv.slots, safeBag: inv.safeBag, equipped: inv.equipped };
    }
    const combat = getCombatState();
    if (combat && combat.result === null) {
        ds.combat = combat;
    } else {
        ds.combat = null;
    }
    if (ds.updateCallback) ds.updateCallback(ds);
    setActiveDungeon(ds);
}

// ─── Spawn & Floor Entry ───
export function enterCurrentFloor() {
    const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
    log(`[시스템] ${floorMap.floor}층에 진입했습니다.`);

    floorMap.cells.forEach(cell => {
        if (cell.object) return;
        
        if (cell.isEnd && cell.tileType === 'exit') {
            const def = TILES[cell.tileDefId];
            if (def && def.boss) {
                cell.object = 'boss';
                cell.objectData = { monsterId: def.boss };
                setTileObject(cell.index, 'boss');
            }
            return;
        }

        const def = TILES[cell.tileDefId];
        if (!def) return;

        // Simple random roll for each cell in the tile (lazy evaluation: roll for every cell based on tile constraints)
        // A robust engine would count exactly to the bounds.
        if (def.mobSpawn && def.mobSpawn.pool && def.mobSpawn.pool.length > 0) {
            if (Math.random() < 0.2) { // 20% chance per cell in mob tiles
                cell.object = 'monster';
                cell.objectData = { monsterId: def.mobSpawn.pool[Math.floor(Math.random() * def.mobSpawn.pool.length)] };
                setTileObject(cell.index, 'monster');
                return;
            }
        }
        if (def.eventSpawn && def.eventSpawn.maxCount > 0) {
            if (Math.random() < 0.1) { // 10% chance per cell in event tiles
                cell.object = 'event';
                cell.objectData = null;
                setTileObject(cell.index, 'event');
                return;
            }
        }
    });

    ds.playerPosition = floorMap.hubCellIndex;
    updateVisibility();
    ds.phase = 'move';
    triggerUpdate();
}

export function moveToNextFloor() {
    if (ds.currentFloorIndex < ds.dungeonMap.floors.length - 1) {
        ds.currentFloorIndex++;
        enterCurrentFloor();
    }
}

// ─── Dice ───
export function rollDice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Visibility (BFS) ───
export function updateVisibility() {
    const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
    const hasTorch = hasStatusEffect('torch_buff');
    const viewRange = SETTINGS.baseViewDistance + (hasTorch ? SETTINGS.torchViewBonus : 0);

    floorMap.cells.forEach(c => {
        if (c.visibility === 'visible') c.visibility = 'fog';
    });

    const q = [[ds.playerPosition, 0]];
    const visited = new Set([ds.playerPosition]);

    while(q.length > 0) {
        const [curr, dist] = q.shift();
        const cell = floorMap.cells.find(c => c.index === curr);
        if (cell) {
            cell.visibility = 'visible';
            cell.visited = true;
        }
        
        if (dist < viewRange) {
            const adj = floorMap.adjacency.get(curr) || [];
            adj.forEach(a => {
                if (!visited.has(a)) {
                    visited.add(a);
                    q.push([a, dist + 1]);
                }
            });
        }
    }
    triggerUpdate();
}

// ─── Movement ───
export function executeMovePhase() {
    ds.phase = 'move';
    const weightStatus = getWeightStatus(ds.wanderer?.str || 0);
    const rawRoll = rollDice(1, SETTINGS.moveDiceSides);
    const dicePenalty = weightStatus.dicePenalty || 0;
    const roll = Math.max(1, rawRoll + dicePenalty);
    ds.turn++;
    
    if (!hasStatusEffect('torch_buff')) {
        const reduced = reduceSanity(SETTINGS.sanityCostPerMove);
        log(t('logs.move_dice_sanity', { roll, cost: reduced }));
    } else {
        log(t('logs.move_dice_torch', { roll }));
    }

    return {
        roll,
        rawRoll,
        dicePenalty,
        weightIcon: weightStatus.icon,
        stepsRemaining: roll,
        path: []
    };
}

// ─── Tile Interaction ───
export function handleTileInteraction() {
    const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
    const cell = floorMap.cells.find(c => c.index === ds.playerPosition);

    if (cell.isStart && ds.turn > 0) {
        return { type: 'start', data: null };
    }

    if (cell.isEnd) {
        if (cell.tileType === 'exit') {
            if (cell.object === 'boss') {
                log(`[보스 등장] 출구를 막고 있는 보스와 전투를 해야합니다.`);
                return { type: 'monster', data: cell.objectData };
            } else {
                return { type: 'exit_cleared', data: null }; // Boss defeated
            }
        } else if (cell.tileType === 'stairs') {
            return { type: 'stairs', data: null };
        }
    }

    if (cell.object === 'monster') {
        const nameKey = cell.objectData?.monsterId ? `monsters.${cell.objectData.monsterId}.name` : null;
        log(t('logs.combat_encounter', { name: cell.objectData?.monsterId || 'unknown', level: 1 }));
        return { type: 'monster', data: cell.objectData };
    }

    if (cell.object === 'chest') {
        log(t('logs.chest_found'));
        cell.object = null;
        cell.objectData = null;
        setTileObject(cell.index, null);
        return { type: 'chest', data: null };
    }

    if (cell.object === 'event') {
        log(t('logs.event_found'));
        cell.object = null;
        cell.objectData = null;
        setTileObject(cell.index, null);
        return { type: 'event', data: null };
    }

    log(t('logs.empty_tile'));
    return { type: 'empty', data: null };
}

"""

new_content += exp_section + "\n" + sanity_helpers

with open('c:/Work/round-the-dungeon/src/dungeonState.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
