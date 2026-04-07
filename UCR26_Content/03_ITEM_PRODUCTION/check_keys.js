const fs = require('fs');
const path = require('path');

const batchDir = 'C:\\Cyboring_Global\\5_Ventures\\sbu-admision\\FASES 3-4-5\\UCR26_Content\\03_ITEM_PRODUCTION\\BATCHES';
const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.json') && !f.includes('summary'));

let keys = new Set();
let metaKeys = new Set();

for (let f of files) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(batchDir, f), 'utf-8'));
        if (data.items) {
            for (let item of data.items) {
                Object.keys(item).forEach(k => keys.add(k));
                if (item.metadata) {
                    Object.keys(item.metadata).forEach(k => metaKeys.add(k));
                }
            }
        }
    } catch(e) {}
}

console.log("Root keys:", Array.from(keys));
console.log("Meta keys:", Array.from(metaKeys));
