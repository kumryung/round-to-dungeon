// ─── Item Data ───
// Source: DATASET.md §4 + loot tables

export const ITEMS = {
    // ── Tools ──
    t_shovel: {
        id: 't_shovel', type: 'tool', name: '삽', emoji: '⛏️',
        desc: '구덩이 탈출, 숨겨진 아이템 발견',
        effect: 'shovel', stackable: false,
    },
    t_key: {
        id: 't_key', type: 'tool', name: '열쇠', emoji: '🔑',
        desc: '잠긴 상자/문 잠금 해제',
        effect: 'key', stackable: true,
    },
    t_holywater: {
        id: 't_holywater', type: 'tool', name: '성수', emoji: '💧',
        desc: '정신력(Sanity) +30 회복',
        effect: 'sanity_restore', value: 30, stackable: true,
    },
    t_torch: {
        id: 't_torch', type: 'tool', name: '횃불', emoji: '🔦',
        desc: '어두운 지역 시야 확보, 정신력 감소 방지',
        effect: 'torch', stackable: true,
    },
    // ── Consumables ──
    c_bandage: {
        id: 'c_bandage', type: 'consumable', name: '붕대', emoji: '🩹',
        desc: '소량 체력 회복 (+15 HP)',
        effect: 'heal', value: 15, stackable: true,
    },
    c_splint: {
        id: 'c_splint', type: 'consumable', name: '부목', emoji: '🦴',
        desc: '골절 상태 완화',
        effect: 'cure_fracture', stackable: true,
    },
    c_antidote: {
        id: 'c_antidote', type: 'consumable', name: '해독제', emoji: '🧪',
        desc: '중독 상태 제거',
        effect: 'cure_poison', stackable: true,
    },
    c_herb: {
        id: 'c_herb', type: 'consumable', name: '약초', emoji: '🌿',
        desc: '체력 회복 (+30 HP)',
        effect: 'heal', value: 30, stackable: true,
    },
    c_elixir: {
        id: 'c_elixir', type: 'consumable', name: '엘릭서', emoji: '✨',
        desc: 'HP/Sanity 완전 회복 + 상태이상 제거',
        effect: 'full_restore', stackable: true,
    },
    // ── Materials ──
    mat_wood: {
        id: 'mat_wood', type: 'material', name: '나무/막대기', emoji: '🪵',
        desc: '기본적인 목재', stackable: true,
    },
    mat_iron_ore: {
        id: 'mat_iron_ore', type: 'material', name: '철광석', emoji: '🪨',
        desc: '가장 기초적인 금속 재료', stackable: true,
    },
    mat_iron_stud: {
        id: 'mat_iron_stud', type: 'material', name: '철 징', emoji: '📌',
        desc: '방패나 둔기에 박아 파괴력을 높이는 쇠못', stackable: true,
    },
    mat_leather_strap: {
        id: 'mat_leather_strap', type: 'material', name: '가죽끈', emoji: '🧵',
        desc: '기본적인 손잡이 마감이나 결속용 재료', stackable: true,
    },
    mat_sticky_sap: {
        id: 'mat_sticky_sap', type: 'material', name: '접착용 수액', emoji: '🍯',
        desc: '부품을 고정하는 천연 접착제', stackable: true,
    },
    mat_sharp_blade: {
        id: 'mat_sharp_blade', type: 'material', name: '날카로운 칼날', emoji: '🔪',
        desc: '철광석을 가공해 만든 기본 날붙이', stackable: true,
    },
    mat_steel_part: {
        id: 'mat_steel_part', type: 'material', name: '강철 부품', emoji: '⚙️',
        desc: '정교한 무기를 만들기 위한 제련된 강철', stackable: true,
    },
    mat_beast_tendon: {
        id: 'mat_beast_tendon', type: 'material', name: '마수의 힘줄', emoji: '🪢',
        desc: '무기의 탄성을 높이거나 부품을 잇는 질긴 끈', stackable: true,
    },
    mat_mana_stone: {
        id: 'mat_mana_stone', type: 'material', name: '마나석', emoji: '💎',
        desc: '마법적인 힘을 공급하는 희귀 광석', stackable: true,
    },
    mat_rune: {
        id: 'mat_rune', type: 'material', name: '룬', emoji: '🔮',
        desc: '속성 공격 및 마법 부여 재료', stackable: true,
    },
    mat_mana_heart: {
        id: 'mat_mana_heart', type: 'material', name: '마력의 심장', emoji: '❤️‍🔥',
        desc: '무기에 생명을 불어넣는 최상위 마법 재료', stackable: true,
    },
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

// ─── Random Events ───

export const EVENTS = [
    { id: 'heal_spring', name: '치유의 샘', emoji: '⛲', desc: 'HP +20 회복', effect: 'heal', value: 20 },
    { id: 'sanity_shrine', name: '정신의 성소', emoji: '🕯️', desc: '정신력 +15 회복', effect: 'sanity_restore', value: 15 },
    { id: 'trap_pit', name: '함정!', emoji: '🕳️', desc: 'HP -10, 정신력 -5', effect: 'trap', hpDmg: 10, sanityDmg: 5 },
    { id: 'dark_corner', name: '어둠의 구석', emoji: '🌑', desc: '정신력 -5', effect: 'sanity_drain', value: 5 },
    { id: 'treasure_stash', name: '숨겨진 보급품', emoji: '🎁', desc: '랜덤 아이템 획득', effect: 'random_item' },
    { id: 'rest_spot', name: '쉬어가는 곳', emoji: '🏕️', desc: 'HP +10, 정신력 +10', effect: 'rest', hpVal: 10, sanityVal: 10 },
];

/**
 * Roll a random event.
 */
export function rollEvent() {
    return EVENTS[Math.floor(Math.random() * EVENTS.length)];
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
