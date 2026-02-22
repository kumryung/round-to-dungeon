// ─── Weapon Data ───
// Grade: common(1) | uncommon(2) | magic(3) | rare(4) | epic(5) | legendary(6)

export const WEAPONS = {
    w_fist: {
        id: 'w_fist', type: 'weapon', stackable: false, maxStack: 1, grade: 'common',
        nameKey: 'items.w_fist.name', descKey: 'items.w_fist.desc', emoji: '✊',
        dmgMin: 1, dmgMax: 3, durability: Infinity, maxDurability: Infinity, price: 0,
        reqStats: {}, weight: 0,
    },
    // ── Common (Tier 1): Primary ~5, Secondary ~3 ──
    w_oak_club: {
        id: 'w_oak_club', type: 'weapon', stackable: false, maxStack: 1, grade: 'common',
        nameKey: 'items.w_oak_club.name', descKey: 'items.w_oak_club.desc', emoji: '🪵',
        dmgMin: 1, dmgMax: 8, durability: 30, maxDurability: 30, price: 100,
        reqStats: {}, weight: 8,
    },
    w_rusty_dagger: {
        id: 'w_rusty_dagger', type: 'weapon', stackable: false, maxStack: 1, grade: 'common',
        nameKey: 'items.w_rusty_dagger.name', descKey: 'items.w_rusty_dagger.desc', emoji: '🔪',
        dmgMin: 3, dmgMax: 7, durability: 30, maxDurability: 30, price: 100,
        reqStats: { agi: 5, spd: 3 }, weight: 5,
    },
    // ── Uncommon (Tier 2): Primary ~8, Secondary ~5, Tertiary ~3 ──
    w_battle_staff: {
        id: 'w_battle_staff', type: 'weapon', stackable: false, maxStack: 1, grade: 'uncommon',
        nameKey: 'items.w_battle_staff.name', descKey: 'items.w_battle_staff.desc', emoji: '🪄',
        dmgMin: 9, dmgMax: 10, durability: 40, maxDurability: 40, price: 200,
        reqStats: { agi: 8, spd: 5 }, weight: 10,
    },
    w_clock_axe: {
        id: 'w_clock_axe', type: 'weapon', stackable: false, maxStack: 1, grade: 'uncommon',
        nameKey: 'items.w_clock_axe.name', descKey: 'items.w_clock_axe.desc', emoji: '⚙️',
        dmgMin: 14, dmgMax: 19, durability: 50, maxDurability: 50, price: 250,
        reqStats: { str: 8, vit: 5, agi: 3 }, weight: 14,
    },
    w_hunter_bow: {
        id: 'w_hunter_bow', type: 'weapon', stackable: false, maxStack: 1, grade: 'uncommon',
        nameKey: 'items.w_hunter_bow.name', descKey: 'items.w_hunter_bow.desc', emoji: '🏹',
        dmgMin: 22, dmgMax: 28, durability: 45, maxDurability: 45, price: 200,
        reqStats: { spd: 8, agi: 5, dex: 3 }, weight: 7,
    },
    // ── Magic (Tier 3): Primary ~12, Secondary ~8, Tertiary ~5 ──
    w_mithril_glaive: {
        id: 'w_mithril_glaive', type: 'weapon', stackable: false, maxStack: 1, grade: 'magic',
        nameKey: 'items.w_mithril_glaive.name', descKey: 'items.w_mithril_glaive.desc', emoji: '🔱',
        dmgMin: 27, dmgMax: 33, durability: 100, maxDurability: 100, price: 500,
        reqStats: { str: 12, agi: 8, spd: 5 }, weight: 12,
    },
    w_magic_sword: {
        id: 'w_magic_sword', type: 'weapon', stackable: false, maxStack: 1, grade: 'magic',
        nameKey: 'items.w_magic_sword.name', descKey: 'items.w_magic_sword.desc', emoji: '⚔️',
        dmgMin: 21, dmgMax: 27, durability: 70, maxDurability: 70, price: 600,
        reqStats: { str: 12, agi: 8 }, weight: 13,
    },
    w_blood_scythe: {
        id: 'w_blood_scythe', type: 'weapon', stackable: false, maxStack: 1, grade: 'magic',
        nameKey: 'items.w_blood_scythe.name', descKey: 'items.w_blood_scythe.desc', emoji: '⛏️',
        dmgMin: 16, dmgMax: 21, durability: 60, maxDurability: 60, price: 550,
        reqStats: { agi: 10, spd: 12 }, weight: 11,
    },
    // ── Rare (Tier 4): Primary ~16, Secondary ~12, Tertiary ~8 ──
    w_rune_spear: {
        id: 'w_rune_spear', type: 'weapon', stackable: false, maxStack: 1, grade: 'rare',
        nameKey: 'items.w_rune_spear.name', descKey: 'items.w_rune_spear.desc', emoji: '🗡️',
        dmgMin: 24, dmgMax: 29, durability: 65, maxDurability: 65, price: 700,
        reqStats: { agi: 16, spd: 12 }, weight: 14,
    },
    w_war_hammer: {
        id: 'w_war_hammer', type: 'weapon', stackable: false, maxStack: 1, grade: 'rare',
        nameKey: 'items.w_war_hammer.name', descKey: 'items.w_war_hammer.desc', emoji: '🔨',
        dmgMin: 38, dmgMax: 45, durability: 80, maxDurability: 80, price: 650,
        reqStats: { str: 16, vit: 12, agi: 8 }, weight: 22,
    },
    w_execution_axe: {
        id: 'w_execution_axe', type: 'weapon', stackable: false, maxStack: 1, grade: 'rare',
        nameKey: 'items.w_execution_axe.name', descKey: 'items.w_execution_axe.desc', emoji: '🪓',
        dmgMin: 11, dmgMax: 40, durability: 70, maxDurability: 70, price: 800,
        reqStats: { str: 16, vit: 12 }, weight: 20,
    },
    // ── Epic (Tier 5): Primary ~20, Secondary ~15, Tertiary ~10 ──
    w_gale_gauntlet: {
        id: 'w_gale_gauntlet', type: 'weapon', stackable: false, maxStack: 1, grade: 'epic',
        nameKey: 'items.w_gale_gauntlet.name', descKey: 'items.w_gale_gauntlet.desc', emoji: '🥊',
        dmgMin: 18, dmgMax: 23, durability: 150, maxDurability: 150, price: 1000,
        reqStats: { spd: 20, agi: 15 }, weight: 8,
    },
    w_berserk_axe: {
        id: 'w_berserk_axe', type: 'weapon', stackable: false, maxStack: 1, grade: 'epic',
        nameKey: 'items.w_berserk_axe.name', descKey: 'items.w_berserk_axe.desc', emoji: '⚡',
        dmgMin: 1, dmgMax: 63, durability: 80, maxDurability: 80, price: 1200,
        reqStats: { str: 20, vit: 15, agi: 10 }, weight: 25,
    },
    w_assassin_katar: {
        id: 'w_assassin_katar', type: 'weapon', stackable: false, maxStack: 1, grade: 'epic',
        nameKey: 'items.w_assassin_katar.name', descKey: 'items.w_assassin_katar.desc', emoji: '🗡️',
        dmgMin: 28, dmgMax: 34, durability: 90, maxDurability: 90, price: 1500,
        reqStats: { agi: 20, spd: 15, dex: 10 }, weight: 6,
    },
    w_thunder_mace: {
        id: 'w_thunder_mace', type: 'weapon', stackable: false, maxStack: 1, grade: 'epic',
        nameKey: 'items.w_thunder_mace.name', descKey: 'items.w_thunder_mace.desc', emoji: '⚡',
        dmgMin: 23, dmgMax: 38, durability: 100, maxDurability: 100, price: 1100,
        reqStats: { str: 20, spd: 15 }, weight: 18,
    },
    // ── Legendary (Tier 6): Primary ~25, Secondary ~18, Tertiary ~12 ──
    w_dragon_slayer: {
        id: 'w_dragon_slayer', type: 'weapon', stackable: false, maxStack: 1, grade: 'legendary',
        nameKey: 'items.w_dragon_slayer.name', descKey: 'items.w_dragon_slayer.desc', emoji: '🐉',
        dmgMin: 44, dmgMax: 52, durability: 120, maxDurability: 120, price: 2000,
        reqStats: { str: 25, agi: 18, spd: 12 }, weight: 28,
    },
};

export const GRADE_ORDER = ['common', 'uncommon', 'magic', 'rare', 'epic', 'legendary'];

export const GRADE_COLOR = {
    common: '#aaa',
    uncommon: '#5b8c5a',
    magic: '#4a7fb5',
    rare: '#8b5cf6',
    epic: '#e06c00',
    legendary: '#f59e0b',
};

/**
 * Get a fresh weapon instance (with full durability).
 */
export function getWeapon(weaponId) {
    const base = WEAPONS[weaponId];
    if (!base) return null;
    return { ...base };
}

/**
 * Get the display color for a grade.
 */
export function gradeColor(grade) {
    return GRADE_COLOR[grade] || '#ccc';
}

/**
 * Returns true if the item's grade tier is >= minGrade tier.
 */
export function isGradeAtLeast(itemGrade, minGrade) {
    return GRADE_ORDER.indexOf(itemGrade) >= GRADE_ORDER.indexOf(minGrade);
}
