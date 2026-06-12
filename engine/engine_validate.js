'use strict';
/**
 * Dataset Engine — Validation + Risk-Based Audit
 *
 * STEP 2 — EXTENDED VALIDATION (R01–R37)
 * STEP 3 — RISK-BASED AUDIT   (min(max(20, ceil(N×0.15))) highest-risk items)
 *
 * Usage:
 *   node engine/engine_validate.js --exam <path/to/exam_config.json>
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CLI + CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const examArg = process.argv.indexOf('--exam');
if (examArg === -1 || !process.argv[examArg + 1]) {
  console.error('ERROR: --exam <path/to/exam_config.json> is required.');
  process.exit(2);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(process.argv[examArg + 1], 'utf8'));
} catch (e) {
  console.error(`ERROR: Cannot load exam config: ${e.message}`);
  process.exit(2);
}

const examDir           = path.dirname(path.resolve(process.argv[examArg + 1]));
const explanationsPath  = path.join(examDir, '04_validation',    config.output.explanations_filename || 'explanations_v1.json');
const datasetPath       = path.join(examDir, '03_item_production', config.output.dataset_filename    || 'dataset_v1.json');

const PROHIBITED_SUBSTRINGS  = config.explanation_rules.prohibited_substrings || [];
const LINE1_CORRECT_PATTERN  = new RegExp(config.explanation_rules.correct_line1_pattern);
const INCORRECT_LINE1_PREFIX = config.explanation_rules.incorrect_line1_prefix  || 'Error:';
const INCORRECT_LINE2_PREFIX = config.explanation_rules.incorrect_line2_prefix  || 'Correction:';
const MAX_LINE_LENGTH        = config.explanation_rules.max_line_length          || 120;
const MIN_LINE_LENGTH        = config.explanation_rules.min_line_length          || 40;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD FILES
// ─────────────────────────────────────────────────────────────────────────────

let outputFile, dataset;
try {
  outputFile = JSON.parse(fs.readFileSync(explanationsPath, 'utf8'));
} catch (e) {
  console.error(`FAIL\nstep: VALIDATION\nrule: LEVEL1_JSON_PARSE\nreason: Cannot parse ${path.basename(explanationsPath)}: ${e.message}`);
  process.exit(1);
}
try {
  dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
} catch (e) {
  console.error(`FAIL\nstep: VALIDATION\nrule: DATASET_LOAD\nreason: Cannot parse ${path.basename(datasetPath)}: ${e.message}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED RULE PATTERNS (universal — not exam-specific)
// ─────────────────────────────────────────────────────────────────────────────

const TRUNCATED_TAIL_RE   = /\s+(de|a|que|con|sin|por|para|y|o|ni|el|la|los|las|un|una)\.$/;
const OPEN_PAREN_RE       = /\([^)]*\.$/;
const DANGLING_SYMBOL_RE  = /[→—:]\s*\.$/;
const GENERIC_SUBJECT_RE  = /^(El\s+estudiante|El\s+usuario|El\s+reactivo|La\s+pregunta)\b/i;
const INSTRUCTIONAL_RE    = /\bdebe\b|\bno\s+debe\b|\bhay\s+que\b|\bes\s+necesario\b|\bdeben\b/i;
const NARRATIVE_SUBJECT_RE = /^(Para\s+(resolver|calcular|obtener)|Se\s+debe|Primero\s+se|El\s+error\s+es\s+no\s+)/i;
const PURE_NUMERIC_ERROR_RE = /^Error:\s*[\d\s+\-*/=÷×₡°.()]+\.$/;
const SHALLOW_ERROR_RE      = /^Error:\s*[\d÷×+\-=()\s₡°.,]+\.$/;

const PLACEHOLDER_LINES = [
  /^(1\s+operaci[oó]n)\s*\.$/i,
  /^(Relaci[oó]n\s+(directa|expl[ií]cita|lineal|simple))\s*\.$/i,
  /^(Reconocimiento\s+(directo|inmediato|simple))\s*\.$/i,
  /^(Sin\s+variable\s+oculta)\s*\.$/i,
  /^(1\s+paso)\s*\.$/i,
  /^(Patr[oó]n\s+simple)\s*\.$/i,
];

function isPlaceholder(line) {
  const c = line.replace(/^(Error:|Corrección:|Correction:)\s*/, '').trim();
  return PLACEHOLDER_LINES.some(re => re.test(c));
}

function isTruncated(line) {
  if (TRUNCATED_TAIL_RE.test(line))  return { reason: 'trailing connector before period' };
  if (OPEN_PAREN_RE.test(line))      return { reason: 'unclosed parenthesis at end of line' };
  if (DANGLING_SYMBOL_RE.test(line)) return { reason: 'dangling symbol before period' };
  if (/[:(,]\s*\.$/.test(line))      return { reason: 'line ends after structural marker' };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — FULL VALIDATION (R01–R37)
// ─────────────────────────────────────────────────────────────────────────────

function validateFull(outputFile, dataset) {
  const fails    = [];
  const required = ['item_id', 'explanation_correct', 'explanation_incorrect_common'];
  const rootKeys = Object.keys(outputFile);

  if (rootKeys.length !== 2 || !rootKeys.includes('version') || !rootKeys.includes('items')) {
    fails.push({ rule: 'R01', detail: `Root must have exactly 2 keys: "version" and "items". Found: ${rootKeys.join(', ')}` });
  }
  if (outputFile.version !== 'v1') {
    fails.push({ rule: 'R02', detail: `version must be "v1", got: "${outputFile.version}"` });
  }
  if (!Array.isArray(outputFile.items)) { fails.push({ rule: 'R03', detail: '"items" must be an array' }); return fails; }
  if (outputFile.items.length === 0)    { fails.push({ rule: 'R04', detail: '"items" must not be empty' }); return fails; }

  const seenIds = new Set();
  for (const item of outputFile.items) {
    const iid      = item.item_id || '(missing)';
    const itemKeys = Object.keys(item);
    if (itemKeys.length !== 3) fails.push({ rule: 'R05', item_id: iid, detail: `Item must have exactly 3 keys, found ${itemKeys.length}: ${itemKeys.join(', ')}` });
    for (const k of required) { if (!itemKeys.includes(k)) fails.push({ rule: 'R05', item_id: iid, detail: `Missing required key "${k}"` }); }
    for (const k of itemKeys) { if (!required.includes(k)) fails.push({ rule: 'R06', item_id: iid, detail: `Extra key "${k}" not allowed` }); }
    if (!item.item_id     || typeof item.item_id     !== 'string') fails.push({ rule: 'R07', item_id: iid, detail: 'item_id must be non-empty string' });
    if (!item.explanation_correct          || typeof item.explanation_correct          !== 'string') fails.push({ rule: 'R08', item_id: iid, detail: 'explanation_correct must be non-empty string' });
    if (!item.explanation_incorrect_common || typeof item.explanation_incorrect_common !== 'string') fails.push({ rule: 'R09', item_id: iid, detail: 'explanation_incorrect_common must be non-empty string' });
    if (seenIds.has(item.item_id)) fails.push({ rule: 'R11', item_id: iid, detail: `Duplicate item_id "${item.item_id}"` });
    seenIds.add(item.item_id);
  }
  if (fails.length > 0) return fails;

  const trainingItems = dataset.segments.training || [];
  const trainingIds   = new Set(trainingItems.map(i => i.item_id));
  const otherIds      = new Set([
    ...(dataset.segments.diagnostic || []).map(i => i.item_id),
    ...Object.values(dataset.segments.simulation || {}).filter(Array.isArray).flat().map(i => i.item_id),
  ]);

  for (const item of outputFile.items) {
    if (!trainingIds.has(item.item_id)) fails.push({ rule: 'R14', item_id: item.item_id, detail: 'item_id not found in segments.training[]' });
    if (otherIds.has(item.item_id))     fails.push({ rule: 'R18', item_id: item.item_id, detail: 'item_id belongs to a non-training segment' });
  }
  for (const tid of trainingIds) {
    if (!seenIds.has(tid)) fails.push({ rule: 'R15', item_id: tid, detail: `training item "${tid}" missing from explanations` });
  }
  if (outputFile.items.length !== trainingItems.length) {
    fails.push({ rule: 'R16', detail: `count mismatch: ${outputFile.items.length} vs ${trainingItems.length}` });
  }
  if (fails.length > 0) return fails;

  for (const item of outputFile.items) {
    const ec       = item.explanation_correct;
    const ei       = item.explanation_incorrect_common;
    const ecL      = ec.split('\n');
    const eiL      = ei.split('\n');
    const allLines = [...ecL, ...eiL];
    const combined = ec + '\n' + ei;

    if ((ec.match(/\n/g) || []).length !== 1) fails.push({ rule: 'R30a', item_id: item.item_id, detail: 'EC must have exactly 1 \\n' });
    if ((ei.match(/\n/g) || []).length !== 1) fails.push({ rule: 'R30b', item_id: item.item_id, detail: 'EI must have exactly 1 \\n' });
    for (const line of allLines) {
      if (line.length > MAX_LINE_LENGTH) fails.push({ rule: 'R22', item_id: item.item_id, detail: `Line exceeds ${MAX_LINE_LENGTH} chars (${line.length}): "${line.substring(0, 60)}..."` });
    }
    if (!eiL[0] || !eiL[0].startsWith(INCORRECT_LINE1_PREFIX)) fails.push({ rule: 'R23', item_id: item.item_id, detail: `EI line 1 must start with "${INCORRECT_LINE1_PREFIX}", got: "${(eiL[0] || '').substring(0, 50)}"` });
    if (!eiL[1] || !eiL[1].startsWith(INCORRECT_LINE2_PREFIX)) fails.push({ rule: 'R24', item_id: item.item_id, detail: `EI line 2 must start with "${INCORRECT_LINE2_PREFIX}", got: "${(eiL[1] || '').substring(0, 50)}"` });
    if (!LINE1_CORRECT_PATTERN.test(ecL[0] || '')) fails.push({ rule: 'R25', item_id: item.item_id, detail: `EC line 1 does not match pattern: "${(ecL[0] || '').substring(0, 80)}"` });
    for (const line of allLines) {
      if (/[…]$/.test(line) || /\.{3,}$/.test(line)) fails.push({ rule: 'R26', item_id: item.item_id, detail: 'Ellipsis at end of line' });
    }
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) fails.push({ rule: 'R27', item_id: item.item_id, detail: `Prohibited substring "${ps}"` });
    }
    if (combined.includes('?'))                                fails.push({ rule: 'R28', item_id: item.item_id, detail: 'Prohibited "?" found' });
    if (/\*\*|__|<[a-zA-Z/]|[a-zA-Z]>/.test(combined))        fails.push({ rule: 'R29', item_id: item.item_id, detail: 'HTML/markdown detected' });
    if (!ecL[0] || !ecL[0].endsWith('.')) fails.push({ rule: 'R30c', item_id: item.item_id, detail: 'EC line 1 must end with "."' });
    if (!ecL[1] || !ecL[1].endsWith('.')) fails.push({ rule: 'R30d', item_id: item.item_id, detail: 'EC line 2 must end with "."' });
    for (const line of allLines) {
      const trunc = isTruncated(line);
      if (trunc) fails.push({ rule: 'R32', item_id: item.item_id, detail: `Truncated (${trunc.reason}): "${line.substring(0, 100)}"` });
    }
    if (GENERIC_SUBJECT_RE.test(ecL[0] || ''))   fails.push({ rule: 'R33', item_id: item.item_id, detail: `EC line 1 uses generic subject` });
    if (INSTRUCTIONAL_RE.test(ecL[0] || ''))     fails.push({ rule: 'R34', item_id: item.item_id, detail: `EC line 1 uses instructional tone` });
    if (NARRATIVE_SUBJECT_RE.test(ecL[0] || '')) fails.push({ rule: 'R34', item_id: item.item_id, detail: `EC line 1 uses narrative opening` });
    const errContent = (eiL[0] || '').replace(new RegExp(`^${INCORRECT_LINE1_PREFIX}\\s*`), '').trim();
    if (PURE_NUMERIC_ERROR_RE.test(eiL[0] || '') || SHALLOW_ERROR_RE.test(eiL[0] || '')) {
      fails.push({ rule: 'R35', item_id: item.item_id, detail: 'Error line is purely numeric' });
    }
    if (errContent.length < 30 && errContent.length > 0) {
      fails.push({ rule: 'R35', item_id: item.item_id, detail: `Error description too brief (${errContent.length} chars)` });
    }
    for (const line of allLines) {
      if (line.length < MIN_LINE_LENGTH) fails.push({ rule: 'R36', item_id: item.item_id, detail: `Line too short (${line.length} chars): "${line}"` });
    }
    for (const line of allLines) {
      if (isPlaceholder(line)) fails.push({ rule: 'R37', item_id: item.item_id, detail: `Semantic placeholder: "${line}"` });
    }
  }

  const ids = outputFile.items.map(i => i.item_id);
  for (let i = 1; i < ids.length; i++) {
    if (ids[i].localeCompare(ids[i - 1], 'en', { sensitivity: 'variant' }) < 0) {
      fails.push({ rule: 'R31', detail: `items[] not sorted at positions ${i - 1},${i}` });
      break;
    }
  }
  return fails;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — RISK-BASED AUDIT
// ─────────────────────────────────────────────────────────────────────────────

function computeRiskScore(item) {
  const ec       = item.explanation_correct;
  const ei       = item.explanation_incorrect_common;
  const combined = ec + '\n' + ei;
  const allLines = [...ec.split('\n'), ...ei.split('\n')];
  let score = 0;
  if (allLines.some(l => l.length < 60))                       score += 3;
  if (/\d/.test(combined))                                     score += 2;
  if (/[=×÷+\-*/₡°→]/.test(combined))                         score += 2;
  if (/\b[A-ZÁÉÍÓÚÑ]{2,}\b/.test(combined))                   score += 1;
  if (/\(/.test(combined))                                     score += 1;
  if (TRUNCATED_TAIL_RE.test(combined) || OPEN_PAREN_RE.test(combined)) score += 4;
  if (GENERIC_SUBJECT_RE.test(ec.split('\n')[0] || ''))        score += 4;
  if (INSTRUCTIONAL_RE.test(ec.split('\n')[0] || ''))          score += 3;
  if (allLines.some(l => isPlaceholder(l)))                    score += 5;
  const errContent = (ei.split('\n')[0] || '').replace(new RegExp(`^${INCORRECT_LINE1_PREFIX}\\s*`), '').trim();
  if (errContent.length < 40) score += 3;
  return score;
}

function runAudit(outputFile) {
  const minCount = Math.max(20, Math.ceil(outputFile.items.length * 0.15));
  const scored   = outputFile.items.map(item => ({ item, score: computeRiskScore(item) }));
  scored.sort((a, b) => b.score - a.score);
  const sample   = scored.slice(0, minCount).map(s => s.item);
  const failures = [];

  for (const item of sample) {
    const ec       = item.explanation_correct;
    const ei       = item.explanation_incorrect_common;
    const ecL      = ec.split('\n');
    const eiL      = ei.split('\n');
    const allLines = [...ecL, ...eiL];
    const combined = ec + '\n' + ei;

    if ((ec.match(/\n/g) || []).length !== 1) failures.push({ item_id: item.item_id, check: 'A_R30a', detail: 'EC: not exactly 1 \\n' });
    if (!ecL[0] || !ecL[0].endsWith('.'))     failures.push({ item_id: item.item_id, check: 'A_R30c', detail: 'EC line 1 does not end with "."' });
    if (!ecL[1] || !ecL[1].endsWith('.'))     failures.push({ item_id: item.item_id, check: 'A_R30d', detail: 'EC line 2 does not end with "."' });
    if (!eiL[0] || !eiL[0].startsWith(INCORRECT_LINE1_PREFIX)) failures.push({ item_id: item.item_id, check: 'A_R23', detail: `EI line 1 must start with "${INCORRECT_LINE1_PREFIX}"` });
    if (!eiL[1] || !eiL[1].startsWith(INCORRECT_LINE2_PREFIX)) failures.push({ item_id: item.item_id, check: 'A_R24', detail: `EI line 2 must start with "${INCORRECT_LINE2_PREFIX}"` });
    for (const line of allLines) {
      if (line.length > MAX_LINE_LENGTH) failures.push({ item_id: item.item_id, check: 'A_R22', detail: `Line exceeds ${MAX_LINE_LENGTH} chars (${line.length})` });
    }
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) failures.push({ item_id: item.item_id, check: 'A_R27', detail: `Prohibited substring "${ps}"` });
    }
    for (const line of allLines) {
      const trunc = isTruncated(line);
      if (trunc) failures.push({ item_id: item.item_id, check: 'A_R32', detail: `Truncated (${trunc.reason})` });
    }
    if (GENERIC_SUBJECT_RE.test(ecL[0] || ''))   failures.push({ item_id: item.item_id, check: 'A_R33', detail: 'EC line 1 uses generic subject' });
    if (INSTRUCTIONAL_RE.test(ecL[0] || ''))     failures.push({ item_id: item.item_id, check: 'A_R34', detail: 'EC line 1 uses instructional tone' });
    const errContent = (eiL[0] || '').replace(new RegExp(`^${INCORRECT_LINE1_PREFIX}\\s*`), '').trim();
    if (PURE_NUMERIC_ERROR_RE.test(eiL[0] || '') || SHALLOW_ERROR_RE.test(eiL[0] || '') || errContent.length < 30) {
      failures.push({ item_id: item.item_id, check: 'A_R35', detail: 'Shallow/numeric error description' });
    }
    for (const line of allLines) {
      if (line.length < MIN_LINE_LENGTH) failures.push({ item_id: item.item_id, check: 'A_R36', detail: `Line too short (${line.length})` });
    }
    for (const line of allLines) {
      if (isPlaceholder(line)) failures.push({ item_id: item.item_id, check: 'A_R37', detail: `Placeholder: "${line}"` });
    }
    for (const line of allLines) {
      const stripped = line.replace(/^(Error:|Corrección:|Correction:)\s*/, '').trim();
      if (/^\w+\.$/.test(stripped)) failures.push({ item_id: item.item_id, check: 'A1_SEMANTIC', detail: `Single-word sentence` });
      if (/^\d+\.$/.test(stripped)) failures.push({ item_id: item.item_id, check: 'A1_SEMANTIC', detail: `Bare numeric` });
    }
    for (const line of allLines) {
      if (/,\s*\.$/.test(line))    failures.push({ item_id: item.item_id, check: 'A2_TRUNCATION', detail: 'Line ends with comma before period' });
      if (/[–—]\s*$/.test(line))  failures.push({ item_id: item.item_id, check: 'A2_TRUNCATION', detail: 'Line ends with em-dash' });
    }
    const errContent2 = (eiL[0] || '').replace(new RegExp(`^${INCORRECT_LINE1_PREFIX}\\s*`), '').trim();
    const hasCognitive = /confunde?|invierte?|omite?|ignora?|asume?|interpreta?|generaliz|escala|aplica|compara|ident|selecciona|toma|usa|calcula|divide|multiplica|suma|resta|confusión|inversión|error\s+de|malinterpr/i.test(errContent2);
    if (errContent2.length >= 10 && !hasCognitive) {
      failures.push({ item_id: item.item_id, check: 'A3_ERROR_DEPTH', detail: 'Error line lacks cognitive misconception identifier' });
    }
  }

  return { sampleSize: sample.length, minCount, failures, sampleIds: sample.map(i => i.item_id) };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

console.log('=== DATASET ENGINE — VALIDATION + AUDIT ===');
console.log(`Exam: ${config.exam_id} — ${config.exam_name}`);
console.log(`Input: ${path.basename(explanationsPath)} (${outputFile.items ? outputFile.items.length : '?'} items)\n`);

console.log('[STEP 2 — VALIDATION R01–R37]');
const validationFails = validateFull(outputFile, dataset);

if (validationFails.length > 0) {
  const byRule = {};
  for (const f of validationFails) { if (!byRule[f.rule]) byRule[f.rule] = []; byRule[f.rule].push(f); }
  console.log(`\n  Failures: ${validationFails.length}`);
  for (const [rule, items] of Object.entries(byRule)) {
    console.log(`\n  [${rule}] ${items.length} violation(s):`);
    items.forEach(f => { if (f.item_id) console.log(`    item_id: ${f.item_id}`); console.log(`    detail:  ${f.detail}`); });
  }
  const first = validationFails[0];
  console.log('\n---\nFAIL');
  console.log(`rule: ${first.rule}`);
  if (first.item_id) console.log(`item_id: ${first.item_id}`);
  console.log(`detail: ${first.detail}`);
  process.exit(1);
}
console.log('  All rules R01–R37: PASS');

console.log('\n[STEP 3 — RISK-BASED AUDIT]');
const auditResult = runAudit(outputFile);
console.log(`  Total: ${outputFile.items.length}  Min sample (max(20, ceil(N×0.15))): ${auditResult.minCount}  Actual: ${auditResult.sampleSize}`);
console.log(`  Sampled: ${auditResult.sampleIds.slice(0, 5).join(', ')}${auditResult.sampleIds.length > 5 ? ` ... (${auditResult.sampleIds.length} total)` : ''}`);

if (auditResult.failures.length > 0) {
  const byCheck = {};
  for (const f of auditResult.failures) { if (!byCheck[f.check]) byCheck[f.check] = []; byCheck[f.check].push(f); }
  console.log(`\n  Audit failures: ${auditResult.failures.length}`);
  for (const [check, items] of Object.entries(byCheck)) {
    console.log(`\n  [${check}] ${items.length} failure(s):`);
    items.forEach(f => { console.log(`    item_id: ${f.item_id}`); console.log(`    detail:  ${f.detail}`); });
  }
  const first = auditResult.failures[0];
  console.log('\n---\nAUDIT_FAIL');
  console.log(`item_id: ${first.item_id}`);
  console.log(`reason: ${first.check}`);
  process.exit(1);
}
console.log('  AUDIT_PASS');

console.log('\n---\nPASS\nvalidation: PASS\naudit: AUDIT_PASS');
