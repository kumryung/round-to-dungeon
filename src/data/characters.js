// ─── Character (Wanderer) Data ───
// Source: DATASET.md §6, §7 + characteristic.md

// ── Positive Traits (20) ──
const POSITIVE_TRAITS = [
    { id: 't_pos_strong_back', name: '강인한 어깨', icon: '💪', desc: '최대 무게 +20%' },
    { id: 't_pos_eagle_eye', name: '예리한 눈', icon: '🦅', desc: '명중률 +5%' },
    { id: 't_pos_first_strike', name: '선수필승', icon: '⚡', desc: '선공 확률 +15%' },
    { id: 't_pos_thick_bone', name: '통뼈', icon: '🦴', desc: '최대 HP +15' },
    { id: 't_pos_night_vision', name: '밤눈', icon: '🌙', desc: '어두운 맵 명중 감소 무시' },
    { id: 't_pos_lucky', name: '행운아', icon: '🍀', desc: '드랍률 +10%' },
    { id: 't_pos_survivalist', name: '생존 전문가', icon: '🏕️', desc: '회복 아이템 효과 +25%' },
    { id: 't_pos_iron_will', name: '강철 의지', icon: '🧠', desc: '정신력 감소 -30%' },
    { id: 't_pos_quick_reflexes', name: '빠른 반사신경', icon: '💨', desc: '회피율 +10%' },
    { id: 't_pos_sharp_blade', name: '날카로운 감각', icon: '🔪', desc: '치명타 확률 +8%' },
    { id: 't_pos_natural_healer', name: '자연 치유', icon: '🌿', desc: '이동 시 HP 회복 +1/칸' },
    { id: 't_pos_treasure_hunter', name: '보물 사냥꾼', icon: '💎', desc: '보물상자 추가 아이템 확률 +20%' },
    { id: 't_pos_thick_skin', name: '두꺼운 피부', icon: '🛡️', desc: '받는 데미지 -10%' },
    { id: 't_pos_steady_hand', name: '차분한 손', icon: '🎯', desc: '머리 부위 명중 보정 +10%' },
    { id: 't_pos_unyielding', name: '불굴', icon: '🔥', desc: 'HP 20% 이하 시 공격력 +20%' },
    { id: 't_pos_poison_resist', name: '독 내성', icon: '🧪', desc: '중독 상태이상 면역' },
    { id: 't_pos_light_foot', name: '가벼운 발걸음', icon: '🦶', desc: '이동 주사위 최소값 +1' },
    { id: 't_pos_craftsman', name: '장인의 손길', icon: '🔨', desc: '제작 시 내구도 +15%' },
    { id: 't_pos_calm_mind', name: '평정심', icon: '☯️', desc: '불안 단계 진입 기준 50으로 하향' },
    { id: 't_pos_scavenger', name: '수집가', icon: '🧲', desc: '이벤트 타일에서 추가 재료 확률 +5%' },
    // ── Situational Positive ──
    { id: 't_pos_forest_expert', name: '숲의 전문가', icon: '🌲', desc: '고블린 숲에서 명중 +10%, 회피 +5%', condition: 'forest' },
    { id: 't_pos_mine_expert', name: '광산 탐험가', icon: '⛏️', desc: '버려진 광산에서 명중 +10%, 회피 +5%', condition: 'mine' },
    { id: 't_pos_swamp_expert', name: '늪지 생존자', icon: '🐊', desc: '유령의 늪에서 명중 +10%, 회피 +5%', condition: 'swamp' },
    { id: 't_pos_citadel_expert', name: '성채 정복자', icon: '🏰', desc: '암흑 성채에서 명중 +10%, 회피 +5%', condition: 'citadel' },
    { id: 't_pos_desert_expert', name: '사막 생존자', icon: '🏜️', desc: '사막 맵에서 명중 +10%, 회피 +5%', condition: 'desert' },
    { id: 't_pos_volcano_expert', name: '화산 탐험가', icon: '🌋', desc: '화산 맵에서 명중 +10%, 회피 +5%', condition: 'volcano' },
    { id: 't_pos_ruins_expert', name: '유적 탐험가', icon: '🏛️', desc: '유적 맵에서 명중 +10%, 회피 +5%', condition: 'ruins' },
    { id: 't_pos_beast_slayer', name: '야수 사냥꾼', icon: '🐺', desc: '야수형 몬스터에게 데미지 +15%', condition: 'beast' },
    { id: 't_pos_undead_slayer', name: '시체 사냥꾼', icon: '⚰️', desc: '언데드 몬스터에게 데미지 +15%', condition: 'undead' },
    { id: 't_pos_demon_slayer', name: '악마 사냥꾼', icon: '😈', desc: '악마형 몬스터에게 데미지 +15%', condition: 'demon' },
    { id: 't_pos_humanoid_slayer', name: '인간형 사냥꾼', icon: '👤', desc: '인간형 몬스터에게 데미지 +15%', condition: 'humanoid' },
    { id: 't_pos_night_owl', name: '올빼미', icon: '🦉', desc: '웨이브 3 이후 명중 +8%, 속도 +2', condition: 'late_wave' },
    { id: 't_pos_cornered_rat', name: '궁지의 쥐', icon: '🐀', desc: '정신력 30 이하 시 공격력 +25%, 속도 +3', condition: 'low_sanity' },
];

// ── Negative Traits (20) ──
const NEGATIVE_TRAITS = [
    { id: 't_neg_clumsy', name: '둔함', icon: '🐢', desc: '도망 성공률 -15%' },
    { id: 't_neg_weakling', name: '약골', icon: '😰', desc: '최대 무게 -15%' },
    { id: 't_neg_glass_body', name: '유리몸', icon: '💔', desc: '받는 데미지 +10%' },
    { id: 't_neg_gluttony', name: '식탐', icon: '🍖', desc: '소모품 추가 소모 (20% 확률)' },
    { id: 't_neg_insomnia', name: '불면증', icon: '😵', desc: '휴식 회복 -50%' },
    { id: 't_neg_coward', name: '겁쟁이', icon: '😱', desc: '정신력 감소 +30%' },
    { id: 't_neg_cursed_hand', name: '마이너스의 손', icon: '🖐️', desc: '제작 실패 확률 +15%' },
    { id: 't_neg_paranoid', name: '편집증', icon: '👁️', desc: '부정적 이벤트 확률 +20%' },
    { id: 't_neg_slow', name: '느림보', icon: '🦥', desc: 'SPD -2, 선공 확률 감소' },
    { id: 't_neg_bad_back', name: '허리 디스크', icon: '🤕', desc: '무거운 무기 장착 시 명중 -5%' },
    { id: 't_neg_shaking_hand', name: '떨리는 손', icon: '🫨', desc: '명중률 -5%' },
    { id: 't_neg_fragile_weapon', name: '거친 손', icon: '🔧', desc: '무기 내구도 소모 2배' },
    { id: 't_neg_dark_phobia', name: '어둠 공포증', icon: '🕳️', desc: '광산/성채 맵 정신력 감소 +50%' },
    { id: 't_neg_blood_phobia', name: '출혈 공포증', icon: '🩸', desc: 'HP 50% 이하 시 명중률 -10%' },
    { id: 't_neg_unlucky', name: '불운', icon: '💀', desc: '드랍률 -10%' },
    { id: 't_neg_reckless', name: '무모함', icon: '🤪', desc: '회피율 -10%' },
    { id: 't_neg_poison_weak', name: '독 취약', icon: '☠️', desc: '중독 지속시간 +2턴' },
    { id: 't_neg_brittle_bone', name: '잘 부러지는 뼈', icon: '🦷', desc: '골절 확률 +30%' },
    { id: 't_neg_heavy_foot', name: '무거운 발걸음', icon: '🧱', desc: '이동 주사위 최대값 -1' },
    { id: 't_neg_hoarder', name: '수집벽', icon: '📦', desc: '아이템 버리기 시 정신력 -5' },
    // ── Situational Negative ──
    { id: 't_neg_forest_phobia', name: '숲 공포증', icon: '🌲', desc: '고블린 숲에서 정신력 감소 +50%, 명중 -5%', condition: 'forest' },
    { id: 't_neg_mine_phobia', name: '광산 공포증', icon: '⛏️', desc: '버려진 광산에서 정신력 감소 +50%, 명중 -5%', condition: 'mine' },
    { id: 't_neg_swamp_phobia', name: '늪 공포증', icon: '👻', desc: '유령의 늪에서 정신력 감소 +50%, 명중 -5%', condition: 'swamp' },
    { id: 't_neg_citadel_phobia', name: '성채 공포증', icon: '🏰', desc: '암흑 성채에서 정신력 감소 +50%, 명중 -5%', condition: 'citadel' },
    { id: 't_neg_desert_phobia', name: '모래 공포증', icon: '🏜️', desc: '사막 맵에서 정신력 감소 +50%, 명중 -5%', condition: 'desert' },
    { id: 't_neg_volcano_phobia', name: '열 공포증', icon: '🌋', desc: '화산 맵에서 정신력 감소 +50%, 명중 -5%', condition: 'volcano' },
    { id: 't_neg_ruins_phobia', name: '유적 공포증', icon: '🏛️', desc: '유적 맵에서 정신력 감소 +50%, 명중 -5%', condition: 'ruins' },
    { id: 't_neg_beast_fear', name: '야수 공포', icon: '🐺', desc: '야수형 몬스터에게 받는 데미지 +15%', condition: 'beast' },
    { id: 't_neg_undead_fear', name: '시체 혐오', icon: '⚰️', desc: '언데드 몬스터 조우 시 정신력 -10', condition: 'undead' },
    { id: 't_neg_demon_fear', name: '악마 공포', icon: '😈', desc: '악마형 몬스터에게 명중 -10%', condition: 'demon' },
    { id: 't_neg_humanoid_mercy', name: '동족 연민', icon: '👤', desc: '인간형 몬스터에게 데미지 -10%', condition: 'humanoid' },
    { id: 't_neg_slow_starter', name: '느린 적응', icon: '🐌', desc: '웨이브 1~2에서 명중 -8%, 속도 -2', condition: 'early_wave' },
    { id: 't_neg_panic', name: '공황', icon: '😵‍💫', desc: '정신력 30 이하 시 회피 -15%, 명중 -10%', condition: 'low_sanity' },
];

// ── Legacy TRAITS object (for backward compatibility) ──
export const TRAITS = {};

// Helper to add keys
const addKeys = (list, type) => list.map(t => ({
    ...t,
    nameKey: `traits.${type}.${t.id}.name`,
    descKey: `traits.${type}.${t.id}.desc`
}));

const POSTIVE_WITH_KEYS = addKeys(POSITIVE_TRAITS, 'positive');
const NEGATIVE_WITH_KEYS = addKeys(NEGATIVE_TRAITS, 'negative');

POSTIVE_WITH_KEYS.forEach(t => { TRAITS[t.id] = { ...t, type: 'positive' }; });
NEGATIVE_WITH_KEYS.forEach(t => { TRAITS[t.id] = { ...t, type: 'negative' }; });

/**
 * Roll random traits for a character.
 * @returns {{ positive: object[], negative: object[] }} 1~2 positive + 1~2 negative traits
 */
export function rollRandomTraits() {
    const count = Math.random() < 0.5 ? 1 : 2;

    const shuffled = (arr) => [...arr].sort(() => Math.random() - 0.5);

    // Use the arrays WITH keys
    const pos = shuffled(POSTIVE_WITH_KEYS).slice(0, count).map(t => ({ ...t, type: 'positive' }));
    const neg = shuffled(NEGATIVE_WITH_KEYS).slice(0, count).map(t => ({ ...t, type: 'negative' }));

    return [...pos, ...neg];
}

export { POSITIVE_TRAITS, NEGATIVE_TRAITS };

/**
 * Generate a randomized wanderer instance from a base template.
 * @param {object} baseChar Character template from CHARACTERS
 * @returns {object} Randomized character instance
 */
export function generateWandererInstance(baseChar) {
    const freeStats = Math.floor(Math.random() * (baseChar.maxFreeStat - baseChar.minFreeStat + 1)) + baseChar.minFreeStat;
    const instance = JSON.parse(JSON.stringify(baseChar));

    // Define weights based on className
    let weights = { vit: 1, str: 1, agi: 1, dex: 1, luk: 1, spd: 1 };
    switch (baseChar.classKey) {
        case 'classes.warrior': case 'classes.guard': weights = { vit: 3, str: 3, agi: 1, dex: 1, luk: 1, spd: 1 }; break;
        case 'classes.rogue': weights = { vit: 1, str: 1, agi: 3, dex: 3, luk: 2, spd: 2 }; break;
        case 'classes.mercenary': case 'classes.duelist': weights = { vit: 1, str: 2, agi: 3, dex: 1, luk: 1, spd: 3 }; break;
        case 'classes.berserker': weights = { vit: 2, str: 5, agi: 1, dex: 1, luk: 1, spd: 1 }; break;
        case 'classes.archer': weights = { vit: 1, str: 1, agi: 2, dex: 5, luk: 2, spd: 1 }; break;
        case 'classes.explorer': weights = { vit: 1, str: 1, agi: 1, dex: 1, luk: 6, spd: 1 }; break;
        case 'classes.paladin': weights = { vit: 5, str: 2, agi: 1, dex: 1, luk: 1, spd: 1 }; break;
        case 'classes.assassin': weights = { vit: 1, str: 1, agi: 4, dex: 3, luk: 1, spd: 4 }; break;
    }

    const statKeys = Object.keys(weights);
    const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);

    for (let i = 0; i < freeStats; i++) {
        let r = Math.random() * weightSum;
        let cumulative = 0;
        for (const key of statKeys) {
            cumulative += weights[key];
            if (r <= cumulative) {
                instance[key]++;
                break;
            }
        }
    }

    // Pre-roll traits
    instance.traits = rollRandomTraits();

    // Expansion Phase 13: Stats & Equipments
    instance.level = 1;
    instance.exp = 0;
    instance.statPoints = 0;
    instance.curSanity = 100;
    instance.maxSanity = 100;
    instance.maxHp = 50 + (instance.vit * 5);
    instance.curHp = instance.maxHp;
    instance.equipments = {
        weapon: null,
        armor: null,
        accessory: null
    };

    return instance;
}

export const CHARACTERS = [
    {
        id: 'c_warrior_01',
        name: 'Arthur',
        nameKey: 'characters.c_warrior_01.name',
        descKey: 'characters.c_warrior_01.desc',
        className: '워리어',
        classKey: 'classes.warrior',
        classIcon: '⚔️',
        tier: 1, minFreeStat: 3, maxFreeStat: 6,
        vit: 14, str: 10, agi: 3, spd: 2, dex: 5, luk: 5,

        portrait: '🛡️',
        desc: '전장에서 단련된 전사. 강인한 체력과 힘이 장점이다.',
    },
    {
        id: 'c_rogue_01',
        name: 'Kyle',
        nameKey: 'characters.c_rogue_01.name',
        descKey: 'characters.c_rogue_01.desc',
        className: '도적',
        classKey: 'classes.rogue',
        classIcon: '🗡️',
        tier: 1, minFreeStat: 4, maxFreeStat: 7,
        vit: 6, str: 3, agi: 10, spd: 5, dex: 8, luk: 7,

        portrait: '🎭',
        desc: '그림자 속의 사냥꾼. 민첩과 명중이 뛰어나다.',
    },
    {
        id: 'c_mercenary_01',
        name: 'Bella',
        nameKey: 'characters.c_mercenary_01.name',
        descKey: 'characters.c_mercenary_01.desc',
        className: '용병',
        classKey: 'classes.mercenary',
        classIcon: '⚡',
        tier: 1, minFreeStat: 4, maxFreeStat: 7,
        vit: 10, str: 6, agi: 5, spd: 10, dex: 5, luk: 5,

        portrait: '💃',
        desc: '번개처럼 빠른 용병. 속도와 선제공격이 특기이다.',
    },
    {
        id: 'c_archer_01',
        name: 'Robin',
        nameKey: 'characters.c_archer_01.name',
        descKey: 'characters.c_archer_01.desc',
        className: '아처',
        classKey: 'classes.archer',
        classIcon: '🏹',
        tier: 1, minFreeStat: 4, maxFreeStat: 8,
        vit: 8, str: 4, agi: 7, spd: 4, dex: 12, luk: 5,

        portrait: '🎯',
        desc: '백발백중의 궁수. 원거리에서 적을 제압한다.',
    },
    {
        id: 'c_explorer_01',
        name: 'Indy',
        nameKey: 'characters.c_explorer_01.name',
        descKey: 'characters.c_explorer_01.desc',
        className: '탐험가',
        classKey: 'classes.explorer',
        classIcon: '🧭',
        tier: 1, minFreeStat: 5, maxFreeStat: 10,
        vit: 9, str: 5, agi: 6, spd: 4, dex: 5, luk: 15,

        portrait: '🤠',
        desc: '미지의 땅을 누비는 탐험가. 뛰어난 운으로 보물을 잘 찾는다.',
    },
    {
        id: 'c_guard_01',
        name: 'Bastian',
        nameKey: 'characters.c_guard_01.name',
        descKey: 'characters.c_guard_01.desc',
        className: '경비병',
        classKey: 'classes.guard',
        classIcon: '🛡️',
        tier: 1, minFreeStat: 3, maxFreeStat: 5,
        vit: 12, str: 8, agi: 4, spd: 2, dex: 6, luk: 4,

        portrait: '💂',
        desc: '마을을 지키던 노련한 경비병. 방어력이 안정적이다.',
    },
    {
        id: 'c_berserker_01',
        name: 'Vargas',
        nameKey: 'characters.c_berserker_01.name',
        descKey: 'characters.c_berserker_01.desc',
        className: '버서커',
        classKey: 'classes.berserker',
        classIcon: '🪓',
        tier: 2, minFreeStat: 6, maxFreeStat: 12,
        vit: 18, str: 15, agi: 2, spd: 1, dex: 3, luk: 3,

        portrait: '👹',
        desc: '분노에 휩싸인 광전사. 압도적인 힘으로 적을 부순다.',
    },
    {
        id: 'c_duelist_01',
        name: 'Julian',
        nameKey: 'characters.c_duelist_01.name',
        descKey: 'characters.c_duelist_01.desc',
        className: '듀얼리스트',
        classKey: 'classes.duelist',
        classIcon: '🤺',
        tier: 2, minFreeStat: 8, maxFreeStat: 14,
        vit: 8, str: 7, agi: 14, spd: 12, dex: 8, luk: 6,

        portrait: '🧥',
        desc: '화려한 검술의 결투가. 빠른 속도로 전장을 휘젓는다.',
    },
    {
        id: 'c_paladin_01',
        name: 'Gabriel',
        nameKey: 'characters.c_paladin_01.name',
        descKey: 'characters.c_paladin_01.desc',
        className: '성전사',
        classKey: 'classes.paladin',
        classIcon: '✨',
        tier: 3, minFreeStat: 10, maxFreeStat: 20,
        vit: 25, str: 18, agi: 3, spd: 2, dex: 5, luk: 7,

        portrait: '👼',
        desc: '신의 가호를 받는 기사. 죽음을 두려워하지 않는 생존력을 가졌다.',
    },
    {
        id: 'c_assassin_01',
        name: 'Shadow',
        nameKey: 'characters.c_assassin_01.name',
        descKey: 'characters.c_assassin_01.desc',
        className: '어쌔신',
        classKey: 'classes.assassin',
        classIcon: '🌑',
        tier: 3, minFreeStat: 15, maxFreeStat: 25,
        vit: 7, str: 5, agi: 20, spd: 18, dex: 15, luk: 10,

        portrait: '🥷',
        desc: '심연에서 온 암살자. 적이 눈치채기 전에 숨통을 끊는다.',
    },
];
