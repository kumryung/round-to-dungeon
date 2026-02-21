import fs from 'fs';

const THEMES = [
    { theme: 'forest', icon: '🌲', name: '숲' },
    { theme: 'mine', icon: '⛏️', name: '광산' },
    { theme: 'swamp', icon: '👻', name: '늪지대' },
    { theme: 'ruins', icon: '🏛️', name: '유적' },
    { theme: 'crypt', icon: '🪦', name: '납골당' },
    { theme: 'volcano', icon: '🌋', name: '화산' },
    { theme: 'citadel', icon: '🏰', name: '성채' },
    { theme: 'abyss', icon: '🌀', name: '미궁' },
    { theme: 'snow', icon: '❄️', name: '설원' },
    { theme: 'desert', icon: '🏜️', name: '사막' }
];

const MONSTER_TIERS = [
    ['m_goblin', 'm_bat', 'm_slime'], // Lv 1
    ['m_orc', 'm_bat', 'm_poison_slime'], // Lv 2
    ['m_skeleton', 'm_ghost', 'm_goblin_king'], // Lv 3
    ['m_treant', 'm_giant_slime', 'm_slime'], // Lv 4
    ['m_warlock', 'm_mimic', 'm_summoner'], // Lv 5
    ['m_demon', 'm_balrog', 'm_dark_knight'], // Lv 6
    ['m_orc', 'm_treant', 'm_goblin_king'], // Lv 7
    ['m_warlock', 'm_ghost', 'm_skeleton'], // Lv 8
    ['m_demon', 'm_balrog', 'm_summoner'], // Lv 9
    ['m_dark_knight', 'm_balrog', 'm_mimic'] // Lv 10
];

const EVENT_TIERS = [
    ['heal_spring', 'treasure_stash', 'rest_spot'], // Lv 1
    ['heal_spring', 'treasure_stash', 'trap_pit'], // Lv 2
    ['dark_corner', 'treasure_stash', 'rest_spot'], // Lv 3
    ['sanity_shrine', 'trap_pit', 'rest_spot'], // Lv 4
    ['dark_corner', 'trap_pit', 'sanity_shrine'], // Lv 5
    ['trap_pit', 'dark_corner', 'treasure_stash'], // Lv 6
    ['sanity_shrine', 'rest_spot'], // Lv 7
    ['dark_corner', 'trap_pit', 'sanity_shrine'], // Lv 8
    ['trap_pit', 'dark_corner', 'treasure_stash'], // Lv 9
    ['trap_pit', 'dark_corner', 'sanity_shrine'] // Lv 10
];

let mapsOut = 'export const MAPS = [\n';
let mapIndex = 1;

for (let lv = 1; lv <= 10; lv++) {
    // 3 to 6 maps per level (lv 1 gets 3 so map_01..03)
    const numMaps = lv === 1 ? 3 : Math.floor(Math.random() * 4) + 3;

    for (let m = 0; m < numMaps; m++) {
        const themeObj = THEMES[Math.floor(Math.random() * THEMES.length)];
        const mKey = 'map_' + String(mapIndex).padStart(2, '0');

        const baseEdge = 6 + lv; // Base edge length (gridSize)
        const edgeLength = baseEdge + Math.floor(Math.random() * 3) - 1;
        const tiles = (edgeLength - 1) * 4;
        const mDiceMax = Math.min(8, 2 + Math.floor(lv / 2));
        const mDiceMin = Math.max(1, mDiceMax - 2);

        mapsOut += `    {
        id: '${mKey}',
        nameKey: 'maps.${mKey}.name',
        descKey: 'maps.${mKey}.desc',
        icon: '${themeObj.icon}',
        theme: '${themeObj.theme}',
        unlockTownLv: ${Math.floor(lv / 2) + 1},
        mapLv: ${lv},
        tiles: ${tiles},
        dice: { monster: [${mDiceMin}, ${mDiceMax}], treasure: [1, 3], event: [1, ${Math.min(4, Math.floor(lv / 3) + 1)}] },
        monsterPool: ${JSON.stringify(MONSTER_TIERS[lv - 1])},
        eventPool: ${JSON.stringify(EVENT_TIERS[lv - 1])}
    },\n`;
        mapIndex++;
    }
}
mapsOut += '];\n';

fs.writeFileSync('c:/Work/round-the-dungeon/src/data/maps.js', mapsOut);
console.log('Generated ' + (mapIndex - 1) + ' maps.');
