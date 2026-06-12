const fs = require('fs');

const path = "c:\\Cyboring_Global\\5_Ventures\\sbu-admision\\bank_v10_final.json";
const bank = JSON.parse(fs.readFileSync(path, 'utf8'));

let failures = [];

// 1. ESTRUCTURA GLOBAL
const segmentsReq = ["diagnostic", "sim_1", "sim_2", "training"];
let total_items = 0;
for (let seg of segmentsReq) {
    if (!bank.hasOwnProperty(seg)) {
        failures.push(`Missing segment: ${seg}`);
    } else {
        total_items += bank[seg].length;
    }
}

if (total_items < 259 || total_items > 265) {
    failures.push(`Total items ${total_items} no esta en [259, 265]`);
}

if (bank.sim_1 && bank.sim_1.length !== 45) {
    failures.push(`sim_1 length is ${bank.sim_1.length}, expected 45`);
}
if (bank.sim_2 && bank.sim_2.length !== 45) {
    failures.push(`sim_2 length is ${bank.sim_2.length}, expected 45`);
}

// 2. SIMULACIONES (CRITICO)
for (let seg of ["sim_1", "sim_2"]) {
    if (!bank[seg]) continue;
    
    let d1=0, d2=0, d3=0;
    let rcv=0, rcm=0;
    
    let isAscending = true;
    for (let i = 0; i < bank[seg].length - 1; i++) {
        let diffA = bank[seg][i].metadata.difficulty;
        let diffB = bank[seg][i+1].metadata.difficulty;
        if (diffA > diffB) {
            isAscending = false;
        }
    }

    for (let item of bank[seg]) {
        let diff = item.metadata.difficulty;
        if (diff === 1) d1++;
        if (diff === 2) d2++;
        if (diff === 3) d3++;

        let macro = item.metadata.macro_area;
        if (macro === "RCV") rcv++;
        if (macro === "RCM") rcm++;
    }

    if (d1 !== 12) failures.push(`${seg} d1=${d1}, expected 12`);
    if (d2 !== 22) failures.push(`${seg} d2=${d2}, expected 22`);
    if (d3 !== 11) failures.push(`${seg} d3=${d3}, expected 11`);
    if (!isAscending) failures.push(`${seg} no tiene orden estrictamente ascendente (difficulty)`);
    if (rcv !== 23) failures.push(`${seg} RCV=${rcv}, expected 23`);
    if (rcm !== 22) failures.push(`${seg} RCM=${rcm}, expected 22`);
}

// 3. TRAINING
const hSkills = ["H2", "H3", "H4", "H5", "H6", "H7"];
let skillCounts = { "H2": 0, "H3": 0, "H4": 0, "H5": 0, "H6": 0, "H7": 0 };
if (bank.training) {
    for (let item of bank.training) {
        let s = item.metadata.skill;
        if (skillCounts.hasOwnProperty(s)) {
            skillCounts[s]++;
        }
    }
    for (let s of hSkills) {
        if (skillCounts[s] < 18) {
            failures.push(`Training skill ${s} count=${skillCounts[s]}, expected >= 18`);
        }
    }
}

// 4. H1 DISTRIBUTION
// simulation: 30-40% H1 alta
// training: >=30% H1 alta
// diagnostic H1 > simulation and training
function getH1Rate(items) {
    if (!items || items.length === 0) return 0;
    let h1_alta = 0;
    for (let item of items) {
        if (item.metadata && item.metadata.h1 && item.metadata.h1.toLowerCase() === 'alta') {
            h1_alta++;
        }
    }
    return h1_alta / items.length;
}

let sim_items = [];
if (bank.sim_1) sim_items.push(...bank.sim_1);
if (bank.sim_2) sim_items.push(...bank.sim_2);

let sim_h1_rate = getH1Rate(sim_items);
let train_h1_rate = getH1Rate(bank.training);
let diag_h1_rate = getH1Rate(bank.diagnostic);

if (sim_h1_rate < 0.30 || sim_h1_rate > 0.40) {
    failures.push(`Simulation H1 rate is ${sim_h1_rate.toFixed(2)}, expected 30%-40%`);
}
if (train_h1_rate < 0.30) {
    failures.push(`Training H1 rate is ${train_h1_rate.toFixed(2)}, expected >= 30%`);
}
if (diag_h1_rate <= sim_h1_rate || diag_h1_rate <= train_h1_rate) {
    failures.push(`Diagnostic H1 rate (${diag_h1_rate.toFixed(2)}) is not strictly > simulation (${sim_h1_rate.toFixed(2)}) and training (${train_h1_rate.toFixed(2)})`);
}

// 5. TRAZABILIDAD
let allItems = [];
if (bank.diagnostic) allItems.push(...bank.diagnostic);
if (bank.sim_1) allItems.push(...bank.sim_1);
if (bank.sim_2) allItems.push(...bank.sim_2);
if (bank.training) allItems.push(...bank.training);

for (let item of allItems) {
    let itemId = item.id || item.item_id || "UNKNOWN_ID";
    if (!item.hasOwnProperty('traceability') || item.traceability === null) {
        failures.push(`Item ${itemId} missing traceability object`);
        continue;
    }
    let t = item.traceability;
    if (!t.template_id || t.template_id === null) failures.push(`Item ${itemId} missing template_id`);
    if (!t.prompt_id || t.prompt_id === null) failures.push(`Item ${itemId} missing prompt_id`);
    if (!t.source_batch_id || t.source_batch_id === null) failures.push(`Item ${itemId} missing source_batch_id`);
}

// 6. DUPLICACION (CRITICO)
let ids = new Set();
let dup_intra_inter = false;
for (let item of allItems) {
    let itemId = item.id || item.item_id;
    if (!itemId) continue;
    if (ids.has(itemId)) {
        dup_intra_inter = true;
        failures.push(`Duplicated id: ${itemId}`);
    }
    ids.add(itemId);
}

if (bank.sim_1 && bank.sim_2 && bank.sim_1.length === 45 && bank.sim_2.length === 45) {
    let coincidencia = false;
    for (let i = 0; i < 45; i++) {
        let s1 = bank.sim_1[i].metadata;
        let s2 = bank.sim_2[i].metadata;
        if (s1 && s2 && s1.skill === s2.skill && s1.difficulty === s2.difficulty && s1.macro_area === s2.macro_area) {
            coincidencia = true;
        }
    }
    if (coincidencia) {
        failures.push(`Sim_1 y Sim_2 tienen coincidencia estructural (mismo skill, difficulty, macro_area en misma posicion)`);
    }
}

let result = {};
if (failures.length > 0) {
    result.status = "rejected";
    result.failures = [...new Set(failures)];
} else {
    result.status = "approved";
    result.failures = [];
}
console.log(JSON.stringify(result, null, 2));
