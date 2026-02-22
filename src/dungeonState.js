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

/** @type {object} */
let ds = {};

/**
 * Initialize dungeon state for a new dungeon session.
 */
export function initDungeonState(tiles, mapData, wanderer) {
    const maxHp = 50 + (wanderer.vit * 5);
    ds = {
        tiles: tiles.map(t => ({ ...t, visited: false, visibility: 'shroud' })),
        mapData,
        wanderer: { ...wanderer },
        sideLength: SETTINGS.baseMapSize + mapData.mapLv,
        wave: 1,
        turn: 0,
        playerPosition: 0,
        phase: 'spawn', // spawn | move | action
        currentHp: maxHp,
        maxHp: maxHp,
        sanity: SETTINGS.initialSanity,
        maxSanity: SETTINGS.maxSanity,
        statusEffects: [],  // { type, duration, icon, label }
        exp: 0,
        level: 1,
        expToNext: SETTINGS.expTable[0],
        freeStatPoints: 0,
        encounteredEvents: [],
        monstersDefeated: 0,
        eventsEncountered: 0,
        logCallback: null,
        updateCallback: null,
    };

    // Initial visibility
    updateVisibility();

    return ds;
}

export function loadDungeonState(savedDs) {
    ds = savedDs;
    // Functions are stripped by JSON serialization, so we explicitly null them
    // The scene will re-assign them
    ds.logCallback = null;
    ds.updateCallback = null;
    return ds;
}

export function getDungeonState() {
    return ds;
}

export function setLogCallback(cb) {
    ds.logCallback = cb;
}

export function setUpdateCallback(cb) {
    ds.updateCallback = cb;
}

function log(msg) {
    if (ds.logCallback) ds.logCallback(msg);
}

export function triggerUpdate() {
    const inv = getInventory();
    if (inv) {
        ds.inventory = {
            slots: inv.slots,
            safeBag: inv.safeBag,
            equipped: inv.equipped
        };
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
    const durText = effect.duration === Infinity ? '∞' : `${effect.duration}턴`;
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
 * Tick all status effects (called once per move phase).
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
                log(t('logs.status_burn', { sanity: reduced }));
                break;
            // torch_buff: handled in executeMovePhase (prevents sanity loss)
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

// ─── Visibility (Fog of War) ───

export function updateVisibility() {
    const { playerPosition, tiles, sideLength } = ds;
    const hasTorch = hasStatusEffect('torch_buff');
    const viewRange = SETTINGS.baseViewDistance + (hasTorch ? SETTINGS.torchViewBonus : 0);

    // Calculate visible range based on map loop logic
    const totalTiles = tiles.length;

    // Reset visible to fog for previously visible tiles
    tiles.forEach(t => {
        if (t.visibility === 'visible') t.visibility = 'fog';
    });

    // Mark current range as visible
    for (let i = -viewRange; i <= viewRange; i++) {
        let idx = (playerPosition + i) % totalTiles;
        if (idx < 0) idx += totalTiles;

        tiles[idx].visibility = 'visible';
        tiles[idx].visited = true;
    }

    triggerUpdate();
}

// ─── Dice ───

export function rollDice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Spawn Phase ───

/**
 * Roll the 3 spawn dice. Returns the roll values without placing anything.
 */
export function rollSpawnDice() {
    const dice = ds.mapData.dice;
    const monsterRoll = rollDice(dice.monster[0], dice.monster[1]);
    const treasureRoll = rollDice(dice.treasure[0], dice.treasure[1]);
    const eventRoll = rollDice(dice.event[0], dice.event[1]);
    return { monsterRoll, treasureRoll, eventRoll };
}

/**
 * Generate a list of spawn placements from dice results, without applying them.
 * Returns an ordered array of { tileIndex, type, objectData? } items.
 */
export function getSpawnPlacements(rolls) {
    const placements = [];

    const getEmptyTiles = () =>
        ds.tiles
            .filter((t) => t.type === 'empty' && t.object === null)
            .map((t) => t.index);

    // Track tiles we've already planned to use (so no duplicates within a batch)
    const claimed = new Set();

    function pickTile() {
        const available = getEmptyTiles().filter((i) => !claimed.has(i));
        if (available.length === 0) return null;
        const idx = available[Math.floor(Math.random() * available.length)];
        claimed.add(idx);
        return idx;
    }

    for (let i = 0; i < rolls.monsterRoll; i++) {
        const idx = pickTile();
        if (idx === null) break;
        placements.push({
            tileIndex: idx,
            type: 'monster',
            objectData: {
                monsterId: ds.mapData.monsterPool[Math.floor(Math.random() * ds.mapData.monsterPool.length)],
                level: ds.wave,
            },
        });
    }

    for (let i = 0; i < rolls.treasureRoll; i++) {
        const idx = pickTile();
        if (idx === null) break;
        placements.push({ tileIndex: idx, type: 'chest' });
    }

    for (let i = 0; i < rolls.eventRoll; i++) {
        const idx = pickTile();
        if (idx === null) break;
        placements.push({ tileIndex: idx, type: 'event' });
    }

    return placements;
}

/**
 * Commit a single spawn placement to the tile state + DOM.
 */
export function commitSpawn(placement) {
    const tile = ds.tiles[placement.tileIndex];
    tile.object = placement.type;
    tile.objectData = placement.objectData || null;
    setTileObject(placement.tileIndex, placement.type);
}

/**
 * Shorthand: execute the entire spawn phase at once (for advanceWave etc.).
 */
export function executeSpawnPhase() {
    const rolls = rollSpawnDice();
    log(t('logs.spawn_dice', { monster: rolls.monsterRoll, treasure: rolls.treasureRoll, event: rolls.eventRoll }));
    const placements = getSpawnPlacements(rolls);
    placements.forEach((p) => commitSpawn(p));
    ds.phase = 'move';
    triggerUpdate();
    return rolls;
}

// ─── Movement ───

/**
 * Roll the movement dice (1d6) and move the player.
 * Returns { roll, steps, stoppedAtStart, finalTile }
 */
export function executeMovePhase() {
    // Apply weight-based dice cap
    const weightStatus = getWeightStatus(ds.wanderer?.str || 0);
    const diceSides = weightStatus.diceMax;
    if (weightStatus.tier > 0) {
        log(t('logs.weight_overloaded', { max: diceSides }) + ` ${weightStatus.icon} (${weightStatus.current}/${weightStatus.max})`);
    }

    const roll = rollDice(1, diceSides);
    ds.turn++;

    // Sanity drops by cost per move (unless torch buff active)
    if (!hasStatusEffect('torch_buff')) {
        const reduced = reduceSanity(SETTINGS.sanityCostPerMove);
        log(t('logs.move_dice_sanity', { roll, cost: reduced }));
    } else {
        log(t('logs.move_dice_torch', { roll }));
    }

    // Tick status effects each move
    tickStatuses();

    const totalTiles = ds.tiles.length;
    let stepsRemaining = roll;
    let currentPos = ds.playerPosition;
    let stoppedAtStart = false;
    const path = [];

    while (stepsRemaining > 0) {
        currentPos = (currentPos + 1) % totalTiles;
        stepsRemaining--;
        path.push(currentPos);

        // Forced stop at start tile
        if (currentPos === 0 && stepsRemaining > 0) {
            stoppedAtStart = true;
            log(t('logs.force_stop_start', { remaining: stepsRemaining }));
            stepsRemaining = 0;
        }
    }

    ds.playerPosition = currentPos;
    ds.phase = 'action';

    const result = {
        roll,
        path,
        stoppedAtStart,
        finalPosition: currentPos,
        finalTile: ds.tiles[currentPos],
    };

    return result;
}

/**
 * Animate player movement along a path of tile indices.
 * Returns a promise that resolves when animation completes.
 */
export function animateMovement(path, sideLength) {
    return new Promise((resolve) => {
        let i = 0;
        function step() {
            if (i >= path.length) {
                resolve();
                return;
            }
            movePlayerToken(path[i], sideLength, true);

            // Heal HP per step (from settings)
            if (ds.currentHp < ds.maxHp) {
                ds.currentHp = Math.min(ds.maxHp, ds.currentHp + SETTINGS.hpRegenPerTile);
                triggerUpdate(); // Refresh HUD
            }

            i++;
            setTimeout(step, 350);
        }
        step();
    });
}

// ─── Tile Interaction ───

/**
 * Handle interaction when landing on a tile.
 * Returns { type, data } describing what happened.
 */
export function handleTileInteraction() {
    const tile = ds.tiles[ds.playerPosition];

    if (tile.type === 'start' || ds.playerPosition === 0) {
        // Check wave advancement
        if (ds.turn > 0) {
            return { type: 'start', data: null };
        }
    }

    if (tile.type === 'corner') {
        // Do not log the placeholder event_corner message anymore.
        // We will process this as a boosted random event in dungeonScene.js
        return { type: 'corner_event', data: null };
    }

    if (tile.object === 'monster') {
        const nameKey = tile.objectData?.monsterId ? `monsters.${tile.objectData.monsterId}.name` : null;
        const name = nameKey ? t(nameKey) : tile.objectData?.monsterId || 'unknown';
        log(t('logs.combat_encounter', { name, level: tile.objectData?.level || 1 }));
        return { type: 'monster', data: tile.objectData };
    }

    if (tile.object === 'chest') {
        log(t('logs.chest_found'));
        // Clear the chest
        tile.object = null;
        tile.objectData = null;
        setTileObject(tile.index, null);
        return { type: 'chest', data: null };
    }

    if (tile.object === 'event') {
        log(t('logs.event_found'));
        tile.object = null;
        tile.objectData = null;
        setTileObject(tile.index, null);
        return { type: 'event', data: null };
    }

    log(t('logs.empty_tile'));
    return { type: 'empty', data: null };
}

// ─── Wave ───

/**
 * Advance to the next wave. Level up monsters, shuffle, respawn.
 */
export function advanceWave() {
    ds.wave++;
    log(`\n═══ ${t('logs.wave_start', { wave: ds.wave })} ═══`);

    // Clear existing non-monster objects (chests/events)
    ds.tiles.forEach((tile) => {
        if (tile.object === 'chest' || tile.object === 'event') {
            tile.object = null;
            tile.objectData = null;
            setTileObject(tile.index, null);
        }
    });

    // Level up existing monsters
    ds.tiles.forEach((tile) => {
        if (tile.object === 'monster' && tile.objectData) {
            tile.objectData.level = ds.wave;
        }
    });

    log(t('logs.monster_level_up', { wave: ds.wave }));

    triggerUpdate();
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
