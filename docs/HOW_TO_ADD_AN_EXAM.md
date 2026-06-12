# How to Add a New Exam

This guide walks you through onboarding a new exam into the Dataset Engine Template from scratch.

---

## Overview

Adding a new exam involves five phases:

| Phase | Name | Input | Output |
|-------|------|-------|--------|
| 0 | **Init** | exam_id, exam_name | Folder structure + exam_config.json skeleton |
| 1 | **Extraction** | Raw exam PDF/text | Structural annotation per item (skill, difficulty, etc.) |
| 2 | **Pattern Registry** | Extraction output | Taxonomy of recurring patterns for this exam |
| 3 | **Item Production** | Extraction + config | `dataset_v1.json` — the item bank |
| 4 | **Explanation Layer** | Item bank + config | `explanations_v1.json` — explanation pairs for training items |

---

## Phase 0 — Init

Run the scaffolding command:

```bash
node engine/engine_init.js --exam-id <id> --exam-name "<Full Name>" [--language <es|en>]
```

Example:
```bash
node engine/engine_init.js --exam-id sat2026 --exam-name "SAT 2026" --language en
```

This creates `exams/sat2026/` with all required subfolders and a pre-filled `exam_config.json`.

**Then:** Open `exams/<exam-id>/exam_config.json` and fill in every field. Use:
- `exams/ucr26/exam_config.json` as a completed reference
- `engine/config.schema.json` for field definitions

---

## Phase 1 — Extraction

### 1a. Prepare source files

Copy the exam PDF and/or markdown extraction to `exams/<exam-id>/00_source_raw/`.

Follow the format in `templates/source_raw_template.md`:
- One `## ITEM_NNN` section per item
- Include stem, options, and answer key

### 1b. Structural annotation

For each item, document in `exams/<exam-id>/01_extraction/extraction_v1.md`:
- **Skill** — which skill from `exam_config.skill_taxonomy`
- **Difficulty** — L1 / L2 / L3
- **Cognitive load** — if your exam has a load dimension
- **paso_critico** — the key reasoning step to reach the correct answer
- **error_tipico** — the most common student mistake

Follow `templates/extraction_template.md` for the exact format.

### 1c. Cross-source convergence (optional but recommended)

If you have a second exam version or reference paper, annotate it in `extraction_v2.md` and compare the two to check consistency of skill assignments.

---

## Phase 2 — Pattern Registry

Create `exams/<exam-id>/02_pattern_registry/pattern_registry.md`.

Document the recurring structural patterns found during extraction:
- Pattern name and description
- Which skill(s) it appears in
- Which distractor type it uses
- How frequently it appears in the exam

This registry is used when generating new items from templates.

---

## Phase 3 — Item Production

Build the item bank manually or using LLM-assisted generation with the prompt templates in `03_item_production/SYSTEM_BOOTSTRAP/prompt_registry_v1.json`.

The final bank must be saved as `exams/<exam-id>/03_item_production/dataset_v1.json`.

**Required JSON structure:**
```json
{
  "exam_id": "<exam-id>",
  "version": "v1",
  "segments": {
    "training":   [ ...items ],
    "diagnostic": [ ...items ],
    "simulation": { "sim_1": [...], "sim_2": [...] }
  }
}
```

**Each item must include:**
```json
{
  "item_id": "ITEM_001_B001",
  "template_id": "T_H2_L2_01",
  "content": {
    "stem": "...",
    "opciones": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "respuesta_correcta": "A",
    "justification": {
      "paso_critico": "...",
      "error_tipico": "..."
    }
  },
  "metadata": {
    "macro_area": "...",
    "skill": "H2",
    "dificultad": 2
  },
  "final_status": "approved"
}
```

Track item counts and governance decisions in `05_governance/Decision_Log.md`.

---

## Phase 4 — Explanation Layer

Run the pipeline to generate `explanations_v1.json` for all training items.

### Manual mode (default)

```bash
node engine/engine_pipeline.js --exam exams/<exam-id>/exam_config.json
```

In manual mode, the pipeline writes prompts to `03_item_production/PROMPTS/generation_batch_manual.txt` and exits. Run the prompts through your LLM, write the output to `04_validation/explanations_v1.json`, then re-run without `--mode` to validate.

### Auto mode (Anthropic API)

```bash
export ANTHROPIC_API_KEY=sk-...
npm install @anthropic-ai/sdk
node engine/engine_pipeline.js --exam exams/<exam-id>/exam_config.json --mode auto
```

### Validate and audit

```bash
node engine/engine_validate.js    --exam exams/<exam-id>/exam_config.json
node engine/engine_consistency.js --exam exams/<exam-id>/exam_config.json
```

Both must exit with `PASS` before the explanations are considered production-ready.

---

## Governance

As you make significant decisions (changing skill assignments, adjusting item counts, resolving ambiguous classifications), log them in `05_governance/Decision_Log.md`.

Track version milestones in `05_governance/Version_Log.md`.

---

## Reference

- [PIPELINE_ARCHITECTURE.md](PIPELINE_ARCHITECTURE.md) — technical detail on what each engine script does
- [VALIDATION_RULES.md](VALIDATION_RULES.md) — all R01–R37 and F01–F06 rules explained
- [LLM_INTEGRATION.md](LLM_INTEGRATION.md) — auto mode setup and model selection
- `exams/ucr26/` — complete reference implementation (not in public repo)
