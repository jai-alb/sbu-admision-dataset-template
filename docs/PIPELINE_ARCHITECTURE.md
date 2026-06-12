# Pipeline Architecture

---

## Data flow overview

```
Raw Exam (PDF / Markdown)
        │
        ▼  Phase 1: Extraction
exams/<id>/01_extraction/extraction_v1.md
        │  (skill, difficulty, paso_critico, error_tipico per item)
        │
        ▼  Phase 3: Item Production
exams/<id>/03_item_production/dataset_v1.json
        │  (item bank: training / diagnostic / simulation segments)
        │
        ▼  engine_pipeline.js --mode manual|auto
exams/<id>/04_validation/explanations_v1.json
        │  (explanation pairs for training items only)
        │
        ▼  engine_validate.js
        │  R01–R37 + risk-based audit
        │
        ▼  engine_consistency.js
        │  F01–F06 cross-item checks
        │
        ▼  PRODUCTION READY
```

---

## engine_pipeline.js — 4-step pipeline

```
STEP 1 — GENERATION
  Input:  dataset_v1.json → segments.training[]
  For each training item:
    - manual mode: write prompts to PROMPTS/generation_batch_manual.txt, exit
    - auto mode:   call llm_adapter.generateExplanations()
    - fallback:    use explanation_fallbacks from exam_config.json
  Output: candidate = { version: "v1", items: [...] }

STEP 2 — VALIDATION (R01–R31)
  Input:  candidate, dataset
  Checks: JSON structure, field types, item_id uniqueness,
          training segment coverage, content rules (prefixes, patterns, line lengths)
  Fail:   exit 1 on first failing rule

STEP 3 — AUDIT (ceil(N × 0.10) items)
  Input:  candidate
  Checks: spot-check sample of first 10% of items
  Fail:   exit 1 on any audit failure

STEP 4 — APPROVAL
  Input:  STEP 2 PASS + STEP 3 AUDIT_PASS
  Output: write explanations_v1.json to 04_validation/
```

---

## engine_validate.js — extended validation

Runs after `engine_pipeline.js` produces `explanations_v1.json`.

### Rule levels

| Level | Rules | Description |
|-------|-------|-------------|
| 2 | R01–R11 | Structural: JSON shape, field types, key counts, no duplicates |
| 3 | R14–R20 | Integrity: training coverage, no non-training items included |
| 4 | R22–R37 | Content: line lengths, prefixes, patterns, prohibited strings, tone, error quality |

**Universal rules** (R01–R16, R22–R31) — apply to any exam, hardcoded in the script.

**Config-driven rules** — the specific prefix strings (R23, R24), the line-1 regex (R25), and the prohibited substrings (R27) all come from `exam_config.json`.

### Risk-based audit (STEP 3)

After validation, selects `max(20, ceil(N × 0.15))` highest-risk items for a deeper audit. Risk score is computed from:
- Short lines (< 60 chars) → +3
- Contains numbers → +2
- Contains math symbols → +2
- Uppercase emphasis → +1
- Open parenthesis → +1
- Truncation pattern detected → +4
- Generic subject in EC line 1 → +4
- Instructional tone → +3
- Placeholder content → +5
- Short error description (< 40 chars) → +3

---

## engine_consistency.js — Section F checks

| Rule | Check |
|------|-------|
| F01 | `explanation_correct` ≠ `explanation_incorrect_common` |
| F02 | `explanation_correct` line 1 must NOT start with error/correction prefixes |
| F03 | Correction content ≠ Error content within the same item |
| F04 | No two items share identical `explanation_correct` |
| F05 | No two items share identical `explanation_incorrect_common` |
| F06 | `explanation_correct` shares ≥1 token (≥4 chars) with source stem + justification + skill |

---

## exam_config.json — the control plane

All exam-specific behavior is derived from `exam_config.json` at runtime. The engine reads it on startup and configures itself. Nothing in the engine scripts is hardcoded to any specific exam.

Key config sections:
- `skill_taxonomy` — defines valid skill IDs and labels (used in fallback lookup and F06 token overlap)
- `segments` — defines which segments exist and their target sizes
- `explanation_rules` — controls all generation and validation behavior (prefixes, patterns, limits)
- `explanation_fallbacks` — per-skill fallback text for generation when justification is too short
- `output` — output filenames

---

## File locations (exam-relative)

| File | Path |
|------|------|
| Exam config | `exams/<id>/exam_config.json` |
| Item bank (dataset) | `exams/<id>/03_item_production/dataset_v1.json` |
| Explanations output | `exams/<id>/04_validation/explanations_v1.json` |
| Manual prompts (written by pipeline) | `exams/<id>/03_item_production/PROMPTS/generation_batch_manual.txt` |
| Prompt registry | `exams/<id>/03_item_production/SYSTEM_BOOTSTRAP/prompt_registry_v1.json` |
| Template library | `exams/<id>/03_item_production/SYSTEM_BOOTSTRAP/template_library_v1.json` |

---

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | PASS — all checks passed |
| 1 | FAIL — validation or audit failure |
| 2 | ERROR — missing input, config not found, malformed JSON |
