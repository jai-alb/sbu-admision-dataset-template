'use strict';
/**
 * F2 VALIDATION + AUDIT — PRODUCTION GRADE
 * Authority: F2_Explanation-System_Spec_v1.md
 *
 * STEP 2 — EXTENDED VALIDATION (R01–R37)
 * STEP 3 — RISK-BASED AUDIT (min(max(20, ceil(N×0.15))) items)
 *
 * Agent: validation and audit hardening — detection only, no modification
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// LOAD FILES
// ─────────────────────────────────────────────────────────────────────────────

const explanationsPath = path.join(__dirname, 'content_dataset_ucr26', 'explanations_v1.json');
const datasetPath      = path.join(__dirname, 'content_dataset_ucr26', 'bank_v1_enriched.json');

let outputFile, dataset;

try {
  outputFile = JSON.parse(fs.readFileSync(explanationsPath, 'utf8'));
} catch (e) {
  console.error('FAIL\nstep: VALIDATION\nrule: LEVEL1_JSON_PARSE\nreason: Cannot parse explanations_v1.json:', e.message);
  process.exit(1);
}

try {
  dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
} catch (e) {
  console.error('FAIL\nstep: VALIDATION\nrule: DATASET_LOAD\nreason: Cannot parse bank_v1_enriched.json:', e.message);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PROHIBITED_SUBSTRINGS = [
  'por ejemplo,', 'cabe destacar', 'es importante', 'podemos ver', 'nótese que',
];

const LINE1_CORRECT_PATTERN = /^[A-ZÁÉÍÓÚÑ][^?!\n]{10,}\.$/;

// R32: sentence-final connectors / truncated endings
// A line ends with a dangling connector/preposition
const TRUNCATED_TAIL_RE   = /\s+(de|a|que|con|sin|por|para|y|o|ni|el|la|los|las|un|una)\\.$/;
// Open parenthesis at end of line (unclosed)
const OPEN_PAREN_RE       = /\([^)]*\.$/;
// Line ends with "→" or "—" or ":" (unfinished)
const DANGLING_SYMBOL_RE  = /[\u2192\u2014:]\s*\.$/;

// R33: forbidden generic subjects in explanation_correct line 1
const GENERIC_SUBJECT_RE  = /^(El\s+estudiante|El\s+usuario|El\s+reactivo|La\s+pregunta)\b/i;

// R34: narrative / instructional tone in explanation_correct line 1
// Detects subject+verb instructional phrasing
const INSTRUCTIONAL_RE    = /\bdebe\b|\bno\s+debe\b|\bhay\s+que\b|\bes\s+necesario\b|\bdeben\b/i;
// Narrative opening (person-centric)
const NARRATIVE_SUBJECT_RE = /^(Para\s+(resolver|calcular|obtener)|Se\s+debe|Primero\s+se|El\s+error\s+es\s+no\s+)/i;

// R35: shallow error description — pure numeric/symbolic result
const PURE_NUMERIC_ERROR_RE = /^Error:\s*[\d\s+\-*/=÷×₡°.()]+\.$/;
// Single short computation without description of misconception type
const SHALLOW_ERROR_RE      = /^Error:\s*[\d÷×+\-=()\s₡°.,]+\.$/;

// R36: minimum line length
const MIN_LINE_LENGTH = 40;

// R37: semantic placeholder patterns (vague one-liners that convey no information)
const PLACEHOLDER_LINES = [
  /^(1\s+operaci[oó]n)\s*\.$/i,
  /^(Relaci[oó]n\s+(directa|expl[ií]cita|lineal|simple))\s*\.$/i,
  /^(Reconocimiento\s+(directo|inmediato|simple))\s*\.$/i,
  /^(Sin\s+variable\s+oculta)\s*\.$/i,
  /^(1\s+paso)\s*\.$/i,
  /^(Patr[oó]n\s+simple)\s*\.$/i,
];

function isPlaceholder(line) {
  const cleaned = line.replace(/^(Error:|Corrección:)\s*/, '').trim();
  return PLACEHOLDER_LINES.some(re => re.test(cleaned));
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: CHECK TRUNCATION
// ─────────────────────────────────────────────────────────────────────────────

function isTruncated(line) {
  // 1. Ends with dangling preposition/connector followed by period
  if (TRUNCATED_TAIL_RE.test(line)) return { reason: 'trailing connector before period' };
  // 2. Has unclosed parenthesis at end — pattern: "...(text."
  if (OPEN_PAREN_RE.test(line)) return { reason: 'unclosed parenthesis at end of line' };
  // 3. Dangling symbol (arrow, dash, colon) before period
  if (DANGLING_SYMBOL_RE.test(line)) return { reason: 'dangling symbol before period' };
  // 4. Line ends with "error:." or similar
  if (/[:(,]\s*\.$/.test(line)) return { reason: 'line ends after structural marker (implies continuation)' };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — FULL VALIDATION (R01–R37)
// ─────────────────────────────────────────────────────────────────────────────

function validateFull(outputFile, dataset) {
  const fails = [];

  // ── LEVEL 1: JSON Parse (already done) ──────────────────────────────────────
  // If we reach here, JSON is valid.

  // ── LEVEL 2: Structural ─────────────────────────────────────────────────────

  // R01: Root must have exactly 2 keys
  const rootKeys = Object.keys(outputFile);
  if (rootKeys.length !== 2 || !rootKeys.includes('version') || !rootKeys.includes('items')) {
    fails.push({ rule: 'R01', detail: `Root must have exactly 2 keys: "version" and "items". Found: ${rootKeys.join(', ')}` });
  }

  // R02: version = "v1"
  if (outputFile.version !== 'v1') {
    fails.push({ rule: 'R02', detail: `version must be exactly "v1", got: "${outputFile.version}"` });
  }

  // R03: items is array
  if (!Array.isArray(outputFile.items)) {
    fails.push({ rule: 'R03', detail: '"items" must be an array' });
    return fails;
  }

  // R04: items not empty
  if (outputFile.items.length === 0) {
    fails.push({ rule: 'R04', detail: '"items" must not be empty' });
    return fails;
  }

  const seenIds = new Set();

  for (const item of outputFile.items) {
    const iid = item.item_id || '(missing)';

    // R05: exactly 3 keys per item
    const itemKeys = Object.keys(item);
    if (itemKeys.length !== 3) {
      fails.push({ rule: 'R05', item_id: iid, detail: `Item must have exactly 3 keys, found ${itemKeys.length}: ${itemKeys.join(', ')}` });
    }

    const required = ['item_id', 'explanation_correct', 'explanation_incorrect_common'];
    for (const k of required) {
      if (!itemKeys.includes(k)) {
        fails.push({ rule: 'R05', item_id: iid, detail: `Missing required key "${k}"` });
      }
    }

    // R06: no extra keys
    for (const k of itemKeys) {
      if (!required.includes(k)) {
        fails.push({ rule: 'R06', item_id: iid, detail: `Extra key "${k}" not allowed` });
      }
    }

    // R07–R10: field types and non-null
    if (!item.item_id || typeof item.item_id !== 'string') {
      fails.push({ rule: 'R07', item_id: iid, detail: 'item_id must be non-empty string' });
    }
    if (!item.explanation_correct || typeof item.explanation_correct !== 'string') {
      fails.push({ rule: 'R08', item_id: iid, detail: 'explanation_correct must be non-empty string' });
    }
    if (!item.explanation_incorrect_common || typeof item.explanation_incorrect_common !== 'string') {
      fails.push({ rule: 'R09', item_id: iid, detail: 'explanation_incorrect_common must be non-empty string' });
    }
    if (item.item_id === null || item.explanation_correct === null || item.explanation_incorrect_common === null) {
      fails.push({ rule: 'R10', item_id: iid, detail: 'No null values allowed' });
    }

    // R11: no duplicate item_ids
    if (seenIds.has(item.item_id)) {
      fails.push({ rule: 'R11', item_id: iid, detail: `Duplicate item_id "${item.item_id}"` });
    }
    seenIds.add(item.item_id);
  }

  // R12: JSON strictly valid (already enforced by JSON.parse)

  if (fails.length > 0) return fails; // Structural failure blocks Level 3

  // ── LEVEL 3: Integrity ──────────────────────────────────────────────────────

  const trainingItems = dataset.segments.training || [];
  const trainingIds   = new Set(trainingItems.map(i => i.item_id));
  const diagnosticIds = new Set((dataset.segments.diagnostic || []).map(i => i.item_id));
  const sim1Ids       = new Set(((dataset.segments.simulation || {}).sim_1 || []).map(i => i.item_id));
  const sim2Ids       = new Set(((dataset.segments.simulation || {}).sim_2 || []).map(i => i.item_id));

  for (const item of outputFile.items) {
    // R14: item_id must exist in segments.training[]
    if (!trainingIds.has(item.item_id)) {
      fails.push({ rule: 'R14', item_id: item.item_id, detail: `item_id not found in segments.training[]` });
    }
    // R18–R20: must not belong to other segments
    if (diagnosticIds.has(item.item_id)) {
      fails.push({ rule: 'R18', item_id: item.item_id, detail: `item_id belongs to segments.diagnostic[]` });
    }
    if (sim1Ids.has(item.item_id)) {
      fails.push({ rule: 'R19', item_id: item.item_id, detail: `item_id belongs to segments.simulation.sim_1[]` });
    }
    if (sim2Ids.has(item.item_id)) {
      fails.push({ rule: 'R20', item_id: item.item_id, detail: `item_id belongs to segments.simulation.sim_2[]` });
    }
  }

  // R15: every training item_id must be covered
  for (const tid of trainingIds) {
    if (!seenIds.has(tid)) {
      fails.push({ rule: 'R15', item_id: tid, detail: `training item_id "${tid}" missing from explanations` });
    }
  }

  // R16: count must match
  if (outputFile.items.length !== trainingItems.length) {
    fails.push({ rule: 'R16', detail: `count mismatch: ${outputFile.items.length} explanations vs ${trainingItems.length} training items` });
  }

  if (fails.length > 0) return fails; // Integrity failure blocks Level 4

  // ── LEVEL 4: Content + Extended Rules R22–R37 ──────────────────────────────

  for (const item of outputFile.items) {
    const ec  = item.explanation_correct;
    const ei  = item.explanation_incorrect_common;
    const ecL = ec.split('\n');
    const eiL = ei.split('\n');
    const allLines = [...ecL, ...eiL];

    // R30a/b: exactly 1 \n per field
    if ((ec.match(/\n/g) || []).length !== 1) {
      fails.push({ rule: 'R30a', item_id: item.item_id, detail: 'explanation_correct must contain exactly 1 \\n' });
    }
    if ((ei.match(/\n/g) || []).length !== 1) {
      fails.push({ rule: 'R30b', item_id: item.item_id, detail: 'explanation_incorrect_common must contain exactly 1 \\n' });
    }

    // R22: each line ≤ 120 chars
    for (const line of allLines) {
      if (line.length > 120) {
        fails.push({ rule: 'R22', item_id: item.item_id, detail: `Line exceeds 120 chars (${line.length}): "${line.substring(0,60)}..."` });
      }
    }

    // R23: EI line 1 starts with "Error:"
    if (!eiL[0] || !eiL[0].startsWith('Error:')) {
      fails.push({ rule: 'R23', item_id: item.item_id, detail: `explanation_incorrect_common line 1 must start with "Error:", got: "${(eiL[0]||'').substring(0,50)}"` });
    }

    // R24: EI line 2 starts with "Corrección:"
    if (!eiL[1] || !eiL[1].startsWith('Corrección:')) {
      fails.push({ rule: 'R24', item_id: item.item_id, detail: `explanation_incorrect_common line 2 must start with "Corrección:", got: "${(eiL[1]||'').substring(0,50)}"` });
    }

    // R25: EC line 1 matches pattern
    if (!LINE1_CORRECT_PATTERN.test(ecL[0])) {
      fails.push({ rule: 'R25', item_id: item.item_id, detail: `explanation_correct line 1 does not match /^[A-ZÁÉÍÓÚÑ][^?!]{10,}\\.$/: "${(ecL[0]||'').substring(0,80)}"` });
    }

    // R26: no ellipsis at end of any line
    for (const line of allLines) {
      if (/[…]$/.test(line) || /\.{3,}$/.test(line)) {
        fails.push({ rule: 'R26', item_id: item.item_id, detail: `Ellipsis at end of line: "${line.substring(0,80)}"` });
      }
    }

    // R27: prohibited substrings
    const combined = ec + '\n' + ei;
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) {
        fails.push({ rule: 'R27', item_id: item.item_id, detail: `Prohibited substring "${ps}" found` });
      }
    }

    // R28: no "?" in any field
    if (combined.includes('?')) {
      fails.push({ rule: 'R28', item_id: item.item_id, detail: 'Prohibited "?" character found' });
    }

    // R29: no HTML tags or markdown formatting
    if (/\*\*|__|<[a-zA-Z/]|[a-zA-Z]>/.test(combined)) {
      fails.push({ rule: 'R29', item_id: item.item_id, detail: 'HTML tag or markdown bold/italic syntax detected' });
    }

    // R30c/d: EC lines end with "."
    if (!ecL[0] || !ecL[0].endsWith('.')) {
      fails.push({ rule: 'R30c', item_id: item.item_id, detail: `explanation_correct line 1 must end with ".", got: "${(ecL[0]||'').substring(0,80)}"` });
    }
    if (!ecL[1] || !ecL[1].endsWith('.')) {
      fails.push({ rule: 'R30d', item_id: item.item_id, detail: `explanation_correct line 2 must end with ".", got: "${(ecL[1]||'').substring(0,80)}"` });
    }

    // R31: sort order (checked after loop)

    // ── NEW RULES ───────────────────────────────────────────────────────────

    // R32: no truncated sentences (trailing connectors, open parens, dangling symbols)
    for (const line of allLines) {
      const trunc = isTruncated(line);
      if (trunc) {
        fails.push({ rule: 'R32', item_id: item.item_id, detail: `Truncated line (${trunc.reason}): "${line.substring(0,100)}"` });
      }
    }

    // R33: no generic subjects in EC line 1
    if (GENERIC_SUBJECT_RE.test(ecL[0] || '')) {
      fails.push({ rule: 'R33', item_id: item.item_id, detail: `EC line 1 uses forbidden generic subject: "${(ecL[0]||'').substring(0,80)}"` });
    }

    // R34: no instructional/narrative tone in EC line 1
    if (INSTRUCTIONAL_RE.test(ecL[0] || '')) {
      fails.push({ rule: 'R34', item_id: item.item_id, detail: `EC line 1 uses instructional tone (must be rule-based, impersonal): "${(ecL[0]||'').substring(0,80)}"` });
    }
    if (NARRATIVE_SUBJECT_RE.test(ecL[0] || '')) {
      fails.push({ rule: 'R34', item_id: item.item_id, detail: `EC line 1 uses narrative opening: "${(ecL[0]||'').substring(0,80)}"` });
    }

    // R35: error description must describe the type of error, not just the numeric result
    const errContent = (eiL[0] || '').replace(/^Error:\s*/, '').trim();
    if (PURE_NUMERIC_ERROR_RE.test(eiL[0] || '') || SHALLOW_ERROR_RE.test(eiL[0] || '')) {
      fails.push({ rule: 'R35', item_id: item.item_id, detail: `Error line describes only a numeric result, not the error type: "${(eiL[0]||'').substring(0,80)}"` });
    }
    // Also catch very short error descriptions that lack cognitive description
    if (errContent.length < 30 && errContent.length > 0) {
      fails.push({ rule: 'R35', item_id: item.item_id, detail: `Error description too brief (${errContent.length} chars) to identify misconception type: "${(eiL[0]||'').substring(0,80)}"` });
    }

    // R36: minimum line length ≥ 40 chars
    for (const line of allLines) {
      if (line.length < MIN_LINE_LENGTH) {
        fails.push({ rule: 'R36', item_id: item.item_id, detail: `Line too short (${line.length} chars, min ${MIN_LINE_LENGTH}): "${line}"` });
      }
    }

    // R37: no semantic placeholder lines
    for (const line of allLines) {
      if (isPlaceholder(line)) {
        fails.push({ rule: 'R37', item_id: item.item_id, detail: `Semantic placeholder detected: "${line}"` });
      }
    }
  }

  // R31: items sorted ascending by item_id (lexicographic, case-sensitive)
  const ids = outputFile.items.map(i => i.item_id);
  for (let i = 1; i < ids.length; i++) {
    if (ids[i].localeCompare(ids[i-1], 'en', { sensitivity: 'variant' }) < 0) {
      fails.push({ rule: 'R31', detail: `items[] not sorted: "${ids[i-1]}" > "${ids[i]}" at positions ${i-1},${i}` });
      break;
    }
  }

  return fails;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — RISK-BASED AUDIT
// ─────────────────────────────────────────────────────────────────────────────

function computeRiskScore(item) {
  const ec  = item.explanation_correct;
  const ei  = item.explanation_incorrect_common;
  const combined = ec + '\n' + ei;
  const allLines = [...ec.split('\n'), ...ei.split('\n')];

  let score = 0;

  // Risk factor 1: short lines (< 60 chars)
  if (allLines.some(l => l.length < 60)) score += 3;

  // Risk factor 2: contains numbers
  if (/\d/.test(combined)) score += 2;

  // Risk factor 3: contains math symbols
  if (/[=×÷+\-*/₡°→]/.test(combined)) score += 2;

  // Risk factor 4: uppercase emphasis (ALL-CAPS word)
  if (/\b[A-ZÁÉÍÓÚÑ]{2,}\b/.test(combined)) score += 1;

  // Risk factor 5: contains parentheses
  if (/\(/.test(combined)) score += 1;

  // Risk factor 6: previously failed patterns (heuristic)
  // Potential truncation
  if (TRUNCATED_TAIL_RE.test(combined) || OPEN_PAREN_RE.test(combined)) score += 4;
  // Generic subjects
  if (GENERIC_SUBJECT_RE.test(ec.split('\n')[0] || '')) score += 4;
  // Instructional tone
  if (INSTRUCTIONAL_RE.test(ec.split('\n')[0] || '')) score += 3;
  // Placeholder content
  if (allLines.some(l => isPlaceholder(l))) score += 5;
  // Short error description
  const errContent = (ei.split('\n')[0] || '').replace(/^Error:\s*/, '').trim();
  if (errContent.length < 40) score += 3;

  return score;
}

function selectAuditSample(items) {
  const total     = items.length;
  const minCount  = Math.max(20, Math.ceil(total * 0.15));

  // Score all items and sort by descending risk
  const scored = items.map(item => ({ item, score: computeRiskScore(item) }));
  scored.sort((a, b) => b.score - a.score);

  // Take top minCount — highest risk items first
  const sample = scored.slice(0, minCount).map(s => s.item);
  return { sample, minCount };
}

function runAudit(outputFile) {
  const total       = outputFile.items.length;
  const { sample, minCount } = selectAuditSample(outputFile.items);

  const failures = [];

  for (const item of sample) {
    const ec  = item.explanation_correct;
    const ei  = item.explanation_incorrect_common;
    const ecL = ec.split('\n');
    const eiL = ei.split('\n');
    const allLines = [...ecL, ...eiL];

    // ── All rules R01–R37 applied per item ──────────────────────────────────

    // Structural basics
    if ((ec.match(/\n/g) || []).length !== 1) {
      failures.push({ item_id: item.item_id, check: 'A_R30a', detail: 'explanation_correct: not exactly 1 \\n' });
    }
    if ((ei.match(/\n/g) || []).length !== 1) {
      failures.push({ item_id: item.item_id, check: 'A_R30b', detail: 'explanation_incorrect_common: not exactly 1 \\n' });
    }

    // EC line endings
    if (!ecL[0] || !ecL[0].endsWith('.')) {
      failures.push({ item_id: item.item_id, check: 'A_R30c', detail: `EC line 1 does not end with ".": "${(ecL[0]||'').substring(0,80)}"` });
    }
    if (!ecL[1] || !ecL[1].endsWith('.')) {
      failures.push({ item_id: item.item_id, check: 'A_R30d', detail: `EC line 2 does not end with ".": "${(ecL[1]||'').substring(0,80)}"` });
    }

    // EI prefixes
    if (!eiL[0] || !eiL[0].startsWith('Error:')) {
      failures.push({ item_id: item.item_id, check: 'A_R23', detail: `EI line 1 must start with "Error:": "${(eiL[0]||'').substring(0,80)}"` });
    }
    if (!eiL[1] || !eiL[1].startsWith('Corrección:')) {
      failures.push({ item_id: item.item_id, check: 'A_R24', detail: `EI line 2 must start with "Corrección:": "${(eiL[1]||'').substring(0,80)}"` });
    }

    // Line length bounds
    for (const line of allLines) {
      if (line.length > 120) {
        failures.push({ item_id: item.item_id, check: 'A_R22', detail: `Line exceeds 120 chars (${line.length}): "${line.substring(0,60)}..."` });
      }
    }

    // Prohibited substrings
    const combined = ec + '\n' + ei;
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) {
        failures.push({ item_id: item.item_id, check: 'A_R27', detail: `Prohibited substring "${ps}"` });
      }
    }

    // R32: truncation check
    for (const line of allLines) {
      const trunc = isTruncated(line);
      if (trunc) {
        failures.push({ item_id: item.item_id, check: 'A_R32', detail: `Truncated line (${trunc.reason}): "${line.substring(0,100)}"` });
      }
    }

    // R33: generic subject
    if (GENERIC_SUBJECT_RE.test(ecL[0] || '')) {
      failures.push({ item_id: item.item_id, check: 'A_R33', detail: `EC line 1 uses generic subject: "${(ecL[0]||'').substring(0,80)}"` });
    }

    // R34: instructional/narrative tone
    if (INSTRUCTIONAL_RE.test(ecL[0] || '')) {
      failures.push({ item_id: item.item_id, check: 'A_R34', detail: `EC line 1 uses instructional tone: "${(ecL[0]||'').substring(0,80)}"` });
    }

    // R35: error quality
    const errContent = (eiL[0] || '').replace(/^Error:\s*/, '').trim();
    if (PURE_NUMERIC_ERROR_RE.test(eiL[0] || '') || SHALLOW_ERROR_RE.test(eiL[0] || '') || errContent.length < 30) {
      failures.push({ item_id: item.item_id, check: 'A_R35', detail: `Shallow/numeric error description: "${(eiL[0]||'').substring(0,80)}"` });
    }

    // R36: minimum line length
    for (const line of allLines) {
      if (line.length < MIN_LINE_LENGTH) {
        failures.push({ item_id: item.item_id, check: 'A_R36', detail: `Line too short (${line.length} chars): "${line}"` });
      }
    }

    // R37: placeholder
    for (const line of allLines) {
      if (isPlaceholder(line)) {
        failures.push({ item_id: item.item_id, check: 'A_R37', detail: `Placeholder line: "${line}"` });
      }
    }

    // A1: Semantic completeness (standalone sentence check)
    // Detect sentences that don't parse as complete thoughts
    for (const line of allLines) {
      const stripped = line.replace(/^(Error:|Corrección:)\s*/, '').trim();
      // Single word before period = not complete
      if (/^\w+\.$/.test(stripped)) {
        failures.push({ item_id: item.item_id, check: 'A1_SEMANTIC_COMPLETENESS', detail: `Single-word sentence detected: "${line}"` });
      }
      // Sentence that starts with a number then period = not a sentence
      if (/^\d+\.$/.test(stripped)) {
        failures.push({ item_id: item.item_id, check: 'A1_SEMANTIC_COMPLETENESS', detail: `Bare numeric sentence: "${line}"` });
      }
    }

    // A2: No truncation mid-phrase (R32 re-check with additional pattern)
    for (const line of allLines) {
      // Ends with comma then period — sentence cut before completing
      if (/,\s*\.$/.test(line)) {
        failures.push({ item_id: item.item_id, check: 'A2_NO_TRUNCATION', detail: `Line ends with comma before period (mid-phrase): "${line.substring(0,100)}"` });
      }
      // Ends with "–" or "—" (em-dash at end)
      if (/[\u2013\u2014]\s*$/.test(line)) {
        failures.push({ item_id: item.item_id, check: 'A2_NO_TRUNCATION', detail: `Line ends with em-dash (truncated): "${line.substring(0,100)}"` });
      }
    }

    // A3: Error explanation depth — must identify a cognitive misconception
    // Detect if error line merely states an operation rather than naming a misconception type
    const errLine = (eiL[0] || '').replace(/^Error:\s*/, '').trim();
    // If error line is purely a computation without any cognitive verb or noun
    const hasCognitiveTerm = /confunde?|invierte?|omite?|ignora?|asume?|interpreta?|generaliz|escala|aplica|compara|ident|selecciona|toma|usa|calcula|divide|multiplica|suma|resta|confusión|inversión|error\s+de|malinterpr/i.test(errLine);
    if (errLine.length >= 10 && !hasCognitiveTerm) {
      failures.push({ item_id: item.item_id, check: 'A3_ERROR_DEPTH', detail: `Error line lacks cognitive misconception identifier: "${(eiL[0]||'').substring(0,80)}"` });
    }
  }

  return { sampleSize: sample.length, minCount, failures, sampleIds: sample.map(i => i.item_id) };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

console.log('=== F2 VALIDATION + AUDIT — PRODUCTION GRADE ===\n');
console.log(`Input: explanations_v1.json (${outputFile.items ? outputFile.items.length : '?'} items)`);

// ── STEP 2: FULL VALIDATION ─────────────────────────────────────────────────

console.log('\n[STEP 2 — VALIDATION R01–R37]');

const validationFails = validateFull(outputFile, dataset);

if (validationFails.length > 0) {
  // Group by rule
  const byRule = {};
  for (const f of validationFails) {
    if (!byRule[f.rule]) byRule[f.rule] = [];
    byRule[f.rule].push(f);
  }

  console.log(`\n  Failures found: ${validationFails.length}`);
  for (const [rule, items] of Object.entries(byRule)) {
    console.log(`\n  [${rule}] ${items.length} violation(s):`);
    items.forEach(f => {
      if (f.item_id) {
        console.log(`    item_id: ${f.item_id}`);
      }
      console.log(`    detail:  ${f.detail}`);
    });
  }

  console.log('\n---');
  console.log('FAIL');
  console.log(`step: VALIDATION`);
  const first = validationFails[0];
  console.log(`rule: ${first.rule}`);
  if (first.item_id) console.log(`item_id: ${first.item_id}`);
  console.log(`detail: ${first.detail}`);
  process.exit(1);
}

console.log('  All rules R01–R37: PASS');

// ── STEP 3: RISK-BASED AUDIT ────────────────────────────────────────────────

console.log('\n[STEP 3 — RISK-BASED AUDIT]');

const auditResult = runAudit(outputFile);

console.log(`  Total items: ${outputFile.items.length}`);
console.log(`  Min sample (max(20, ceil(${outputFile.items.length}×0.15))): ${auditResult.minCount}`);
console.log(`  Actual sample (highest-risk): ${auditResult.sampleSize} items`);
console.log(`  Sampled item_ids: ${auditResult.sampleIds.slice(0, 5).join(', ')}${auditResult.sampleIds.length > 5 ? ` ... (${auditResult.sampleIds.length} total)` : ''}`);

if (auditResult.failures.length > 0) {
  // Group by check
  const byCheck = {};
  for (const f of auditResult.failures) {
    if (!byCheck[f.check]) byCheck[f.check] = [];
    byCheck[f.check].push(f);
  }

  console.log(`\n  Audit failures: ${auditResult.failures.length}`);
  for (const [check, items] of Object.entries(byCheck)) {
    console.log(`\n  [${check}] ${items.length} failure(s):`);
    items.forEach(f => {
      console.log(`    item_id: ${f.item_id}`);
      console.log(`    detail:  ${f.detail}`);
    });
  }

  console.log('\n---');
  console.log('AUDIT_FAIL');
  const first = auditResult.failures[0];
  console.log(`item_id: ${first.item_id}`);
  console.log(`reason: ${first.check}`);
  process.exit(1);
}

console.log('  AUDIT_PASS');

// ── FINAL OUTPUT ─────────────────────────────────────────────────────────────

console.log('\n---');
console.log('PASS');
console.log('validation: PASS');
console.log('audit: AUDIT_PASS');
