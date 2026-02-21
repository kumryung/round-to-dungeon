import fs from 'fs';

try {
    const fullBlock = fs.readFileSync('full_events_block.txt', 'utf8');

    function replaceEvents(filePath) {
        let raw = fs.readFileSync(filePath, 'utf8');

        // Find where events: { starts
        const startStr = 'events: {';
        const startIndex = raw.indexOf(startStr);
        if (startIndex === -1) {
            console.log('Could not find events block in ' + filePath);

            // If doesn't exist, we just inject it before traits:
            const fallbackStr = 'traits: {';
            const fallbackIndex = raw.indexOf(fallbackStr);
            if (fallbackIndex !== -1) {
                raw = raw.slice(0, fallbackIndex) + fullBlock + raw.slice(fallbackIndex);
                fs.writeFileSync(filePath, raw);
                console.log('Injected events before traits in ' + filePath);
            }
            return;
        }

        // Find where 'events:' block ends 
        // It's followed by `traits: {`
        const nextStr = 'traits: {';
        const endIndex = raw.indexOf(nextStr);

        if (endIndex === -1) {
            console.log('Could not find end of events block in ' + filePath);
            return;
        }

        // Replace everything between startIndex and endIndex with fullBlock
        raw = raw.slice(0, startIndex) + fullBlock + raw.slice(endIndex);
        fs.writeFileSync(filePath, raw);
        console.log('Replaced events block in ' + filePath);
    }

    replaceEvents('./src/locales/ko.js');
    replaceEvents('./src/locales/en.js');
} catch (e) {
    console.error(e);
}
