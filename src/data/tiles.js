// ─── Tile Data ───
// 다층 맵 시스템의 각 타일 형태와 출구, 스폰 설정을 정의합니다.

// tileType 목록
export const TILE_TYPES = [
    'hub',        // 시작 거점 (1층에만, 맵당 1개)
    'exit',       // 던전 출구 (마지막 층에만, 보스 배치)
    'stairs',     // 계단 (층 이동, 되돌아갈 수 없음)
    'storage',    // 보물 창고
    'lab',        // 연구실
    'rest',       // 휴게실
    'corridor',   // 복도
    'arena',      // 전투장
    'shrine',     // 제단
    'trap',       // 함정 구역
];

export const TILES = {
    // ─── Forest 테마 ───
    1: {
        id: 1, tileType: 'hub', theme: 'forest',
        name: '숲 속 거점', icon: '🌲',
        layout: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        exits: { top: [{ col: 1 }], right: [{ row: 1 }], bottom: [{ col: 1 }], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 0, generalCount: [0, 0], tileTypeCount: [0, 0] },
        mobSpawn: null,
    },
    2: {
        id: 2, tileType: 'hub', theme: 'forest',
        name: '큰 나무 밑 캠프', icon: '🌳',
        layout: [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ],
        exits: { top: [{ col: 1 }], right: [{ row: 1 }], bottom: [{ col: 1 }], left: [{ row: 0 }] },
        eventSpawn: { maxCount: 0, generalCount: [0, 0], tileTypeCount: [0, 0] },
        mobSpawn: null,
    },
    3: {
        id: 3, tileType: 'storage', theme: 'forest',
        name: '나무 속 보물 상자', icon: '📦',
        layout: [
            [0, 0, 0, 1],
            [1, 1, 1, 0],
            [0, 0, 0, 1]
        ],
        exits: { top: [], right: [], bottom: [], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 2, generalCount: [0, 1], tileTypeCount: [1, 2] },
        mobSpawn: { count: [0, 2], pool: [16001] }, // mimic_lv1
    },
    4: {
        id: 4, tileType: 'lab', theme: 'forest',
        name: '버려진 연금술 탁자', icon: '🔬',
        layout: [
            [0, 1, 0],
            [1, 1, 1],
            [1, 0, 1]
        ],
        exits: { top: [{ col: 1 }], right: [], bottom: [], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 3, generalCount: [0, 1], tileTypeCount: [1, 3] },
        mobSpawn: { count: [1, 3], pool: [7001, 7002, 1001] }, // warlock, summoner
    },
    5: {
        id: 5, tileType: 'rest', theme: 'forest',
        name: '요정의 옹달샘', icon: '🧚',
        layout: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ],
        exits: { top: [{ col: 1 }], right: [{ row: 1 }], bottom: [{ col: 1 }], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 2, generalCount: [0, 1], tileTypeCount: [1, 2] },
        mobSpawn: null, // 휴게실엔 몹 없음
    },
    6: {
        id: 6, tileType: 'corridor', theme: 'forest',
        name: '오솔길', icon: '🛣️',
        layout: [
            [1, 1, 1, 1]
        ],
        exits: { top: [], right: [{ row: 0 }], bottom: [], left: [{ row: 0 }] },
        eventSpawn: { maxCount: 1, generalCount: [0, 1], tileTypeCount: [0, 0] },
        mobSpawn: { count: [1, 2], pool: [2001, 2002, 3001, 3002] }, // goblin, bat
    },
    7: {
        id: 7, tileType: 'arena', theme: 'forest',
        name: '마물 둥지', icon: '⚔️',
        layout: [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1]
        ],
        exits: { top: [{ col: 2 }], right: [{ row: 1 }], bottom: [{ col: 2 }], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 1, generalCount: [0, 1], tileTypeCount: [0, 0] },
        mobSpawn: { count: [3, 6], pool: [4001, 4002, 15001, 14001] }, // orc, giant_slime, treant
    },
    8: {
        id: 8, tileType: 'shrine', theme: 'forest',
        name: '오래된 비석', icon: '🪨',
        layout: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        exits: { top: [], right: [{ row: 1 }], bottom: [], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 2, generalCount: [0, 0], tileTypeCount: [1, 2] },
        mobSpawn: null, // 제단엔 보통 이벤트를 통해 전투/보상이 발생함
    },
    9: {
        id: 9, tileType: 'trap', theme: 'forest',
        name: '거미줄 군락', icon: '🕸️',
        layout: [
            [1, 0, 1],
            [0, 1, 0],
            [1, 0, 1]
        ],
        exits: { top: [{ col: 1 }], right: [{ row: 1 }], bottom: [{ col: 1 }], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 2, generalCount: [0, 2], tileTypeCount: [1, 2] },
        mobSpawn: { count: [1, 3], pool: [3001, 13001] }, // bat, poison_slime
    },
    10: {
        id: 10, tileType: 'stairs', theme: 'forest',
        name: '깊은 숲으로 가는 길', icon: '🪜',
        layout: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ],
        exits: { top: [{ col: 1 }], right: [], bottom: [], left: [{ row: 1 }] },
        eventSpawn: { maxCount: 0, generalCount: [0, 0], tileTypeCount: [0, 0] },
        mobSpawn: null,
    },
    11: {
        id: 11, tileType: 'exit', theme: 'forest',
        name: '숲의 수호자 구역', icon: '🚪',
        boss: 8001,  // 고블린 킹 lv1
        layout: [
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
            [1, 1, 1, 1, 1],
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0]
        ],
        exits: { top: [], right: [], bottom: [], left: [{ row: 2 }] }, // 입구 1개
        eventSpawn: { maxCount: 0, generalCount: [0, 0], tileTypeCount: [0, 0] },
        mobSpawn: null, // 보스만 배치
    },

    // ─── Mine 테마 ───
    101: {
        id: 101, tileType: 'hub', theme: 'mine',
        name: '광산 입구', icon: '⛏️',
        layout: [ [0,1,0], [1,1,1], [0,1,0] ],
        exits: { top: [{col:1}], right: [{row:1}], bottom: [{col:1}], left: [{row:1}] },
        eventSpawn: { maxCount: 0, generalCount: [0,0], tileTypeCount: [0,0] },
        mobSpawn: null,
    },
    102: {
        id: 102, tileType: 'corridor', theme: 'mine',
        name: '광차 철로', icon: '🛤️',
        layout: [ [1,1,1,1] ],
        exits: { top: [], right: [{row:0}], bottom: [], left: [{row:0}] },
        eventSpawn: { maxCount: 1, generalCount: [0,1], tileTypeCount: [0,0] },
        mobSpawn: { count: [1,2], pool: [6001, 12001] }, // skeleton, dark_knight
    },
    110: {
        id: 110, tileType: 'stairs', theme: 'mine',
        name: '수직갱 리프트', icon: '🛗',
        layout: [ [1,1], [1,1] ],
        exits: { top: [{col:0}], right: [], bottom: [], left: [{row:0}] },
        eventSpawn: { maxCount: 0, generalCount: [0,0], tileTypeCount: [0,0] },
        mobSpawn: null,
    },
    111: {
        id: 111, tileType: 'exit', theme: 'mine',
        name: '용암 지대', icon: '🚪',
        boss: 11001,  // 발록 lv1
        layout: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ],
        exits: { top: [{col:1}], right: [], bottom: [], left: [] },
        eventSpawn: { maxCount: 0, generalCount: [0,0], tileTypeCount: [0,0] },
        mobSpawn: null,
    },
};
