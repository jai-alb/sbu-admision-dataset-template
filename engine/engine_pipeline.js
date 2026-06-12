'use strict';
/**
 * Dataset Engine — Full Pipeline
 *
 * STEP 1 — GENERATION  (all segments.training[], sorted ascending by item_id)
 * STEP 2 — VALIDATION  (R01–R31 from spec)
 * STEP 3 — AUDIT       (ceil(N × 0.10) first items)
 * STEP 4 — APPROVAL
 *
 * Usage:
 *   node engine/engine_pipeline.js --exam <path/to/exam_config.json> [--mode manual|auto] [--dry-run] [--batches N]
 *
 * --exam      Required. Path to the exam_config.json for the exam to process.
 * --mode      Optional. 'manual' (default) writes prompts to file. 'auto' calls the Anthropic API directly.
 * --dry-run   Optional. Runs generation and validation but does not write the output file.
 * --batches N Optional (auto mode). Process only the first N batches.
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CLI ARGUMENT PARSING
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { exam: null, mode: 'manual', dryRun: false, batches: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--exam'    && argv[i + 1]) { args.exam    = argv[++i]; continue; }
    if (argv[i] === '--mode'    && argv[i + 1]) { args.mode    = argv[++i]; continue; }
    if (argv[i] === '--dry-run')                 { args.dryRun  = true;      continue; }
    if (argv[i] === '--batches' && argv[i + 1]) { args.batches = parseInt(argv[++i], 10); continue; }
  }
  return args;
}

const args = parseArgs(process.argv);

if (!args.exam) {
  console.error('ERROR: --exam <path/to/exam_config.json> is required.');
  console.error('Usage: node engine/engine_pipeline.js --exam exams/ucr26/exam_config.json');
  process.exit(2);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD EXAM CONFIG
// ─────────────────────────────────────────────────────────────────────────────

let config;
try {
  config = JSON.parse(fs.readFileSync(args.exam, 'utf8'));
} catch (e) {
  console.error(`ERROR: Cannot load exam config at "${args.exam}": ${e.message}`);
  process.exit(2);
}

const examDir    = path.dirname(path.resolve(args.exam));
const datasetPath = path.join(examDir, '03_item_production', config.output.dataset_filename || 'dataset_v1.json');
const outputPath  = path.join(examDir, '04_validation',      config.output.explanations_filename || 'explanations_v1.json');
const promptsDir  = path.join(examDir, '03_item_production', 'PROMPTS');

const PROHIBITED_SUBSTRINGS  = config.explanation_rules.prohibited_substrings || [];
const FORBIDDEN_WORDS        = config.explanation_rules.forbidden_words        || [];
const FORBIDDEN_REPLACEMENTS = config.explanation_rules.forbidden_replacements || {};
const LINE1_CORRECT_PATTERN  = new RegExp(config.explanation_rules.correct_line1_pattern);
const INCORRECT_LINE1_PREFIX = config.explanation_rules.incorrect_line1_prefix  || 'Error:';
const INCORRECT_LINE2_PREFIX = config.explanation_rules.incorrect_line2_prefix  || 'Correction:';
const MAX_LINE_LENGTH        = config.explanation_rules.max_line_length          || 120;
const FALLBACKS              = config.explanation_fallbacks                      || {};

const DEFAULT_SKILL = Object.keys(FALLBACKS).find(k => {
  const s = config.skill_taxonomy[k];
  return s && s.type !== 'cognitive_load';
}) || Object.keys(FALLBACKS)[0] || null;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function ensurePeriod(text) {
  const t = text.trim().replace(/[.!?…]+$/, '');
  return t + '.';
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function truncateLine(text, max) {
  if (text.length <= max) return text;
  const cutIdx = text.lastIndexOf(' ', max - 2);
  const cut    = cutIdx > 20 ? cutIdx : max - 1;
  return ensurePeriod(text.substring(0, cut).trim());
}

function removeAnswerLabels(text) {
  let t = text.replace(/\b[A-D]\s*\([^)]{0,40}\)\s*[:–—]\s*/g, ' ');
  t = t.replace(/\(\s*[A-D]\s*\)/g, ' ');
  t = t.replace(/[Oo]pci[oó]n\s*[A-D]\s*[:)]\s*/g, ' ');
  t = t.replace(/[Dd]istractor\s+[A-D]\s*[:)]\s*/g, ' ');
  t = t.replace(/^\s*[A-D]\s*:\s*/g, '');
  t = t.replace(/[Ll]a\s+(?:respuesta|opci[oó]n)\s+correcta\s+\([A-D]\)\s*/g, '');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function removeAnswerPhrases(text) {
  let t = text;
  t = t.replace(/[Ll]a\s+opci[oó]n\s+correcta\s+es\b\s*/g, '');
  t = t.replace(/[Ll]a\s+respuesta\s+correcta\s+es\b\s*/g, '');
  t = t.replace(/(?<!\p{L})[A-D](?!\p{L})/gu, ' ');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function removeStepMarkers(text) {
  return text
    .replace(/^\d+\s+[^.\n]{1,60}?:\s*/i, '')
    .replace(/^\d+\s*paso[s]?\s*[:]\s*/i, '')
    .replace(/^paso\s*\d+\s*[:]\s*/i, '')
    .trim();
}

function sanitizeMathOperators(text) {
  let t = text;
  t = t.replace(/\s*>\s*/g, ' mayor que ');
  t = t.replace(/\s*<\s*/g, ' menor que ');
  t = t.replace(/[<>]/g, '');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function replaceForbiddenWords(text) {
  let t = text;
  for (const [word, replacement] of Object.entries(FORBIDDEN_REPLACEMENTS)) {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    t = t.replace(re, (match) => {
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return t;
}

function removeContextualAnchors(text) {
  let t = text;
  t = t.replace(/\ben este caso\b/gi, '');
  t = t.replace(/\baquí\b/gi, '');
  t = t.replace(/\baqui\b/gi, '');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function cleanText(text) {
  let t = removeStepMarkers(text);
  t = sanitizeMathOperators(t);
  t = removeAnswerLabels(t);
  t = replaceForbiddenWords(t);
  t = removeContextualAnchors(t);
  return t.replace(/\s{2,}/g, ' ').trim();
}

function cleanTextForCorrect(text) {
  let t = cleanText(text);
  t = removeAnswerPhrases(t);
  return t.replace(/\s{2,}/g, ' ').trim();
}

function hasAnswerLabelReference(text) {
  if (/[Ll]a\s+opci[oó]n\s+correcta\s+es/i.test(text)) return true;
  if (/[Ll]a\s+respuesta\s+correcta\s+es/i.test(text)) return true;
  if (/(?<!\p{L})[A-D](?!\p{L})/u.test(text)) return true;
  return false;
}

function getFallback(skill, field) {
  const entry = FALLBACKS[skill] || FALLBACKS[DEFAULT_SKILL] || {};
  return entry[field] || '';
}

function getPasoCritico(justification) {
  if (typeof justification === 'object' && justification !== null) {
    return (justification.paso_critico || justification.pas_critico || '').trim();
  }
  return '';
}

function getErrorTipico(justification) {
  if (typeof justification === 'object' && justification !== null) {
    return (justification.error_tipico || '').trim();
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — GENERATION CORE
// ─────────────────────────────────────────────────────────────────────────────

function generateExplanationCorrect(item) {
  const skill = item.metadata.skill;
  const just  = item.content.justification;
  const pc    = getPasoCritico(just);

  let line1, line2;

  if (pc && pc.length >= 10) {
    const cleaned   = cleanTextForCorrect(pc);
    const sentences = cleaned.split('.').map(s => s.trim()).filter(s => s.length >= 10);
    let rawLine1    = sentences[0] || cleaned;

    if (hasAnswerLabelReference(rawLine1) || rawLine1.length < 10) {
      rawLine1 = sentences.find(s => !hasAnswerLabelReference(s) && s.length >= 10)
                 || getFallback(skill, 'correct_line1');
    }

    line1 = ensurePeriod(truncateLine(capitalizeFirst(rawLine1), MAX_LINE_LENGTH - 1));

    const cleanSentences = sentences.filter(s => !hasAnswerLabelReference(s) && s.length >= 8);
    const secondSentence = cleanSentences.length >= 2 ? cleanSentences[1]
                         : (cleanSentences[0] && cleanSentences[0] !== rawLine1 ? cleanSentences[0] : null);
    line2 = secondSentence
      ? ensurePeriod(truncateLine(capitalizeFirst(secondSentence), MAX_LINE_LENGTH - 1))
      : getFallback(skill, 'correct_line2');
  } else {
    line1 = getFallback(skill, 'correct_line1');
    line2 = getFallback(skill, 'correct_line2');
  }

  line1 = ensurePeriod(truncateLine(replaceForbiddenWords(removeContextualAnchors(line1)).trim(), MAX_LINE_LENGTH - 1));
  line2 = ensurePeriod(truncateLine(replaceForbiddenWords(removeContextualAnchors(line2)).trim(), MAX_LINE_LENGTH - 1));

  return `${line1}\n${line2}`;
}

function generateExplanationIncorrect(item) {
  const skill = item.metadata.skill;
  const just  = item.content.justification;
  const et    = getErrorTipico(just);
  const pc    = getPasoCritico(just);

  const l1max = MAX_LINE_LENGTH - INCORRECT_LINE1_PREFIX.length - 1;
  const l2max = MAX_LINE_LENGTH - INCORRECT_LINE2_PREFIX.length - 1;

  let errorText, corrText;

  if (et && et.length >= 10) {
    const parts = removeAnswerLabels(et).split('.').map(s => s.trim()).filter(s => s.length >= 8);
    errorText = capitalizeFirst(ensurePeriod(truncateLine(cleanText(parts[0] || et.substring(0, 100)), l1max)));
  } else {
    errorText = capitalizeFirst(ensurePeriod(getFallback(skill, 'error')));
  }

  if (pc && pc.length >= 10) {
    const sentences = cleanText(pc).split('.').map(s => s.trim()).filter(s => s.length >= 8);
    corrText = capitalizeFirst(ensurePeriod(truncateLine(sentences[0] || pc.substring(0, 100), l2max)));
  } else {
    corrText = capitalizeFirst(ensurePeriod(getFallback(skill, 'correction')));
  }

  errorText = ensurePeriod(truncateLine(replaceForbiddenWords(removeContextualAnchors(errorText)).trim(), l1max));
  corrText  = ensurePeriod(truncateLine(replaceForbiddenWords(removeContextualAnchors(corrText)).trim(),  l2max));

  return `${INCORRECT_LINE1_PREFIX} ${errorText}\n${INCORRECT_LINE2_PREFIX} ${corrText}`;
}

function checkPreOutput(item_id, ec, ei) {
  const errors  = [];
  const ecLines = ec.split('\n');
  const eiLines = ei.split('\n');

  if (!ei.includes(INCORRECT_LINE2_PREFIX)) {
    errors.push({ item_id, rule: 'pre_correction_prefix', detail: `Missing "${INCORRECT_LINE2_PREFIX}"` });
  }
  if (hasAnswerLabelReference(ecLines[0] || '')) {
    errors.push({ item_id, rule: 'pre_answer_label', detail: 'explanation_correct contains answer label reference' });
  }
  const combined = ec + '\n' + ei;
  for (const fw of FORBIDDEN_WORDS) {
    if (new RegExp(`\\b${fw}\\b`, 'i').test(combined)) {
      errors.push({ item_id, rule: 'pre_forbidden_word', detail: `Forbidden word "${fw}" found` });
    }
  }
  if (!eiLines[1] || !eiLines[1].startsWith(INCORRECT_LINE2_PREFIX)) {
    errors.push({ item_id, rule: 'pre_line2_prefix', detail: `EI line 2 must start with "${INCORRECT_LINE2_PREFIX}"` });
  }
  if ((ec.match(/\n/g) || []).length !== 1) errors.push({ item_id, rule: 'pre_line_count_ec', detail: 'EC must have exactly 1 \\n' });
  if ((ei.match(/\n/g) || []).length !== 1) errors.push({ item_id, rule: 'pre_line_count_ei', detail: 'EI must have exactly 1 \\n' });
  for (const line of [...ecLines, ...eiLines]) {
    if (line && !line.endsWith('.')) errors.push({ item_id, rule: 'pre_period', detail: `Line must end with ".": "${line.substring(0, 60)}"` });
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateOutput(outputFile, dataset) {
  const fails    = [];
  const required = ['item_id', 'explanation_correct', 'explanation_incorrect_common'];
  const rootKeys = Object.keys(outputFile);

  if (rootKeys.length !== 2 || !rootKeys.includes('version') || !rootKeys.includes('items')) {
    fails.push({ rule: 'R01', detail: 'Root must have exactly 2 keys: "version" and "items"' });
  }
  if (outputFile.version !== 'v1') {
    fails.push({ rule: 'R02', detail: `version must be "v1", got "${outputFile.version}"` });
  }
  if (!Array.isArray(outputFile.items)) { fails.push({ rule: 'R03', detail: '"items" must be an array' }); return fails; }
  if (outputFile.items.length === 0)    { fails.push({ rule: 'R04', detail: '"items" must not be empty' }); return fails; }

  const seenIds = new Set();
  for (const item of outputFile.items) {
    const iid      = item.item_id || '(missing)';
    const itemKeys = Object.keys(item);
    if (itemKeys.length !== 3) fails.push({ rule: 'R05', item_id: iid, detail: `Item must have exactly 3 keys, found ${itemKeys.length}` });
    for (const k of required) { if (!itemKeys.includes(k)) fails.push({ rule: 'R05', item_id: iid, detail: `Missing "${k}"` }); }
    for (const k of itemKeys) { if (!required.includes(k)) fails.push({ rule: 'R06', item_id: iid, detail: `Extra key "${k}"` }); }
    if (!item.item_id     || typeof item.item_id     !== 'string') fails.push({ rule: 'R07', item_id: iid, detail: 'item_id must be non-empty string' });
    if (!item.explanation_correct          || typeof item.explanation_correct          !== 'string') fails.push({ rule: 'R08', item_id: iid, detail: 'explanation_correct must be non-empty string' });
    if (!item.explanation_incorrect_common || typeof item.explanation_incorrect_common !== 'string') fails.push({ rule: 'R09', item_id: iid, detail: 'explanation_incorrect_common must be non-empty string' });
    if (seenIds.has(item.item_id)) fails.push({ rule: 'R11', item_id: iid, detail: `Duplicate item_id` });
    seenIds.add(item.item_id);
  }
  if (fails.length > 0) return fails;

  const trainingItems = dataset.segments.training  || [];
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
    const combined = ec + '\n' + ei;

    if ((ec.match(/\n/g) || []).length !== 1) fails.push({ rule: 'R30a', item_id: item.item_id, detail: 'EC must have exactly 1 \\n' });
    if ((ei.match(/\n/g) || []).length !== 1) fails.push({ rule: 'R30b', item_id: item.item_id, detail: 'EI must have exactly 1 \\n' });
    for (const line of [...ecL, ...eiL]) {
      if (line.length > MAX_LINE_LENGTH) fails.push({ rule: 'R22', item_id: item.item_id, detail: `Line exceeds ${MAX_LINE_LENGTH} chars (${line.length})` });
    }
    if (!eiL[0] || !eiL[0].startsWith(INCORRECT_LINE1_PREFIX)) fails.push({ rule: 'R23', item_id: item.item_id, detail: `EI line 1 must start with "${INCORRECT_LINE1_PREFIX}"` });
    if (!eiL[1] || !eiL[1].startsWith(INCORRECT_LINE2_PREFIX)) fails.push({ rule: 'R24', item_id: item.item_id, detail: `EI line 2 must start with "${INCORRECT_LINE2_PREFIX}"` });
    if (!LINE1_CORRECT_PATTERN.test(ecL[0])) fails.push({ rule: 'R25', item_id: item.item_id, detail: `EC line 1 does not match pattern: "${(ecL[0] || '').substring(0, 80)}"` });
    for (const line of [...ecL, ...eiL]) {
      if (/[…]$/.test(line) || /\.{3,}$/.test(line)) fails.push({ rule: 'R26', item_id: item.item_id, detail: `Ellipsis at end of line` });
    }
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) fails.push({ rule: 'R27', item_id: item.item_id, detail: `Prohibited substring "${ps}"` });
    }
    if (combined.includes('?'))                                fails.push({ rule: 'R28', item_id: item.item_id, detail: 'Prohibited "?" found' });
    if (/\*\*|__|<[a-zA-Z/]|[a-zA-Z]>/.test(combined))        fails.push({ rule: 'R29', item_id: item.item_id, detail: 'HTML/markdown detected' });
    if (!ecL[0] || !ecL[0].endsWith('.')) fails.push({ rule: 'R30c', item_id: item.item_id, detail: 'EC line 1 must end with "."' });
    if (!ecL[1] || !ecL[1].endsWith('.')) fails.push({ rule: 'R30d', item_id: item.item_id, detail: 'EC line 2 must end with "."' });
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
// STEP 3 — AUDIT
// ─────────────────────────────────────────────────────────────────────────────

function auditItems(outputFile) {
  const total      = outputFile.items.length;
  const sampleSize = Math.ceil(total * 0.10);
  const sample     = outputFile.items.slice(0, sampleSize);
  const failures   = [];

  console.log(`\n[STEP 3 — AUDIT]  Total: ${total}  Sample: ${sampleSize}`);

  for (const item of sample) {
    const ec       = item.explanation_correct;
    const ei       = item.explanation_incorrect_common;
    const ecL      = ec.split('\n');
    const eiL      = ei.split('\n');
    const combined = ec + '\n' + ei;

    if ((ec.match(/\n/g) || []).length !== 1) failures.push({ item_id: item.item_id, check: 'EC_NEWLINE',      detail: 'EC must have exactly 1 \\n' });
    if (!ecL[0] || !ecL[0].endsWith('.'))     failures.push({ item_id: item.item_id, check: 'EC_L1_PERIOD',   detail: 'EC line 1 must end with "."' });
    if (!ecL[1] || !ecL[1].endsWith('.'))     failures.push({ item_id: item.item_id, check: 'EC_L2_PERIOD',   detail: 'EC line 2 must end with "."' });
    if (!eiL[0] || !eiL[0].startsWith(INCORRECT_LINE1_PREFIX)) failures.push({ item_id: item.item_id, check: 'EI_LINE1_PREFIX', detail: `EI line 1 must start with "${INCORRECT_LINE1_PREFIX}"` });
    if (!eiL[1] || !eiL[1].startsWith(INCORRECT_LINE2_PREFIX)) failures.push({ item_id: item.item_id, check: 'EI_LINE2_PREFIX', detail: `EI line 2 must start with "${INCORRECT_LINE2_PREFIX}"` });
    for (const line of [...ecL, ...eiL]) {
      if (line.length > MAX_LINE_LENGTH) failures.push({ item_id: item.item_id, check: 'LINE_LENGTH', detail: `Line exceeds ${MAX_LINE_LENGTH} chars (${line.length})` });
    }
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) failures.push({ item_id: item.item_id, check: 'PROHIBITED_SUBSTR', detail: `"${ps}"` });
    }
  }

  return { sampleSize, failures };
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL MODE HELPER
// ─────────────────────────────────────────────────────────────────────────────

function writeManualPrompts(trainingItems) {
  if (!fs.existsSync(promptsDir)) fs.mkdirSync(promptsDir, { recursive: true });

  const promptReg = path.join(examDir, '03_item_production', 'SYSTEM_BOOTSTRAP', 'prompt_registry_v1.json');
  let   genPrompt = '(prompt_registry_v1.json not found — define your generation prompt here)';
  if (fs.existsSync(promptReg)) {
    try {
      const reg = JSON.parse(fs.readFileSync(promptReg, 'utf8'));
      const gv1 = Array.isArray(reg) ? reg.find(p => p.prompt_id === 'GEN_v1') : reg;
      if (gv1) genPrompt = JSON.stringify(gv1, null, 2);
    } catch (_) {}
  }

  const lines = [
    `=== MANUAL MODE — GENERATION PROMPTS ===`,
    `Exam: ${config.exam_id} — ${config.exam_name}`,
    `Items: ${trainingItems.length}`,
    ``, `GEN PROMPT SPEC:`, genPrompt, ``,
    `ITEMS (sorted by item_id):`,
    ...trainingItems.map(i => JSON.stringify({ item_id: i.item_id, skill: i.metadata.skill, justification: i.content.justification }, null, 2)),
  ];

  const out = path.join(promptsDir, 'generation_batch_manual.txt');
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  console.log(`\n[MANUAL MODE] Prompts written to: ${out}`);
  console.log(`After running your LLM, write output to: ${outputPath}`);
  console.log(`Then re-run without --mode to validate.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== DATASET ENGINE PIPELINE ===');
  console.log(`Exam: ${config.exam_id} — ${config.exam_name}`);
  console.log(`Mode: ${args.mode}${args.dryRun ? ' [dry-run]' : ''}\n`);

  let dataset;
  try {
    dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  } catch (e) {
    console.error(`FAIL\nstep: 1\nreason: Cannot load dataset at "${datasetPath}": ${e.message}`);
    process.exit(2);
  }

  const trainingItems = [...(dataset.segments.training || [])].sort((a, b) =>
    a.item_id.localeCompare(b.item_id, 'en', { sensitivity: 'variant' })
  );

  console.log(`[STEP 1 — GENERATION]  Training items loaded: ${trainingItems.length}`);

  if (args.mode === 'manual' && !fs.existsSync(outputPath)) {
    writeManualPrompts(trainingItems);
    process.exit(0);
  }

  if (args.mode === 'auto') {
    let adapter;
    try { adapter = require('./llm_adapter.js'); } catch (e) {
      console.error('FAIL\nreason: --mode auto requires engine/llm_adapter.js and ANTHROPIC_API_KEY.');
      process.exit(2);
    }
    adapter.generateExplanations({ trainingItems, config, outputPath, dryRun: args.dryRun })
      .then(() => console.log('PASS — LLM generation complete.'))
      .catch(e => { console.error('FAIL\nreason:', e.message); process.exit(1); });
    return;
  }

  const generatedItems = [];
  const step1Fails     = [];

  for (const item of trainingItems) {
    let ec, ei;
    try {
      ec = generateExplanationCorrect(item);
      ei = generateExplanationIncorrect(item);
    } catch (e) {
      step1Fails.push({ item_id: item.item_id, reason: `Generation error: ${e.message}` });
      break;
    }
    const preErrors = checkPreOutput(item.item_id, ec, ei);
    if (preErrors.length > 0) { step1Fails.push({ item_id: item.item_id, reason: preErrors[0].detail }); break; }
    generatedItems.push({ item_id: item.item_id, explanation_correct: ec, explanation_incorrect_common: ei });
  }

  if (step1Fails.length > 0) {
    console.error(`\nFAIL\nstep: 1\nitem_id: ${step1Fails[0].item_id}\nreason: ${step1Fails[0].reason}`);
    process.exit(1);
  }
  console.log(`  Generated: ${generatedItems.length} items — PASS`);

  const candidate = { version: 'v1', items: generatedItems };

  console.log(`\n[STEP 2 — VALIDATION]`);
  const validationFails = validateOutput(candidate, dataset);
  if (validationFails.length > 0) {
    const f = validationFails[0];
    console.error(`\nFAIL\nstep: 2\nrule: ${f.rule}${f.item_id ? `\nitem_id: ${f.item_id}` : ''}\nreason: ${f.detail}`);
    if (validationFails.length > 1) validationFails.forEach(v => console.error(`  [${v.rule}] ${v.item_id || ''}: ${v.detail}`));
    process.exit(1);
  }
  console.log(`  All validation rules passed — PASS`);

  const auditResult = auditItems(candidate);
  if (auditResult.failures.length > 0) {
    const f = auditResult.failures[0];
    console.error(`\nFAIL\nstep: 3\nitem_id: ${f.item_id}\nfailed_check: ${f.check}\nreason: ${f.detail}`);
    process.exit(1);
  }
  console.log(`  Sample size: ${auditResult.sampleSize} — AUDIT_PASS`);

  if (!args.dryRun) {
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(candidate, null, 2), 'utf8');
    console.log(`\n  Output written: ${outputPath}`);
  } else {
    console.log(`\n  [dry-run] Output NOT written.`);
  }

  console.log(`\n[STEP 4 — APPROVAL]  → ${config.output.explanations_filename} APPROVED\n`);
  console.log('PASS');
  console.log(`total_items: ${generatedItems.length}`);
}

main();
