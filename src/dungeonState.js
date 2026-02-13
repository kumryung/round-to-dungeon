// ─── Dungeon State ───
// Manages runtime state during dungeon gameplay (separate from global gameState)

import { setTileObject, movePlayerToken } from './mapEngine.js';
import { SETTINGS } from './data/settings.js';

/** @type {object} */
let ds = {};

/**
 * Initialize dungeon state for a new dungeon session.
 */
export function initDungeonState(tiles, mapData, wanderer) {
    ds = {
        tiles,
        mapData,
        wanderer: { ...wanderer },
        sideLength: 5 + mapData.mapLv,
        wave: 1,
        turn: 0,
        playerPosition: 0,
        phase: 'spawn', // spawn | move | action
        currentHp: wanderer.hp,
        maxHp: wanderer.hp,
        sanity: 100,
        maxSanity: 100,
        logCallback: null,
        updateCallback: null,
    };
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

function triggerUpdate() {
    if (ds.updateCallback) ds.updateCallback(ds);
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
    log(`🎲 스폰 주사위  — 몬스터: ${rolls.monsterRoll} | 보물: ${rolls.treasureRoll} | 이벤트: ${rolls.eventRoll}`);
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
    const roll = rollDice(1, 6);
    ds.turn++;

    // Sanity drops by 2 on each move
    ds.sanity = Math.max(0, ds.sanity - 2);

    log(`🎲 이동 주사위: ${roll}  (정신력 -2)`);

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
            log(`🏠 시작점 강제 정지! (남은 이동: ${stepsRemaining} 무시)`);
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
        log(`❓ 이벤트 타일! (고정 이벤트 — 추후 구현)`);
        return { type: 'corner_event', data: null };
    }

    if (tile.object === 'monster') {
        const name = tile.objectData?.monsterId?.replace('m_', '') || 'unknown';
        log(`💀 몬스터 조우! — ${name} (Lv.${tile.objectData?.level || 1})`);
        return { type: 'monster', data: tile.objectData };
    }

    if (tile.object === 'chest') {
        log(`📦 보물상자 발견!`);
        // Clear the chest
        tile.object = null;
        tile.objectData = null;
        setTileObject(tile.index, null);
        return { type: 'chest', data: null };
    }

    if (tile.object === 'event') {
        log(`❓ 이벤트 발생! (추후 구현)`);
        tile.object = null;
        tile.objectData = null;
        setTileObject(tile.index, null);
        return { type: 'event', data: null };
    }

    log(`→ 빈 타일. 아무 일도 일어나지 않았다.`);
    return { type: 'empty', data: null };
}

// ─── Wave ───

/**
 * Advance to the next wave. Level up monsters, shuffle, respawn.
 */
export function advanceWave() {
    ds.wave++;
    log(`\n═══ Wave ${ds.wave} 시작! ═══`);

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

    log(`⬆️ 기존 몬스터 레벨업 → Lv.${ds.wave}`);

    triggerUpdate();
}

// ─── Sanity helpers ───

export function getSanityStatus(sanity) {
    if (sanity >= 70) return { label: '평정', class: 'sanity-normal' };
    if (sanity >= 31) return { label: '불안', class: 'sanity-anxiety' };
    if (sanity >= 11) return { label: '공포', class: 'sanity-panic' };
    return { label: '광기', class: 'sanity-madness' };
}
