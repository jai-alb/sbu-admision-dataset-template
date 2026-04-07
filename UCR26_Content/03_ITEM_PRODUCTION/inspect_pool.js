const fs = require('fs');
const path = require('path');

const batchDir = 'C:\\Cyboring_Global\\5_Ventures\\sbu-admision\\FASES 3-4-5\\UCR26_Content\\03_ITEM_PRODUCTION\\BATCHES';
const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.json'));

let summaries = {};
for (let f of files) {
  if (f.includes('summary')) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(batchDir, f), 'utf-8'));
      summaries[data.batch_id] = data;
    } catch(e) {}
  }
}

let rawItems = [];
for (let f of files) {
  if (!f.includes('summary')) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(batchDir, f), 'utf-8'));
      if (data.items) {
        let bId = data.batch_id;
        let pIdGen = data.prompt_id_gen || (summaries[bId] && summaries[bId].prompt_id_gen) || "GEN_v1";
        
        for (let item of data.items) {
           item.source_batch_id = bId;
           if (!item.prompt_id && !(item.metadata && item.metadata.prompt_id)) {
               item.prompt_id = pIdGen; 
           }
           rawItems.push(item);
        }
      }
    } catch(e) {}
  }
}

function getProp(item, prop1, prop2) {
    if (item[prop1] !== undefined) return item[prop1];
    if (prop2 && item[prop2] !== undefined) return item[prop2];
    if (item.metadata && item.metadata[prop1] !== undefined) return item.metadata[prop1];
    if (prop2 && item.metadata && item.metadata[prop2] !== undefined) return item.metadata[prop2];
    return null;
}

let uniquePool = [];
let removedCount = 0; let seenIDs=new Set(); let seenHashes=new Set();

for (let item of rawItems) {
    if (item.final_status !== 'approved') continue;
    
    let pId = getProp(item, 'prompt_id');
    let tId = getProp(item, 'template_id');
    let sBatch = item.source_batch_id;
    
    if (!pId || !tId || !sBatch) {
        continue;
    }
    
    let mArea = getProp(item, 'macro_area');
    let skill = getProp(item, 'skill');
    let diff = getProp(item, 'dificultad', 'difficulty');
    let iType = getProp(item, 'item_type');
    let h1 = getProp(item, 'H1');
    let errType = getProp(item, 'tipo_error', 'error_type') || 'N/A';
    
    if (!mArea || !skill || !diff || !iType) {
        continue;
    }
    
    item._mArea = mArea;
    item._skill = skill;
    item._diff = typeof diff === 'number' ? diff : parseInt(diff.toString().replace(/[^0-9]/g,''));
    item._h1 = typeof h1 === 'string' ? h1.toLowerCase() : h1; // normalize
    item._iType = iType;
    
    let estLogica = item.stem ? item.stem.substring(0, 15) : 'N/A';
    let fullHash = `${tId}_${item.stem}_${errType}_${skill}_${item._diff}`;
    if (seenIDs.has(item.item_id)) { continue;}
    if (seenHashes.has(fullHash)) { continue;}
    seenIDs.add(item.item_id);
    seenHashes.add(fullHash);

    uniquePool.push(item);
}


let sim1Pool = uniquePool.filter(i => i.source_batch_id === 'BATCH_025');
let sim2Pool = uniquePool.filter(i => i.source_batch_id === 'BATCH_026');

function display(pool, desc) {
  let L1_H5 = pool.filter(i=>i._skill==='H5'&&i._diff===1).map(i=>i.item_id);
  let L2_H5 = pool.filter(i=>i._skill==='H5'&&i._diff===2).map(i=>i.item_id);
  let L3_H5 = pool.filter(i=>i._skill==='H5'&&i._diff===3).map(i=>i.item_id);
  
  let L1_H3 = pool.filter(i=>i._skill==='H3'&&i._diff===1).map(i=>i.item_id);
  let L2_H3 = pool.filter(i=>i._skill==='H3'&&i._diff===2).map(i=>i.item_id);
  let L3_H3 = pool.filter(i=>i._skill==='H3'&&i._diff===3).map(i=>i.item_id);
  console.log(desc, "H5 (L1, L2, L3) count:", L1_H5.length, L2_H5.length, L3_H5.length);
  console.log(desc, "H3 (L1, L2, L3) count:", L1_H3.length, L2_H3.length, L3_H3.length);
}

display(sim1Pool, 'SIM1');
display(sim2Pool, 'SIM2');
