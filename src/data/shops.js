// ─── Shop Data ───
// CONSUMABLE_SHOP_DATA: materials, tools, consumables
// EQUIPMENT_SHOP_DATA: weapons, armors, accessories
// GACHA_POOL: all item types weighted by tier

// ─── Consumable Shop ───
export const CONSUMABLE_SHOP_DATA = {
    slots: [
        {
            id: 1, unlockLevel: 1, pool: [
                { id: 'c_bandage', weight: 40 },
                { id: 't_torch', weight: 30 },
                { id: 'mat_wood', weight: 20 },
                { id: 't_shovel', weight: 10 },
            ]
        },
        {
            id: 2, unlockLevel: 1, pool: [
                { id: 'c_herb', weight: 40 },
                { id: 't_key', weight: 30 },
                { id: 'mat_iron_ore', weight: 20 },
                { id: 't_holywater', weight: 10 },
            ]
        },
        {
            id: 3, unlockLevel: 1, pool: [
                { id: 'c_antidote', weight: 40 },
                { id: 'mat_leather_strap', weight: 30 },
                { id: 'mat_iron_stud', weight: 20 },
                { id: 'c_splint', weight: 10 },
            ]
        },
        {
            id: 4, unlockLevel: 1, pool: [
                { id: 'c_sanity_brew', weight: 40 },
                { id: 'mat_sticky_sap', weight: 30 },
                { id: 'mat_beast_tendon', weight: 20 },
                { id: 'mat_steel_part', weight: 10 },
            ]
        },
        {
            id: 5, unlockLevel: 2, pool: [
                { id: 'c_mega_potion', weight: 30 },
                { id: 'c_rage_tonic', weight: 25 },
                { id: 'c_stone_skin', weight: 25 },
                { id: 'mat_mana_stone', weight: 20 },
            ]
        },
        {
            id: 6, unlockLevel: 4, pool: [
                { id: 'mat_sharp_blade', weight: 40 },
                { id: 'mat_rune', weight: 30 },
                { id: 'mat_mana_stone', weight: 20 },
                { id: 'mat_steel_part', weight: 10 },
            ]
        },
        {
            id: 7, unlockLevel: 6, pool: [
                { id: 'c_ghost_step', weight: 40 },
                { id: 'mat_mana_stone', weight: 30 },
                { id: 'mat_rune', weight: 20 },
                { id: 'mat_mana_heart', weight: 10 },
            ]
        },
        {
            id: 8, unlockLevel: 8, pool: [
                { id: 'c_elixir', weight: 40 },
                { id: 't_holywater', weight: 40 },
                { id: 'mat_mana_heart', weight: 20 },
            ]
        },
        {
            id: 9, unlockLevel: 9, pool: [
                { id: 'mat_mana_heart', weight: 60 },
                { id: 'mat_dragon_scale', weight: 40 },
            ]
        },
        {
            id: 10, unlockLevel: 10, pool: [
                { id: 'c_elixir', weight: 60 },
                { id: 'c_mega_potion', weight: 40 },
            ]
        },
    ]
};

// ─── Equipment Shop ───
export const EQUIPMENT_SHOP_DATA = {
    slots: [
        {
            id: 1, unlockLevel: 1, pool: [
                { id: 'w_oak_club', weight: 40, source: 'weapon' },
                { id: 'w_rusty_dagger', weight: 30, source: 'weapon' },
                { id: 'a_rags', weight: 20, source: 'armor' },
                { id: 'ac_worn_ring', weight: 10, source: 'accessory' },
            ]
        },
        {
            id: 2, unlockLevel: 1, pool: [
                { id: 'a_leather_vest', weight: 40, source: 'armor' },
                { id: 'ac_simple_amulet', weight: 30, source: 'accessory' },
                { id: 'w_oak_club', weight: 20, source: 'weapon' },
                { id: 'ac_worn_ring', weight: 10, source: 'accessory' },
            ]
        },
        {
            id: 3, unlockLevel: 1, pool: [
                { id: 'w_battle_staff', weight: 35, source: 'weapon' },
                { id: 'w_clock_axe', weight: 25, source: 'weapon' },
                { id: 'a_studded_leather', weight: 25, source: 'armor' },
                { id: 'ac_iron_ring', weight: 15, source: 'accessory' },
            ]
        },
        {
            id: 4, unlockLevel: 1, pool: [
                { id: 'w_hunter_bow', weight: 35, source: 'weapon' },
                { id: 'a_chainmail', weight: 30, source: 'armor' },
                { id: 'ac_swiftness_charm', weight: 20, source: 'accessory' },
                { id: 'ac_hunter_pendant', weight: 15, source: 'accessory' },
            ]
        },
        {
            id: 5, unlockLevel: 2, pool: [
                { id: 'w_mithril_glaive', weight: 35, source: 'weapon' },
                { id: 'w_magic_sword', weight: 25, source: 'weapon' },
                { id: 'a_iron_breastplate', weight: 25, source: 'armor' },
                { id: 'ac_mana_brooch', weight: 15, source: 'accessory' },
            ]
        },
        {
            id: 6, unlockLevel: 4, pool: [
                { id: 'w_blood_scythe', weight: 35, source: 'weapon' },
                { id: 'a_shadow_cloak', weight: 30, source: 'armor' },
                { id: 'ac_warriors_band', weight: 25, source: 'accessory' },
                { id: 'ac_mana_brooch', weight: 10, source: 'accessory' },
            ]
        },
        {
            id: 7, unlockLevel: 6, pool: [
                { id: 'w_rune_spear', weight: 30, source: 'weapon' },
                { id: 'w_war_hammer', weight: 25, source: 'weapon' },
                { id: 'a_mithril_mail', weight: 25, source: 'armor' },
                { id: 'ac_rune_ring', weight: 20, source: 'accessory' },
            ]
        },
        {
            id: 8, unlockLevel: 8, pool: [
                { id: 'w_execution_axe', weight: 30, source: 'weapon' },
                { id: 'a_enchanted_robe', weight: 30, source: 'armor' },
                { id: 'ac_guardian_seal', weight: 40, source: 'accessory' },
            ]
        },
        {
            id: 9, unlockLevel: 9, pool: [
                { id: 'w_gale_gauntlet', weight: 30, source: 'weapon' },
                { id: 'w_berserk_axe', weight: 25, source: 'weapon' },
                { id: 'a_runic_plate', weight: 25, source: 'armor' },
                { id: 'ac_shadow_earring', weight: 20, source: 'accessory' },
            ]
        },
        {
            id: 10, unlockLevel: 10, pool: [
                { id: 'w_dragon_slayer', weight: 30, source: 'weapon' },
                { id: 'a_dragonscale_armor', weight: 25, source: 'armor' },
                { id: 'a_celestial_vestment', weight: 15, source: 'armor' },
                { id: 'ac_berserker_torc', weight: 20, source: 'accessory' },
                { id: 'ac_crown_of_valor', weight: 10, source: 'accessory' },
            ]
        },
    ]
};

// ─── Gacha Pool ───
// source: 'weapon' | 'armor' | 'accessory' | 'item'
// grade: used for 10+1 guarantee (rare+)
export const GACHA_POOL = [
    // ── Common (Tier 1) ── weight: 300 total
    { id: 'c_bandage', source: 'item', grade: 'common', weight: 50 },
    { id: 'c_herb', source: 'item', grade: 'common', weight: 50 },
    { id: 't_torch', source: 'item', grade: 'common', weight: 40 },
    { id: 'a_rags', source: 'armor', grade: 'common', weight: 40 },
    { id: 'a_leather_vest', source: 'armor', grade: 'common', weight: 30 },
    { id: 'w_oak_club', source: 'weapon', grade: 'common', weight: 40 },
    { id: 'w_rusty_dagger', source: 'weapon', grade: 'common', weight: 30 },
    { id: 'ac_worn_ring', source: 'accessory', grade: 'common', weight: 30 },
    { id: 'ac_simple_amulet', source: 'accessory', grade: 'common', weight: 30 },

    // ── Uncommon (Tier 2) ── weight: 200 total
    { id: 'c_sanity_brew', source: 'item', grade: 'uncommon', weight: 30 },
    { id: 't_holywater', source: 'item', grade: 'uncommon', weight: 25 },
    { id: 'a_studded_leather', source: 'armor', grade: 'uncommon', weight: 30 },
    { id: 'a_chainmail', source: 'armor', grade: 'uncommon', weight: 25 },
    { id: 'w_battle_staff', source: 'weapon', grade: 'uncommon', weight: 30 },
    { id: 'w_clock_axe', source: 'weapon', grade: 'uncommon', weight: 20 },
    { id: 'w_hunter_bow', source: 'weapon', grade: 'uncommon', weight: 20 },
    { id: 'ac_iron_ring', source: 'accessory', grade: 'uncommon', weight: 20 },
    { id: 'ac_swiftness_charm', source: 'accessory', grade: 'uncommon', weight: 20 },

    // ── Magic (Tier 3) ── weight: 120 total
    { id: 'c_mega_potion', source: 'item', grade: 'magic', weight: 20 },
    { id: 'c_rage_tonic', source: 'item', grade: 'magic', weight: 15 },
    { id: 'a_iron_breastplate', source: 'armor', grade: 'magic', weight: 20 },
    { id: 'a_shadow_cloak', source: 'armor', grade: 'magic', weight: 15 },
    { id: 'w_mithril_glaive', source: 'weapon', grade: 'magic', weight: 20 },
    { id: 'w_magic_sword', source: 'weapon', grade: 'magic', weight: 15 },
    { id: 'ac_mana_brooch', source: 'accessory', grade: 'magic', weight: 15 },

    // ── Rare (Tier 4) ── weight: 60 total
    { id: 'c_elixir', source: 'item', grade: 'rare', weight: 12 },
    { id: 'c_ghost_step', source: 'item', grade: 'rare', weight: 8 },
    { id: 'a_mithril_mail', source: 'armor', grade: 'rare', weight: 12 },
    { id: 'w_rune_spear', source: 'weapon', grade: 'rare', weight: 10 },
    { id: 'w_war_hammer', source: 'weapon', grade: 'rare', weight: 8 },
    { id: 'ac_rune_ring', source: 'accessory', grade: 'rare', weight: 10 },

    // ── Epic (Tier 5) ── weight: 20 total
    { id: 'a_runic_plate', source: 'armor', grade: 'epic', weight: 5 },
    { id: 'a_voidweave_armor', source: 'armor', grade: 'epic', weight: 4 },
    { id: 'w_gale_gauntlet', source: 'weapon', grade: 'epic', weight: 5 },
    { id: 'w_berserk_axe', source: 'weapon', grade: 'epic', weight: 3 },
    { id: 'ac_shadow_earring', source: 'accessory', grade: 'epic', weight: 3 },

    // ── Legendary (Tier 6) ── weight: 5 total
    { id: 'a_dragonscale_armor', source: 'armor', grade: 'legendary', weight: 1 },
    { id: 'a_celestial_vestment', source: 'armor', grade: 'legendary', weight: 1 },
    { id: 'w_dragon_slayer', source: 'weapon', grade: 'legendary', weight: 1 },
    { id: 'ac_crown_of_valor', source: 'accessory', grade: 'legendary', weight: 1 },
    { id: 'ac_ring_of_eternity', source: 'accessory', grade: 'legendary', weight: 1 },
];
