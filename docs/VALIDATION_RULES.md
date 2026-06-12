# Validation Rules Reference

All validation rules run in two separate scripts:

- `engine_validate.js` — R01–R37 (structural + content, plus risk-based audit)
- `engine_consistency.js` — F01–F06 (cross-item and intra-item consistency)

---

## engine_validate.js — R rules

Rules are grouped into levels that run in order. Level 2 failures abort before level 3, and so on.

---

### Level 1 — JSON Parse

| Rule | Check |
|------|-------|
| LEVEL1_JSON_PARSE | `explanations_v1.json` must be valid JSON |
| DATASET_LOAD | `dataset_v1.json` must be valid JSON |

---

### Level 2 — Structural Shape (R01–R11)

| Rule | Check | Type |
|------|-------|------|
| R01 | Root object must have exactly 2 keys: `version` and `items` | Universal |
| R02 | `version` must equal `"v1"` | Universal |
| R03 | `items` must be an array | Universal |
| R04 | `items` must not be empty | Universal |
| R05 | Each item must have exactly 3 keys: `item_id`, `explanation_correct`, `explanation_incorrect_common` | Universal |
| R06 | No extra keys allowed beyond the required 3 | Universal |
| R07 | `item_id` must be a non-empty string | Universal |
| R08 | `explanation_correct` must be a non-empty string | Universal |
| R09 | `explanation_incorrect_common` must be a non-empty string | Universal |
| R11 | No duplicate `item_id` values | Universal |

---

### Level 3 — Integrity Against Dataset (R14–R20)

| Rule | Check | Type |
|------|-------|------|
| R14 | Every explanation `item_id` must exist in `dataset.segments.training[]` | Universal |
| R15 | Every training `item_id` in the dataset must appear in the explanations | Universal |
| R16 | Explanation count must equal training item count | Universal |
| R18 | No explanation `item_id` may belong to a non-training segment | Universal |

---

### Level 4 — Content Rules (R22–R31)

| Rule | Check | Type |
|------|-------|------|
| R22 | No line may exceed `max_line_length` characters | Config-driven |
| R23 | EI line 1 must start with `incorrect_line1_prefix` | Config-driven |
| R24 | EI line 2 must start with `incorrect_line2_prefix` | Config-driven |
| R25 | EC line 1 must match `correct_line1_pattern` (regex) | Config-driven |
| R26 | No line may end with ellipsis (`...` or `…`) | Universal |
| R27 | No line may contain any string from `prohibited_substrings` | Config-driven |
| R28 | No `?` character allowed anywhere | Universal |
| R29 | No HTML tags or markdown bold/italic formatting | Universal |
| R30a | `explanation_correct` must contain exactly 1 `\n` | Universal |
| R30b | `explanation_incorrect_common` must contain exactly 1 `\n` | Universal |
| R30c | EC line 1 must end with `.` | Universal |
| R30d | EC line 2 must end with `.` | Universal |
| R31 | `items[]` must be sorted ascending by `item_id` | Universal |

---

### Level 4 — Extended Quality Rules (R32–R37)

These rules catch generation artifacts. All are universal — they detect patterns that signal low-quality output regardless of exam type.

| Rule | Check |
|------|-------|
| R32 | No truncated lines (trailing preposition before `.`, unclosed parenthesis at end, dangling symbol before `.`, line ending with `:` or `,`) |
| R33 | EC line 1 must not start with generic subjects: "El estudiante", "El usuario", "El reactivo", "La pregunta" |
| R34 | EC line 1 must not use instructional tone (`debe`, `no debe`, `hay que`, etc.) or narrative openings (`Para resolver`, `Se debe`, `Primero se`) |
| R35 | EI line 1 must not be purely numeric, and error description must be ≥30 characters |
| R36 | No line may be shorter than `min_line_length` characters | Config-driven |
| R37 | No semantic placeholders (single-operation labels, "Reconocimiento directo", "1 paso", "Patrón simple", etc.) |

---

### Risk-Based Audit (Step 3)

After all R rules pass, a subset of items is sampled for a deeper manual-style audit.

**Sample size:** `max(20, ceil(N × 0.15))` highest-risk items.

**Risk scoring:**

| Condition | Score |
|-----------|-------|
| Any line < 60 chars | +3 |
| Contains digits | +2 |
| Contains math symbols (`=×÷+−*/₡°→`) | +2 |
| Uppercase emphasis word | +1 |
| Open parenthesis `(` | +1 |
| Truncation pattern detected | +4 |
| Generic subject in EC line 1 | +4 |
| Instructional tone in EC line 1 | +3 |
| Semantic placeholder found | +5 |
| Error content < 40 chars | +3 |

**Audit-only checks (on the sampled items):**

| Check | Description |
|-------|-------------|
| A_R30a/c/d | EC structure and terminal punctuation |
| A_R23/24 | Prefix conformance on EI lines |
| A_R22 | Max line length |
| A_R27 | Prohibited substrings |
| A_R32 | Truncation patterns |
| A_R33/34 | Generic subject / instructional tone |
| A_R35 | Shallow or numeric error description |
| A_R36 | Min line length |
| A_R37 | Semantic placeholders |
| A1_SEMANTIC | Single-word sentence or bare number |
| A2_TRUNCATION | Line ending with `, .` or trailing em-dash |
| A3_ERROR_DEPTH | Error line lacks cognitive misconception identifier verb |

---

## engine_consistency.js — F rules

Section F checks run independently from the R rules. Both must pass before output is production-ready.

| Rule | Scope | Check |
|------|-------|-------|
| F01 | Intra-item | `explanation_correct` must not be identical to `explanation_incorrect_common` |
| F02 | Intra-item | EC line 1 must not start with `incorrect_line1_prefix` or `incorrect_line2_prefix` (field-swap guard) |
| F03 | Intra-item | Correction content (EI line 2, after prefix) must not equal Error content (EI line 1, after prefix) |
| F04 | Cross-item | No two items may share identical `explanation_correct` text |
| F05 | Cross-item | No two items may share identical `explanation_incorrect_common` text |
| F06 | Source alignment | `explanation_correct` must share ≥1 token of ≥4 characters with the source item's stem + justification + skill label |

**Why F02 matters:** If an explanation was accidentally placed in the wrong field, EC line 1 will start with the error prefix — a reliable swap signal.

**Why F06 matters:** Zero token overlap between an explanation and its source item usually indicates the explanation was generated for a different item (copy-paste error or model hallucination).

---

## Config-driven vs universal rules

| Behavior | Source |
|----------|--------|
| Error line prefix string | `exam_config.explanation_rules.incorrect_line1_prefix` |
| Correction line prefix string | `exam_config.explanation_rules.incorrect_line2_prefix` |
| EC line 1 regex pattern | `exam_config.explanation_rules.correct_line1_pattern` |
| Min and max line length | `exam_config.explanation_rules.min_line_length` / `max_line_length` |
| Prohibited substring list | `exam_config.explanation_rules.prohibited_substrings` |
| Forbidden word list | `exam_config.explanation_rules.forbidden_words` |
| All other rules | Hardcoded in the engine scripts |
