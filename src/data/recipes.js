// ─── Crafting Recipes ───
// Source: DATASET.md §3 — Weapon Recipes
// Each recipe: { result (weapon ID), ingredients: [{ id, qty }], grade }
// Ingredients can be materials (mat_*) or existing weapons (w_*) for upgrades.

export const RECIPES = [
    // ── 일반 (Common) ──
    {
        result: 'w_oak_club',
        grade: 'common',
        reqItem: 'rcp_w_oak_club',
        reqCastleLv: 1,
        ingredients: [
            { id: 'mat_iron_ore', qty: 1 },
            { id: 'mat_leather_strap', qty: 1 },
        ],
    },
    {
        result: 'w_rusty_dagger',
        grade: 'common',
        reqItem: 'rcp_w_rusty_dagger',
        reqCastleLv: 1,
        ingredients: [
            { id: 'mat_wood', qty: 1 },
            { id: 'mat_iron_stud', qty: 1 },
            { id: 'mat_iron_ore', qty: 1 },
        ],
    },
    {
        result: 'w_battle_staff',
        grade: 'common',
        reqItem: 'rcp_w_battle_staff',
        reqCastleLv: 1,
        ingredients: [
            { id: 'mat_wood', qty: 1 },
            { id: 'mat_sticky_sap', qty: 2 },
        ],
    },
    {
        result: 'w_clock_axe',
        grade: 'common',
        reqItem: 'rcp_w_clock_axe',
        reqCastleLv: 1,
        ingredients: [
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_sharp_blade', qty: 1 },
            { id: 'mat_iron_ore', qty: 1 },
            { id: 'mat_wood', qty: 1 },
        ],
    },
    {
        result: 'w_hunter_bow',
        grade: 'common',
        reqItem: 'rcp_w_hunter_bow',
        reqCastleLv: 1,
        ingredients: [
            { id: 'mat_wood', qty: 2 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_iron_stud', qty: 1 },
        ],
    },

    // ── 영웅 (Heroic) — weapon + materials ──
    {
        result: 'w_mithril_glaive',
        grade: 'epic',
        reqItem: 'rcp_w_mithril_glaive',
        reqCastleLv: 3,
        ingredients: [
            { id: 'mat_steel_part', qty: 2 },
            { id: 'mat_sticky_sap', qty: 1 },
            { id: 'mat_iron_ore', qty: 2 },
            { id: 'mat_wood', qty: 1 },
        ],
    },
    {
        result: 'w_magic_sword',
        grade: 'epic',
        reqItem: 'rcp_w_magic_sword',
        reqCastleLv: 3,
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_mana_stone', qty: 1 },
            { id: 'mat_beast_tendon', qty: 1 },
        ],
    },
    {
        result: 'w_blood_scythe',
        grade: 'epic',
        reqItem: 'rcp_w_blood_scythe',
        reqCastleLv: 3,
        ingredients: [
            { id: 'mat_sharp_blade', qty: 1 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_rune_spear',
        grade: 'epic',
        reqItem: 'rcp_w_rune_spear',
        reqCastleLv: 3,
        ingredients: [
            { id: 'mat_mana_stone', qty: 1 },
            { id: 'mat_wood', qty: 2 },
            { id: 'mat_sharp_blade', qty: 1 },
        ],
    },
    {
        result: 'w_war_hammer',
        grade: 'epic',
        reqItem: 'rcp_w_war_hammer',
        reqCastleLv: 3,
        ingredients: [
            { id: 'mat_iron_ore', qty: 2 },
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_mana_stone', qty: 1 },
        ],
    },
    {
        result: 'w_execution_axe',
        grade: 'epic',
        reqItem: 'rcp_w_execution_axe',
        reqCastleLv: 3,
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_iron_ore', qty: 1 },
            { id: 'mat_steel_part', qty: 1 },
        ],
    },

    // ── 전설 (Legendary) — rare materials required ──
    {
        result: 'w_gale_gauntlet',
        grade: 'legendary',
        reqItem: 'rcp_w_gale_gauntlet',
        reqCastleLv: 5,
        ingredients: [
            { id: 'mat_steel_part', qty: 2 },
            { id: 'mat_sharp_blade', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_berserk_axe',
        grade: 'legendary',
        reqItem: 'rcp_w_berserk_axe',
        reqCastleLv: 5,
        ingredients: [
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_assassin_katar',
        grade: 'legendary',
        reqItem: 'rcp_w_assassin_katar',
        reqCastleLv: 5,
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_steel_part', qty: 1 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_mana_heart', qty: 1 },
        ],
    },
    {
        result: 'w_thunder_mace',
        grade: 'legendary',
        reqItem: 'rcp_w_thunder_mace',
        reqCastleLv: 5,
        ingredients: [
            { id: 'mat_mana_stone', qty: 1 },
            { id: 'mat_steel_part', qty: 2 },
            { id: 'mat_beast_tendon', qty: 1 },
            { id: 'mat_rune', qty: 1 },
        ],
    },
    {
        result: 'w_dragon_slayer',
        grade: 'legendary',
        reqItem: 'rcp_w_dragon_slayer',
        reqCastleLv: 5,
        ingredients: [
            { id: 'mat_sharp_blade', qty: 2 },
            { id: 'mat_mana_heart', qty: 1 },
            { id: 'mat_beast_tendon', qty: 2 },
            { id: 'mat_steel_part', qty: 1 },
        ],
    },
];
