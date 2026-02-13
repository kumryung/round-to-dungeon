// ─── Weapon Data ───
// Source: DATASET.md §3

export const WEAPONS = {
    w_fist: {
        id: 'w_fist', grade: '기본', name: '주먹', emoji: '✊',
        dmgMin: 1, dmgMax: 3, durability: Infinity, maxDurability: Infinity,
        reqStats: {},
        desc: '빈손 공격. 내구도 무한.',
    },
    w_oak_club: {
        id: 'w_oak_club', grade: '일반', name: '떡갈나무 몽둥이', emoji: '🪵',
        dmgMin: 1, dmgMax: 8, durability: 30, maxDurability: 30,
        reqStats: { agi: 5 },
        desc: '기본 무기.',
    },
    w_rusty_dagger: {
        id: 'w_rusty_dagger', grade: '일반', name: '녹슨 단검', emoji: '🔪',
        dmgMin: 3, dmgMax: 7, durability: 30, maxDurability: 30,
        reqStats: { spd: 7 },
        desc: '내구도가 낮음.',
    },
    w_battle_staff: {
        id: 'w_battle_staff', grade: '일반', name: '전투 지팡이', emoji: '🪄',
        dmgMin: 9, dmgMax: 10, durability: 40, maxDurability: 40,
        reqStats: { agi: 6, spd: 9 },
        desc: '제작이 쉬움.',
    },
    w_clock_axe: {
        id: 'w_clock_axe', grade: '일반', name: '태엽 도끼', emoji: '⚙️',
        dmgMin: 14, dmgMax: 19, durability: 50, maxDurability: 50,
        reqStats: { str: 8, agi: 12, spd: 6 },
        desc: '초반 추천 무기.',
    },
    w_hunter_bow: {
        id: 'w_hunter_bow', grade: '일반', name: '사냥꾼의 활', emoji: '🏹',
        dmgMin: 22, dmgMax: 28, durability: 45, maxDurability: 45,
        reqStats: { str: 11, agi: 8, spd: 14 },
        desc: '2티어 원거리 무기.',
    },
    w_mithril_glaive: {
        id: 'w_mithril_glaive', grade: '영웅', name: '미스릴 글레이브', emoji: '🔱',
        dmgMin: 27, dmgMax: 33, durability: 100, maxDurability: 100,
        reqStats: { str: 12, agi: 16, spd: 9 },
        desc: '가성비/내구도 우수.',
    },
    w_magic_sword: {
        id: 'w_magic_sword', grade: '영웅', name: '마법 검', emoji: '⚔️',
        dmgMin: 21, dmgMax: 27, durability: 70, maxDurability: 70,
        reqStats: { agi: 24 },
        desc: '마나를 두른 검.',
    },
    w_blood_scythe: {
        id: 'w_blood_scythe', grade: '영웅', name: '피를 마시는 낫', emoji: '⛏️',
        dmgMin: 16, dmgMax: 21, durability: 60, maxDurability: 60,
        reqStats: { spd: 24 },
        desc: '빠른 공속.',
    },
    w_rune_spear: {
        id: 'w_rune_spear', grade: '영웅', name: '룬 스피어', emoji: '🗡️',
        dmgMin: 24, dmgMax: 29, durability: 65, maxDurability: 65,
        reqStats: { agi: 14, spd: 21 },
        desc: '관통력 강화 창.',
    },
    w_war_hammer: {
        id: 'w_war_hammer', grade: '영웅', name: '워 해머', emoji: '🔨',
        dmgMin: 38, dmgMax: 45, durability: 80, maxDurability: 80,
        reqStats: { str: 20, agi: 15, spd: 11 },
        desc: '육중한 해머.',
    },
    w_execution_axe: {
        id: 'w_execution_axe', grade: '영웅', name: '처형인의 도끼', emoji: '🪓',
        dmgMin: 11, dmgMax: 40, durability: 70, maxDurability: 70,
        reqStats: { str: 27 },
        desc: '힘 특화 도끼.',
    },
    w_gale_gauntlet: {
        id: 'w_gale_gauntlet', grade: '전설', name: '질풍의 건틀릿', emoji: '🥊',
        dmgMin: 18, dmgMax: 23, durability: 150, maxDurability: 150,
        reqStats: { spd: 27 },
        desc: '연타 특화(내구도 높음).',
    },
    w_berserk_axe: {
        id: 'w_berserk_axe', grade: '전설', name: '광전사의 도끼', emoji: '⚡',
        dmgMin: 1, dmgMax: 63, durability: 80, maxDurability: 80,
        reqStats: { str: 23, agi: 15 },
        desc: '데미지 편차 극심.',
    },
    w_assassin_katar: {
        id: 'w_assassin_katar', grade: '전설', name: '암살자의 카타르', emoji: '🗡️',
        dmgMin: 28, dmgMax: 34, durability: 90, maxDurability: 90,
        reqStats: { agi: 15, spd: 23 },
        desc: '급소 타격 최적화.',
    },
    w_thunder_mace: {
        id: 'w_thunder_mace', grade: '전설', name: '뇌신의 둔기', emoji: '⚡',
        dmgMin: 23, dmgMax: 38, durability: 100, maxDurability: 100,
        reqStats: { str: 23, spd: 15 },
        desc: '적 마비 효과.',
    },
    w_dragon_slayer: {
        id: 'w_dragon_slayer', grade: '전설', name: '용살자의 대검', emoji: '🐉',
        dmgMin: 44, dmgMax: 52, durability: 120, maxDurability: 120,
        reqStats: { str: 21, agi: 12, spd: 16 },
        desc: '게임 최강의 무기.',
    },
};

const GRADE_COLOR = { '기본': '#888', '일반': '#ccc', '영웅': '#8b5cf6', '전설': '#f59e0b' };

/**
 * Get a fresh weapon instance (with full durability).
 */
export function getWeapon(weaponId) {
    const base = WEAPONS[weaponId];
    if (!base) return null;
    return { ...base };
}

/**
 * Get the display color for a grade.
 */
export function gradeColor(grade) {
    return GRADE_COLOR[grade] || '#ccc';
}
