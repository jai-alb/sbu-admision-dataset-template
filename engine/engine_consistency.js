'use strict';
/**
 * Dataset Engine — Consistency Check
 *
 * Section F — Cross-item and intra-item consistency checks:
 *   F01 — Field identity: explanation_correct !== explanation_incorrect_common
 *   F02 — Field swap: explanation_correct line 1 must NOT start with error/correction prefixes
 *   F03 — Intra-item: correction content !== error content
 *   F04 — Cross-item: no two items share identical explanation_correct
 *   F05 — Cross-item: no two items share identical explanation_incorrect_common
 *   F06 — Source alignment: explanation_correct shares ≥1 token (≥4 chars) with source item
 *
 * Usage:
 *   node engine/engine_consistency.js --exam <path/to/exam_config.json>
 *
 * Exit 0: VALIDATION_PASS (Section F)
 * Exit 1: VALIDATION_FAIL
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

const examDir          = path.dirname(path.resolve(process.argv[examArg + 1]));
const explanationsPath = path.join(examDir, '04_validation',    config.output.explanations_filename || 'explanations_v1.json');
const datasetPath      = path.join(examDir, '03_item_production', config.output.dataset_filename    || 'dataset_v1.json');

const INCORRECT_LINE1_PREFIX = config.explanation_rules.incorrect_line1_prefix || 'Error:';
const INCORRECT_LINE2_PREFIX = config.explanation_rules.incorrect_line2_prefix || 'Correction:';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function fail(rule, itemId, reason) {
  process.stdout.write(JSON.stringify({
    result:  'VALIDATION_FAIL',
    section: 'F',
    rule,
    item_id: itemId || null,
    reason
  }, null, 2) + '\n');
  process.exit(1);
}

function tokenSet(text) {
  return new Set(
    text.toLowerCase()
        .replace(/[^a-záéíóúüñ\s]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD FILES
// ─────────────────────────────────────────────────────────────────────────────

let expl, dataset;
try { expl    = JSON.parse(fs.readFileSync(explanationsPath, 'utf8')); }
catch (e) { fail('F-PARSE', null, `Failed to parse ${path.basename(explanationsPath)}: ${e.message}`); }

try { dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8')); }
catch (e) { fail('F-PARSE', null, `Failed to parse ${path.basename(datasetPath)}: ${e.message}`); }

const srcMap = new Map(dataset.segments.training.map(s => [s.item_id, s]));

// ─────────────────────────────────────────────────────────────────────────────
// PER-ITEM CHECKS
// ─────────────────────────────────────────────────────────────────────────────

const ecSeen = new Map();
const eiSeen = new Map();

for (const item of expl.items) {
  const src = srcMap.get(item.item_id);
  if (!src) {
    fail('F07', item.item_id, 'item_id not found in segments.training[] — source lookup failed');
  }

  const ec            = item.explanation_correct;
  const ei            = item.explanation_incorrect_common;
  const [ecL1]        = ec.split('\n');
  const eiLines       = ei.split('\n');
  const eiL1          = eiLines[0] || '';
  const eiL2          = eiLines[1] || '';
  const errContent    = eiL1.replace(new RegExp(`^${INCORRECT_LINE1_PREFIX}\\s*`), '');
  const corrContent   = eiL2.replace(new RegExp(`^${INCORRECT_LINE2_PREFIX}\\s*`), '');

  // F01 — field identity
  if (ec === ei) {
    fail('F01', item.item_id, 'explanation_correct is identical to explanation_incorrect_common');
  }

  // F02 — EC line 1 must not start with error/correction markers
  if (new RegExp(`^(${INCORRECT_LINE1_PREFIX}|${INCORRECT_LINE2_PREFIX})`, 'i').test(ecL1)) {
    fail('F02', item.item_id, `explanation_correct line 1 starts with a forbidden prefix: "${ecL1.substring(0, 60)}"`);
  }

  // F03 — intra-item: correction content ≠ error content
  if (corrContent === errContent) {
    fail('F03', item.item_id, 'Correction content is identical to Error content — possible copy within field');
  }

  // F04 — cross-item EC duplication
  if (ecSeen.has(ec)) {
    fail('F04', item.item_id, `explanation_correct is identical to item "${ecSeen.get(ec)}" — cross-item duplication`);
  }
  ecSeen.set(ec, item.item_id);

  // F05 — cross-item EI duplication
  if (eiSeen.has(ei)) {
    fail('F05', item.item_id, `explanation_incorrect_common is identical to item "${eiSeen.get(ei)}" — cross-item duplication`);
  }
  eiSeen.set(ei, item.item_id);

  // F06 — source alignment: explanation_correct must share ≥1 token (≥4 chars) with source item
  const justText   = typeof src.content.justification === 'string'
    ? src.content.justification
    : Object.values(src.content.justification).join(' ');
  const sourceText = [src.content.stem, justText, src.metadata.skill].join(' ');
  const ecTokens   = tokenSet(ec);
  const srcTokens  = tokenSet(sourceText);
  const hasOverlap = [...srcTokens].some(t => ecTokens.has(t));

  if (!hasOverlap) {
    fail('F06', item.item_id, 'explanation_correct shares no token (≥4 chars) with source stem/justification/skill — possible misassignment');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASS
// ─────────────────────────────────────────────────────────────────────────────

process.stdout.write(JSON.stringify({
  result:         'VALIDATION_PASS',
  section:        'F',
  exam_id:        config.exam_id,
  rules_checked:  ['F01', 'F02', 'F03', 'F04', 'F05', 'F06'],
  items_checked:  expl.items.length,
  timestamp:      new Date().toISOString()
}, null, 2) + '\n');

process.exit(0);
