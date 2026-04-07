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

const assemblyLog = [];
function log(action, id, reason, segment='none') {
  assemblyLog.push({ action, item_id: id, reason, segment });
}

let uniquePool = [];
let seenIDs = new Set();
let seenHashes = new Set();
let removedCount = 0;

for (let item of rawItems) {
    if (item.final_status !== 'approved') continue;
    
    let pId = getProp(item, 'prompt_id');
    let tId = getProp(item, 'template_id');
    let sBatch = item.source_batch_id;
    
    if (!pId || !tId || !sBatch) {
        log('removed', item.item_id, 'missing_metadata');
        continue;
    }
    
    let mArea = getProp(item, 'macro_area');
    let skill = getProp(item, 'skill');
    let diff = getProp(item, 'dificultad', 'difficulty');
    let iType = getProp(item, 'item_type');
    let h1 = getProp(item, 'H1');
    let errType = getProp(item, 'tipo_error', 'error_type') || 'N/A';
    
    if (!mArea || !skill || !diff || !iType) {
        log('removed', item.item_id, 'incomplete_metadata_segmentation');
        continue;
    }
    
    item._mArea = mArea;
    item._skill = skill;
    item._diff = typeof diff === 'number' ? diff : parseInt(diff.toString().replace(/[^0-9]/g,''));
    item._h1 = typeof h1 === 'string' ? h1.toLowerCase() : h1; // normalize
    item._iType = iType;
    
    let estLogica = item.stem ? item.stem.substring(0, 15) : 'N/A';
    let fullHash = `${tId}_${item.stem}_${errType}_${skill}_${item._diff}`;
    
    if (seenIDs.has(item.item_id)) {
        log('removed', item.item_id, 'duplicate_removed');
        removedCount++;
        continue;
    }
    if (seenHashes.has(fullHash)) {
        log('removed', item.item_id, 'duplicate_removed');
        removedCount++;
        continue;
    }
    
    seenIDs.add(item.item_id);
    seenHashes.add(fullHash);
    uniquePool.push(item);
}

let poolFiltered = uniquePool.filter(i => {
    if (i._iType === 'simulation' || i.simulation_id) {
        if (i.source_batch_id !== 'BATCH_025' && i.source_batch_id !== 'BATCH_026') {
            log('removed', i.item_id, 'legacy_simulation_replaced');
            return false;
        }
    }
    return true;
});

let sim1Pool = poolFiltered.filter(i => i.source_batch_id === 'BATCH_025');
let sim2Pool = poolFiltered.filter(i => i.source_batch_id === 'BATCH_026');
let otherPool = poolFiltered.filter(i => i.source_batch_id !== 'BATCH_025' && i.source_batch_id !== 'BATCH_026');

// Patch SIM1: needs -1 H5, +1 H3. Keep difficulty identical. Swap H5 L2 for H3 L2.
let s1_h5_idx = sim1Pool.findIndex(i => i._skill === 'H5' && i._diff === 2);
let s1_h5_item = sim1Pool.splice(s1_h5_idx, 1)[0];
let o_h3_1_idx = otherPool.findIndex(i => i._skill === 'H3' && i._diff === 2);
let o_h3_1_item = otherPool.splice(o_h3_1_idx, 1)[0];
s1_h5_item._iType = 'training'; s1_h5_item.item_type = 'training';
o_h3_1_item._iType = 'simulation'; o_h3_1_item.item_type = 'simulation';
sim1Pool.push(o_h3_1_item);
otherPool.push(s1_h5_item);

// Patch SIM2: needs -2 H5, +2 H3. Keep difficulty identical. Drop H5 L2 alta! Need to fix H1 rate.
let cand2_h5 = sim2Pool.filter(i => i._skill === 'H5' && i._diff === 2 && i._h1 === 'alta');
if (cand2_h5.length < 2) cand2_h5 = sim2Pool.filter(i => i._skill === 'H5' && i._h1 === 'alta'); // fallback to any h1 alta if less than 2
let s2_drop1 = cand2_h5[0];
let s2_drop2 = cand2_h5[1] || sim2Pool.filter(i => i._skill === 'H5' && i._item_id !== s2_drop1.item_id && i._h1 === 'alta')[0];

sim2Pool.splice(sim2Pool.indexOf(s2_drop1), 1);
sim2Pool.splice(sim2Pool.indexOf(s2_drop2), 1);

let o2_h3_1_idx = otherPool.findIndex(i => i._skill === 'H3' && i._diff === s2_drop1._diff && i._h1 !== 'alta');
let o2_add1 = otherPool.splice(o2_h3_1_idx, 1)[0];

let o2_h3_2_idx = otherPool.findIndex(i => i._skill === 'H3' && i._diff === s2_drop2._diff && i._h1 !== 'alta');
let o2_add2 = otherPool.splice(o2_h3_2_idx, 1)[0];

s2_drop1._iType = 'training'; s2_drop1.item_type = 'training';
s2_drop2._iType = 'training'; s2_drop2.item_type = 'training';
o2_add1._iType = 'simulation'; o2_add1.item_type = 'simulation';
o2_add2._iType = 'simulation'; o2_add2.item_type = 'simulation';
sim2Pool.push(o2_add1);
sim2Pool.push(o2_add2);
otherPool.push(s2_drop1);
otherPool.push(s2_drop2);

function checkSimConstraints(name, simArray) {
    if (simArray.length !== 45) { console.log(`${name} FAIL: length ${simArray.length}`); return false; }
    let rcv = simArray.filter(i => i._mArea === 'RCV').length;
    let rcm = simArray.filter(i => i._mArea === 'RCM').length;
    if (rcv !== 23 || rcm !== 22) { console.log(`${name} FAIL: RCV ${rcv} RCM ${rcm}`); return false; }
    let sk = {H2:0,H3:0,H4:0,H5:0,H6:0,H7:0};
    let df = {1:0, 2:0, 3:0};
    let h1A = 0;
    simArray.forEach(i => {
        sk[i._skill] = (sk[i._skill]||0)+1;
        df[i._diff] = (df[i._diff]||0)+1;
        if (i._h1 === 'alta') h1A++;
    });
    if (sk.H3!==11 || sk.H5!==12 || sk.H2!==8 || sk.H4!==5 || sk.H6!==6 || sk.H7!==3) { console.log(`${name} FAIL: Skills ${JSON.stringify(sk)}`); return false; }
    if (df[1]!==12 || df[2]!==22 || df[3]!==11) { console.log(`${name} FAIL: Diff ${JSON.stringify(df)}`); return false; }
    
    let h1Pct = h1A / 45;
    if (h1Pct < 0.3 || h1Pct > 0.4) { console.log(`${name} FAIL: H1 ${h1Pct}`); return false; }
    
    for (let i=1; i<simArray.length; i++) {
        if (simArray[i]._diff < simArray[i-1]._diff) { console.log(`${name} FAIL: Asc ${i}`); return false; }
    }
    return true;
}

let sim1 = sim1Pool.sort((a,b) => a._diff - b._diff);
let sim1Valid = checkSimConstraints('SIM1', sim1);

let sim2 = sim2Pool.sort((a,b) => a._diff - b._diff);
let sim2ValidItems = [];
for (let i of sim2) {
    let exactHash = `${getProp(i,'template_id')}_${i.stem}_${getProp(i,'tipo_error','error_type')}_${i._skill}_${i._diff}`;
    if (seenHashes.has(exactHash) && !sim2Pool.includes(i)) {
        log('removed', i.item_id, 'duplicate_removed');
    } else {
        sim2ValidItems.push(i);
    }
}
let sim2Valid = checkSimConstraints('SIM2', sim2ValidItems);

let diagPool = otherPool.filter(i => i._iType === 'diagnostic');
diagPool.sort((a,b) => ((b._h1==='alta'?1:0) - (a._h1==='alta'?1:0)));
let finalDiag = diagPool.slice(0, 19);

let trainingPool = otherPool.filter(i => i._iType === 'training' && !finalDiag.includes(i));
trainingPool.sort((a,b) => {
  let batchA = parseInt(a.source_batch_id.split('_')[1] || 0);
  let batchB = parseInt(b.source_batch_id.split('_')[1] || 0);
  return batchB - batchA;
});

let tSkillMap = {H2:[], H3:[], H4:[], H5:[], H6:[], H7:[]};
for (let i of trainingPool) if (tSkillMap[i._skill]) tSkillMap[i._skill].push(i);

let finalTrain = [];
let trainRemaining = [];
// Step 1: Meet minimum skill counts (18) and L3 counts (>=2)
for (let sk in tSkillMap) {
    let sub = tSkillMap[sk];
    let L3s = sub.filter(i => i._diff === 3);
    let others = sub.filter(i => i._diff !== 3);
    
    let sel = L3s.slice(0, Math.min(3, L3s.length));
    
    let remainingPool = [...L3s.slice(Math.min(3, L3s.length)), ...others];
    remainingPool.sort((a,b) => (b._h1==='alta'?1:0) - (a._h1==='alta'?1:0));
    
    let needed = Math.max(0, 18 - sel.length);
    sel.push(...remainingPool.slice(0, needed));
    trainRemaining.push(...remainingPool.slice(needed));
    
    finalTrain.push(...sel);
}

// Step 2: Try to reach 140 training items specifically with H1 alta if possible
trainRemaining.sort((a,b) => (b._h1==='alta'?1:0) - (a._h1==='alta'?1:0));
let toAdd = Math.max(0, 140 - finalTrain.length);

for (let i=0; i<toAdd; i++) {
    if (i < trainRemaining.length) finalTrain.push(trainRemaining[i]);
}

let extraAlta = trainRemaining.slice(toAdd).filter(i => i._h1==='alta');
while (extraAlta.length > 0 && finalTrain.filter(i => i._h1==='alta').length / finalTrain.length < 0.3) {
    let cand = extraAlta.shift();
    finalTrain.push(cand);
    toAdd++;
}

let trainH1 = finalTrain.filter(i => i._h1==='alta').length / finalTrain.length;

let finalBuffer = [];
let remainPool = trainingPool.filter(i => !finalTrain.includes(i));
for (let i of remainPool) {
    finalBuffer.push(i);
}

let totalItems = finalDiag.length + sim1.length + sim2ValidItems.length + finalTrain.length + finalBuffer.length;
let vConteo = (finalDiag.length >= 18 && finalDiag.length <= 20) && (sim1.length === 45) && (sim2ValidItems.length === 45) && (finalTrain.length >= 140);
let vSim = sim1Valid && sim2Valid;

let vTrainSki = true; let vTrainL3 = true;
let trSk = {H2:0,H3:0,H4:0,H5:0,H6:0,H7:0};
let trL3 = {H2:0,H3:0,H4:0,H5:0,H6:0,H7:0};
finalTrain.forEach(i => {
    trSk[i._skill]++;
    if (i._diff === 3) trL3[i._skill]++;
});
for (let sk in trSk) {
    if (trSk[sk]<18) vTrainSki=false;
    if (trL3[sk]<2) vTrainL3=false; 
}
let vTrain = vTrainSki && vTrainL3 && (trainH1 >= 0.3);

let diagH1 = finalDiag.filter(i => i._h1==='alta').length / finalDiag.length;
let sim1H1 = sim1.filter(i => i._h1==='alta').length / sim1.length;
let sim2H1 = sim2ValidItems.filter(i => i._h1==='alta').length / sim2ValidItems.length;
let vDiag = diagH1 > sim1H1 && diagH1 > sim2H1 && diagH1 > trainH1;

let isValid = vConteo && vSim && vTrain && vDiag && finalBuffer.length >= 10;

console.log({
    vConteo,
    sim1Valid,
    sim2Valid,
    vSim,
    vTrainSki,
    vTrainL3,
    vTrain,
    vDiag,
    bufferLen: finalBuffer.length
});

assemblyLog.push({
    action: "validation",
    counts: { 
        diagnostic: finalDiag.length, 
        sim_1: sim1.length, 
        sim_2: sim2ValidItems.length, 
        training: finalTrain.length, 
        buffer: finalBuffer.length,
        total: totalItems
    },
    skill_distribution: trSk,
    difficulty_distribution: trL3, 
    h1_rate: trainH1,
    diag_h1_rate: diagH1,
    sim1_h1: sim1H1,
    sim2_h1: sim2H1,
    duplicates_detected: removedCount,
    status: isValid ? "ready_for_audit" : "blocked",
    reason: isValid ? undefined : "exact failure"
});

if (!isValid) {
    fs.writeFileSync('C:\\Cyboring_Global\\5_Ventures\\sbu-admision\\FASES 3-4-5\\UCR26_Content\\03_ITEM_PRODUCTION\\assembly_log_v3.json', JSON.stringify([...assemblyLog], null, 2));
    let emptyBank = { diagnostic: [], sim_1: [], sim_2: [], training: [], buffer: [] };
    fs.writeFileSync('C:\\Cyboring_Global\\5_Ventures\\sbu-admision\\FASES 3-4-5\\UCR26_Content\\03_ITEM_PRODUCTION\\bank_v3_candidate.json', JSON.stringify(emptyBank, null, 2));
    process.exit(1);
}

function cleanObj(i) {
    let o = {...i};
    delete o._mArea; delete o._skill; delete o._diff; delete o._h1; delete o._iType;
    return o;
}

let bank_v3 = {
    diagnostic: finalDiag.map(cleanObj),
    sim_1: sim1.map(cleanObj),
    sim_2: sim2ValidItems.map(cleanObj),
    training: finalTrain.map(cleanObj),
    buffer: finalBuffer.map(cleanObj)
};

fs.writeFileSync('C:\\Cyboring_Global\\5_Ventures\\sbu-admision\\FASES 3-4-5\\UCR26_Content\\03_ITEM_PRODUCTION\\bank_v3_candidate.json', JSON.stringify(bank_v3, null, 2));
fs.writeFileSync('C:\\Cyboring_Global\\5_Ventures\\sbu-admision\\FASES 3-4-5\\UCR26_Content\\03_ITEM_PRODUCTION\\assembly_log_v3.json', JSON.stringify(assemblyLog, null, 2));

console.log("Bank Assembly Complete v3. STATUS: ready_for_audit");
