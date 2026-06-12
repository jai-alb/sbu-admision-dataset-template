# Dataset Engine Template

A reusable pipeline for extracting structural information from any standardized exam, generating a validated dataset of multiple-choice items with explanation pairs, and auditing output quality.

---

## What this engine produces

Given a raw exam as input, the engine produces:

1. **`dataset_v1.json`** — a structured item bank with metadata (skill, difficulty, cognitive load, segment assignment)
2. **`explanations_v1.json`** — explanation pairs for training items: one explanation for the correct answer, one for the most common error

---

## Prerequisites

- **Node.js** ≥ 18
- An exam to process (see [HOW_TO_ADD_AN_EXAM.md](HOW_TO_ADD_AN_EXAM.md))
- _(optional, for `--mode auto`)_ `ANTHROPIC_API_KEY` + `npm install @anthropic-ai/sdk`

---

## Quick start

```bash
# 1. Scaffold a new exam folder
node engine/engine_init.js --exam-id myexam --exam-name "My Exam 2026" --language en

# 2. Fill in the exam config
#    edit exams/myexam/exam_config.json

# 3. Add source files to exams/myexam/00_source_raw/

# 4. Run the pipeline (manual mode — generates prompts for LLM)
node engine/engine_pipeline.js --exam exams/myexam/exam_config.json

# 5. (Auto mode — calls Anthropic API directly)
node engine/engine_pipeline.js --exam exams/myexam/exam_config.json --mode auto

# 6. Validate the output
node engine/engine_validate.js   --exam exams/myexam/exam_config.json
node engine/engine_consistency.js --exam exams/myexam/exam_config.json
```

---

## Engine scripts

| Script | Purpose | Docs |
|--------|---------|------|
| `engine/engine_init.js` | Scaffold a new exam folder | [HOW_TO_ADD_AN_EXAM.md](HOW_TO_ADD_AN_EXAM.md) |
| `engine/engine_pipeline.js` | Full generation pipeline (Steps 1–4) | [PIPELINE_ARCHITECTURE.md](PIPELINE_ARCHITECTURE.md) |
| `engine/engine_validate.js` | Extended validation R01–R37 + risk-based audit | [VALIDATION_RULES.md](VALIDATION_RULES.md) |
| `engine/engine_consistency.js` | Cross-item consistency checks F01–F06 | [VALIDATION_RULES.md](VALIDATION_RULES.md) |
| `engine/llm_adapter.js` | Anthropic API wrapper for `--mode auto` | [LLM_INTEGRATION.md](LLM_INTEGRATION.md) |

---

## Repository layout

```
dataset/
├── engine/                    ← Engine core (public)
│   ├── engine_pipeline.js
│   ├── engine_validate.js
│   ├── engine_consistency.js
│   ├── engine_init.js
│   ├── llm_adapter.js
│   ├── execution_config.json
│   └── config.schema.json
│
├── exams/                     ← Exam instances (private, .gitignore'd)
│   └── ucr26/                 ← Reference case: UCR 2026 admissions exam
│
├── templates/                 ← Blank starter files for a new exam
│   ├── exam_config.template.json
│   ├── source_raw_template.md
│   └── extraction_template.md
│
└── docs/                      ← This documentation
```

---

## Reference case

`exams/ucr26/` contains a complete, production-grade run of this engine for the **UCR 2026 Costa Rican university admissions exam**. It is excluded from the public repository (`.gitignore`) but serves as the authoritative working example of every config field, phase output, and pipeline artifact.

---

## Further reading

- [HOW_TO_ADD_AN_EXAM.md](HOW_TO_ADD_AN_EXAM.md) — full onboarding walkthrough
- [PIPELINE_ARCHITECTURE.md](PIPELINE_ARCHITECTURE.md) — phase diagram and data flow
- [VALIDATION_RULES.md](VALIDATION_RULES.md) — all R01–R37 and F01–F06 rules
- [LLM_INTEGRATION.md](LLM_INTEGRATION.md) — manual vs auto mode, model choices
- [CHANGELOG.md](CHANGELOG.md) — engine version history
