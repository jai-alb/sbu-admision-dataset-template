# Changelog

---

## v2.0.0 — 2026-06-12

**Engine Template (major rewrite)**

This release completes the refactoring of the UCR26-specific pipeline into a generic, config-driven Dataset Engine Template. The engine is now fully decoupled from any specific exam.

### Architecture changes

- Introduced `exam_config.json` as the single source of truth for all exam-specific behavior. The engine reads it at startup and derives all constants, paths, prefixes, patterns, and fallbacks from it.
- Added `engine/config.schema.json` — JSON Schema (draft-07) validating the structure of any `exam_config.json`.
- Added `engine/engine_init.js` — scaffolds a new exam folder structure with a pre-filled config template.
- Added `engine/llm_adapter.js` — Anthropic API wrapper for `--mode auto` (lazy-loaded; not required for manual mode).

### Script changes

| Old name | New name | Change |
|----------|----------|--------|
| `f2_pipeline_full.js` | `engine/engine_pipeline.js` | Full rewrite: config-driven, `--mode manual/auto`, `--dry-run`, `--batches N` |
| `f2_validate_audit_v2.js` | `engine/engine_validate.js` | Config-driven prefixes, patterns, and line lengths |
| `f2_consistency_check.js` | `engine/engine_consistency.js` | Config-driven prefixes |

### Removed hardcoding

- Skill fallback objects `SKILL_LINE1_FALLBACK`, `SKILL_FALLBACK_ERROR`, `SKILL_FALLBACK_CORRECTION` removed; replaced by `config.explanation_fallbacks` lookup via `getFallback(skill, field)`.
- `"Error:"` / `"Corrección:"` string literals removed; read from `config.explanation_rules.incorrect_line1_prefix` / `incorrect_line2_prefix`.
- `LINE1_CORRECT_PATTERN` regex removed; read from `config.explanation_rules.correct_line1_pattern`.
- Hardcoded paths to `content_dataset_ucr26/` removed; all paths derived from `examDir` + config output fields.
- Hardcoded `segments.sim_1` / `segments.sim_2` references removed; non-training segments now enumerated generically from `Object.values(dataset.segments.simulation)`.

### LLM integration

- Two-mode pipeline: `--mode manual` (default, writes prompts to file) / `--mode auto` (Anthropic API).
- Generation model: `claude-haiku-4-5-20251001`.
- Adversarial validation model: `claude-sonnet-4-6`.
- Retry logic: 3 attempts, 4× back-off on HTTP 429.
- Abort threshold: >10% item failures.

### Repository layout changes

- `UCR26_Content/` renamed to `exams/ucr26/` (exam instance directory).
- All phase subdirectories lowercased: `00_source_raw`, `01_extraction`, `02_pattern_registry`, `03_item_production`, `04_validation`, `05_governance`.
- All UCR26-specific filenames normalized to generic names (`bank_v1_enriched.json` → `dataset_v1.json`, `MASTER_Structural_Patterns.md` → `pattern_registry.md`, etc.).
- `UCR_Documents/` moved to `exams/ucr26/05_governance/legacy/ucr_documents/`.
- `exams/` excluded from public repository via `.gitignore`.
- New `templates/` directory with `exam_config.template.json`, `source_raw_template.md`, `extraction_template.md`.
- New `docs/` directory with full engine documentation.

### Documentation

- `docs/README.md` — engine overview and quick start
- `docs/HOW_TO_ADD_AN_EXAM.md` — full onboarding walkthrough
- `docs/PIPELINE_ARCHITECTURE.md` — phase diagram, script responsibilities, data flow
- `docs/VALIDATION_RULES.md` — R01–R37 and F01–F06 reference
- `docs/LLM_INTEGRATION.md` — manual vs auto mode, model selection, cost guidance

---

## v1.x — UCR26 (archived)

The v1.x history is preserved in `exams/ucr26/05_governance/legacy/` and `exams/ucr26/05_governance/Version_Log.md`. The v1 pipeline was specific to the UCR 2026 Costa Rican university admissions exam and is not part of the public engine template.
