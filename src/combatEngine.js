// ─── Combat Engine ───
// Handles turn-based combat logic: initiative, hit/damage, flee, monster AI

import { getDungeonState, getSanityStatus } from './dungeonState.js';
import { getInventory, getWeaponDamage, degradeWeapon } from './inventory.js';

// ─── Constants ───
const PART_BONUS = { head: -20, body: 10, legs: 0 };
const PART_MULT = { head: 1.5, body: 1.0, legs: 1.0 };
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

    combat = {
        player: {
            name: wanderer.name,
            portrait: wanderer.portrait,
            hp: ds.currentHp,
            maxHp: ds.maxHp,
            atk: baseAtk,
            def: 0,
            spd: wanderer.spd,
            dex: wanderer.dex,
            agi: wanderer.agi,
            traits: wanderer.traits || [],
            sanity: ds.sanity,
        },
        monster: { ...monster },
        turn: 0,
        phase: 'init', // init | player | monster | result
        log: [],
        result: null, // 'victory' | 'defeat' | 'fled'
    };

    return combat;
}

export function getCombatState() {
    return combat;
}

// ─── Initiative ───

/**
 * Determine who attacks first.
 * @returns {'player'|'monster'}
 */
export function determineInitiative() {
    if (!combat) return 'player';

    let playerSpd = combat.player.spd;

    // Trait: 선수필승 → +10% initiative bonus (treated as +3 SPD)
    if (combat.player.traits.some((t) => t.id === 't_pos_first_strike')) {
        playerSpd += 3;
    }

    // Tie-break: player wins
    const first = playerSpd >= combat.monster.spd ? 'player' : 'monster';

    combatLog(`⚡ 선공: ${first === 'player' ? combat.player.name : combat.monster.name} (SPD ${first === 'player' ? playerSpd : combat.monster.spd})`);

    return first;
}

// ─── Hit Chance ───

/**
 * Calculate hit chance for a given body part.
 */
export function getHitChance(part) {
    if (!combat) return 0;

    const ds = getDungeonState();

    // Base hit chance from monster data (default to old logic if missing)
    let baseHit = 50 + PART_BONUS[part];
    if (combat.monster.partsHit && typeof combat.monster.partsHit[part] === 'number') {
        baseHit = combat.monster.partsHit[part];
    }

    let hitChance = baseHit + (combat.player.dex * 2) - combat.monster.eva;

    // Trait: 예리한 눈 → +5%
    if (combat.player.traits.some((t) => t.id === 't_pos_eagle_eye')) {
        hitChance += 5;
    }

    // Sanity debuff
    const sanityState = getSanityStatus(ds.sanity);
    if (sanityState.class === 'sanity-anxiety') hitChance -= 10;
    else if (sanityState.class === 'sanity-panic') hitChance -= 20;
    else if (sanityState.class === 'sanity-madness') hitChance -= 30;

    return Math.max(5, Math.min(95, hitChance));
}

// ─── Player Attack ───

/**
 * Execute a player attack on the given body part.
 * @param {'head'|'body'|'legs'} part
 * @returns {{ hit: boolean, damage: number, critical: boolean }}
 */
export function playerAttack(part) {
    if (!combat) return { hit: false, damage: 0, critical: false, weaponBroke: false };

    // Madness: random part selection
    const ds = getDungeonState();
    const sanityState = getSanityStatus(ds.sanity);
    if (sanityState.class === 'sanity-madness') {
        const enabledParts = ['head', 'body', 'legs'].filter(p => combat.monster.parts?.[p] !== false);
        part = enabledParts[Math.floor(Math.random() * enabledParts.length)];
        combatLog(`😵 광기! 랜덤 부위 공격: ${PART_LABEL[part]}`);
    }

    combat.turn++;
    combat.phase = 'player';

    const hitChance = getHitChance(part);
    const roll = Math.random() * 100;
    const hit = roll < hitChance;

    if (!hit) {
        combatLog(`🎯 ${combat.player.name} → ${PART_LABEL[part]} 공격! — MISS (${hitChance}%)`);
        return { hit: false, damage: 0, critical: false, weaponBroke: false };
    }

    // Get weapon damage (random within range)
    let weaponDmg = getWeaponDamage();
    let damage = Math.max(1, weaponDmg - combat.monster.def);
    damage = Math.round(damage * PART_MULT[part]);

    // Ghost: physical resist 50%
    if (combat.monster.ability === 'phys_resist') {
        damage = Math.max(1, Math.round(damage * 0.5));
        combatLog(`👻 유령이 물리 공격을 반감시켰습니다.`);
    }

    damage = Math.max(1, damage);
    combat.monster.hp = Math.max(0, combat.monster.hp - damage);

    // Poison Slime: Thorns (Poison)
    if (combat.monster.ability === 'poison') {
        const poisonDmg = 3 + Math.floor(combat.monster.lv / 2);
        combat.player.hp = Math.max(0, combat.player.hp - poisonDmg);
        // Sync dungeon state
        const ds = getDungeonState();
        ds.currentHp = combat.player.hp;
        combatLog(`🤢 독 슬라임의 독이 튀었습니다! (-${poisonDmg} HP)`);

        if (typeof window.__refreshCombatUI === 'function') window.__refreshCombatUI();
    }

    // Giant Slime: Split (Heal on hit? No, on death usually. Let's add minor regen)
    if (combat.monster.ability === 'split' && combat.monster.hp > 0) {
        const regen = 5;
        combat.monster.hp = Math.min(combat.monster.maxHp, combat.monster.hp + regen);
        combatLog(`🫧 대형 슬라임이 분열하며 재생합니다. (+${regen} HP)`);
    }

    // Degrade weapon durability
    const weaponState = degradeWeapon();
    const weaponBroke = weaponState?.broken === true;
    if (weaponBroke) {
        combatLog(`💔 무기 파손! 주먹으로 전환`);
    }

    const critical = part === 'head';
    combatLog(`⚔️ ${combat.player.name} → ${PART_LABEL[part]} ${critical ? '치명타! ' : ''}${damage} 데미지! (${hitChance}%)`);

    if (combat.monster.hp <= 0) {
        combat.result = 'victory';
        combat.phase = 'result';
        combatLog(`🏆 ${combat.monster.name} 처치!`);
    }

    return { hit: true, damage, critical, weaponBroke };
}

// ─── Monster Attack ───

/**
 * Execute a monster's attack on the player.
 * @returns {{ damage: number }}
 */
export function monsterAttack() {
    if (!combat || combat.result) return { damage: 0 };

    combat.phase = 'monster';

    // Base damage calculation
    let damage = Math.max(1, combat.monster.atk - combat.player.def);

    // ─── Special Abilities (Attack Modifiers) ───

    // Mimic: First turn crit
    if (combat.monster.ability === 'first_crit' && combat.turn <= 1) {
        damage = Math.round(damage * 2);
        combatLog(`📦 미믹의 기습 공격! (치명타)`);
    }

    // Balrog: AoE (Every 2 turns)
    if (combat.monster.ability === 'aoe' && combat.turn % 2 === 0) {
        damage = Math.round(damage * 1.5);
        combatLog(`🔥 발록의 화염 채찍! (광역 피해)`);
    }

    // Warlock: Magic Attack (Ignores DEF partially)
    if (combat.monster.ability === 'magic_atk') {
        damage = Math.max(1, combat.monster.atk - Math.floor(combat.player.def / 2));
        combatLog(`🔮 암흑사제의 마법 공격! (방어 관통)`);
    }

    // Summoner: Bat Summon (Extra damage)
    if (combat.monster.ability === 'summon_bat' && Math.random() < 0.3) {
        damage += 5;
        combatLog(`🦇 소환된 박쥐가 협공합니다! (+5 Dmg)`);
    }

    // Goblin King: Battle Cry (Buff ATK every 3 turns)
    if (combat.monster.ability === 'buff_goblins' && combat.turn % 3 === 0) {
        combat.monster.atk += 2;
        combatLog(`👑 킹 고블린이 전장의 함성을 지릅니다! (공격력 증가)`);
        damage = 0; // Turns into buff action instead of attack
        return { damage: 0, evaded: false };
    }

    // Treant: Entangle (Reduce Player SPD/EVA)
    if (combat.monster.ability === 'entangle' && Math.random() < 0.25) {
        combat.player.agi = Math.max(0, combat.player.agi - 1);
        combatLog(`🌳 트렌트의 뿌리가 발을 묶습니다! (민첩 감소)`);
    }

    // Player AGI gives small evasion chance: AGI * 2%
    const evadeChance = combat.player.agi * 2;
    const evadeRoll = Math.random() * 100;
    if (evadeRoll < evadeChance) {
        combatLog(`🛡️ ${combat.player.name}이(가) 회피! (${evadeChance}%)`);
        return { damage: 0, evaded: true };
    }

    combat.player.hp = Math.max(0, combat.player.hp - damage);

    // Sync back to dungeon state
    const ds = getDungeonState();
    ds.currentHp = combat.player.hp;

    combatLog(`💥 ${combat.monster.name} → ${damage} 데미지!`);

    // Demon: Burn (Sanity damage)
    if (combat.monster.ability === 'burn') {
        ds.sanity = Math.max(0, ds.sanity - 2);
        combatLog(`🔥 악마의 화염으로 정신력이 깎입니다! (-2 Sanity)`);
    }

    if (combat.player.hp <= 0) {
        combat.result = 'defeat';
        combat.phase = 'result';
        combatLog(`💀 ${combat.player.name} 쓰러졌다...`);
    }

    return { damage, evaded: false };
}

// ─── Flee ───

/**
 * Attempt to flee from combat.
 * Base chance: 40% + (player.spd - monster.spd) * 5%
 * @returns {boolean} success
 */
export function attemptFlee() {
    if (!combat) return false;

    let fleeChance = 40 + (combat.player.spd - combat.monster.spd) * 5;

    // Trait: 둔함 → -10%
    if (combat.player.traits.some((t) => t.id === 't_neg_clumsy')) {
        fleeChance -= 10;
    }

    fleeChance = Math.max(10, Math.min(90, fleeChance));

    const roll = Math.random() * 100;
    const success = roll < fleeChance;

    if (success) {
        combat.result = 'fled';
        combat.phase = 'result';
        combatLog(`🏃 도망 성공! (${fleeChance}%)`);
    } else {
        combatLog(`🚫 도망 실패! (${fleeChance}%) — 몬스터의 턴!`);
    }

    return success;
}

// ─── Helpers ───

function combatLog(msg) {
    if (combat) combat.log.push(msg);
}

export function getPartLabel(part) {
    return PART_LABEL[part] || part;
}

export function getPartBonus(part) {
    return PART_BONUS[part] || 0;
}

export function getPartMult(part) {
    return PART_MULT[part] || 1;
}
