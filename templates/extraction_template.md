# Phase 1 — Structural Extraction Guide

This template explains how to complete the structural extraction for each item in `01_extraction/`.

The extraction assigns metadata to each raw item: skill, difficulty level, cognitive load, and error type. This metadata drives all downstream generation and validation.

---

## Output file

For each source version, create a corresponding extraction file:

```
exams/<exam-id>/01_extraction/extraction_v1.md
```

---

## Per-item extraction format

```
## ITEM_001

**Skill:** [skill ID from exam_config.skill_taxonomy — e.g., H2]
**Macro area:** [macro area ID — e.g., RCM]
**Difficulty level:** [L1 | L2 | L3]
**Cognitive load (H1):** [baja | media | alta]  ← omit if your exam has no H1 dimension
**Reasoning type:** [brief label — e.g., "Algebraic translation", "Pattern detection"]
**Distractor type:** [brief label — e.g., "Invalid inference", "Proportionality confusion"]
**Recurring trap:** [one sentence — the specific misconception this item exploits]

**Justification:**
- paso_critico: [The key conceptual step required to solve this item correctly. 1-2 sentences.]
- error_tipico: [The most common mistake students make on this item. 1-2 sentences.]

---
```

---

## Field definitions

| Field | Description |
|-------|-------------|
| **Skill** | The primary cognitive skill being evaluated. Must match a key in `exam_config.skill_taxonomy`. |
| **Macro area** | The broad domain the skill belongs to. Must match an id in `exam_config.macro_areas`. |
| **Difficulty level** | L1 (basic), L2 (intermediate), L3 (high discrimination). Defined in `exam_config.difficulty_levels`. |
| **Cognitive load** | Only if your exam uses a cross-cutting load dimension (like H1). Values: baja / media / alta. |
| **Reasoning type** | A short label for the cognitive operation required. Used in pattern registry. |
| **Distractor type** | A short label for the type of wrong answer presented. |
| **Recurring trap** | The specific misconception exploited by the distractors. This becomes `error_tipico` in the dataset. |
| **paso_critico** | The key insight or step required to reach the correct answer. Used in explanation generation. |
| **error_tipico** | The most common student error on this item. Used in explanation generation. |

---

## Classification rules

### Skill assignment
- Assign **one primary skill** per item.
- If the item uses multiple skills, assign the one that is the primary discriminator (the one students most commonly fail on).
- When uncertain between two skills, check the `exam_config.skill_taxonomy` descriptions and pick the closer match. Log the ambiguity in `05_governance/Decision_Log.md`.

### Difficulty assignment
- **L1**: A student who understands the skill can solve it in one direct step with no inference chain.
- **L2**: Requires two chained operations or one intermediate inference. Distractors are plausible.
- **L3**: Requires strong inference or recognizing a structural trap. Distractors are highly plausible and exploit a specific misconception.

### paso_critico vs error_tipico
- `paso_critico`: written as a **rule or principle** (impersonal, declarative). Example: *"La proporcionalidad requiere calcular la tasa unitaria antes de escalar."*
- `error_tipico`: written as a **behavior or action** (what the student does wrong). Example: *"Multiplicar directamente sin calcular la tasa unitaria."*

---

## Example (Spanish exam)

```
## ITEM_001

**Skill:** H6
**Macro area:** RCM
**Difficulty level:** L2
**Cognitive load (H1):** media
**Reasoning type:** Proportional scaling
**Distractor type:** Direct multiplication without unit rate
**Recurring trap:** Multiplying total by new quantity without first establishing the unit rate

**Justification:**
- paso_critico: La proporcionalidad directa requiere establecer la tasa unitaria dividiendo el total entre la cantidad base, y luego multiplicar por la nueva cantidad.
- error_tipico: Multiplicar directamente el valor dado por el nuevo factor sin establecer la relación unitaria, produciendo un resultado no proporcional.

---
```

---

## After completing the extraction

→ Proceed to `02_pattern_registry/` to document structural patterns.
→ Then build `03_item_production/dataset_v1.json` using the extraction data.
→ Then run: `node engine/engine_pipeline.js --exam exams/<exam-id>/exam_config.json`
