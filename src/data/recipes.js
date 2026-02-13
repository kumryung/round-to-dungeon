// ─── Crafting Recipes ───
// Source: DATASET.md §3 — Weapon Recipes
// Each recipe: { result (weapon ID), ingredients: [{ id, qty }], grade }
// Ingredients can be materials (mat_*) or existing weapons (w_*) for upgrades.

export const RECIPES = [
    // ── 일반 (Common) ──
    {
        result: 'w_oak_club',
        grade: '일반',
        ingredients: [
            { id: 'mat_iron_ore', qty: 1 },
            { id: 'mat_leather_strap', qty: 1 },
        ],
    },
    {
        result: 'w_rusty_dagger',
        grade: '일반',
        ingredients: [
            { id: 'mat_wood', qty: 1 },
            { id: 'mat_iron_stud', qty: 1 },
            { id: 'mat_iron_ore', qty: 1 },
        ],
    },
    {
        result: 'w_battle_staff',
        grade: '일반',
        ingredients: [
            { id: 'mat_wood', qty: 1 },
            { id: 'mat_sticky_sap', qty: 2 },
        ],
    },
    {
        result: 'w_clock_axe',
        grade: '일반',
        ingredients: [
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_sharp_blade', qty: 1 },
            { id: 'mat_iron_ore', qty: 1 },
            { id: 'mat_wood', qty: 1 },
        ],
    },
    {
        result: 'w_hunter_bow',
        grade: '일반',
        ingredients: [
            { id: 'mat_wood', qty: 2 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_iron_stud', qty: 1 },
        ],
    },

    // ── 영웅 (Heroic) — weapon + materials ──
    {
        result: 'w_mithril_glaive',
        grade: '영웅',
        ingredients: [
            { id: 'mat_steel_part', qty: 2 },
            { id: 'mat_sticky_sap', qty: 1 },
            { id: 'mat_iron_ore', qty: 2 },
            { id: 'mat_wood', qty: 1 },
        ],
    },
    {
        result: 'w_magic_sword',
        grade: '영웅',
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_mana_stone', qty: 1 },
            { id: 'mat_beast_tendon', qty: 1 },
        ],
    },
    {
        result: 'w_blood_scythe',
        grade: '영웅',
        ingredients: [
            { id: 'mat_sharp_blade', qty: 1 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_rune_spear',
        grade: '영웅',
        ingredients: [
            { id: 'mat_mana_stone', qty: 1 },
            { id: 'mat_wood', qty: 2 },
            { id: 'mat_sharp_blade', qty: 1 },
        ],
    },
    {
        result: 'w_war_hammer',
        grade: '영웅',
        ingredients: [
            { id: 'mat_iron_ore', qty: 2 },
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_mana_stone', qty: 1 },
        ],
    },
    {
        result: 'w_execution_axe',
        grade: '영웅',
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_iron_ore', qty: 1 },
            { id: 'mat_steel_part', qty: 1 },
        ],
    },

    // ── 전설 (Legendary) — rare materials required ──
    {
        result: 'w_gale_gauntlet',
        grade: '전설',
        ingredients: [
            { id: 'mat_steel_part', qty: 2 },
            { id: 'mat_sharp_blade', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_berserk_axe',
        grade: '전설',
        ingredients: [
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_assassin_katar',
        grade: '전설',
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_thunder_mace',
        grade: '전설',
        ingredients: [
            { id: 'mat_mana_stone', qty: 1 },
            { id: 'mat_steel_part', qty: 2 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_rune', qty: 1 },
        ],
    },
    {
        result: 'w_dragon_slayer',
        grade: '전설',
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_mana_heart', qty: 1 },
            { id: 'mat_beast_tendon', qty: 2 },
            { id: 'mat_steel_part', qty: 1 },
        ],
    },
];
