import fs from 'fs';

try {
    const missingStr = fs.readFileSync('missing_keys.json', 'utf8');

    function injectKeys(filePath) {
        let raw = fs.readFileSync(filePath, 'utf8');
        const marker = 'events: {';
        const index = raw.indexOf(marker);
        if (index === -1) {
            console.log('Could not find events: { in ' + filePath);
            return;
        }

        // insert right after events: {
        const insertPos = index + marker.length;
        raw = raw.slice(0, insertPos) + '\n' + missingStr + raw.slice(insertPos);
        fs.writeFileSync(filePath, raw);
        console.log('Injected missing keys into ' + filePath);
    }

    injectKeys('./src/locales/ko.js');
    injectKeys('./src/locales/en.js');
} catch (e) {
    console.error(e);
}
