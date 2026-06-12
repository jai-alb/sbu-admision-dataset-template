'use strict';
/**
 * Dataset Engine — New Exam Scaffolding
 *
 * Creates the full folder structure for a new exam in one command.
 *
 * Usage:
 *   node engine/engine_init.js --exam-id <id> --exam-name "<Full Name>" [--language <es|en>]
 *
 * Example:
 *   node engine/engine_init.js --exam-id sat2026 --exam-name "SAT 2026" --language en
 *
 * Output:
 *   exams/<exam-id>/                     — exam root (excluded from git via .gitignore)
 *     00_source_raw/                     — place raw exam input here (PDF, markdown)
 *     01_extraction/                     — structural extraction outputs
 *     02_pattern_registry/               — skill and pattern registry
 *     03_item_production/
 *       BATCHES/                         — generated item batches
 *       SYSTEM_BOOTSTRAP/                — prompt registry, template library, state
 *     04_validation/                     — explanations output and audit logs
 *     05_governance/                     — decision log, version log
 *     exam_config.json                   — pre-filled from templates/exam_config.template.json
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CLI PARSING
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { examId: null, examName: null, language: 'es' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--exam-id'   && argv[i + 1]) { args.examId   = argv[++i]; continue; }
    if (argv[i] === '--exam-name' && argv[i + 1]) { args.examName = argv[++i]; continue; }
    if (argv[i] === '--language'  && argv[i + 1]) { args.language = argv[++i]; continue; }
  }
  return args;
}

const args = parseArgs(process.argv);

if (!args.examId || !args.examName) {
  console.error('ERROR: --exam-id and --exam-name are required.');
  console.error('Usage: node engine/engine_init.js --exam-id myexam --exam-name "My Exam 2026"');
  process.exit(2);
}

if (!/^[a-z0-9_-]+$/.test(args.examId)) {
  console.error(`ERROR: exam-id must be lowercase alphanumeric with hyphens/underscores only. Got: "${args.examId}"`);
  process.exit(2);
}

// ─────────────────────────────────────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '..');
const EXAM_DIR    = path.join(ROOT, 'exams', args.examId);
const TEMPLATE    = path.join(ROOT, 'templates', 'exam_config.template.json');

if (fs.existsSync(EXAM_DIR)) {
  console.error(`ERROR: Exam folder already exists: ${EXAM_DIR}`);
  console.error('To re-initialize, delete the folder first.');
  process.exit(2);
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE FOLDER STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

const dirs = [
  '00_source_raw',
  '01_extraction',
  '02_pattern_registry',
  '03_item_production/BATCHES',
  '03_item_production/SYSTEM_BOOTSTRAP',
  '03_item_production/DRAFT',
  '03_item_production/REJECTED',
  '03_item_production/VALIDATED',
  '04_validation',
  '05_governance',
];

console.log(`\n=== DATASET ENGINE — INIT ===`);
console.log(`Creating exam: ${args.examId} — "${args.examName}" [${args.language}]\n`);

for (const dir of dirs) {
  const fullPath = path.join(EXAM_DIR, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`  + ${path.join('exams', args.examId, dir)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE exam_config.json FROM TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

let configContent;
if (fs.existsSync(TEMPLATE)) {
  let raw = fs.readFileSync(TEMPLATE, 'utf8');
  raw = raw.replace(/"exam_id":\s*".*?"/, `"exam_id": "${args.examId}"`);
  raw = raw.replace(/"exam_name":\s*".*?"/, `"exam_name": "${args.examName}"`);
  raw = raw.replace(/"language":\s*".*?"/, `"language": "${args.language}"`);
  configContent = raw;
} else {
  configContent = JSON.stringify({
    exam_id:   args.examId,
    exam_name: args.examName,
    language:  args.language,
    _note:     'Fill in this config using templates/exam_config.template.json as a reference. See docs/HOW_TO_ADD_AN_EXAM.md for guidance.',
    skill_taxonomy:        {},
    macro_areas:           [],
    segments:              { training: { target: 0, explanation_layer: true } },
    difficulty_levels:     {},
    explanation_rules:     {},
    explanation_fallbacks: {},
    output: { dataset_filename: 'dataset_v1.json', explanations_filename: 'explanations_v1.json' }
  }, null, 2);
}

const configPath = path.join(EXAM_DIR, 'exam_config.json');
fs.writeFileSync(configPath, configContent, 'utf8');
console.log(`\n  + exams/${args.examId}/exam_config.json`);

// ─────────────────────────────────────────────────────────────────────────────
// WRITE 00_source_raw/README.md
// ─────────────────────────────────────────────────────────────────────────────

const readmePath = path.join(EXAM_DIR, '00_source_raw', 'README.md');
fs.writeFileSync(readmePath, `# Source Raw Input [exam: ${args.examId}]

Place the original exam files here before running the pipeline.

## Accepted formats
- **PDF** — the official exam file as distributed
- **Markdown** — a structured text extraction of the PDF (recommended for Phase 1)

## Next step
After placing your source files, follow **Phase 1 — Extraction** in:
  docs/HOW_TO_ADD_AN_EXAM.md
`, 'utf8');
console.log(`  + exams/${args.examId}/00_source_raw/README.md`);

// ─────────────────────────────────────────────────────────────────────────────
// WRITE 05_governance/Decision_Log.md and Version_Log.md
// ─────────────────────────────────────────────────────────────────────────────

fs.writeFileSync(path.join(EXAM_DIR, '05_governance', 'Decision_Log.md'),
`# Decision Log [exam: ${args.examId}]

## DEC-001
- **Date:** ${new Date().toISOString().split('T')[0]}
- **Decision:** Exam folder initialized with engine_init.js
- **Rationale:** —
`, 'utf8');

fs.writeFileSync(path.join(EXAM_DIR, '05_governance', 'Version_Log.md'),
`# Version Log [exam: ${args.examId}]

## ${new Date().toISOString().split('T')[0]} — v0.1 — Initialization
- Exam folder created via engine_init.js
- exam_config.json seeded from template
`, 'utf8');
console.log(`  + exams/${args.examId}/05_governance/Decision_Log.md`);
console.log(`  + exams/${args.examId}/05_governance/Version_Log.md`);

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

console.log(`
=== SETUP COMPLETE ===

Next steps (in order):

  [ ] 1. Edit exam_config.json — fill in skill_taxonomy, macro_areas, segments, explanation_rules, explanation_fallbacks.
         Reference: exams/ucr26/exam_config.json (completed example)
         Schema:    engine/config.schema.json

  [ ] 2. Add source files to exams/${args.examId}/00_source_raw/
         Reference: templates/source_raw_template.md

  [ ] 3. Run Phase 1 extraction — analyze each item, assign skills, difficulty levels, cognitive load.
         Reference: templates/extraction_template.md
         Output to: exams/${args.examId}/01_extraction/

  [ ] 4. Build dataset_v1.json (item bank) in exams/${args.examId}/03_item_production/

  [ ] 5. Run the pipeline:
         node engine/engine_pipeline.js --exam exams/${args.examId}/exam_config.json

  [ ] 6. Run validation:
         node engine/engine_validate.js --exam exams/${args.examId}/exam_config.json

  [ ] 7. Run consistency check:
         node engine/engine_consistency.js --exam exams/${args.examId}/exam_config.json

Full guide: docs/HOW_TO_ADD_AN_EXAM.md
`);
