// ─── Monster Data ───
// Source: DATASET.md §1

export const MONSTERS = {
    m_summoner: {
        id: 'm_summoner', name: '소환술사', nameEn: 'Summoner', emoji: '🧙‍♂️',
        lv: 1, hp: 30, atk: 5, spd: 4, eva: 5, def: 0,
        parts: { head: true, body: true, legs: true },
        ability: 'summon_bat', abilityDesc: '턴 경과 시 Bat 소환 시도',
        fear: false,
    },
    m_goblin: {
        id: 'm_goblin', name: '고블린', nameEn: 'Goblin', emoji: '👺',
        lv: 1, hp: 35, atk: 8, spd: 5, eva: 5, def: 0,
        parts: { head: true, body: true, legs: true },
        ability: null, abilityDesc: '기본형 몬스터',
        fear: false,
    },
    m_bat: {
        id: 'm_bat', name: '박쥐', nameEn: 'Bat', emoji: '🦇',
        lv: 2, hp: 25, atk: 6, spd: 12, eva: 25, def: 0,
        parts: { head: true, body: true, legs: false },
        ability: null, abilityDesc: '비행형, 회피 높음',
        fear: false,
    },
    m_orc: {
        id: 'm_orc', name: '오크', nameEn: 'Orc', emoji: '👹',
        lv: 3, hp: 70, atk: 12, spd: 3, eva: 0, def: 2,
        parts: { head: true, body: true, legs: true },
        ability: null, abilityDesc: '높은 체력/공격력, 낮은 속도',
        fear: false,
    },
    m_ghost: {
        id: 'm_ghost', name: '유령', nameEn: 'Ghost', emoji: '👻',
        lv: 3, hp: 40, atk: 10, spd: 8, eva: 30, def: 0,
        parts: { head: false, body: true, legs: false },
        ability: 'phys_resist', abilityDesc: '물리 공격 50% 반감, 몸통만 존재',
        fear: true,
    },
    m_skeleton: {
        id: 'm_skeleton', name: '해골', nameEn: 'Skeleton', emoji: '💀',
        lv: 4, hp: 50, atk: 14, spd: 6, eva: 5, def: 1,
        parts: { head: true, body: true, legs: true },
        ability: null, abilityDesc: '관통 공격에 취약',
        fear: false,
    },
    m_warlock: {
        id: 'm_warlock', name: '암흑사제', nameEn: 'Warlock', emoji: '🧛',
        lv: 5, hp: 60, atk: 18, spd: 7, eva: 10, def: 1,
        parts: { head: true, body: true, legs: true },
        ability: 'magic_atk', abilityDesc: '원거리 마법 공격',
        fear: true,
    },
    m_goblin_king: {
        id: 'm_goblin_king', name: '킹 고블린', nameEn: 'Goblin King', emoji: '👑',
        lv: 5, hp: 100, atk: 15, spd: 6, eva: 10, def: 2,
        parts: { head: true, body: true, legs: true },
        ability: 'buff_goblins', abilityDesc: '주변 고블린 강화 버프',
        fear: false,
    },
    m_slime: {
        id: 'm_slime', name: '슬라임', nameEn: 'Slime', emoji: '🟢',
        lv: 5, hp: 80, atk: 10, spd: 2, eva: 0, def: 0,
        parts: { head: false, body: true, legs: false },
        ability: null, abilityDesc: '몸통만 타격 가능',
        fear: false,
    },
    m_demon: {
        id: 'm_demon', name: '악마', nameEn: 'Demon', emoji: '😈',
        lv: 5, hp: 90, atk: 20, spd: 9, eva: 10, def: 2,
        parts: { head: true, body: true, legs: true },
        ability: 'burn', abilityDesc: '공격 시 화상 디버프 부여',
        fear: true,
    },
    m_balrog: {
        id: 'm_balrog', name: '발록', nameEn: 'Balrog', emoji: '🔥',
        lv: 6, hp: 150, atk: 25, spd: 5, eva: 5, def: 3,
        parts: { head: true, body: true, legs: true },
        ability: 'aoe', abilityDesc: '2턴마다 광역 공격',
        fear: false,
    },
    m_dark_knight: {
        id: 'm_dark_knight', name: '암흑기사', nameEn: 'Dark Knight', emoji: '⚔️',
        lv: 7, hp: 180, atk: 22, spd: 8, eva: 15, def: 5,
        parts: { head: true, body: true, legs: true },
        ability: 'high_def', abilityDesc: '높은 방어력',
        fear: false,
    },
    m_poison_slime: {
        id: 'm_poison_slime', name: '독슬라임', nameEn: 'Poison Slime', emoji: '🟣',
        lv: 8, hp: 120, atk: 15, spd: 3, eva: 0, def: 0,
        parts: { head: false, body: true, legs: false },
        ability: 'poison', abilityDesc: '피격 시 중독 부여',
        fear: false,
    },
    m_treant: {
        id: 'm_treant', name: '트렌트', nameEn: 'Treant', emoji: '🌳',
        lv: 9, hp: 300, atk: 30, spd: 1, eva: 0, def: 4,
        parts: { head: true, body: true, legs: true },
        ability: 'entangle', abilityDesc: '화염 취약, 뿌리 묶기(민첩 감소)',
        fear: false,
    },
    m_giant_slime: {
        id: 'm_giant_slime', name: '대형 슬라임', nameEn: 'Giant Slime', emoji: '🫧',
        lv: 10, hp: 350, atk: 35, spd: 2, eva: 0, def: 0,
        parts: { head: false, body: true, legs: false },
        ability: 'split', abilityDesc: '사망 시 분열 가능성',
        fear: false,
    },
    m_mimic: {
        id: 'm_mimic', name: '미믹', nameEn: 'Mimic', emoji: '📦',
        lv: 11, hp: 100, atk: 50, spd: 15, eva: 10, def: 0,
        parts: { head: false, body: true, legs: false },
        ability: 'first_crit', abilityDesc: '상자 위장, 첫 턴 확정 치명타',
        fear: true,
    },
};

/**
 * Get a monster instance scaled to a given wave level.
 * Stats scale: HP +15%/lv, ATK +10%/lv, EVA +1%/lv, DEF +0.5/lv
 */
export function getMonster(monsterId, waveLevel = 1) {
    const base = MONSTERS[monsterId];
    if (!base) return null;

    const lvDiff = Math.max(0, waveLevel - base.lv);
    return {
        ...base,
        hp: Math.round(base.hp * (1 + lvDiff * 0.15)),
        maxHp: Math.round(base.hp * (1 + lvDiff * 0.15)),
        atk: Math.round(base.atk * (1 + lvDiff * 0.10)),
        eva: Math.min(80, base.eva + lvDiff * 1),
        def: Math.round(base.def + lvDiff * 0.5),
        currentLevel: waveLevel,
    };
}
