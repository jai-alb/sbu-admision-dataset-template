# Dataset Engine Template — Refactoring Plan

**Status:** Approved — ready to execute  
**Date:** 2026-06-12  
**Author:** jai-alb  
**Engine version target:** v2.0  

---

## Context

This project was built as a production pipeline for a specific exam (UCR / UCR26). The goal of this refactor is to transform it into a **generic Dataset Engine Template**: a reusable system that accepts any exam or test as input, processes it through a structured pipeline, identifies evaluated competencies, and produces a validated dataset of questions as output.

UCR26 is preserved as a working reference case (example exam), clearly marked as such — not deleted. The `exams/ucr26/` folder will be excluded from the public repository via `.gitignore`.

---

## Decisions

| # | Decision |
|---|----------|
| D1 | All engine-level documentation is written in **English only**. Dataset content (stems, options, explanations) follows the language of the input exam. |
| D2 | `exams/ucr26/` (and the entire `exams/` tree) is **excluded from the public repo** via `.gitignore`. The engine logic and templates are public; exam data is private. |
| D3 | Engine scripts **remain Node.js**. The Python file (`audit_script.py`) is an exam-instance utility inside `exams/ucr26/` — it is not engine core. Mixing runtimes in the engine itself would hurt maintainability with no performance gain. See Future Notes. |
| D4 | **LLM integration is added as an optional layer** with two run modes: `manual` (current behavior, prompts written to file) and `auto` (live Anthropic API calls). Manual remains the default. See Stage 4.5. |

---

## Guiding Principles

- **No more UCR26/UCR in filenames, folder names, or document headers.** All naming must be exam-agnostic.
- **Everything exam-specific moves to a configuration file.** The pipeline itself never assumes exam identity.
- **Preserve the architecture.** The 5-phase structure (Extract → Generate → Validate → Audit → Approve) is solid and stays.
- **One-exam-at-a-time folder model.** Each exam processed by the engine lives in its own isolated subfolder under `exams/`.
- **Don't break what works.** All improvements are additive or behind flags. No existing behavior is removed without a replacement.

---

## Stage 1 — Inventory & Decision Audit

**Goal:** Map every exam-specific element before touching anything. Produce a checklist that guides all subsequent stages.

### 1.1 Classify all existing files into three buckets

| Bucket | Description | Action |
|--------|-------------|--------|
| **Engine Core** | Logic reusable for any exam | Keep, rename, generalize |
| **UCR26 Instance** | Data, configs, outputs specific to UCR26 | Move to `exams/ucr26/` |
| **UCR26 Coupled** | Engine logic with hardcoded UCR26 values | Decouple via config |

### 1.2 Hardcoded UCR26 items to audit in scripts

- Skill taxonomy H1–H7 (labels and descriptions)
- Macro areas RCM / RCV (labels)
- Segment targets: 155 training / 19 diagnostic / 45+45 simulation
- Explanation prefix rules (`"Error:"` / `"Corrección:"`)
- Forbidden words list (opción, enunciado, texto, pregunta, problema)
- Regex patterns for line validation
- File paths (`bank_v1_enriched.json`, `explanations_v1.json`)
- All document headers mentioning `UCR26`, `UCR 2025`, `Fase 3B`, etc.

**Deliverable:** A checklist file `docs/INVENTORY.md` logging every file and field that requires action, used as a progress tracker through Stages 2–4.

---

## Stage 2 — Repository & File Renaming

**Goal:** Remove all UCR/UCR26 references from filenames, folder names, document headers, and git-tracked content outside `exams/`.

### 2.1 Add `.gitignore` entries

Before any file moves, add these entries to `.gitignore`:

```
# Exam instance data — private
exams/
```

This ensures no exam data (including the UCR26 reference case) is accidentally pushed when running `git add .`.

### 2.2 Top-level folder rename

| Current | Rename to |
|---------|-----------|
| `UCR26_Content/` | `exams/ucr26/` |

The `exams/` folder is the home for all exam run instances. Each exam gets its own subfolder.

### 2.3 Subfolder structure rename (inside `exams/ucr26/`)

| Current | Rename to |
|---------|-----------|
| `00_SOURCE_RAW/` | `00_source_raw/` |
| `01_EXTRACTION_STRUCTURAL/` | `01_extraction/` |
| `02_PATTERN_REGISTRY/` | `02_pattern_registry/` |
| `03_ITEM_PRODUCTION/` | `03_item_production/` |
| `04_VALIDATION/` | `04_validation/` |
| `05_GOVERNANCE/` | `05_governance/` |
| `LEGACY DOCS/` | `05_governance/legacy/` |

### 2.4 File renames (inside `exams/ucr26/`)

All files with `UCR26_`, `UCR_2025_`, or `UCR_` prefixes are renamed to generic phase names. Content is preserved unchanged.

| Current | Rename to |
|---------|-----------|
| `UCR_2025_V1.md` (in source_raw) | `source_raw_v1.md` |
| `UCR_2025_V3.pdf` | `source_raw_v3.pdf` |
| `UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md` | `extraction_protocol.md` |
| `UCR26_Fase_4_Architecture-Spec.md` | `item_production_spec.md` |
| `MASTER_Structural_Patterns.md` | `pattern_registry.md` |
| `bank_v1_enriched.json` | `dataset_v1.json` |
| `UCR_2025_V1_pilot_selection.md` | `pilot_selection.md` |
| `UCR_2025_V1_dataset_validation.md` | `dataset_validation.md` |
| `UCR_2025_V1_aggregates_v2.md` | `aggregates_v2.md` |
| `UCR_2025_V1_comparison_FINAL.md` | `comparison_final.md` |

### 2.5 Document header updates

Every markdown file inside `exams/ucr26/` that has a UCR-specific title gets updated. Old pattern:

> `# UCR26 — Fase 3B: Protocolo de Extracción Estructural`

New pattern (generic title + exam tag):

> `# Extraction Protocol [exam: ucr26]`

A systematic find-and-replace pass over all `.md` files handles this. Content below the header is not changed.

### 2.6 Root-level script renames

| Current | Rename to |
|---------|-----------|
| `f2_pipeline_full.js` | `engine_pipeline.js` |
| `f2_validate_audit_v2.js` | `engine_validate.js` |
| `f2_consistency_check.js` | `engine_consistency.js` |

---

## Stage 3 — Configuration Layer (Abstraction)

**Goal:** Extract every exam-specific value out of the scripts and into a per-exam configuration file. The engine reads config at runtime and derives all behavior from it.

### 3.1 Create the engine config schema

A new file `engine/config.schema.json` defines the structure every exam config must follow:

```json
{
  "exam_id": "string — unique slug, used as folder name and output prefix",
  "exam_name": "string — human-readable full name",
  "language": "string — ISO 639-1 code (en, es, fr, etc.)",
  "skill_taxonomy": {
    "H1": { "label": "string", "description": "string", "type": "cognitive_load" },
    "H2": { "label": "string", "description": "string", "macro_area": "string" }
  },
  "macro_areas": [
    { "id": "string", "label": "string", "skills": ["H2", "H6"] }
  ],
  "segments": {
    "training":    { "target": "number", "explanation_layer": true },
    "diagnostic":  { "target": "number", "explanation_layer": false },
    "simulation":  { "sets": "number", "items_per_set": "number", "explanation_layer": false }
  },
  "difficulty_levels": {
    "L1": { "label": "string", "description": "string" },
    "L2": { "label": "string", "description": "string" },
    "L3": { "label": "string", "description": "string" }
  },
  "explanation_rules": {
    "correct_line1_pattern": "regex string",
    "incorrect_line1_prefix": "string",
    "incorrect_line2_prefix": "string",
    "forbidden_words": ["array", "of", "strings"],
    "min_line_length": "number",
    "max_line_length": "number"
  },
  "validation_thresholds": {
    "ambiguity_pct": "number",
    "conflict_pct": "number",
    "rejection_pct": "number"
  },
  "prompt_registry": "path — relative to exam folder",
  "template_library": "path — relative to exam folder"
}
```

### 3.2 Create UCR26 exam config as reference implementation

`exams/ucr26/exam_config.json` — holds all UCR26-specific values extracted from the scripts. This file must pass validation against `engine/config.schema.json` with zero errors. It becomes the **canonical example** of how to configure a new exam.

### 3.3 Add `exam_id` to output files for traceability

Every generated output file (`dataset_v1.json`, `explanations_v1.json`) must include `exam_id` and `engine_version` as root-level fields. This ensures outputs are always traceable back to their source exam and engine version, even when files are shared or moved.

```json
{
  "exam_id": "ucr26",
  "engine_version": "2.0",
  "generated_at": "ISO timestamp",
  "items": [ ... ]
}
```

### 3.4 Move and clean execution config

`execution_config.json` is mostly generic. Move it to `engine/execution_config.json`. Audit for any UCR-specific values and move them to `exams/ucr26/exam_config.json`. Risk scoring weights for the audit sampler also move here.

---

## Stage 4 — Pipeline Script Generalization

**Goal:** The three engine scripts become fully exam-agnostic. They accept an exam config path as the only exam-specific input.

### 4.1 engine_pipeline.js

- Accept `--exam <path-to-exam_config.json>` as required CLI argument
- Accept `--mode <manual|auto>` with `manual` as default (see Stage 4.5)
- Load config at startup; fail fast with a clear error if the config is missing or fails schema validation
- Replace all hardcoded skill labels (H1–H7, RCM/RCV) with values from `config.skill_taxonomy`
- Replace hardcoded segment counts with values from `config.segments`
- Replace hardcoded explanation validation patterns with `config.explanation_rules`
- Derive all output file paths from `exam_id` and exam folder location — no hardcoded filenames

### 4.2 engine_validate.js

- Same config-driven approach for all R01–R37 rules
- **Universal rules** (JSON structure, field types, uniqueness, line length) stay hardcoded — they apply to any exam
- **Exam-specific rules** (prefix checks, skill label validation, macro area checks) become config-driven
- Risk scoring weights (for risk-based audit sampler) read from `engine/execution_config.json`

### 4.3 engine_consistency.js

- F01–F06 checks are largely universal — minor cleanup only
- Token overlap check (F06) reads exam-specific skill labels from config instead of hardcoded H1–H7 strings

### 4.4 Utility tools

`audit_bank.js`, `check_keys.js`, `inspect_pool.js`, `final_audit.js` — move from `exams/ucr26/03_item_production/` to `engine/tools/`. Parameterize each with `--exam <config_path>` so they work with any exam folder.

---

## Stage 4.5 — LLM Integration Layer (Optional / Additive)

**Goal:** Add a live Anthropic API call layer so the pipeline can run fully automated in `auto` mode. The current manual workflow is preserved and remains the default.

### Why this improvement

Currently the pipeline generates prompt specs (GEN_v1, ADV_v1) and the user runs them manually in an LLM interface, then pastes results back into batch JSON files. This works, but it adds a manual bottleneck for every batch. Automating this step removes the bottleneck without changing any of the pipeline logic.

### Design: two-mode operation

```
engine_pipeline.js --exam <config> --mode manual   # current behavior (default)
engine_pipeline.js --exam <config> --mode auto      # new: calls API directly
```

In `manual` mode, Step 1 (Generation) writes prompts to `03_item_production/PROMPTS/batch_NNN_gen_prompt.txt` and exits, waiting for the user to supply results. No behavior change from current system.

In `auto` mode, Step 1 calls the Anthropic API directly and writes the response into the batch JSON, then continues to validation without user intervention.

### Implementation: engine/llm_adapter.js

A new file `engine/llm_adapter.js` wraps the Anthropic SDK. It exposes two functions:

- `generate(prompt, config)` — calls generation model, returns parsed item JSON
- `validate(item, prompt, config)` — calls adversarial validation model, returns verdict

**Model assignment:**
- **Generation (GEN):** `claude-haiku-4-5-20251001` — fast, cost-effective for high-volume item generation
- **Adversarial validation (ADV):** `claude-sonnet-4-6` — higher accuracy for quality judgment calls

This split optimizes cost without sacrificing validation quality: generation is high-volume and tolerant of minor errors (the ADV pass catches them); validation is low-volume and high-stakes.

**Requirements:**
- `ANTHROPIC_API_KEY` environment variable must be set to use `--mode auto`
- The adapter handles retries (using `execution_config.json` `max_retries` value) and rate-limit back-off
- If the API call fails after all retries, the pipeline falls back to manual mode for that batch and logs a warning

### What does not change

- The prompt specs in `prompt_registry` remain the source of truth for what gets sent to the LLM — the adapter is just the delivery mechanism
- All validation (R01–R37, F01–F06) runs identically in both modes
- Batch JSON format is identical regardless of mode
- The `manual` mode path is untouched

---

## Stage 5 — Engine Folder Structure & Onboarding

**Goal:** Establish the final folder layout and create the scaffolding tools that make adding a new exam easy.

### 5.1 Final top-level structure

```
dataset/
│
├── engine/                          # Engine core — exam-agnostic, public
│   ├── engine_pipeline.js           # Main pipeline (4 steps)
│   ├── engine_validate.js           # R01–R37 + risk-based audit
│   ├── engine_consistency.js        # F01–F06 cross-item checks
│   ├── engine_init.js               # Scaffold a new exam folder (see 5.3)
│   ├── llm_adapter.js               # Anthropic API wrapper (Stage 4.5)
│   ├── execution_config.json        # Retry limits, audit thresholds
│   ├── config.schema.json           # JSON schema for exam_config.json
│   └── tools/
│       ├── audit_bank.js
│       ├── check_keys.js
│       ├── inspect_pool.js
│       └── final_audit.js
│
├── exams/                           # Private — excluded via .gitignore
│   └── ucr26/                       # Reference case
│       ├── exam_config.json
│       ├── 00_source_raw/
│       ├── 01_extraction/
│       ├── 02_pattern_registry/
│       ├── 03_item_production/
│       │   ├── SYSTEM_BOOTSTRAP/
│       │   ├── BATCHES/
│       │   └── dataset_v1.json
│       ├── 04_validation/
│       │   └── explanations_v1.json
│       └── 05_governance/
│           └── legacy/
│
├── templates/                       # Starter kit for a new exam, public
│   ├── exam_config.template.json    # Blank config, annotated with comments
│   ├── source_raw_template.md       # How to format raw exam input
│   └── extraction_template.md      # How to document Phase 1 extraction
│
├── docs/                            # Engine documentation, public, English only
│   ├── README.md
│   ├── HOW_TO_ADD_AN_EXAM.md
│   ├── PIPELINE_ARCHITECTURE.md
│   ├── VALIDATION_RULES.md
│   ├── LLM_INTEGRATION.md           # Manual vs auto mode, model choices
│   ├── INVENTORY.md                 # Stage 1 checklist (produced during refactor)
│   └── CHANGELOG.md
│
└── REFACTOR_PLAN.md                 # This file
```

### 5.2 Create starter templates

`templates/exam_config.template.json` — every field present, with inline comments explaining the expected value and constraints. The UCR26 config serves as the filled-in example.

`templates/source_raw_template.md` — instructions for extracting items from a PDF into the canonical markdown format expected by Phase 1. Includes item numbering convention, options format, and metadata fields.

`templates/extraction_template.md` — instructions for Phase 1 structural annotation: how to assign skills, difficulty levels, cognitive load, and error types to each raw item.

### 5.3 engine_init.js — new exam scaffolding script

A new CLI tool that creates the full folder structure for a new exam in one command:

```
node engine/engine_init.js --exam-id myexam --exam-name "My Exam 2026"
```

This creates:
- `exams/myexam/` with all six numbered phase subfolders
- `exams/myexam/exam_config.json` pre-filled from `templates/exam_config.template.json` with `exam_id` and `exam_name` substituted
- `exams/myexam/00_source_raw/README.md` with next-step instructions

The command outputs a checklist of what to fill in before running the pipeline.

---

## Stage 6 — Documentation Rewrite

**Goal:** All engine-level documentation is in English, reflects the generic engine, and is sufficient for someone unfamiliar with UCR26 to onboard a new exam from scratch.

### 6.1 New engine-level docs to create

| File | Content |
|------|---------|
| `docs/README.md` | What this engine is, what it produces, prerequisites, quickstart |
| `docs/HOW_TO_ADD_AN_EXAM.md` | Full walkthrough: `engine_init` → source input → extraction → generation → validation → output |
| `docs/PIPELINE_ARCHITECTURE.md` | Phase diagram, data flow, script responsibilities, input/output formats |
| `docs/VALIDATION_RULES.md` | All R01–R37 and F01–F06 rules documented, which are universal vs config-driven |
| `docs/LLM_INTEGRATION.md` | Manual vs auto mode, model selection rationale, API key setup, cost guidance |
| `docs/CHANGELOG.md` | Engine version history starting at v2.0 |

### 6.2 UCR26 docs to update (inside `exams/ucr26/`)

All markdown files inside the exam folder keep their content intact, but:
- Headers are updated to generic titles with `[exam: ucr26]` tag (see Stage 2.5)
- `Decision_Log.md` and `Version_Log.md` are recognized as exam-instance governance files, not engine docs
- No content is rewritten — only titles and UCR-specific references in headers

### 6.3 Deprecate legacy docs folder

`UCR26_Content/LEGACY DOCS/` contents move to `exams/ucr26/05_governance/legacy/`. The old folder is deleted after the move is confirmed.

---

## Stage 7 — Validation & Final Review

**Goal:** Confirm the refactored engine is correct, clean, and proven to work for at least two exam instances.

### 7.1 Config schema validation

Validate `exams/ucr26/exam_config.json` against `engine/config.schema.json` — must pass with zero errors. This is a prerequisite for all other tests.

### 7.2 Smoke test: UCR26 as the reference case

Run the full pipeline using UCR26 in manual mode and confirm output matches the pre-refactor result:

```
node engine/engine_pipeline.js --exam exams/ucr26/exam_config.json --mode manual
```

Expected: identical output structure to the original `bank_v1_enriched.json` / `explanations_v1.json`.

### 7.3 Smoke test: LLM adapter in auto mode

With `ANTHROPIC_API_KEY` set, run a single-batch dry run against UCR26 in auto mode to confirm the adapter connects, handles retries, and writes valid JSON output.

```
node engine/engine_pipeline.js --exam exams/ucr26/exam_config.json --mode auto --dry-run --batches 1
```

### 7.4 Stale reference audit

Run a full grep for the following strings across all tracked files (everything outside `exams/`). Expected: zero matches.

```
UCR, UCR26, Fase 3, f2_pipeline, f2_validate, f2_consistency
```

### 7.5 New exam scaffold dry run

Run `engine_init.js` for a minimal mock exam, fill in the config template, and confirm the pipeline reaches Step 1 without errors. This proves the onboarding path works independently of UCR26.

```
node engine/engine_init.js --exam-id mockexam --exam-name "Mock Exam"
node engine/engine_pipeline.js --exam exams/mockexam/exam_config.json --dry-run
```

### 7.6 Commit & push

Final commit to `https://github.com/jai-alb/sbu-admision-dataset-template.git` with message:

```
refactor: generalize UCR26 pipeline into generic Dataset Engine Template v2.0
```

---

## Execution Order Summary

| Stage | Description | Effort | Depends on |
|-------|-------------|--------|------------|
| 1 | Inventory & audit | Low | — |
| 2 | Rename files, folders, headers, add .gitignore | Medium | 1 |
| 3 | Config schema + UCR26 config + output traceability | High | 1 |
| 4 | Generalize pipeline scripts | High | 3 |
| 4.5 | LLM integration layer | Medium | 4 |
| 5 | Engine folder structure + init script + templates | Medium | 2, 3, 4 |
| 6 | Documentation rewrite | Medium | 5 |
| 7 | Validation & final review | Low | all |

Stages 2 and 3 can proceed in parallel. Stage 4.5 is independent of Stage 5–6 and can be deferred without blocking the rest.

---

## Future Notes

These improvements are not in scope for this refactor but are worth considering once the engine template is stable:

- **Python analytics layer** (`engine/analytics/`) — Python is better suited for data analysis, visualization, and statistical validation of dataset quality (distribution checks, difficulty curves, skill coverage heatmaps). This can be added as a companion to the Node.js engine without replacing it. The `audit_script.py` in `exams/ucr26/04_validation/` is the seed for this.

- **Multi-exam aggregation** — A future tool that reads across multiple `exams/` folders and produces a comparative report (skill coverage, difficulty distribution, dataset size) to help with cross-exam quality assurance.

- **Web UI for exam config** — A simple form-based interface that generates a valid `exam_config.json` from user input, reducing configuration errors when onboarding a new exam.

- **CI integration** — A GitHub Actions workflow that runs the stale-reference grep (Stage 7.4) and schema validation (Stage 7.1) on every push to ensure the engine stays clean over time.

- **Auto mode cost tracking** — Extend `llm_adapter.js` to log token counts and estimated cost per batch, giving operators visibility into API spend per exam run.

---

*End of plan.*
