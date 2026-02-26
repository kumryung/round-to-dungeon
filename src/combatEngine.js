// ─── Combat Engine ───
// Handles turn-based combat logic: initiative, hit/damage, flee, monster AI

import { getDungeonState, getSanityStatus, applyStatusEffect } from './dungeonState.js';
import { SETTINGS } from './data/settings.js';
import { getInventory, getWeaponDamage, degradeWeapon, getWeightStatus } from './inventory.js';
import { setActiveDungeon } from './gameState.js';
import { t } from './i18n.js';

// ─── Constants ───
const PART_LABEL = { head: '머리', body: '몸통', legs: '다리' };

/** @type {object|null} */
let combat = null;

// ─── Init ───

/**
 * Initialize a combat encounter.
 * @param {object} wanderer Player character data (from dungeonState)
 * @param {object} monster  Monster instance (from getMonster)
 * @returns {object} combat state
 */
export function initCombat(wanderer, monster) {
    const ds = getDungeonState();
    const inv = getInventory();

    // Player ATK from equipped weapon
    const weapon = inv?.equipped;
    const baseAtk = weapon ? Math.round((weapon.dmgMin + weapon.dmgMax) / 2) : wanderer.str + 5;

    // ATB tick: maxTick = 100 / SPD, scaled by inventory weight tier
    const basePlayerTick = parseFloat((100 / Math.max(1, wanderer.spd)).toFixed(2));
    const weightSt = getWeightStatus(wanderer.str || 0);
    let playerMaxTick;
    if (weightSt.tier === 0) {
        // Light: ATB tick 10% faster (ceil so e.g. 10->9, 9->9)
        playerMaxTick = Math.ceil(basePlayerTick * weightSt.atbMult);
    } else if (weightSt.tier >= 2) {
        // Heavy/VeryHeavy/Extreme: ATB tick 10-30% slower (floor)
        playerMaxTick = Math.floor(basePlayerTick * weightSt.atbMult);
    } else {
        // Normal: no change
        playerMaxTick = basePlayerTick;
    }
    const monsterEntry = {
        ...monster,
        nameKey: monster.id ? `monsters.${monster.id}.name` : null,
        isSummon: false,
        maxTick: parseFloat((100 / Math.max(1, monster.spd)).toFixed(2)),
        currentTick: parseFloat((100 / Math.max(1, monster.spd)).toFixed(2)),
    };

    combat = {
        player: {
            nameKey: wanderer.nameKey,
            name: wanderer.name,
            portrait: wanderer.portrait,
            hp: ds.currentHp,
            maxHp: ds.maxHp,
            atk: baseAtk,
            def: 0,
            spd: wanderer.spd,
            dex: wanderer.dex,
            agi: wanderer.agi,
            str: wanderer.str || 5,
            traits: wanderer.traits || [],
            sanity: ds.sanity,
            maxTick: playerMaxTick,
            currentTick: playerMaxTick,
        },
        monsters: [monsterEntry],       // Array of monsters
        activeTargetIndex: 0,           // Index into monsters[]
        lastAttackedIndex: 0,           // Memory of last attacked monster
        turn: 0,
        phase: 'init', // init | player | monster | result
        nextTurn: null, // 'player' | 'monster'
        log: [],
        result: null, // 'victory' | 'defeat' | 'fled'
    };

    // Backwards compat: expose combat.monster as alias for the primary monster
    Object.defineProperty(combat, 'monster', {
        get() { return this.monsters[this.activeTargetIndex]; },
        configurable: true,
    });

    syncCombatState();
    return combat;
}

/**
 * Advance the tick counter to find the next actor.
 * Subtracts the minimum currentTick from all combatants.
 * Sets combat.nextTurn to 'player' or monster index.
 * @returns {number} The amount of tick that was advanced (minTick)
 */
export function advanceTick() {
    if (!combat) return 0;

    const allActors = [
        { key: 'player', ref: combat.player },
        ...combat.monsters.filter(m => m.hp > 0).map((m, i) => ({ key: `monster_${i}`, ref: m, idx: i })),
    ];

    const minTick = Math.min(...allActors.map(a => a.ref.currentTick));

    // Subtract minTick from all
    allActors.forEach(a => {
        a.ref.currentTick = parseFloat(Math.max(0, a.ref.currentTick - minTick).toFixed(4));
    });

    // Determine next actor(s) at 0 tick, tiebreak: highest SPD, then player priority
    const atZero = allActors.filter(a => a.ref.currentTick <= 0.001);
    atZero.sort((a, b) => b.ref.spd - a.ref.spd);

    const next = atZero[0];
    if (next) {
        combat.nextTurn = next.key === 'player' ? 'player' : 'monster';
        if (next.key !== 'player') combat.actingMonsterIndex = next.idx;
    }

    syncCombatState();
    return minTick;
}

/**
 * Reset the tick for an actor after they take their turn.
 * @param {'player'|number} actor - 'player' or monster array index
 */
export function resetTick(actor) {
    if (!combat) return;
    if (actor === 'player') {
        combat.player.currentTick = combat.player.maxTick;
    } else if (typeof actor === 'number' && combat.monsters[actor]) {
        combat.monsters[actor].currentTick = combat.monsters[actor].maxTick;
    }
}

export function getCombatState() {
    return combat;
}

/**
 * Load a saved combat state (used when resuming).
 */
export function loadCombatState(savedCombat) {
    if (!savedCombat) return null;
    combat = savedCombat;

    // Backward compatibility for nextTurn tracker
    if (combat.nextTurn === undefined) {
        if (combat.phase === 'player') combat.nextTurn = 'monster';
        else if (combat.phase === 'monster') combat.nextTurn = 'player';
        else combat.nextTurn = null; // Either not started or finished
    }

    // Re-bind the backwards compatibility alias for `monster`
    Object.defineProperty(combat, 'monster', {
        get() { return this.monsters[this.activeTargetIndex]; },
        configurable: true,
    });

    return combat;
}

/**
 * Get the currently active target monster.
 */
export function getActiveTarget() {
    if (!combat) return null;
    return combat.monsters[combat.activeTargetIndex] || combat.monsters[0];
}

/**
 * Set the active target by index. Returns false if that monster is dead.
 */
export function setActiveTarget(index) {
    if (!combat || index < 0 || index >= combat.monsters.length) return false;
    if (combat.monsters[index].hp <= 0) return false;
    combat.activeTargetIndex = index;
    return true;
}

/**
 * After a monster dies, auto-select the first living monster.
 * Returns the new index, or -1 if all dead.
 */
function autoSelectTarget() {
    if (!combat) return -1;
    const alive = combat.monsters.findIndex(m => m.hp > 0);
    if (alive >= 0) {
        combat.activeTargetIndex = alive;
        combat.lastAttackedIndex = alive;
    }
    return alive;
}

/**
 * Add a summoned monster mid-combat.
 * @param {object} monsterDef Raw monster from MONSTERS data
 * @param {number} level Current dungeon level
 */
export function summonMonster(monsterDef, level) {
    if (!combat) return;

    const aliveSummons = combat.monsters.filter(m => m.isSummon && m.hp > 0).length;
    if (aliveSummons >= 3) return; // Limit to 3 active summons max

    const spd = monsterDef.spd || 8;
    const maxTick = parseFloat((100 / Math.max(1, spd)).toFixed(2));

    const summoned = {
        ...monsterDef,
        nameKey: monsterDef.id ? `monsters.${monsterDef.id}.name` : null,
        isSummon: true,
        hp: monsterDef.hp + level,
        maxHp: monsterDef.hp + level,
        currentLevel: level,
        maxTick: maxTick,
        currentTick: maxTick,
    };
    combat.monsters.push(summoned);
    combatLog(t('logs.combat_summon_bat'));
    syncCombatState();

    // Notify UI to refresh
    if (typeof window.__refreshCombatMonsters === 'function') window.__refreshCombatMonsters();
}

// ─── Initiative ───

/**
 * Determine and log who is naturally faster, and apply first strike trait.
 */
export function determineInitiative() {
    if (!combat) return;

    const primaryMonster = combat.monsters[0];
    let playerSpd = combat.player.spd;

    // Trait: 선수필승 → 30% initial ATB boost and +3 SPD for tiebreak log
    if (combat.player.traits.some((t) => t.id === 't_pos_first_strike')) {
        playerSpd += 3;
        combat.player.currentTick = Math.max(0, combat.player.currentTick - (combat.player.maxTick * 0.3));
    }

    // Just for logging who is technically faster initially
    const first = playerSpd >= primaryMonster.spd ? 'player' : 'monster';

    combatLog(t('logs.combat_first_strike', { name: first === 'player' ? getFighterName(combat.player) : getFighterName(primaryMonster), spd: first === 'player' ? playerSpd : primaryMonster.spd }));

    syncCombatState();
}

// ─── Hit Chance ───

/**
 * Calculate hit chance for a given body part against the active target.
 */
export function getHitChance(part) {
    if (!combat) return 0;

    const ds = getDungeonState();
    const target = getActiveTarget();
    if (!target) return 0;

    // Base hit chance from monster data (default to old logic if missing)
    let baseHit = 50;
    baseHit += SETTINGS.partBonus[part];
    if (target.partsHit && typeof target.partsHit[part] === 'number') {
        baseHit = target.partsHit[part];
    }

    let hitChance = baseHit + (combat.player.dex * 2) - target.eva;

    // Trait: 예리한 눈 → +5%
    if (combat.player.traits.some((t) => t.id === 't_pos_eagle_eye')) {
        hitChance += 5;
    }

    // Theme Expert trait
    const theme = ds.mapData?.theme || '';
    if (theme) {
        const expertId = `t_pos_${theme}_expert`;
        if (combat.player.traits.some((t) => t.id === expertId)) {
            hitChance += 10;
        }
    }

    // Sanity debuff/buff on accuracy
    const sanityState = getSanityStatus(ds.sanity);
    hitChance += sanityState.playerAcc ?? 0;

    return Math.max(5, Math.min(95, hitChance));
}

/**
 * Calculate predicted damage range for UI.
 * @param {'head'|'body'|'legs'} part
 * @returns {{ min: number, max: number }}
 */
export function getPredictedDamage(part) {
    if (!combat) return { min: 0, max: 0 };

    const target = getActiveTarget();
    if (!target) return { min: 0, max: 0 };

    const inv = getInventory();
    const weapon = inv?.equipped;
    const minWpn = weapon ? weapon.dmgMin : (combat.player.str || 0) + 1;
    const maxWpn = weapon ? weapon.dmgMax : (combat.player.str || 0) + 3;

    const calc = (base) => {
        let dmg = Math.max(1, base - target.def);
        dmg = Math.round(dmg * SETTINGS.partMult[part]);

        // Ghost: physical resist
        if (target.ability === 'phys_resist') {
            dmg = Math.max(1, Math.round(dmg * 0.5));
        }
        return Math.max(1, dmg);
    };

    return {
        min: calc(minWpn),
        max: calc(maxWpn),
    };
}

// ─── Player Attack ───

/**
 * Execute a player attack on the given body part against the active target.
 * @param {'head'|'body'|'legs'} part
 * @returns {{ hit: boolean, damage: number, critical: boolean, targetIndex: number }}
 */
export function playerAttack(part) {
    if (!combat) return { hit: false, damage: 0, critical: false, weaponBroke: false, targetIndex: 0 };

    const target = getActiveTarget();
    if (!target) return { hit: false, damage: 0, critical: false, weaponBroke: false, targetIndex: 0 };

    const targetIndex = combat.activeTargetIndex;

    // Madness: random part selection
    const ds = getDungeonState();
    const sanityState = getSanityStatus(ds.sanity);
    if (sanityState.class === 'sanity-madness') {
        const enabledParts = ['head', 'body', 'legs'].filter(p => target.parts?.[p] !== false);
        part = enabledParts[Math.floor(Math.random() * enabledParts.length)];
        combatLog(t('logs.combat_random_part', { part: getPartLabel(part) }));
    }

    combat.turn++;
    combat.phase = 'player';
    combat.lastAttackedIndex = targetIndex;
    combat.nextTurn = 'monster';

    const hitChance = getHitChance(part);
    const roll = Math.random() * 100;
    const hit = roll < hitChance;

    if (!hit) {
        combatLog(t('logs.combat_miss', { name: getFighterName(combat.player), part: getPartLabel(part), chance: hitChance }));
        syncCombatState();
        return { hit: false, damage: 0, critical: false, weaponBroke: false, targetIndex };
    }

    // Get weapon damage (random within range) or unarmed damage based on STR
    const inv = getInventory();
    let weaponDmg;
    if (inv?.equipped) {
        weaponDmg = getWeaponDamage();
    } else {
        const str = combat.player.str || 0;
        weaponDmg = str + 1 + Math.floor(Math.random() * 3); // Unarmed: STR+1 to STR+3
    }
    let damage = Math.max(1, weaponDmg - target.def);
    damage = Math.round(damage * SETTINGS.partMult[part]);

    // Ghost: physical resist 50%
    if (target.ability === 'phys_resist') {
        damage = Math.max(1, Math.round(damage * 0.5));
        combatLog(t('logs.combat_resist'));
    }

    damage = Math.max(1, damage);
    target.hp = Math.max(0, target.hp - damage);

    // Poison Slime: Thorns (Poison on hit)
    if (target.ability === 'poison') {
        const poisonDmg = 3 + Math.floor(target.lv / 2);
        combat.player.hp = Math.max(0, combat.player.hp - poisonDmg);
        ds.currentHp = combat.player.hp;
        combatLog(t('logs.combat_poison_dmg', { dmg: poisonDmg }));
        if (typeof window.__refreshCombatUI === 'function') window.__refreshCombatUI();
    }

    // Giant Slime: Split (minor regen)
    if (target.ability === 'split' && target.hp > 0) {
        const regen = 5;
        target.hp = Math.min(target.maxHp, target.hp + regen);
        combatLog(t('logs.combat_split_heal', { heal: regen }));
    }

    // Degrade weapon durability
    const weaponState = degradeWeapon();
    const weaponBroke = weaponState?.broken === true;
    if (weaponBroke) {
        combatLog(t('logs.combat_weapon_broke'));
    }

    const critical = part === 'head';
    const criticalText = critical ? t('logs.combat_crit_text') : '';
    combatLog(t('logs.combat_hit', { name: getFighterName(combat.player), part: getPartLabel(part), crit: criticalText, dmg: damage, chance: hitChance }));

    // Check if this target died
    if (target.hp <= 0) {
        combatLog(t('logs.victory', { name: getFighterName(target) }));

        // Check if ALL monsters are dead
        const allDead = combat.monsters.every(m => m.hp <= 0);
        if (allDead) {
            combat.result = 'victory';
            combat.phase = 'result';
        } else {
            // Auto-select next alive monster
            autoSelectTarget();
            if (typeof window.__refreshCombatMonsters === 'function') window.__refreshCombatMonsters();
        }
    }

    syncCombatState();
    return { hit: true, damage, critical, weaponBroke, targetIndex };
}

// ─── Monster Attack ───

/**
 * Execute all alive monsters' attacks on the player (one by one).
 * @returns {{ damage: number, evaded: boolean }}
 */
export function monsterAttack() {
    if (!combat || combat.result) return { damage: 0, evaded: false };

    combat.phase = 'monster';

    let totalDamage = 0;
    let anyEvaded = false;

    const sanityMod = getSanityStatus(getDungeonState()?.sanity ?? 100);

    const actingIndex = combat.actingMonsterIndex !== undefined ? combat.actingMonsterIndex : combat.activeTargetIndex;
    const monster = combat.monsters[actingIndex];
    if (!monster || monster.hp <= 0) return { damage: 0, evaded: false };

    // Apply sanity monster DMG modifier
    const monsterDmgMult = 1 + (sanityMod.monsterDmg ?? 0) / 100;
    let damage = Math.max(1, Math.round((monster.atk - combat.player.def) * monsterDmgMult));

    // ─── Special Abilities (Attack Modifiers) ───

    // Mimic: First turn crit
    if (monster.ability === 'first_crit' && combat.turn <= 1) {
        damage = Math.round(damage * 2);
        combatLog(t('logs.combat_mimic_crit'));
    }

    // Balrog: AoE (Every 2 turns)
    if (monster.ability === 'aoe' && combat.turn % 2 === 0) {
        damage = Math.round(damage * 1.5);
        combatLog(t('logs.combat_balrog_aoe'));
    }

    // Warlock: Magic Attack (Ignores DEF partially)
    if (monster.ability === 'magic_atk') {
        damage = Math.max(1, monster.atk - Math.floor(combat.player.def / 2));
        combatLog(t('logs.combat_warlock_magic'));
    }

    // Summoner: Bat Summon
    if (monster.ability === 'summon_bat' && Math.random() < 0.3) {
        const ds = getDungeonState();
        const batDef = { id: 'm_bat', name: '박쥐', emoji: '🦇', hp: 8, atk: 4, def: 0, eva: 20, spd: 8, exp: 0, parts: { head: true, body: true, legs: false }, partsHit: { head: 40, body: 80 }, ability: '', isSummon: true };
        summonMonster(batDef, ds.wave || 1);
        // Still attacked this turn
    }

    // Goblin King: Battle Cry (Buff ATK every 3 turns)
    if (monster.ability === 'buff_goblins' && combat.turn % 3 === 0) {
        monster.atk += 2;
        combatLog(t('logs.combat_goblin_buff'));
        return { damage: totalDamage, evaded: anyEvaded }; // Skips actual attack this turn
    }

    // Treant: Entangle (Reduce Player AGI)
    if (monster.ability === 'entangle' && Math.random() < 0.25) {
        combat.player.agi = Math.max(0, combat.player.agi - 1);
        combatLog(t('logs.combat_treant_snare'));
    }

    // Player evasion (boosted or penalized by sanity evasion modifier)
    let evadeChance = combat.player.agi * 2 + (sanityMod.evasion ?? 0);
    const dsLocal = getDungeonState();
    const theme = dsLocal.mapData?.theme || '';
    if (theme) {
        const expertId = `t_pos_${theme}_expert`;
        if (combat.player.traits.some((t) => t.id === expertId)) {
            evadeChance += 5;
        }
    }

    const evadeRoll = Math.random() * 100;
    if (evadeRoll < evadeChance) {
        combatLog(t('logs.combat_evade', { name: getFighterName(combat.player), chance: evadeChance }));
        anyEvaded = true;
        syncCombatState();
        return { damage: totalDamage, evaded: anyEvaded };
    }

    combat.player.hp = Math.max(0, combat.player.hp - damage);
    totalDamage += damage;

    // Sync back to dungeon state
    const ds = getDungeonState();
    ds.currentHp = combat.player.hp;

    combatLog(t('logs.combat_monster_hit', { name: getFighterName(monster), dmg: damage }));

    // Demon: Burn status effect
    if (monster.ability === 'burn') {
        applyStatusEffect({
            type: 'burn',
            duration: SETTINGS.burnDuration,
            icon: '🔥',
            label: t('status.burn'),
        });
    }

    // Poison Slime: Poison status effect (30% chance)
    if (monster.ability === 'poison' && Math.random() < 0.3) {
        applyStatusEffect({
            type: 'poison',
            duration: SETTINGS.poisonDuration,
            icon: '🟢',
            label: t('status.poison'),
        });
    }

    if (combat.player.hp <= 0) {
        combat.result = 'defeat';
        combat.phase = 'result';
        combatLog(t('logs.death'));
    }

    syncCombatState();
    return { damage: totalDamage, evaded: anyEvaded && totalDamage === 0 };
}

// ─── Flee ───

/**
 * Attempt to flee from combat.
 * Base chance: 40% + (player.spd - fastest_monster.spd) * 5%
 * @returns {boolean} success
 */
export function attemptFlee() {
    if (!combat) return false;

    const sanityMod = getSanityStatus(getDungeonState()?.sanity ?? 100);
    const fastestMonster = combat.monsters.reduce((fastest, m) => m.hp > 0 && m.spd > fastest.spd ? m : fastest, { spd: 0 });
    let fleeChance = 40 + (combat.player.spd - fastestMonster.spd) * 5;
    fleeChance += sanityMod.flee ?? 0;

    // Trait: 둔함 → -10%
    if (combat.player.traits.some((t) => t.id === 't_neg_clumsy')) {
        fleeChance -= 10;
    }

    fleeChance = Math.max(5, Math.min(90, fleeChance));

    const roll = Math.random() * 100;
    const success = roll < fleeChance;

    if (success) {
        combat.result = 'fled';
        combat.phase = 'result';
        combatLog(t('logs.combat_flee_success', { chance: fleeChance }));
    } else {
        combat.nextTurn = 'monster';
        combatLog(t('logs.combat_flee_fail', { chance: fleeChance }));
    }

    syncCombatState();
    return success;
}

// ─── Admin Tools ───

export function adminCombatWin() {
    if (!combat) return;
    combat.monsters.forEach(m => m.hp = 0);
    combat.result = 'victory';
    combat.phase = 'result';
    combatLog(t('logs.combat_admin_win'));
    if (typeof window.__refreshCombatUI === 'function') window.__refreshCombatUI();
}

export function adminCombatLose(keepHP = false) {
    if (!combat) return;
    combat.result = 'defeat';
    combat.phase = 'result';
    if (!keepHP) {
        combat.player.hp = 0;
        const ds = getDungeonState();
        ds.currentHp = 0;
    }
    combatLog(t('logs.combat_admin_lose', { type: keepHP ? 'Save HP' : 'Death' }));
    syncCombatState();
    if (typeof window.__refreshCombatUI === 'function') window.__refreshCombatUI();
}

// Update global admin hook
if (window.__admin) {
    window.__admin.combatWin = adminCombatWin;
    window.__admin.combatLose = () => adminCombatLose(true);
    window.__admin.combatKill = () => adminCombatLose(false);
}

function combatLog(msg) {
    if (combat) combat.log.push(msg);
}

export function getFighterName(fighter) {
    if (!fighter) return '';
    return fighter.nameKey ? t(fighter.nameKey) : fighter.name;
}

export function getPartLabel(part) {
    return t('dungeon_ui.part_' + part) || PART_LABEL[part] || part;
}

export function getPartBonus(part) {
    return SETTINGS.partBonus?.[part] || 0;
}

export function getPartMult(part) {
    return SETTINGS.partMult?.[part] || 1;
}

function syncCombatState() {
    if (!combat) return;
    const ds = getDungeonState();
    if (!ds) return;

    // Attach current combat snapshot
    if (combat.result === null) {
        ds.combat = combat;
    } else {
        ds.combat = null;
    }

    // Always attach inventory snapshot if available, just in case
    const inv = getInventory();
    if (inv) {
        ds.inventory = {
            slots: inv.slots,
            safeBag: inv.safeBag,
            equipped: inv.equipped
        };
    }

    // Pass the state to the global game state to trigger localStorage save
    setActiveDungeon(ds);
}
