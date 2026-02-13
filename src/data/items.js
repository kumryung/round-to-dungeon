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
