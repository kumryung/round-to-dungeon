// ─── Item Data ───
// Source: DATASET.md §4 + loot tables
// Grade: common(1) | uncommon(2) | magic(3) | rare(4) | epic(5) | legendary(6)

export const ITEMS = {
    // ── Tools ──
    t_shovel: {
        id: 't_shovel', type: 'tool', grade: 'common', nameKey: 'items.t_shovel.name', descKey: 'items.t_shovel.desc', emoji: '⛏️',
        effect: 'shovel', stackable: false, maxStack: 1, price: 150, weight: 3,
    },
    t_key: {
        id: 't_key', type: 'tool', grade: 'common', nameKey: 'items.t_key.name', descKey: 'items.t_key.desc', emoji: '🔑',
        effect: 'key', stackable: true, maxStack: 10, price: 120, weight: 1,
    },
    t_holywater: {
        id: 't_holywater', type: 'tool', grade: 'uncommon', nameKey: 'items.t_holywater.name', descKey: 'items.t_holywater.desc', emoji: '💧',
        effect: 'sanity_restore', value: 30, stackable: true, maxStack: 10, price: 200, weight: 1,
    },
    t_torch: {
        id: 't_torch', type: 'tool', grade: 'common', nameKey: 'items.t_torch.name', descKey: 'items.t_torch.desc', emoji: '🔦',
        effect: 'torch', stackable: true, maxStack: 10, price: 80, weight: 2,
    },
    // ── Consumables ──
    c_bandage: {
        id: 'c_bandage', type: 'consumable', grade: 'common', nameKey: 'items.c_bandage.name', descKey: 'items.c_bandage.desc', emoji: '🩹',
        effect: 'heal', value: 15, stackable: true, maxStack: 99, price: 50, weight: 1,
    },
    c_splint: {
        id: 'c_splint', type: 'consumable', grade: 'common', nameKey: 'items.c_splint.name', descKey: 'items.c_splint.desc', emoji: '🦴',
        effect: 'cure_fracture', stackable: true, maxStack: 99, price: 180, weight: 1,
    },
    c_antidote: {
        id: 'c_antidote', type: 'consumable', grade: 'common', nameKey: 'items.c_antidote.name', descKey: 'items.c_antidote.desc', emoji: '🧪',
        effect: 'cure_poison', stackable: true, maxStack: 99, price: 150, weight: 1,
    },
    c_herb: {
        id: 'c_herb', type: 'consumable', grade: 'common', nameKey: 'items.c_herb.name', descKey: 'items.c_herb.desc', emoji: '🌿',
        effect: 'heal', value: 30, stackable: true, maxStack: 99, price: 100, weight: 1,
    },
    c_elixir: {
        id: 'c_elixir', type: 'consumable', grade: 'rare', nameKey: 'items.c_elixir.name', descKey: 'items.c_elixir.desc', emoji: '✨',
        effect: 'full_restore', stackable: true, maxStack: 99, price: 1000, weight: 2,
    },
    c_mega_potion: {
        id: 'c_mega_potion', type: 'consumable', grade: 'magic', nameKey: 'items.c_mega_potion.name', descKey: 'items.c_mega_potion.desc', emoji: '🫙',
        effect: 'heal', value: 70, stackable: true, maxStack: 99, price: 400, weight: 2,
    },
    c_sanity_brew: {
        id: 'c_sanity_brew', type: 'consumable', grade: 'uncommon', nameKey: 'items.c_sanity_brew.name', descKey: 'items.c_sanity_brew.desc', emoji: '🍵',
        effect: 'sanity_restore', value: 50, stackable: true, maxStack: 99, price: 300, weight: 1,
    },
    c_rage_tonic: {
        id: 'c_rage_tonic', type: 'consumable', grade: 'magic', nameKey: 'items.c_rage_tonic.name', descKey: 'items.c_rage_tonic.desc', emoji: '🔴',
        effect: 'str_boost', value: 5, duration: 3, stackable: true, maxStack: 30, price: 350, weight: 1,
    },
    c_stone_skin: {
        id: 'c_stone_skin', type: 'consumable', grade: 'magic', nameKey: 'items.c_stone_skin.name', descKey: 'items.c_stone_skin.desc', emoji: '🪨',
        effect: 'def_boost', value: 5, duration: 3, stackable: true, maxStack: 30, price: 350, weight: 1,
    },
    c_ghost_step: {
        id: 'c_ghost_step', type: 'consumable', grade: 'rare', nameKey: 'items.c_ghost_step.name', descKey: 'items.c_ghost_step.desc', emoji: '👻',
        effect: 'spd_boost', value: 8, duration: 3, stackable: true, maxStack: 20, price: 600, weight: 1,
    },
    // ── Materials ──
    mat_wood: {
        id: 'mat_wood', type: 'material', grade: 'common', nameKey: 'items.mat_wood.name', descKey: 'items.mat_wood.desc', emoji: '🪵',
        stackable: true, maxStack: 99, price: 30, weight: 2,
    },
    mat_iron_ore: {
        id: 'mat_iron_ore', type: 'material', grade: 'common', nameKey: 'items.mat_iron_ore.name', descKey: 'items.mat_iron_ore.desc', emoji: '🪨',
        stackable: true, maxStack: 99, price: 50, weight: 5,
    },
    mat_iron_stud: {
        id: 'mat_iron_stud', type: 'material', grade: 'common', nameKey: 'items.mat_iron_stud.name', descKey: 'items.mat_iron_stud.desc', emoji: '📌',
        stackable: true, maxStack: 99, price: 80, weight: 3,
    },
    mat_leather_strap: {
        id: 'mat_leather_strap', type: 'material', grade: 'common', nameKey: 'items.mat_leather_strap.name', descKey: 'items.mat_leather_strap.desc', emoji: '🧵',
        stackable: true, maxStack: 99, price: 60, weight: 2,
    },
    mat_sticky_sap: {
        id: 'mat_sticky_sap', type: 'material', grade: 'common', nameKey: 'items.mat_sticky_sap.name', descKey: 'items.mat_sticky_sap.desc', emoji: '🍯',
        stackable: true, maxStack: 99, price: 70, weight: 2,
    },
    mat_sharp_blade: {
        id: 'mat_sharp_blade', type: 'material', grade: 'uncommon', nameKey: 'items.mat_sharp_blade.name', descKey: 'items.mat_sharp_blade.desc', emoji: '🔪',
        stackable: true, maxStack: 99, price: 300, weight: 3,
    },
    mat_steel_part: {
        id: 'mat_steel_part', type: 'material', grade: 'uncommon', nameKey: 'items.mat_steel_part.name', descKey: 'items.mat_steel_part.desc', emoji: '⚙️',
        stackable: true, maxStack: 99, price: 400, weight: 5,
    },
    mat_beast_tendon: {
        id: 'mat_beast_tendon', type: 'material', grade: 'uncommon', nameKey: 'items.mat_beast_tendon.name', descKey: 'items.mat_beast_tendon.desc', emoji: '🪢',
        stackable: true, maxStack: 99, price: 120, weight: 2,
    },
    mat_mana_stone: {
        id: 'mat_mana_stone', type: 'material', grade: 'magic', nameKey: 'items.mat_mana_stone.name', descKey: 'items.mat_mana_stone.desc', emoji: '💎',
        stackable: true, maxStack: 99, price: 500, weight: 3,
    },
    mat_rune: {
        id: 'mat_rune', type: 'material', grade: 'magic', nameKey: 'items.mat_rune.name', descKey: 'items.mat_rune.desc', emoji: '🔮',
        stackable: true, maxStack: 99, price: 600, weight: 3,
    },
    mat_mana_heart: {
        id: 'mat_mana_heart', type: 'material', grade: 'rare', nameKey: 'items.mat_mana_heart.name', descKey: 'items.mat_mana_heart.desc', emoji: '❤️‍🔥',
        stackable: true, maxStack: 99, price: 1500, weight: 4,
    },
    mat_dragon_scale: {
        id: 'mat_dragon_scale', type: 'material', grade: 'epic', nameKey: 'items.mat_dragon_scale.name', descKey: 'items.mat_dragon_scale.desc', emoji: '🐉',
        stackable: true, maxStack: 99, price: 3000, weight: 5,
    },
    mat_ancient_crystal: {
        id: 'mat_ancient_crystal', type: 'material', grade: 'legendary', nameKey: 'items.mat_ancient_crystal.name', descKey: 'items.mat_ancient_crystal.desc', emoji: '🔯',
        stackable: true, maxStack: 99, price: 8000, weight: 4,
    },
    // ── Equipment (Armor/Accessory) — legacy entries kept for save compat ──
    eq_leather_armor: {
        id: 'eq_leather_armor', type: 'armor', grade: 'common', nameKey: 'items.eq_leather_armor.name', descKey: 'items.eq_leather_armor.desc', emoji: '👕',
        def: 2, stackable: false, maxStack: 1, price: 200, weight: 8,
    },
    eq_iron_ring: {
        id: 'eq_iron_ring', type: 'accessory', grade: 'common', nameKey: 'items.eq_iron_ring.name', descKey: 'items.eq_iron_ring.desc', emoji: '💍',
        str: 1, stackable: false, maxStack: 1, price: 150, weight: 1,
    },
    // ── Gacha Tickets ──
    i_ticket_silver: {
        id: 'i_ticket_silver', type: 'ticket', grade: 'uncommon', nameKey: 'items.i_ticket_silver.name', descKey: 'items.i_ticket_silver.desc', emoji: '🎫',
        stackable: true, maxStack: 99, price: 0, weight: 0,
    },
    i_ticket_gold: {
        id: 'i_ticket_gold', type: 'ticket', grade: 'rare', nameKey: 'items.i_ticket_gold.name', descKey: 'items.i_ticket_gold.desc', emoji: '🎟️',
        stackable: true, maxStack: 99, price: 0, weight: 0,
    },

    // ── Recipes ──
    rcp_w_oak_club: { id: 'rcp_w_oak_club', type: 'consumable', grade: 'common', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_oak_club.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 100 },
    rcp_w_rusty_dagger: { id: 'rcp_w_rusty_dagger', type: 'consumable', grade: 'common', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_rusty_dagger.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 100 },
    rcp_w_battle_staff: { id: 'rcp_w_battle_staff', type: 'consumable', grade: 'common', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_battle_staff.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 200 },
    rcp_w_clock_axe: { id: 'rcp_w_clock_axe', type: 'consumable', grade: 'uncommon', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_clock_axe.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 250 },
    rcp_w_hunter_bow: { id: 'rcp_w_hunter_bow', type: 'consumable', grade: 'uncommon', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_hunter_bow.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 200 },

    rcp_w_mithril_glaive: { id: 'rcp_w_mithril_glaive', type: 'consumable', grade: 'rare', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_mithril_glaive.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 500 },
    rcp_w_magic_sword: { id: 'rcp_w_magic_sword', type: 'consumable', grade: 'rare', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_magic_sword.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 600 },
    rcp_w_blood_scythe: { id: 'rcp_w_blood_scythe', type: 'consumable', grade: 'rare', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_blood_scythe.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 550 },
    rcp_w_rune_spear: { id: 'rcp_w_rune_spear', type: 'consumable', grade: 'rare', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_rune_spear.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 700 },
    rcp_w_war_hammer: { id: 'rcp_w_war_hammer', type: 'consumable', grade: 'rare', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_war_hammer.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 650 },
    rcp_w_execution_axe: { id: 'rcp_w_execution_axe', type: 'consumable', grade: 'epic', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_execution_axe.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 800 },

    rcp_w_gale_gauntlet: { id: 'rcp_w_gale_gauntlet', type: 'consumable', grade: 'epic', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_gale_gauntlet.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 1000 },
    rcp_w_berserk_axe: { id: 'rcp_w_berserk_axe', type: 'consumable', grade: 'legendary', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_berserk_axe.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 1200 },
    rcp_w_assassin_katar: { id: 'rcp_w_assassin_katar', type: 'consumable', grade: 'legendary', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_assassin_katar.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 1500 },
    rcp_w_thunder_mace: { id: 'rcp_w_thunder_mace', type: 'consumable', grade: 'legendary', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_thunder_mace.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 1100 },
    rcp_w_dragon_slayer: { id: 'rcp_w_dragon_slayer', type: 'consumable', grade: 'legendary', nameKey: 'items.rcp_prefix', nameParams: { nameKey: 'items.w_dragon_slayer.name' }, emoji: '📜', descKey: 'items.rcp_desc', stackable: true, maxStack: 99, price: 2000 },
};

// ─── Treasure Chest Loot Tables ───
// Each entry: { id, weight } — higher weight = more common

export const CHEST_LOOT = [
    // Common consumables (high weight)
    { id: 'c_bandage', weight: 25 },
    { id: 'c_herb', weight: 20 },
    { id: 'c_antidote', weight: 12 },
    { id: 'c_splint', weight: 10 },
    // Tools
    { id: 't_key', weight: 8 },
    { id: 't_torch', weight: 10 },
    { id: 't_holywater', weight: 6 },
    // Rare
    { id: 'c_elixir', weight: 3 },
    // Materials (common)
    { id: 'mat_wood', weight: 15 },
    { id: 'mat_iron_ore', weight: 12 },
    { id: 'mat_leather_strap', weight: 10 },
    { id: 'mat_iron_stud', weight: 8 },
    { id: 'mat_sticky_sap', weight: 8 },
    // Materials (uncommon)
    { id: 'mat_sharp_blade', weight: 6 },
    { id: 'mat_steel_part', weight: 5 },
    { id: 'mat_beast_tendon', weight: 4 },
    // Materials (rare)
    { id: 'mat_mana_stone', weight: 3 },
    { id: 'mat_rune', weight: 2 },
    { id: 'mat_mana_heart', weight: 1 },
];

/**
 * Roll a random item from the chest loot table.
 */
export function rollChestLoot() {
    const totalWeight = CHEST_LOOT.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of CHEST_LOOT) {
        roll -= entry.weight;
        if (roll <= 0) return ITEMS[entry.id];
    }
    return ITEMS['c_bandage']; // fallback
}



/**
 * Roll for monster loot.
 * Uses a fixed range of 0-100. If the sum of weights is less than 100,
 * the remainder is the chance to drop nothing.
 */
export function rollMonsterLoot(monster) {
    if (!monster.loot || monster.loot.length === 0) return null;

    const roll = Math.random() * 100;
    let current = 0;

    for (const entry of monster.loot) {
        current += entry.weight;
        if (roll < current) {
            return ITEMS[entry.id] || null; // Return item object
        }
    }
    return null; // No drop (e.g. rolled 90 but weights sum to 70)
}
