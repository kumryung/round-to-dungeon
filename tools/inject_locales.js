import fs from 'fs';

let koMaps = '';
let enMaps = '';
let jaMaps = '';

const THEMES = [
    { theme: 'forest', nameKo: '숲', nameEn: 'Forest', nameJa: '森' },
    { theme: 'mine', nameKo: '광산', nameEn: 'Mine', nameJa: '鉱山' },
    { theme: 'swamp', nameKo: '늪지대', nameEn: 'Swamp', nameJa: '沼地' },
    { theme: 'ruins', nameKo: '유적', nameEn: 'Ruins', nameJa: '遺跡' },
    { theme: 'crypt', nameKo: '납골당', nameEn: 'Crypt', nameJa: '納骨堂' },
    { theme: 'volcano', nameKo: '화산', nameEn: 'Volcano', nameJa: '火山' },
    { theme: 'citadel', nameKo: '성채', nameEn: 'Citadel', nameJa: '城塞' },
    { theme: 'abyss', nameKo: '미궁', nameEn: 'Abyss', nameJa: '迷宮' },
    { theme: 'snow', nameKo: '설원', nameEn: 'Snowfield', nameJa: '雪原' },
    { theme: 'desert', nameKo: '사막', nameEn: 'Desert', nameJa: '砂漠' }
];

// Re-generate MAPS to sync names and descriptions
// Actually we can just read the generated maps.js back using regex
const mapsJsRaw = fs.readFileSync('c:/Work/round-the-dungeon/src/data/maps.js', 'utf8');
const regex = /id:\s*'map_(\d+)',[\s\S]*?theme:\s*'([^']+)'/g;
let match;

while ((match = regex.exec(mapsJsRaw)) !== null) {
    const key = match[1];
    const themeName = match[2];
    const themeObj = THEMES.find(t => t.theme === themeName) || THEMES[0];

    koMaps += `        map_${key}: { name: "탐험 구역 ${key} (${themeObj.nameKo})", desc: "미지의 위험이 도사리는 ${key}구역입니다." },\n`;
    enMaps += `        map_${key}: { name: "Exploration Zone ${key} (${themeObj.nameEn})", desc: "Zone ${key}, filled with unknown dangers." },\n`;
    jaMaps += `        map_${key}: { name: "探検区域 ${key} (${themeObj.nameJa})", desc: "未知の危険が潜む第${key}区域です。" },\n`;
}

function injectLocales(filename, mapsStr) {
    let content = fs.readFileSync(filename, 'utf-8');

    // Replace the block "maps: { ... },"
    // Need to handle curly braces correctly
    const startRegex = /maps:\s*\{/;
    const stMatch = content.match(startRegex);
    if (stMatch) {
        const startIdx = stMatch.index + stMatch[0].length;

        let braceCount = 1;
        let endIdx = -1;
        for (let j = startIdx; j < content.length; j++) {
            if (content[j] === '{') braceCount++;
            else if (content[j] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIdx = j;
                    break;
                }
            }
        }

        if (endIdx !== -1) {
            const before = content.substring(0, startIdx);
            const after = content.substring(endIdx); // starts with "}"
            content = before + '\n' + mapsStr + '    ' + after;
            fs.writeFileSync(filename, content);
            console.log('Updated ' + filename);
        } else {
            console.log('Could not find end of maps block in ' + filename);
        }
    } else {
        console.log('Could not find maps: { in ' + filename);
    }
}

injectLocales('c:/Work/round-the-dungeon/src/locales/ko.js', koMaps);
injectLocales('c:/Work/round-the-dungeon/src/locales/en.js', enMaps);
injectLocales('c:/Work/round-the-dungeon/src/locales/ja.js', jaMaps);
