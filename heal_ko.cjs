const fs = require('fs');

const missingKeys = JSON.parse(fs.readFileSync('c:/Work/round-the-dungeon/missing_utf8.json', 'utf8'));
let koText = fs.readFileSync('c:/Work/round-the-dungeon/src/locales/ko.js', 'utf8');

function extractGroupProps(group) {
    const groupRegex = new RegExp(`\\s*${group}\\s*:\\s*\\{([\\s\\S]*?)\\},`);
    const match = koText.match(groupRegex);
    if (!match) return {};

    const block = match[1];
    const propRegex = /([a-zA-Z0-9_]+)\s*:\s*(["'])(.+?)\2/g;
    const props = {};
    let m;
    while ((m = propRegex.exec(block)) !== null) {
        props[m[1]] = m[3];
    }
    return props;
}

const additions = {};
for (const key of missingKeys) {
    if (key.startsWith('events.')) {
        const parts = key.split('.');
        if (parts.length >= 3) {
            const group = parts[1];
            const prop = parts[2];
            if (!additions[group]) additions[group] = [];
            if (!additions[group].includes(prop)) additions[group].push(prop);
        }
    }
}

function getBestMatch(existingProps, propName) {
    const defaultLabels = {
        'skip': '무시하고 지나가기',
        'torch': '횃불로 태우기',
        'force': '힘으로 부수기',
        'key': '열쇠 사용',
        'pray': '기도하기',
        'cleanse': '정화하기',
        'touch': '직접 만지기',
        'consume': '아이템 사용',
        'cut': '절단하기',
        'smash': '박살내기',
        'search': '수색하기',
        'dig': '파헤치기',
        'read': '읽어보기'
    };

    if (!propName.includes('_')) {
        for (const k in existingProps) {
            if (!k.includes('_') && k.length > 3) return existingProps[k];
        }
        for (const [k, v] of Object.entries(defaultLabels)) {
            if (propName.includes(k)) return v;
        }
        return "상호작용 시도";
    }

    const keywords = ['epic', 'great', 'good', 'ok', 'poor', 'fail', 'bad', 'curse', 'doom', 'ambush', 'fight', 'sick', 'toxic', 'mad', 'fear', 'lost', 'trap', 'wisdom', 'bless', 'reward', 'gold', 'loot'];

    for (const kw of keywords) {
        if (propName.includes(kw)) {
            for (const [k, v] of Object.entries(existingProps)) {
                if (k.includes(kw)) return v;
            }
        }
    }

    const pos = ['ok', 'good', 'great', 'epic', 'wisdom', 'bless', 'reward', 'safe', 'gold', 'loot'];
    const neg = ['bad', 'poor', 'fail', 'curse', 'doom', 'ambush', 'fight', 'sick', 'toxic', 'mad', 'fear', 'lost', 'trap', 'fall', 'burn', 'hurt'];

    const isPos = pos.some(p => propName.includes(p));
    const isNeg = neg.some(p => propName.includes(p));

    if (isPos) {
        for (const [k, v] of Object.entries(existingProps)) {
            if (pos.some(p => k.includes(p))) return v;
        }
        return "뛰어난 감각으로 이익을 취했습니다.";
    }

    if (isNeg) {
        for (const [k, v] of Object.entries(existingProps)) {
            if (neg.some(p => k.includes(p))) return v;
        }
        return "불행하게도 위험에 빠지고 말았습니다.";
    }

    return "의미심장한 결과가 나타납니다.";
}

for (const group in additions) {
    const props = additions[group];
    const groupRegex = new RegExp(`(\\s*${group}\\s*:\\s*\\{)`);
    const existingProps = extractGroupProps(group);

    if (groupRegex.test(koText)) {
        let insertText = '';
        for (const p of props) {
            const val = getBestMatch(existingProps, p);
            insertText += `            ${p}: "${val}",\n`;
        }
        koText = koText.replace(groupRegex, `$1\n${insertText}`);
    } else {
        let insertText = '';
        for (const p of props) {
            const val = getBestMatch({}, p);
            insertText += `            ${p}: "${val}",\n`;
        }
        const newGroup = `        ${group}: {\n            name: "${group}",\n            desc: "기이한 광경",\n${insertText}        },\n`;
        koText = koText.replace(/(events:\s*\{)/, `$1\n${newGroup}`);
    }
}

// Let's also add status.fracture
if (!koText.includes('fracture:')) {
    koText = koText.replace(/(status:\s*\{)/, `$1\n        fracture: "골절",`);
}

fs.writeFileSync('c:/Work/round-the-dungeon/src/locales/ko.js', koText, 'utf8');
console.log('Successfully patched ko.js with contextually aware fallback strings.');
