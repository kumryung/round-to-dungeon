// ─── Dungeon State ───
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
    const oldLog = ds.logCallback;
    const oldUpdate = ds.updateCallback;
    const maxHp = 50 + ((wanderer.vit || 0) * 5);
    ds = {
        dungeonMap,
        mapData,
        wanderer: { ...wanderer },
        currentFloorIndex: 0,
        turn: 0,
        playerPosition: dungeonMap.floors[0].hubCellIndex, // index of current cell
        previousPosition: null, // Track where we came from to prevent backtracking
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
        logCallback: oldLog,
        updateCallback: oldUpdate,
    };

    enterCurrentFloor();
    return ds;
}

export function loadDungeonState(savedDs) {
    const oldLog = ds.logCallback;
    const oldUpdate = ds.updateCallback;
    ds = savedDs;
    ds.logCallback = oldLog;
    ds.updateCallback = oldUpdate;

    if (ds.dungeonMap && ds.dungeonMap.floors) {
        ds.dungeonMap.floors.forEach(floor => {
            // If adjacency is completely missing, or it's an empty object (lost Map data), recalculate it
            if (!floor.adjacency || (typeof floor.adjacency === 'object' && Object.keys(floor.adjacency).length === 0)) {
                floor.adjacency = {};
                
                const cellMap = new Map();
                floor.cells.forEach(c => cellMap.set(`${c.gr},${c.gc}`, c));

                floor.cells.forEach(cell => {
                    const neighbors = [];
                    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    dirs.forEach(d => {
                        const nr = cell.gr + d[0];
                        const nc = cell.gc + d[1];
                        const ncell = cellMap.get(`${nr},${nc}`);
                        if (ncell) {
                            neighbors.push(ncell.index);
                        }
                    });
                    floor.adjacency[cell.index] = neighbors;
                });
                console.log(`[DungeonState] Recalculated missing adjacency for floor ${floor.floor}`);
            } else if (floor.adjacency instanceof Map) {
                // If it IS a Map somehow, convert it to plain object for future safety
                const newObj = {};
                for (const [k, v] of floor.adjacency.entries()) {
                    newObj[k] = v;
                }
                floor.adjacency = newObj;
            }
        });
    }

    if (ds.previousPosition === undefined) {
        ds.previousPosition = null;
    }

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
                cell.hidden = false;
                setTileObject(cell.index, 'boss');
            }
            return;
        }

        const def = TILES[cell.tileDefId];
        if (!def) return;

        // More robust spawning logic based on the tile definition
        if (def.mobSpawn && def.mobSpawn.pool && def.mobSpawn.pool.length > 0) {
            if (Math.random() < 0.6) { // 60% chance to spawn a monster on a mob tile cell
                cell.object = 'monster';
                cell.objectData = { monsterId: def.mobSpawn.pool[Math.floor(Math.random() * def.mobSpawn.pool.length)] };
                cell.hidden = true;
                setTileObject(cell.index, 'monster');
                return;
            }
        }
        if (def.eventSpawn && def.eventSpawn.maxCount > 0) {
            if (Math.random() < 0.4) { // 40% chance to spawn an event on an event tile cell
                cell.object = 'event';
                cell.objectData = null;
                cell.hidden = true;
                setTileObject(cell.index, 'event');
                return;
            }
        }
    });

    // Start at the designated hub cell for the new floor
    ds.playerPosition = floorMap.hubCellIndex;
    ds.previousPosition = null; // Clear path memory so player can freely move anywhere
    
    updateVisibility();
    ds.phase = 'move';
    triggerUpdate();
}

export function revealTile(cellIndex) {
    const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
    const cell = floorMap.cells.find(c => c.index === cellIndex);
    if (cell && cell.hidden) {
        cell.hidden = false;
        // The actual visual update is handled in mapEngine via revealTileObject
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

    const playerCell = floorMap.cells.find(c => c.index === ds.playerPosition);
    if (!playerCell) return;

    const pr = playerCell.gr;
    const pc = playerCell.gc;

    floorMap.cells.forEach(c => {
        if (Math.abs(c.gr - pr) <= viewRange && Math.abs(c.gc - pc) <= viewRange) {
            c.visibility = 'visible';
            c.visited = true;
        } else if (c.visited) {
            c.visibility = 'fog';
        } else {
            c.visibility = 'shroud';
        }
    });

    triggerUpdate();
}

// ─── Movement ───
export function executeClickMove(targetCellIndex) {
    ds.phase = 'move';
    const floorMap = ds.dungeonMap.floors[ds.currentFloorIndex];
    const weightStatus = getWeightStatus(ds.wanderer?.str || 0);
    const weightMultIdx = Math.min(Math.max(weightStatus.tier, 0), SETTINGS.weightSanityMult.length - 1);
    const weightMult = SETTINGS.weightSanityMult[weightMultIdx];
    
    const baseSanityCost = SETTINGS.sanityCostPerTile || 1;
    const finalSanityCost = Math.ceil(baseSanityCost * weightMult);
    
    return {
        sanityCostPerTile: finalSanityCost,
        weightIcon: weightStatus.icon
    };
}

export function incrementTurn() {
    ds.turn++;
    triggerUpdate();
}

export function handleMoveStepEnd(cellIndex) {
    ds.playerPosition = cellIndex;
    updateVisibility();
}

export function moveToNextFloor() {
    if (ds.currentFloorIndex < ds.dungeonMap.floors.length - 1) {
        ds.currentFloorIndex++;
        enterCurrentFloor();
    }
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

// ─── EXP / Level ───

/**
 * Grant EXP to the player. Handles level-up(s) and free stat point allocation.
 * @param {number} amount EXP gained
 * @returns {{ gained: number, leveledUp: boolean, newLevel: number }}
 */
export function grantExp(amount) {
    ds.exp += amount;
    let leveledUp = false;

    while (ds.exp >= ds.expToNext) {
        ds.exp -= ds.expToNext;
        ds.level++;
        ds.freeStatPoints += SETTINGS.freeStatPerLevel;

        // Get next level requirement from table, or use last value if exceeded
        const tableIdx = ds.level - 1;
        ds.expToNext = SETTINGS.expTable[tableIdx] || SETTINGS.expTable[SETTINGS.expTable.length - 1];

        leveledUp = true;
        log(t('logs.level_up', { level: ds.level, points: SETTINGS.freeStatPerLevel }));
    }

    triggerUpdate();
    return { gained: amount, leveledUp, newLevel: ds.level };
}

/**
 * Allocate a free stat point to a specific stat.
 * @param {'hp'|'str'|'agi'|'spd'|'dex'|'luk'} statName
 * @returns {boolean} success
 */
export function allocateStat(statName) {
    if (ds.freeStatPoints <= 0) return false;

    const validStats = ['vit', 'str', 'agi', 'spd', 'dex', 'luk'];
    if (!validStats.includes(statName)) return false;

    ds.freeStatPoints--;

    if (statName === 'vit') {
        ds.wanderer.vit = (ds.wanderer.vit || 0) + 1;
        const hpGain = 5; // 1 VIT = 5 HP
        ds.maxHp += hpGain;
        ds.currentHp += hpGain;
        log(t('logs.stat_vit_up', { hp: hpGain, maxHp: ds.maxHp }));
    } else {
        ds.wanderer[statName] = (ds.wanderer[statName] || 0) + 1;
        log(`💪 ${statName.toUpperCase()} +1 (현재 ${ds.wanderer[statName]})`);
    }

    triggerUpdate();
    return true;
}

// ─── Status Effects ───

/**
 * Apply a status effect to the player.
 * @param {{ type: string, duration: number, icon?: string, label?: string }} effect
 */
export function applyStatusEffect(effect) {
    if (!effect || !effect.id) return;
    // Refresh if same status already active
    ds.statusEffects = ds.statusEffects.filter(e => e.id !== effect.id);
    ds.statusEffects.push({ ...effect });
    const label = effect.label || effect.labelKey || effect.id;
    const durText = effect.duration === Infinity ? '∞' : `${effect.duration}칸`;
    log(`${effect.icon || '⚡'} ${label} 부여됨 (${durText})`);
    triggerUpdate();
}

/**
 * Tick all active status effects by 1 turn.
 * Applies per-tick HP/Sanity changes and removes expired effects.
 */
export function tickStatuses() {
    if (!ds.statusEffects || ds.statusEffects.length === 0) return;
    const expired = [];
    for (const eff of ds.statusEffects) {
        // Apply tick damage/healing
        if (eff.hpTick && eff.hpTick !== 0) {
            if (eff.hpTick < 0) {
                ds.currentHp = Math.max(0, ds.currentHp + eff.hpTick);
                log(`${eff.icon || '⚡'} ${eff.id}: HP ${eff.hpTick}`);
            } else {
                ds.currentHp = Math.min(ds.maxHp, ds.currentHp + eff.hpTick);
            }
        }
        if (eff.sanityTick && eff.sanityTick !== 0) {
            if (eff.sanityTick < 0) {
                reduceSanity(Math.abs(eff.sanityTick));
            } else {
                ds.sanity = Math.min(ds.maxSanity, ds.sanity + eff.sanityTick);
            }
        }
        // Decrement duration
        if (eff.duration !== Infinity) {
            eff.duration--;
            if (eff.duration <= 0) expired.push(eff.id);
        }
    }
    // Remove expired
    if (expired.length > 0) {
        ds.statusEffects = ds.statusEffects.filter(e => !expired.includes(e.id));
        expired.forEach(id => log(`✅ ${id} 상태이상 종료`));
    }
    triggerUpdate();
}

/**
 * Compute flat stat modifiers from all active status effects.
 * Returns an object used by combatEngine.
 */
export function getStatusModifiers() {
    const mods = { atkMul: 0, maxHpMul: 0, hitMod: 0, evadeMod: 0, evadeMul: 0, spdMul: 0, hpTick: 0, sanityTick: 0 };
    for (const eff of (ds.statusEffects || [])) {
        const sm = eff.statMod || {};
        for (const [k, v] of Object.entries(sm)) {
            mods[k] = (mods[k] || 0) + v;
        }
        if (eff.hpTick) mods.hpTick += eff.hpTick;
        if (eff.sanityTick) mods.sanityTick += eff.sanityTick;
    }
    return mods;
}

/**
 * Remove a specific status effect by id (e.g. bandage clears bleed).
 */
export function removeStatusEffect(id) {
    const idx = ds.statusEffects.findIndex(e => e.id === id);
    if (idx !== -1) {
        ds.statusEffects.splice(idx, 1);
        log(`✅ ${id} 상태이상 해제됨`);
        triggerUpdate();
        updateVisibility(); // Re-calculate visibility if torch buff is applied/removed
        return true;
    }
    return false;
}


/**
 * Reduce sanity naturally or by event, applying phobia trait checks.
 * @param {number} amount
 */
export function reduceSanity(amount) {
    if (amount <= 0) return;

    // Check traits for phobia modifiers
    let multiplier = 1.0;
    if (ds.wanderer && ds.wanderer.traits && ds.mapData) {
        const t = ds.wanderer.traits;
        const theme = ds.mapData.theme || 'ruins'; // fallback

        // General Coward trait check (+30%)
        if (t.some(trait => trait.id === 't_neg_coward')) {
            multiplier += 0.3;
        }

        // Theme Phobia check (+50%)
        const phobiaId = `t_neg_${theme}_phobia`;
        if (t.some(trait => trait.id === phobiaId)) {
            multiplier += 0.5;
        }
    }

    const finalAmount = Math.ceil(amount * multiplier);
    
    // Apply insanity damage to health if dropping below 0
    if (ds.sanity - finalAmount < 0) {
        const hpDamage = Math.abs(ds.sanity - finalAmount);
        ds.currentHp = Math.max(0, ds.currentHp - hpDamage);
        log(`☠️ 정신력이 붕괴되어 체력이 ${hpDamage} 감소했습니다!`);
    }

    ds.sanity = Math.max(0, ds.sanity - finalAmount);
    return finalAmount;
}

/**
 * Check if player has a specific status effect.
 */
export function hasStatusEffect(id) {
    return ds.statusEffects.some(e => e.id === id);
}

/**
 * Clear all status effects.
 */
export function clearAllStatusEffects() {
    if (ds.statusEffects.length > 0) {
        ds.statusEffects = [];
        log(t('logs.status_all_cleared'));
        triggerUpdate();
        updateVisibility(); // Re-calculate visibility if torch buff was cleared
    }
}

/**
 * Tick all status effects (called per tile movement).
 * Applies DoT damage and decrements duration.
 */
export function tickStatusEffects() {
    const expired = [];
    let visibilityMightChange = false;

    for (const effect of ds.statusEffects) {
        switch (effect.type) {
            case 'poison':
                ds.currentHp = Math.max(0, ds.currentHp - SETTINGS.poisonDamagePerTurn);
                log(t('logs.status_poison', { damage: SETTINGS.poisonDamagePerTurn }));
                break;
            case 'burn':
                const reduced = reduceSanity(SETTINGS.burnSanityPerTurn);
                if (reduced > 0) log(t('logs.status_burn', { sanity: reduced }));
                break;
            // torch_buff: prevents sanity loss, handled in caller
        }

        effect.duration--;
        if (effect.duration <= 0) {
            expired.push(effect.type);
            if (effect.type === 'torch_buff') {
                visibilityMightChange = true;
            }
        }
    }

    // Remove expired effects
    for (const type of expired) {
        const effect = ds.statusEffects.find(e => e.type === type);
        ds.statusEffects = ds.statusEffects.filter(e => e.type !== type);
        if (effect) {
            log(t('logs.status_expired', { icon: effect.icon || '', label: effect.label || type }));
        }
    }

    triggerUpdate();
    if (visibilityMightChange) {
        updateVisibility(); // Re-calculate visibility if torch buff expired
    }
}


// ─── Sanity helpers ───

/**
 * Returns the current sanity tier and all associated gameplay modifiers.
 * 7 tiers: 광명 (91-100), 안정 (76-90), 경계 (61-75), 불안 (41-60), 공포 (21-40), 절망 (11-20), 패닉 (0-10)
 */
export function getSanityStatus(sanity) {
    if (sanity >= 91) return {
        labelKey: 'dungeon_ui.sanity_radiant', class: 'sanity-radiant',
        playerAcc: +10, evasion: +5, preemptive: +15, flee: +15, itemDiscover: +20,
        allyCrit: 0, sanityDecayMult: 1.0,
        monsterAcc: 0, monsterDmg: 0, monsterCrit: 0, ambush: 0,
    };
    if (sanity >= 76) return {
        labelKey: 'dungeon_ui.sanity_stable', class: 'sanity-stable',
        playerAcc: +5, evasion: +2, preemptive: +10, flee: +10, itemDiscover: +10,
        allyCrit: 0, sanityDecayMult: 1.0,
        monsterAcc: 0, monsterDmg: 0, monsterCrit: 0, ambush: 0,
    };
    if (sanity >= 61) return {
        labelKey: 'dungeon_ui.sanity_alert', class: 'sanity-alert',
        playerAcc: 0, evasion: 0, preemptive: +5, flee: 0, itemDiscover: +5,
        allyCrit: 0, sanityDecayMult: 1.05,
        monsterAcc: 0, monsterDmg: 0, monsterCrit: +1, ambush: 0,
    };
    if (sanity >= 41) return {
        labelKey: 'dungeon_ui.sanity_anxious', class: 'sanity-anxious',
        playerAcc: -5, evasion: 0, preemptive: 0, flee: -5, itemDiscover: 0,
        allyCrit: +1, sanityDecayMult: 1.10,
        monsterAcc: +5, monsterDmg: +10, monsterCrit: +2, ambush: +10,
    };
    if (sanity >= 21) return {
        labelKey: 'dungeon_ui.sanity_fear', class: 'sanity-fear',
        playerAcc: -10, evasion: 0, preemptive: 0, flee: -15, itemDiscover: -10,
        allyCrit: +2, sanityDecayMult: 1.15,
        monsterAcc: +10, monsterDmg: +15, monsterCrit: +5, ambush: +20,
    };
    if (sanity >= 11) return {
        labelKey: 'dungeon_ui.sanity_despair', class: 'sanity-despair',
        playerAcc: -15, evasion: 0, preemptive: 0, flee: -25, itemDiscover: -20,
        allyCrit: +3, sanityDecayMult: 1.20,
        monsterAcc: +15, monsterDmg: +20, monsterCrit: +10, ambush: +30,
    };
    return {
        labelKey: 'dungeon_ui.sanity_panic', class: 'sanity-panic',
        playerAcc: -20, evasion: 0, preemptive: 0, flee: -40, itemDiscover: -30,
        allyCrit: +5, sanityDecayMult: 1.30,
        monsterAcc: +25, monsterDmg: +30, monsterCrit: +15, ambush: +40,
    };
}
