'use strict';

/**
 * f2_consistency_check.js
 * Section F — Consistency Check (explanations_v1.json vs. bank_v1_enriched.json)
 *
 * Checks NOT covered by f2_validate_audit_v2.js (R01–R37):
 *   F01 — Field identity: explanation_correct !== explanation_incorrect_common
 *   F02 — Field swap: explanation_correct line 1 must NOT start with "Error:" or "Corrección:"
 *   F03 — Intra-item: Corrección content !== Error content (no copy within field)
 *   F04 — Cross-item: no two items share identical explanation_correct value
 *   F05 — Cross-item: no two items share identical explanation_incorrect_common value
 *   F06 — Source alignment: explanation_correct shares ≥1 token (≥4 chars) with
 *          source stem + justification + skill (alignment signal against misassignment)
 *
 * Exit 0: VALIDATION_PASS (Section F)
 * Exit 1: VALIDATION_FAIL at first violation
 */

const fs   = require('fs');
const path = require('path');

const EXPLANATIONS = path.join(__dirname, 'content_dataset_ucr26', 'explanations_v1.json');
const DATASET      = path.join(__dirname, 'content_dataset_ucr26', 'bank_v1_enriched.json');

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── load files ────────────────────────────────────────────────────────────────

let expl, dataset;
try { expl    = JSON.parse(fs.readFileSync(EXPLANATIONS, 'utf8')); }
catch (e) { fail('F-PARSE', null, `Failed to parse explanations_v1.json: ${e.message}`); }

try { dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8')); }
catch (e) { fail('F-PARSE', null, `Failed to parse bank_v1_enriched.json: ${e.message}`); }

const srcMap = new Map(dataset.segments.training.map(s => [s.item_id, s]));

// ── per-item checks ───────────────────────────────────────────────────────────

const ecSeen = new Map();   // ec value → first item_id
const eiSeen = new Map();   // ei value → first item_id

for (const item of expl.items) {

  const src = srcMap.get(item.item_id);
  if (!src) {
    fail('F07', item.item_id,
      `item_id not found in segments.training[] — source lookup failed`);
  }

  const ec    = item.explanation_correct;
  const ei    = item.explanation_incorrect_common;
  const [ecL1]      = ec.split('\n');
  const [eiL1, eiL2] = ei.split('\n');
  const errContent  = eiL1.replace(/^Error:\s*/, '');
  const corrContent = eiL2.replace(/^Corrección:\s*/, '');

  // F01 — field identity
  if (ec === ei) {
    fail('F01', item.item_id,
      'explanation_correct is identical to explanation_incorrect_common (field swap or copy)');
  }

  // F02 — EC line 1 must not start with error/correction markers
  if (/^(Error:|Corrección:)/i.test(ecL1)) {
    fail('F02', item.item_id,
      `explanation_correct line 1 starts with a forbidden marker: "${ecL1.substring(0, 60)}"`);
  }

  // F03 — intra-item: Corrección content ≠ Error content
  if (corrContent === errContent) {
    fail('F03', item.item_id,
      'Corrección content is identical to Error content — possible copy within field');
  }

  // F04 — cross-item EC duplication
  if (ecSeen.has(ec)) {
    fail('F04', item.item_id,
      `explanation_correct is identical to item "${ecSeen.get(ec)}" — cross-item duplication`);
  }
  ecSeen.set(ec, item.item_id);

  // F05 — cross-item EI duplication
  if (eiSeen.has(ei)) {
    fail('F05', item.item_id,
      `explanation_incorrect_common is identical to item "${eiSeen.get(ei)}" — cross-item duplication`);
  }
  eiSeen.set(ei, item.item_id);

  // F06 — source alignment signal
  const justText = typeof src.content.justification === 'string'
    ? src.content.justification
    : Object.values(src.content.justification).join(' ');

  const sourceText  = [src.content.stem, justText, src.metadata.skill].join(' ');
  const ecTokens    = tokenSet(ec);
  const srcTokens   = tokenSet(sourceText);
  const hasOverlap  = [...srcTokens].some(t => ecTokens.has(t));

  if (!hasOverlap) {
    fail('F06', item.item_id,
      'explanation_correct shares no token (≥4 chars) with source stem/justification/skill — possible misassignment');
  }
}

// ── PASS ──────────────────────────────────────────────────────────────────────

process.stdout.write(JSON.stringify({
  result:         'VALIDATION_PASS',
  section:        'F',
  rules_checked:  ['F01', 'F02', 'F03', 'F04', 'F05', 'F06'],
  items_checked:  expl.items.length,
  timestamp:      new Date().toISOString()
}, null, 2) + '\n');

process.exit(0);
