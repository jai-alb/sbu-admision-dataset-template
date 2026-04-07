const fs = require('fs');
const path = require('path');

const batchDir = "c:\\Cyboring_Global\\5_Ventures\\sbu-admision\\FASES 3-4-5\\UCR26_Content\\03_ITEM_PRODUCTION\\BATCHES";

let allApproved = [];
let errors = [];

// Load all batch files
const batchFiles = fs.readdirSync(batchDir)
  .filter(f => f.match(/^batch_\d+\.json$/))
  .sort()
  .map(f => path.join(batchDir, f));

console.log("=== LOADING BATCHES ===");
for (const bf of batchFiles) {
  const content = JSON.parse(fs.readFileSync(bf, 'utf8'));
  const batchId = content.batch_id || '?';
  const itemType = content.item_type || '?';
  const batchSimId = content.simulation_id || null; // Added: batch-level simulation_id
  const items = content.items || [];
  const approved = items.filter(i => i.final_status === 'approved');
  console.log(`  ${batchId} (${itemType}): ${approved.length} approved`);
  for (const item of approved) {
    const meta = item.metadata || {};
    // Determine sim segment from multiple possible locations
    let simSeg = meta.sim_segment || item.sim_segment || null;
    // Try item-level simulation_id
    if (!simSeg && (item.simulation_id === 'sim_1' || item.simulation_id === 'sim_2')) {
      simSeg = item.simulation_id;
    }
    // Try metadata simulation_id
    if (!simSeg && (meta.simulation_id === 'sim_1' || meta.simulation_id === 'sim_2')) {
      simSeg = meta.simulation_id;
    }
    // Fallback to batch-level simulation_id
    if (!simSeg && (batchSimId === 'sim_1' || batchSimId === 'sim_2')) {
      simSeg = batchSimId;
    }
    // Final fallback from batch item_type
    if (!simSeg && itemType === 'sim_1') simSeg = 'sim_1';
    if (!simSeg && itemType === 'sim_2') simSeg = 'sim_2';
    allApproved.push({
      item_id: item.item_id || '',
      batch_id: batchId,
      batch_item_type: itemType,
      template_id: item.template_id || '',
      prompt_id: item.prompt_id || '',
      item_type: meta.item_type || itemType,
      macro_area: meta.macro_area || '',
      skill: meta.skill || '',
      dificultad: meta.dificultad ?? meta.difficulty ?? null,
      H1: meta.H1 || '',
      sim_segment: simSeg,
    });
  }
}

console.log(`\n=== TOTAL APPROVED: ${allApproved.length} ===\n`);

// STEP 1: SEGMENTATION
console.log("=== STEP 1: SEGMENTATION ===");
const training = allApproved.filter(i => i.item_type === 'training');
const diagnostic = allApproved.filter(i => i.item_type === 'diagnostic');
const sim_all = allApproved.filter(i => i.item_type === 'simulation');
const sim_1 = allApproved.filter(i => i.sim_segment === 'sim_1');
const sim_2 = allApproved.filter(i => i.sim_segment === 'sim_2');

console.log(`  training: ${training.length}`);
console.log(`  diagnostic: ${diagnostic.length}`);
console.log(`  simulation (all): ${sim_all.length}`);
console.log(`  sim_1: ${sim_1.length}`);
console.log(`  sim_2: ${sim_2.length}`);

// STEP 2: DUPLICATION CHECK
console.log("\n=== STEP 2: DUPLICATION CHECK ===");
const allIds = allApproved.map(i => i.item_id);
const uniqueIds = new Set(allIds);
if (allIds.length !== uniqueIds.size) {
  const dupCount = allIds.length - uniqueIds.size;
  errors.push(`DUPLICATE_IDS: ${dupCount} duplicate item_ids`);
  console.log(`  FAIL: ${dupCount} duplicate item_ids`);
} else {
  console.log("  PASS: No duplicate item_ids");
}

const simIds = new Set([...sim_1, ...sim_2].map(i => i.item_id));
const diagIds = new Set(diagnostic.map(i => i.item_id));
const trainIds = new Set(training.map(i => i.item_id));

const sd = [...simIds].filter(x => diagIds.has(x));
const st = [...simIds].filter(x => trainIds.has(x));
const dt = [...diagIds].filter(x => trainIds.has(x));
if (sd.length) { errors.push(`CROSS_OVERLAP sim/diag: ${sd}`); console.log(`  FAIL: sim/diag overlap: ${sd}`); }
else console.log("  PASS: No sim/diag overlap");
if (st.length) { errors.push(`CROSS_OVERLAP sim/train: ${st}`); console.log(`  FAIL: sim/train overlap`); }
else console.log("  PASS: No sim/train overlap");
if (dt.length) { errors.push(`CROSS_OVERLAP diag/train: ${dt}`); console.log(`  FAIL: diag/train overlap`); }
else console.log("  PASS: No diag/train overlap");

// STEP 3: SIMULATION VALIDATION
console.log("\n=== STEP 3: SIMULATION VALIDATION ===");

function validateSim(simItems, simName) {
  const vErrors = [];
  const n = simItems.length;
  console.log(`\n  [${simName}] Count: ${n} (required: 45)`);
  if (n !== 45) vErrors.push(`${simName} COUNT: ${n} != 45`);

  const rcv = simItems.filter(i => i.macro_area === 'RCV').length;
  const rcm = simItems.filter(i => i.macro_area === 'RCM').length;
  console.log(`  [${simName}] RCV=${rcv}(req:23), RCM=${rcm}(req:22)`);
  if (rcv !== 23) vErrors.push(`${simName} RCV=${rcv} != 23`);
  if (rcm !== 22) vErrors.push(`${simName} RCM=${rcm} != 22`);

  const expectedSkills = {H2:8, H3:11, H4:5, H5:12, H6:6, H7:3};
  console.log(`  [${simName}] Skill distribution:`);
  for (const [sk, req] of Object.entries(expectedSkills)) {
    const actual = simItems.filter(i => i.skill === sk).length;
    const s = actual === req ? 'OK' : 'FAIL';
    console.log(`    ${sk}: ${actual} (req:${req}) [${s}]`);
    if (actual !== req) vErrors.push(`${simName} SKILL ${sk}: ${actual} != ${req}`);
  }

  const d1 = simItems.filter(i => i.dificultad === 1).length;
  const d2 = simItems.filter(i => i.dificultad === 2).length;
  const d3 = simItems.filter(i => i.dificultad === 3).length;
  console.log(`  [${simName}] Difficulty: L1=${d1}(req:12), L2=${d2}(req:22), L3=${d3}(req:11)`);
  if (d1 !== 12) vErrors.push(`${simName} DIFFICULTY L1: ${d1} != 12`);
  if (d2 !== 22) vErrors.push(`${simName} DIFFICULTY L2: ${d2} != 22`);
  if (d3 !== 11) vErrors.push(`${simName} DIFFICULTY L3: ${d3} != 11`);

  const h1Alta = simItems.filter(i => i.H1 === 'alta').length;
  const h1Rate = n > 0 ? h1Alta / n : 0;
  console.log(`  [${simName}] H1 alta: ${h1Alta}/${n} = ${(h1Rate*100).toFixed(1)}% (req:30-40%)`);
  if (h1Rate < 0.30 || h1Rate > 0.40) {
    vErrors.push(`${simName} H1_RATE: ${(h1Rate*100).toFixed(1)}% outside 30-40%`);
  }

  return { vErrors, h1Rate };
}

const { vErrors: sim1Errors, h1Rate: sim1H1Rate } = validateSim(sim_1, 'SIM_1');
const { vErrors: sim2Errors, h1Rate: sim2H1Rate } = validateSim(sim_2, 'SIM_2');

// STEP 4: INTER-SIMULACRO ISOLATION
console.log("\n=== STEP 4: SIMULACRO ISOLATION ===");
const s1ids = new Set(sim_1.map(i => i.item_id));
const s2ids = new Set(sim_2.map(i => i.item_id));
const simOverlap = [...s1ids].filter(x => s2ids.has(x));
if (simOverlap.length) {
  errors.push(`SIM_ITEM_OVERLAP: ${simOverlap.length} items shared between sim_1 and sim_2`);
  console.log(`  FAIL: ${simOverlap.length} items in both sim_1 and sim_2`);
} else {
  console.log("  PASS: 0 item_id overlaps between sim_1 and sim_2");
}

// STEP 5: DIAGNOSTIC
console.log("\n=== STEP 5: DIAGNOSTIC VALIDATION ===");
const diagCount = diagnostic.length;
console.log(`  Count: ${diagCount} (req: 18-20)`);
if (diagCount < 18 || diagCount > 20) errors.push(`DIAGNOSTIC_COUNT: ${diagCount} outside 18-20`);

const diagH1Alta = diagnostic.filter(i => i.H1 === 'alta').length;
const diagH1Rate = diagCount > 0 ? diagH1Alta / diagCount : 0;
const diagD2 = diagnostic.filter(i => i.dificultad === 2).length;
const diagD2Pct = diagCount > 0 ? diagD2 / diagCount : 0;

const trainH1Alta = training.filter(i => i.H1 === 'alta').length;
const trainH1Rate = training.length > 0 ? trainH1Alta / training.length : 0;
const maxSimTrainH1 = Math.max(sim1H1Rate, sim2H1Rate, trainH1Rate);

console.log(`  H1 alta: ${diagH1Alta}/${diagCount} = ${(diagH1Rate*100).toFixed(1)}%`);
console.log(`  Level 2: ${diagD2}/${diagCount} = ${(diagD2Pct*100).toFixed(1)}% (req: majority)`);
console.log(`  Rates — diag:${(diagH1Rate*100).toFixed(1)}% sim1:${(sim1H1Rate*100).toFixed(1)}% sim2:${(sim2H1Rate*100).toFixed(1)}% train:${(trainH1Rate*100).toFixed(1)}%`);

if (diagH1Rate <= maxSimTrainH1) {
  errors.push(`DIAGNOSTIC_H1_RATE: ${(diagH1Rate*100).toFixed(1)}% NOT strictly greater than max(sim/train)=${(maxSimTrainH1*100).toFixed(1)}%`);
  console.log(`  FAIL: diagnostic H1 must be strictly greater than sim/train`);
} else {
  console.log(`  PASS: diagnostic H1 (${(diagH1Rate*100).toFixed(1)}%) > max(sim/train) (${(maxSimTrainH1*100).toFixed(1)}%)`);
}
if (diagD2Pct < 0.50) {
  errors.push(`DIAGNOSTIC_L2_NOT_MAJORITY: ${diagD2}/${diagCount}`);
  console.log(`  FAIL: Level 2 not majority`);
} else {
  console.log(`  PASS: Level 2 is majority (${(diagD2Pct*100).toFixed(1)}%)`);
}

console.log("  Skill representation:");
for (const sk of ['H2','H3','H4','H5','H6','H7']) {
  const cnt = diagnostic.filter(i => i.skill === sk).length;
  console.log(`    ${sk}: ${cnt}`);
}

// STEP 6: TRAINING
console.log("\n=== STEP 6: TRAINING VALIDATION ===");
const trainCount = training.length;
console.log(`  Total: ${trainCount} (req: >=140)`);
if (trainCount < 140) errors.push(`TRAINING_COUNT: ${trainCount} < 140`);
console.log(`  H1 alta: ${trainH1Alta}/${trainCount} = ${(trainH1Rate*100).toFixed(1)}% (req: >=30%)`);
if (trainH1Rate < 0.30) errors.push(`TRAINING_H1_RATE: ${(trainH1Rate*100).toFixed(1)}% < 30%`);

let trainValid = trainCount >= 140 && trainH1Rate >= 0.30;
console.log("  Skill counts and L3:");
for (const sk of ['H2','H3','H4','H5','H6','H7']) {
  const skItems = training.filter(i => i.skill === sk);
  const skCount = skItems.length;
  const skL3 = skItems.filter(i => i.dificultad === 3).length;
  const s = (skCount >= 18 && skL3 >= 2) ? 'OK' : 'FAIL';
  console.log(`    ${sk}: ${skCount} items (req>=18), L3=${skL3} (req>=2) [${s}]`);
  if (skCount < 18) { errors.push(`TRAINING_SKILL_${sk}: ${skCount} < 18`); trainValid = false; }
  if (skL3 < 2)    { errors.push(`TRAINING_SKILL_${sk}_L3: ${skL3} < 2`); trainValid = false; }
}

// STEP 7: TRACEABILITY
console.log("\n=== STEP 7: TRACEABILITY ===");
const missingTrace = allApproved.filter(i =>
  !i.template_id || !i.prompt_id || !i.skill || i.dificultad === null || !i.H1
);
if (missingTrace.length) {
  errors.push(`TRACEABILITY: ${missingTrace.length} items with incomplete metadata`);
  console.log(`  FAIL: ${missingTrace.length} items missing trace fields`);
} else {
  console.log("  PASS: All items have complete traceability");
}

// STEP 8: GLOBAL
console.log("\n=== STEP 8: GLOBAL VALIDATION ===");
const totalBank = allApproved.length;
console.log(`  Total bank: ${totalBank} (target: 250-255)`);
if (totalBank < 245 || totalBank > 270) {
  errors.push(`BANK_SIZE: ${totalBank} outside expected range ~250-255`);
}
const minRequired = 45 + 45 + 18 + 140;
const buffer = totalBank - minRequired;
console.log(`  Buffer (bank ${totalBank} - min ${minRequired}): ${buffer} (req: >=10)`);
if (buffer < 10) errors.push(`BUFFER: ${buffer} < 10`);

// FINAL
const allErrors = [...errors, ...sim1Errors, ...sim2Errors];
const sim1Valid = sim1Errors.length === 0;
const sim2Valid = sim2Errors.length === 0;
const diagValid = (diagCount >= 18 && diagCount <= 20 && diagH1Rate > maxSimTrainH1 && diagD2Pct >= 0.50);
const dupCheck = !allErrors.some(e => e.includes('DUPLICATE') || e.includes('OVERLAP'));
const traceCheck = missingTrace.length === 0;

console.log("\n" + "=".repeat(50));
console.log("PHASE 4B BANK AUDIT — FINAL OUTPUT");
console.log("=".repeat(50));

console.log("\nA. RESULTADO");
console.log(`   bank_status: ${allErrors.length === 0 ? 'approved' : 'rejected'}`);

console.log("\nB. RESUMEN");
console.log(`   diagnostic_count: ${diagCount}`);
console.log(`   sim_1_count: ${sim_1.length}`);
console.log(`   sim_2_count: ${sim_2.length}`);
console.log(`   training_count: ${trainCount}`);
console.log(`   total_bank: ${totalBank}`);

console.log("\nC. VALIDACIONES");
console.log(`   simulation_1_valid: ${sim1Valid}`);
console.log(`   simulation_2_valid: ${sim2Valid}`);
console.log(`   diagnostic_valid: ${diagValid}`);
console.log(`   training_valid: ${trainValid}`);
console.log(`   duplication_check: ${dupCheck ? 'pass' : 'fail'}`);
console.log(`   traceability_check: ${traceCheck ? 'pass' : 'fail'}`);

console.log("\nD. ERRORES");
if (allErrors.length) {
  for (const e of allErrors) console.log(`   - ${e}`);
} else {
  console.log("   none");
}

console.log("\nE. DECISION FINAL");
console.log(`   ${allErrors.length === 0 ? 'approved' : 'rejected'}`);
