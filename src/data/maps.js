// ─── Map Data ───
// Level 1~10, themed maps. Multi-floor dungeon structure.

export const MAPS = [
    {
        id: 'map_01_forest', nameKey: 'maps.map_01_forest.name', name: '고블린 숲',
        icon: '🌲', theme: 'forest',
        unlockTownLv: 1, mapLv: 1,
        floors: [
            {
                floor: 1,
                tileCount: [6, 9],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [6, 9],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '울창한 숲 속에 고블린과 박쥐가 횡행하는 초보 모험가의 시험장.',
    },
    {
        id: 'map_01_mine', nameKey: 'maps.map_01_mine.name', name: '얕은 광산',
        icon: '⛏️', theme: 'mine',
        unlockTownLv: 1, mapLv: 1,
        floors: [
            {
                floor: 1,
                tileCount: [6, 9],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [6, 9],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '갓 파헤쳐진 얕은 광산. 아직 위험은 크지 않지만 어둠이 짙다.',
    },
    {
        id: 'map_01_ruins', nameKey: 'maps.map_01_ruins.name', name: '허물어진 마을',
        icon: '🏚️', theme: 'ruins',
        unlockTownLv: 1, mapLv: 1,
        floors: [
            {
                floor: 1,
                tileCount: [6, 9],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [6, 9],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '오래전 불에 탄 폐허마을. 고블린들이 점거했지만 잔해 속에 보물이 숨어있다.',
    },
    {
        id: 'map_02_mine', nameKey: 'maps.map_02_mine.name', name: '버려진 광산',
        icon: '🪨', theme: 'mine',
        unlockTownLv: 2, mapLv: 2,
        floors: [
            {
                floor: 1,
                tileCount: [7, 10],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [7, 10],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '어둠이 짙게 내려앉은 폐광. 오크와 해골 전사가 방황한다.',
    },
    {
        id: 'map_02_swamp', nameKey: 'maps.map_02_swamp.name', name: '진흙 늪지',
        icon: '🌿', theme: 'swamp',
        unlockTownLv: 2, mapLv: 2,
        floors: [
            {
                floor: 1,
                tileCount: [7, 10],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [7, 10],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '독성 가스가 자욱한 늪지. 슬라임들이 독성 웅덩이를 이루며 번식한다.',
    },
    {
        id: 'map_02_ruins', nameKey: 'maps.map_02_ruins.name', name: '고대 사원 입구',
        icon: '🏛️', theme: 'ruins',
        unlockTownLv: 2, mapLv: 2,
        floors: [
            {
                floor: 1,
                tileCount: [7, 10],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [7, 10],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '봉인이 풀린 사원의 입구. 파수꾼으로 남겨진 해골들이 방랑자를 맞는다.',
    },
    {
        id: 'map_03_swamp', nameKey: 'maps.map_03_swamp.name', name: '유령의 늪',
        icon: '👻', theme: 'swamp',
        unlockTownLv: 3, mapLv: 3,
        floors: [
            {
                floor: 1,
                tileCount: [8, 11],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [8, 11],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '안개에 둘러싸인 늪지대. 유령과 독슬라임이 도사린다.',
    },
    {
        id: 'map_03_forest', nameKey: 'maps.map_03_forest.name', name: '마수의 숲',
        icon: '🌳', theme: 'forest',
        unlockTownLv: 3, mapLv: 3,
        floors: [
            {
                floor: 1,
                tileCount: [8, 11],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [8, 11],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '거대한 나무들이 하늘을 가린 심층 숲. 트렌트와 맹수들이 서식한다.',
    },
    {
        id: 'map_03_mine', nameKey: 'maps.map_03_mine.name', name: '심층 갱도',
        icon: '🕳️', theme: 'mine',
        unlockTownLv: 3, mapLv: 3,
        floors: [
            {
                floor: 1,
                tileCount: [8, 11],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [8, 11],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '채굴 중단된 심층 갱도. 갇혀 죽은 광부의 원혼과 암흑 사제가 배회한다.',
    },
    {
        id: 'map_04_ruins', nameKey: 'maps.map_04_ruins.name', name: '고대 유적',
        icon: '🏛️', theme: 'ruins',
        unlockTownLv: 4, mapLv: 4,
        floors: [
            {
                floor: 1,
                tileCount: [10, 13],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [10, 13],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [10, 13],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '수백 년 된 왕국의 유적. 함정과 미믹이 탐험자의 목숨을 노린다.',
    },
    {
        id: 'map_04_citadel', nameKey: 'maps.map_04_citadel.name', name: '요새 외벽',
        icon: '🧱', theme: 'citadel',
        unlockTownLv: 4, mapLv: 4,
        floors: [
            {
                floor: 1,
                tileCount: [10, 13],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [10, 13],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [10, 13],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '오크와 해골들이 장악한 요새의 외벽. 내부로 침투하려면 이곳을 통과해야 한다.',
    },
    {
        id: 'map_04_desert', nameKey: 'maps.map_04_desert.name', name: '모래폭풍 사막',
        icon: '🏜️', theme: 'desert',
        unlockTownLv: 4, mapLv: 4,
        floors: [
            {
                floor: 1,
                tileCount: [10, 13],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [10, 13],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [10, 13],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '쉴 새 없이 모래바람이 부는 황무지. 뼈다귀만 남은 탐험가들의 잔해가 즐비하다.',
    },
    {
        id: 'map_05_citadel', nameKey: 'maps.map_05_citadel.name', name: '암흑 성채',
        icon: '🏰', theme: 'citadel',
        unlockTownLv: 5, mapLv: 5,
        floors: [
            {
                floor: 1,
                tileCount: [11, 14],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [11, 14],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [11, 14],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '절대 악의 잔재가 깃든 성채. 살아서 돌아오는 자는 드물다.',
    },
    {
        id: 'map_05_swamp', nameKey: 'maps.map_05_swamp.name', name: '저주받은 늪',
        icon: '🌑', theme: 'swamp',
        unlockTownLv: 5, mapLv: 5,
        floors: [
            {
                floor: 1,
                tileCount: [11, 14],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [11, 14],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [11, 14],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '저주받은 흑수가 흐르는 깊은 늪. 암흑 사제들이 이곳을 제단으로 삼는다.',
    },
    {
        id: 'map_05_volcano', nameKey: 'maps.map_05_volcano.name', name: '화산 기슭',
        icon: '🌋', theme: 'volcano',
        unlockTownLv: 5, mapLv: 5,
        floors: [
            {
                floor: 1,
                tileCount: [11, 14],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [11, 14],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [11, 14],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '용암이 흘러내리는 활화산 기슭. 열기와 독가스가 판단력을 흐린다.',
    },
    {
        id: 'map_06_volcano', nameKey: 'maps.map_06_volcano.name', name: '불타는 화산',
        icon: '🔥', theme: 'volcano',
        unlockTownLv: 6, mapLv: 6,
        floors: [
            {
                floor: 1,
                tileCount: [12, 15],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [12, 15],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [12, 15],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '용암이 분출하는 화산 내부. 발록과 악마들이 불길 속에 웅크리고 있다.',
    },
    {
        id: 'map_06_desert', nameKey: 'maps.map_06_desert.name', name: '타오르는 사막',
        icon: '☀️', theme: 'desert',
        unlockTownLv: 6, mapLv: 6,
        floors: [
            {
                floor: 1,
                tileCount: [12, 15],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [12, 15],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [12, 15],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '작열하는 태양 아래 끝없이 펼쳐진 사막. 신기루와 함정이 탐험자를 미혹한다.',
    },
    {
        id: 'map_06_crypt', nameKey: 'maps.map_06_crypt.name', name: '석관 지하실',
        icon: '⚰️', theme: 'crypt',
        unlockTownLv: 6, mapLv: 6,
        floors: [
            {
                floor: 1,
                tileCount: [12, 15],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [12, 15],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [12, 15],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '미라와 해골이 봉인된 지하 석관실. 고대 왕가의 저주가 흘러넘친다.',
    },
    {
        id: 'map_07_desert', nameKey: 'maps.map_07_desert.name', name: '마르지 않는 사막',
        icon: '🏜️', theme: 'desert',
        unlockTownLv: 7, mapLv: 7,
        floors: [
            {
                floor: 1,
                tileCount: [13, 16],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [13, 16],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [13, 16],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '끝이 보이지 않는 광활한 사막. 모래 속에 고대 도시의 잔해와 저주가 잠들어 있다.',
    },
    {
        id: 'map_07_crypt', nameKey: 'maps.map_07_crypt.name', name: '왕의 묘지',
        nameEn: "King's Crypt",
        icon: '🪦', theme: 'crypt',
        unlockTownLv: 7, mapLv: 7,
        floors: [
            {
                floor: 1,
                tileCount: [13, 16],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [13, 16],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [13, 16],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '왕들이 잠든 거대한 지하 묘지. 이 곳의 수호자들은 영혼이 안식을 취하지 못하고 방황한다.',
    },
    {
        id: 'map_07_snow', nameKey: 'maps.map_07_snow.name', name: '눈보라 고원',
        icon: '❄️', theme: 'snow',
        unlockTownLv: 7, mapLv: 7,
        floors: [
            {
                floor: 1,
                tileCount: [13, 16],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [13, 16],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [13, 16],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '만년설이 덮인 고원. 살을 에는 추위와 굶주린 부족들이 잠복해있다.',
    },
    {
        id: 'map_08_snow', nameKey: 'maps.map_08_snow.name', name: '얼어붙은 설원',
        icon: '🌨️', theme: 'snow',
        unlockTownLv: 8, mapLv: 8,
        floors: [
            {
                floor: 1,
                tileCount: [15, 18],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '생명체가 살기 힘든 극한의 설원. 얼음 결정 속에 봉인된 고대 병사들이 잠에서 깨어난다.',
    },
    {
        id: 'map_08_volcano', nameKey: 'maps.map_08_volcano.name', name: '화염 심층부',
        icon: '💥', theme: 'volcano',
        unlockTownLv: 8, mapLv: 8,
        floors: [
            {
                floor: 1,
                tileCount: [15, 18],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '화산의 심장부. 마그마의 열기가 정신을 혼미하게 하고 발록들이 군림한다.',
    },
    {
        id: 'map_08_crypt', nameKey: 'maps.map_08_crypt.name', name: '망각의 묘지',
        icon: '💀', theme: 'crypt',
        unlockTownLv: 8, mapLv: 8,
        floors: [
            {
                floor: 1,
                tileCount: [15, 18],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [15, 18],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '이름이 지워진 자들의 묘지. 기억을 먹는 유령들이 방랑자의 정신을 갉아먹는다.',
    },
    {
        id: 'map_09_abyss', nameKey: 'maps.map_09_abyss.name', name: '심연의 문턱',
        icon: '🌌', theme: 'abyss',
        unlockTownLv: 9, mapLv: 9,
        floors: [
            {
                floor: 1,
                tileCount: [16, 19],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '현실과 허공의 경계. 중력과 이성이 무너지는 심연의 입구.',
    },
    {
        id: 'map_09_crypt', nameKey: 'maps.map_09_crypt.name', name: '신의 유해',
        nameEn: "God's Remnants",
        icon: '🩻', theme: 'crypt',
        unlockTownLv: 9, mapLv: 9,
        floors: [
            {
                floor: 1,
                tileCount: [16, 19],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '쓰러진 신의 유해가 지하 깊은 곳에 묻혀있다. 그 힘이 주변을 오염시키고 있다.',
    },
    {
        id: 'map_09_snow', nameKey: 'maps.map_09_snow.name', name: '세계의 끝',
        icon: '🏔️', theme: 'snow',
        unlockTownLv: 9, mapLv: 9,
        floors: [
            {
                floor: 1,
                tileCount: [16, 19],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [16, 19],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '극지의 끝에 다다른 곳. 아래는 심연이고, 위는 죽음뿐이다.',
    },
    {
        id: 'map_10_abyss', nameKey: 'maps.map_10_abyss.name', name: '끝없는 심연',
        icon: '⚫', theme: 'abyss',
        unlockTownLv: 10, mapLv: 10,
        floors: [
            {
                floor: 1,
                tileCount: [17, 20],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '바닥이 없는 심연. 이곳에 들어온 자는 돌아올 수 없다는 전설이 있다.',
    },
    {
        id: 'map_10_void', nameKey: 'maps.map_10_void.name', name: '공허의 왕좌',
        icon: '🌀', theme: 'abyss',
        unlockTownLv: 10, mapLv: 10,
        floors: [
            {
                floor: 1,
                tileCount: [17, 20],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '공허의 왕이 앉아있던 자리. 현실이 부서지고 기억이 사라지는 곳.',
    },
    {
        id: 'map_10_citadel', nameKey: 'maps.map_10_citadel.name', name: '황혼의 성채',
        icon: '🌑', theme: 'citadel',
        unlockTownLv: 10, mapLv: 10,
        floors: [
            {
                floor: 1,
                tileCount: [17, 20],
                startType: 'hub',
                endType: 'stairs',
            },
            {
                floor: 2,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 3,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'stairs',
            },
            {
                floor: 4,
                tileCount: [17, 20],
                startType: 'stairs',
                endType: 'exit',
            },
        ],
        autoGenerate: {
            tilePool: null, // theme-based
        },
        desc: '황혼의 빛 속에 잠긴 마지막 성채. 이 성의 주인은 어둠 그 자체다.',
    },
];
