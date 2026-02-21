// ─── Armor Data ───
// Grade: common(1) | uncommon(2) | magic(3) | rare(4) | epic(5) | legendary(6)
// Stats: def (flat damage reduction), maxHp (bonus max HP)

export const ARMORS = {
    // ── Common (Tier 1) ──
    a_rags: {
        id: 'a_rags', type: 'armor', grade: 'common',
        nameKey: 'items.a_rags.name', descKey: 'items.a_rags.desc', emoji: '🩱',
        def: 1, maxHp: 0,
        stackable: false, maxStack: 1, price: 80,
        reqStats: {},
    },
    a_leather_vest: {
        id: 'a_leather_vest', type: 'armor', grade: 'common',
        nameKey: 'items.a_leather_vest.name', descKey: 'items.a_leather_vest.desc', emoji: '👕',
        def: 3, maxHp: 5,
        stackable: false, maxStack: 1, price: 200,
        reqStats: {},
    },
    // ── Uncommon (Tier 2) ──
    a_studded_leather: {
        id: 'a_studded_leather', type: 'armor', grade: 'uncommon',
        nameKey: 'items.a_studded_leather.name', descKey: 'items.a_studded_leather.desc', emoji: '🥋',
        def: 5, maxHp: 10,
        stackable: false, maxStack: 1, price: 400,
        reqStats: { vit: 5 },
    },
    a_chainmail: {
        id: 'a_chainmail', type: 'armor', grade: 'uncommon',
        nameKey: 'items.a_chainmail.name', descKey: 'items.a_chainmail.desc', emoji: '🔗',
        def: 7, maxHp: 5,
        stackable: false, maxStack: 1, price: 500,
        reqStats: { vit: 6, str: 5 },
    },
    // ── Magic (Tier 3) ──
    a_iron_breastplate: {
        id: 'a_iron_breastplate', type: 'armor', grade: 'magic',
        nameKey: 'items.a_iron_breastplate.name', descKey: 'items.a_iron_breastplate.desc', emoji: '🛡️',
        def: 10, maxHp: 15,
        stackable: false, maxStack: 1, price: 800,
        reqStats: { vit: 8, str: 7 },
    },
    a_shadow_cloak: {
        id: 'a_shadow_cloak', type: 'armor', grade: 'magic',
        nameKey: 'items.a_shadow_cloak.name', descKey: 'items.a_shadow_cloak.desc', emoji: '🧥',
        def: 6, maxHp: 20,
        stackable: false, maxStack: 1, price: 900,
        reqStats: { spd: 10 },
    },
    // ── Rare (Tier 4) ──
    a_mithril_mail: {
        id: 'a_mithril_mail', type: 'armor', grade: 'rare',
        nameKey: 'items.a_mithril_mail.name', descKey: 'items.a_mithril_mail.desc', emoji: '💠',
        def: 15, maxHp: 20,
        stackable: false, maxStack: 1, price: 1500,
        reqStats: { vit: 12, str: 10 },
    },
    a_enchanted_robe: {
        id: 'a_enchanted_robe', type: 'armor', grade: 'rare',
        nameKey: 'items.a_enchanted_robe.name', descKey: 'items.a_enchanted_robe.desc', emoji: '🔵',
        def: 8, maxHp: 40,
        stackable: false, maxStack: 1, price: 1800,
        reqStats: { agi: 12 },
    },
    // ── Epic (Tier 5) ──
    a_runic_plate: {
        id: 'a_runic_plate', type: 'armor', grade: 'epic',
        nameKey: 'items.a_runic_plate.name', descKey: 'items.a_runic_plate.desc', emoji: '🟣',
        def: 22, maxHp: 30,
        stackable: false, maxStack: 1, price: 3000,
        reqStats: { vit: 18, str: 15 },
    },
    a_voidweave_armor: {
        id: 'a_voidweave_armor', type: 'armor', grade: 'epic',
        nameKey: 'items.a_voidweave_armor.name', descKey: 'items.a_voidweave_armor.desc', emoji: '🌑',
        def: 15, maxHp: 60,
        stackable: false, maxStack: 1, price: 3500,
        reqStats: { agi: 18, spd: 15 },
    },
    // ── Legendary (Tier 6) ──
    a_dragonscale_armor: {
        id: 'a_dragonscale_armor', type: 'armor', grade: 'legendary',
        nameKey: 'items.a_dragonscale_armor.name', descKey: 'items.a_dragonscale_armor.desc', emoji: '🐉',
        def: 35, maxHp: 50,
        stackable: false, maxStack: 1, price: 8000,
        reqStats: { vit: 25, str: 20 },
    },
    a_celestial_vestment: {
        id: 'a_celestial_vestment', type: 'armor', grade: 'legendary',
        nameKey: 'items.a_celestial_vestment.name', descKey: 'items.a_celestial_vestment.desc', emoji: '✨',
        def: 20, maxHp: 100,
        stackable: false, maxStack: 1, price: 10000,
        reqStats: { agi: 25, spd: 20 },
    },
};

/**
 * Get a fresh armor instance.
 */
export function getArmor(armorId) {
    const base = ARMORS[armorId];
    if (!base) return null;
    return { ...base };
}
