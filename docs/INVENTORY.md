# Dataset Engine — Refactor Inventory

**Status:** Stage 1 complete  
**Date:** 2026-06-12  

This checklist was produced during Stage 1 of the refactor. It classifies every file and flags every hardcoded UCR26 assumption that requires action before the engine is generic.

---

## Bucket Legend

| Symbol | Bucket | Action |
|--------|--------|--------|
| E | Engine Core | Keep, rename if needed, generalize |
| U | UCR26 Instance | Move to `exams/ucr26/` |
| C | UCR26 Coupled | Decouple via config (hardcoded assumptions found) |

---

## Root Level

| File | Bucket | Status | Notes |
|------|--------|--------|-------|
| `f2_pipeline_full.js` | C | Rename → `engine/engine_pipeline.js` | Hardcoded: skill fallbacks H1–H7, `Error:`/`Corrección:` prefixes, forbidden words list, `content_dataset_ucr26` path |
| `f2_validate_audit_v2.js` | C | Rename → `engine/engine_validate.js` | Hardcoded: `content_dataset_ucr26` path, `Error:`/`Corrección:` prefixes, R23/R24 prefix strings |
| `f2_consistency_check.js` | C | Rename → `engine/engine_consistency.js` | Hardcoded: `content_dataset_ucr26` path |
| `REFACTOR_PLAN.md` | E | Keep at root | — |
| `.gitignore` | E | Update — add `exams/` exclusion | — |

**Path discrepancy noted:** All three scripts reference `content_dataset_ucr26/` as their data folder, but no such folder exists in the repo. The actual data is at `UCR26_Content/03_ITEM_PRODUCTION/bank_v1_enriched.json`. The generalized scripts will derive paths from `exam_config.json`.

---

## UCR26_Content/ → exams/ucr26/

### 00_SOURCE_RAW/ → 00_source_raw/

| File | Bucket | New Name | Status |
|------|--------|----------|--------|
| `UCR_2025_V1.md` | U | `source_raw_v1.md` | Rename |
| `UCR_2025_V3.pdf` | U | `source_raw_v3.pdf` | Rename |

### 01_EXTRACTION_STRUCTURAL/ → 01_extraction/

| File | Bucket | New Name | Status |
|------|--------|----------|--------|
| `UCR_2025_V1.md` | U | `extraction_v1.md` | Rename |
| `UCR_2025_V3.md` | U | `extraction_v3.md` | Rename |

### 02_PATTERN_REGISTRY/ → 02_pattern_registry/

| File | Bucket | New Name | Status |
|------|--------|----------|--------|
| `MASTER_Structural_Patterns.md` | U | `pattern_registry.md` | Rename |

### 03_ITEM_PRODUCTION/ → 03_item_production/

| File | Bucket | New Name | Status |
|------|--------|----------|--------|
| `bank_v1_enriched.json` | U | `dataset_v1.json` | Rename — SSoT dataset |
| `audit_bank.js` | C | `engine/tools/audit_bank.js` | Move + generalize (Stage 4.4) |
| `check_keys.js` | C | `engine/tools/check_keys.js` | Move + generalize (Stage 4.4) |
| `inspect_pool.js` | C | `engine/tools/inspect_pool.js` | Move + generalize (Stage 4.4) |
| `final_audit.js` | C | `engine/tools/final_audit.js` | Move + generalize (Stage 4.4) |
| `BATCHES/` (26 batch files) | U | Keep in place | Production artifacts, no rename needed |
| `DRAFT/` | U | Keep in place | Empty placeholder |
| `REJECTED/` | U | Keep in place | Empty placeholder |
| `VALIDATED/` | U | Keep in place | Empty placeholder |
| `_deprecated/` | U | Keep in place | Historical artifacts |

### 03_ITEM_PRODUCTION/SYSTEM_BOOTSTRAP/ → 03_item_production/SYSTEM_BOOTSTRAP/

| File | Bucket | Status | Notes |
|------|--------|--------|-------|
| `execution_config.json` | E | Move → `engine/execution_config.json` | Mostly generic; audit for UCR-specific values |
| `template_library_v1.json` | U | Keep in SYSTEM_BOOTSTRAP | UCR26 template specs |
| `prompt_registry_v1.json` | U | Keep in SYSTEM_BOOTSTRAP | UCR26 prompt specs |
| `system_state_v2.json` | U | Keep in SYSTEM_BOOTSTRAP | UCR26 pipeline state |
| `sbu-admision.code-workspace` | U | Remove or keep | Workspace file, not engine-relevant |

### 04_VALIDATION/ → 04_validation/

| File | Bucket | New Name | Status |
|------|--------|----------|--------|
| `Cross_Review_Log.md` | U | `cross_review_log.md` | Rename + update header |
| `audit.ps1` | U | Keep name | UCR26 PowerShell audit utility |
| `audit_script.py` | U | Keep name | UCR26 Python audit utility |

### 05_GOVERNANCE/ → 05_governance/

| File | Bucket | New Name | Status |
|------|--------|----------|--------|
| `Decision_Log.md` | U | Keep name | Update header |
| `Version_Log.md` | U | Keep name | Update header |
| `UCR_2025_V1_aggregates_v2.md` | U | `aggregates_v2.md` | Rename + update header |
| `UCR_2025_V1_comparison_FINAL.md` | U | `comparison_final.md` | Rename + update header |
| `UCR_2025_V1_dataset_validation.md` | U | `dataset_validation.md` | Rename + update header |
| `UCR_2025_V1_pilot_selection.md` | U | `pilot_selection.md` | Rename + update header |

---

## UCR_Documents/ → exams/ucr26/05_governance/legacy/ucr_documents/

All 13 files move wholesale. No content changes; they are archived spec docs.

| File | Notes |
|------|-------|
| `INDEX.md` | Master index — describes the closed UCR26 system |
| `UCR26_Blueprint.md` | Strategic design doc |
| `UCR26_Fase_2A_Explanation_System.md` | Explanation generation spec |
| `UCR26_Fase_2B_Prompt_Library.md` | Prompt templates |
| `UCR26_Fase_2C_Validation_System.md` | Validation protocols |
| `UCR26_Fase_3A_Marco_Operativo_Minimo.md` | Operational framework |
| `UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md` | Extraction protocol |
| `UCR26_Fase_3C_Muestra_Piloto_Controlada.md` | Pilot sample validation |
| `UCR26_Fase_4A_Production_System.md` | Production system spec |
| `UCR26_Fase_4B_Bank_System.md` | Bank assembly spec |
| `UCR26_Fase_4C_Pipeline_Execution.md` | Pipeline orchestration |
| `UCR26_Fase_5A_Governance_Bank_Build.md` | Governance rules |
| `UCR26_Fase_5B_Data_Schema_Bank_Enriched.md` | Dataset schema spec |
| `UCR26_Fase_5C_Build_Protocol.md` | Build protocol |
| `UCR26_Fase_5D_Validation_Checklist.md` | Validation checklist |

---

## Hardcoded UCR26 Assumptions in Scripts

### f2_pipeline_full.js (→ engine_pipeline.js)

| Constant | Value | Action |
|----------|-------|--------|
| `PROHIBITED_SUBSTRINGS` | Spanish phrases list | Move to `exam_config.explanation_rules.prohibited_substrings` |
| `FORBIDDEN_WORDS_PROMPT` | Spanish word list | Move to `exam_config.explanation_rules.forbidden_words` |
| `LINE1_CORRECT_PATTERN` | `/^[A-ZÁÉÍÓÚÑ][^?!\n]{10,}\.$/` | Move to `exam_config.explanation_rules.correct_line1_pattern` |
| `SKILL_LINE1_FALLBACK` | H1–H7 Spanish strings | Move to `exam_config.explanation_fallbacks.{skill}.correct_line1` |
| `SKILL_LINE2_FALLBACK` | H1–H7 Spanish strings | Move to `exam_config.explanation_fallbacks.{skill}.correct_line2` |
| `SKILL_ERROR_FALLBACK` | H1–H7 Spanish strings | Move to `exam_config.explanation_fallbacks.{skill}.error` |
| `SKILL_CORRECTION_FALLBACK` | H1–H7 Spanish strings | Move to `exam_config.explanation_fallbacks.{skill}.correction` |
| `replaceForbiddenWords()` | Hardcoded replacement map | Move to `exam_config.explanation_rules.forbidden_replacements` |
| Dataset path | `content_dataset_ucr26/bank_v1_enriched.json` | Derive from `exam_config.output.dataset_filename` |
| Output path | `content_dataset_ucr26/explanations_v1.json` | Derive from `exam_config.output.explanations_filename` |
| `"Error:"` prefix check | Hardcoded string | Move to `exam_config.explanation_rules.incorrect_line1_prefix` |
| `"Corrección:"` prefix check | Hardcoded string | Move to `exam_config.explanation_rules.incorrect_line2_prefix` |

### f2_validate_audit_v2.js (→ engine_validate.js)

| Constant | Value | Action |
|----------|-------|--------|
| `explanationsPath` | `content_dataset_ucr26/explanations_v1.json` | Config-derived |
| `datasetPath` | `content_dataset_ucr26/bank_v1_enriched.json` | Config-derived |
| `PROHIBITED_SUBSTRINGS` | Same list | Config-driven |
| `LINE1_CORRECT_PATTERN` | Same regex | Config-driven |
| `"Error:"` / `"Corrección:"` in R23/R24 | Hardcoded | Config-driven |
| `MIN_LINE_LENGTH = 40` | Hardcoded | Move to config |

### f2_consistency_check.js (→ engine_consistency.js)

| Constant | Value | Action |
|----------|-------|--------|
| `EXPLANATIONS` path | `content_dataset_ucr26/explanations_v1.json` | Config-derived |
| `DATASET` path | `content_dataset_ucr26/bank_v1_enriched.json` | Config-derived |

---

*End of inventory.*
