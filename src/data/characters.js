// ─── Character (Wanderer) Data ───
// Source: DATASET.md §6, §7

export const TRAITS = {
    // ── Positive ──
    t_pos_strong_back: { id: 't_pos_strong_back', name: '강인한 어깨', type: 'positive', desc: '인벤토리 최대 무게 +20%' },
    t_pos_eagle_eye: { id: 't_pos_eagle_eye', name: '예리한 눈', type: 'positive', desc: '명중률 +5%' },
    t_pos_first_strike: { id: 't_pos_first_strike', name: '선수필승', type: 'positive', desc: '선공 확률 +10%' },
    t_pos_thick_bone: { id: 't_pos_thick_bone', name: '통뼈', type: 'positive', desc: '최대 HP +15' },
    t_pos_night_vision: { id: 't_pos_night_vision', name: '밤눈', type: 'positive', desc: '어두운 맵 명중 감소 무시' },
    t_pos_lucky: { id: 't_pos_lucky', name: '행운아', type: 'positive', desc: '드랍률 +10%' },
    t_pos_survivalist: { id: 't_pos_survivalist', name: '생존 전문가', type: 'positive', desc: '회복량 +20%' },
    // ── Negative ──
    t_neg_clumsy: { id: 't_neg_clumsy', name: '둔함', type: 'negative', desc: '도망 성공률 -10%' },
    t_neg_weakling: { id: 't_neg_weakling', name: '약골', type: 'negative', desc: '최대 무게 -10%' },
    t_neg_glass_body: { id: 't_neg_glass_body', name: '유리몸', type: 'negative', desc: '방어 효율 -10%' },
    t_neg_gluttony: { id: 't_neg_gluttony', name: '식탐', type: 'negative', desc: '허기 소모 +20%' },
    t_neg_insomnia: { id: 't_neg_insomnia', name: '불면증', type: 'negative', desc: '휴식 회복 -20%' },
    t_neg_coward: { id: 't_neg_coward', name: '겁쟁이', type: 'negative', desc: '보스 대면 시 공격력 -10%' },
    t_neg_cursed_hand: { id: 't_neg_cursed_hand', name: '마이너스의 손', type: 'negative', desc: '제작 대성공 확률 0%' },
};

export const CHARACTERS = [
    {
        id: 'c_warrior_01',
        name: '아서 (Arthur)',
        className: '워리어',
        classIcon: '⚔️',
        hp: 120, str: 10, agi: 3, spd: 2, dex: 5, luk: 5,
        traits: [TRAITS.t_pos_strong_back, TRAITS.t_neg_clumsy],
        startWeapon: 'w_oak_club',
        portrait: '🛡️',
        desc: '강인한 어깨로 무거운 장비를 거뜬히 들지만, 몸이 둔하다.',
    },
    {
        id: 'c_rogue_01',
        name: '카일 (Kyle)',
        className: '도적',
        classIcon: '🗡️',
        hp: 80, str: 3, agi: 10, spd: 5, dex: 8, luk: 7,
        traits: [TRAITS.t_pos_eagle_eye, TRAITS.t_neg_weakling],
        startWeapon: 'w_rusty_dagger',
        portrait: '🎭',
        desc: '예리한 눈매로 급소를 노리지만, 체력이 약하다.',
    },
    {
        id: 'c_mercenary_01',
        name: '벨라 (Bella)',
        className: '용병',
        classIcon: '⚡',
        hp: 100, str: 6, agi: 5, spd: 10, dex: 5, luk: 5,
        traits: [TRAITS.t_pos_first_strike, TRAITS.t_neg_glass_body],
        startWeapon: 'w_rusty_dagger',
        portrait: '💃',
        desc: '누구보다 빠르게 선제공격하지만, 방어가 취약하다.',
    },
    {
        id: 'c_warrior_02',
        name: '헥토르 (Hector)',
        className: '워리어',
        classIcon: '⚔️',
        hp: 130, str: 12, agi: 2, spd: 1, dex: 4, luk: 4,
        traits: [TRAITS.t_pos_thick_bone, TRAITS.t_neg_gluttony],
        startWeapon: null,
        portrait: '🏋️',
        desc: '통뼈로 어지간한 공격에 끄떡없지만, 식탐이 심하다.',
    },
    {
        id: 'c_rogue_02',
        name: '리나 (Lina)',
        className: '도적',
        classIcon: '🗡️',
        hp: 75, str: 2, agi: 12, spd: 6, dex: 9, luk: 8,
        traits: [TRAITS.t_pos_night_vision, TRAITS.t_neg_insomnia],
        startWeapon: null,
        portrait: '🌙',
        desc: '어둠 속에서도 정확히 조준하지만, 불면증에 시달린다.',
    },
];
