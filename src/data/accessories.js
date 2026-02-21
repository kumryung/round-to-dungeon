// ─── Accessory Data ───
// Grade: common(1) | uncommon(2) | magic(3) | rare(4) | epic(5) | legendary(6)
// Stats: flat buffs to str, agi, spd, vit (applied to wanderer's combat stats)

export const ACCESSORIES = {
    // ── Common (Tier 1) ──
    ac_worn_ring: {
        id: 'ac_worn_ring', type: 'accessory', grade: 'common',
        nameKey: 'items.ac_worn_ring.name', descKey: 'items.ac_worn_ring.desc', emoji: '⭕',
        str: 1,
        stackable: false, maxStack: 1, price: 80,
        reqStats: {},
    },
    ac_simple_amulet: {
        id: 'ac_simple_amulet', type: 'accessory', grade: 'common',
        nameKey: 'items.ac_simple_amulet.name', descKey: 'items.ac_simple_amulet.desc', emoji: '📿',
        vit: 2,
        stackable: false, maxStack: 1, price: 100,
        reqStats: {},
    },
    // ── Uncommon (Tier 2) ──
    ac_iron_ring: {
        id: 'ac_iron_ring', type: 'accessory', grade: 'uncommon',
        nameKey: 'items.ac_iron_ring.name', descKey: 'items.ac_iron_ring.desc', emoji: '💍',
        str: 2, vit: 1,
        stackable: false, maxStack: 1, price: 250,
        reqStats: {},
    },
    ac_swiftness_charm: {
        id: 'ac_swiftness_charm', type: 'accessory', grade: 'uncommon',
        nameKey: 'items.ac_swiftness_charm.name', descKey: 'items.ac_swiftness_charm.desc', emoji: '💨',
        spd: 3, agi: 1,
        stackable: false, maxStack: 1, price: 300,
        reqStats: {},
    },
    ac_hunter_pendant: {
        id: 'ac_hunter_pendant', type: 'accessory', grade: 'uncommon',
        nameKey: 'items.ac_hunter_pendant.name', descKey: 'items.ac_hunter_pendant.desc', emoji: '🦅',
        agi: 3, spd: 1,
        stackable: false, maxStack: 1, price: 350,
        reqStats: {},
    },
    // ── Magic (Tier 3) ──
    ac_mana_brooch: {
        id: 'ac_mana_brooch', type: 'accessory', grade: 'magic',
        nameKey: 'items.ac_mana_brooch.name', descKey: 'items.ac_mana_brooch.desc', emoji: '🔵',
        str: 2, agi: 2, spd: 2,
        stackable: false, maxStack: 1, price: 600,
        reqStats: {},
    },
    ac_warriors_band: {
        id: 'ac_warriors_band', type: 'accessory', grade: 'magic',
        nameKey: 'items.ac_warriors_band.name', descKey: 'items.ac_warriors_band.desc', emoji: '🟦',
        str: 5, vit: 2,
        stackable: false, maxStack: 1, price: 700,
        reqStats: { str: 8 },
    },
    // ── Rare (Tier 4) ──
    ac_rune_ring: {
        id: 'ac_rune_ring', type: 'accessory', grade: 'rare',
        nameKey: 'items.ac_rune_ring.name', descKey: 'items.ac_rune_ring.desc', emoji: '🔮',
        str: 4, agi: 4, spd: 2,
        stackable: false, maxStack: 1, price: 1200,
        reqStats: {},
    },
    ac_guardian_seal: {
        id: 'ac_guardian_seal', type: 'accessory', grade: 'rare',
        nameKey: 'items.ac_guardian_seal.name', descKey: 'items.ac_guardian_seal.desc', emoji: '🔰',
        vit: 8, str: 2,
        stackable: false, maxStack: 1, price: 1500,
        reqStats: { vit: 10 },
    },
    // ── Epic (Tier 5) ──
    ac_shadow_earring: {
        id: 'ac_shadow_earring', type: 'accessory', grade: 'epic',
        nameKey: 'items.ac_shadow_earring.name', descKey: 'items.ac_shadow_earring.desc', emoji: '🌑',
        agi: 8, spd: 6,
        stackable: false, maxStack: 1, price: 3000,
        reqStats: { agi: 18 },
    },
    ac_berserker_torc: {
        id: 'ac_berserker_torc', type: 'accessory', grade: 'epic',
        nameKey: 'items.ac_berserker_torc.name', descKey: 'items.ac_berserker_torc.desc', emoji: '🟠',
        str: 10, vit: 3,
        stackable: false, maxStack: 1, price: 3500,
        reqStats: { str: 20 },
    },
    // ── Legendary (Tier 6) ──
    ac_crown_of_valor: {
        id: 'ac_crown_of_valor', type: 'accessory', grade: 'legendary',
        nameKey: 'items.ac_crown_of_valor.name', descKey: 'items.ac_crown_of_valor.desc', emoji: '👑',
        str: 8, agi: 8, spd: 8, vit: 8,
        stackable: false, maxStack: 1, price: 10000,
        reqStats: {},
    },
    ac_ring_of_eternity: {
        id: 'ac_ring_of_eternity', type: 'accessory', grade: 'legendary',
        nameKey: 'items.ac_ring_of_eternity.name', descKey: 'items.ac_ring_of_eternity.desc', emoji: '🌌',
        str: 15, agi: 5, spd: 5, vit: 10,
        stackable: false, maxStack: 1, price: 15000,
        reqStats: { str: 25 },
    },
};

/**
 * Get a fresh accessory instance.
 */
export function getAccessory(accessoryId) {
    const base = ACCESSORIES[accessoryId];
    if (!base) return null;
    return { ...base };
}
