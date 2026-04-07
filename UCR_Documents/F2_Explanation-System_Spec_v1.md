# F2_Explanation-System_Spec_v1.md

**Status:** Active — Binding  
**Version:** v1  
**Scope:** segments.training exclusively  

---

## 1. Scope

The explanation system applies **exclusively** to items in `segments.training[]` of `bank_v1_enriched.json`.

- Items in `segments.diagnostic[]` are **excluded**
- Items in `segments.simulation.sim_1[]` are **excluded**
- Items in `segments.simulation.sim_2[]` are **excluded**

Any explanation referencing an item outside `segments.training[]` constitutes a structural violation and must be rejected.

---

## 2. Architecture

The explanation system is implemented as an **external file**, decoupled from the main dataset.

```
bank_v1_enriched.json          explanations_v1.json
└── segments.training[]   ←→   └── items[]
        item_id                       item_id  (1:1 mapping)
```

- **Mapping type:** 1:1 strict, via `item_id`
- **Lookup model:** Server-side, deterministic — no runtime inference
- **No embedded logic:** The file is static. No computed fields, no conditional values
- **Coupling point:** `item_id` is the sole join key between both files

---

## 3. Data Structure

### 3.1 Root Schema

```json
{
  "version": "v1",
  "items": [
    {
      "item_id": "string",
      "explanation_correct": "string",
      "explanation_incorrect_common": "string"
    }
  ]
}
```

### 3.2 Root Fields

| Field | Type | Required | Value |
|---|---|---|---|
| `version` | string | yes | exactly `"v1"` |
| `items` | array | yes | non-empty array of item objects |

No additional root keys are permitted.

### 3.3 Item Object Fields

| Field | Type | Required | Nullable |
|---|---|---|---|
| `item_id` | string | yes | no |
| `explanation_correct` | string | yes | no |
| `explanation_incorrect_common` | string | yes | no |

No additional keys are permitted in any item object.  
No field may be `null` or empty string `""`.

### 3.5 Ordering Requirement

`items[]` must be sorted **ascending by `item_id`** (lexicographic, case-sensitive).  
Any file where `items[]` is not in this order is non-compliant and must be rejected.

### 3.4 Full Example (2 items)

```json
{
  "version": "v1",
  "items": [
    {
      "item_id": "TRAIN-RCV-H2-001",
      "explanation_correct": "El factor modificable de mayor peso predictivo es la hipertensión arterial sostenida.\nEsta variable lidera el modelo de riesgo cardiovascular a 10 años.",
      "explanation_incorrect_common": "Error: confundir prevalencia de un factor con su peso predictivo.\nCorrección: prevalencia alta no implica mayor impacto en el modelo de riesgo."
    },
    {
      "item_id": "TRAIN-RCM-H4-007",
      "explanation_correct": "La distinción correcta es: emergencia hipertensiva implica daño a órgano blanco.\nEste criterio determina la vía terapéutica, no el valor tensional absoluto.",
      "explanation_incorrect_common": "Error: seleccionar manejo de urgencia cuando existe daño a órgano blanco.\nCorrección: daño a órgano blanco define emergencia, no urgencia hipertensiva."
    }
  ]
}
```

---

## 4. Content Model

### 4.1 Field: `explanation_correct`

**Format:** Regla + razón

- Line 1: states the correct rule or principle
- Line 2: states the reason or operative consequence

**Constraints:**
- Exactly 2 lines, separated by `\n`
- Each line ≤ 120 characters
- Line 1 must match: `/^[A-ZÁÉÍÓÚÑ][^?!]{10,}\.$/`
- Both lines must end with `.`
- No `?` or `!` characters allowed
- No ellipsis (`…` or `...`) at end of any line

**Example:**
```
"El factor modificable de mayor peso predictivo es la hipertensión arterial sostenida.\nEsta variable lidera el modelo de riesgo cardiovascular a 10 años."
```

### 4.2 Field: `explanation_incorrect_common`

**Format:** Error típico + corrección

- Line 1: must begin with `"Error:"`
- Line 2: must begin with `"Corrección:"`

**Constraints:**
- Exactly 2 lines, separated by `\n`
- Each line ≤ 120 characters
- No `?` or `!` characters allowed
- No ellipsis at end of any line

**Example:**
```
"Error: confundir prevalencia de un factor con su peso predictivo.\nCorrección: prevalencia alta no implica mayor impacto en el modelo de riesgo."
```

### 4.3 Global Content Restrictions

| Restriction | Detail |
|---|---|
| Max lines per field | 2 (enforced via exactly 1 `\n`) |
| Max chars per line | 120 |
| No narrative | Prohibited |
| No external context | Prohibited |
| No extra examples | Prohibited |
| No stylistic variation | All items must follow same format |
| Prohibited substrings | `"por ejemplo,"` `"cabe destacar"` `"es importante"` `"podemos ver"` `"nótese que"` |
| No HTML or markdown | No `<>`, `**`, `_`, `#`, `-` in field values |

---

## 5. Validation System

Validations execute in 3 ordered levels. Failure at any level blocks execution of the next.

### Execution Order

```
Level 1 — JSON Parse
Level 2 — Structural Rules       (requires Level 1 PASS)
Level 3 — Integrity Rules        (requires Level 2 PASS)
Level 4 — Content Rules          (requires Level 3 PASS)
```

---

### VALIDATION_RULES

#### STRUCTURAL
- R01: Root object must contain exactly 2 keys: `"version"` and `"items"`
- R02: `"version"` must be string, value must be exactly `"v1"`
- R03: `"items"` must be an array
- R04: `"items"` must not be empty
- R05: Each item must contain exactly 3 keys: `item_id`, `explanation_correct`, `explanation_incorrect_common`
- R06: No additional keys allowed in any item object
- R07: `"item_id"` must be type string, non-empty
- R08: `"explanation_correct"` must be type string, non-empty
- R09: `"explanation_incorrect_common"` must be type string, non-empty
- R10: No null values allowed in any field
- R11: No duplicate `"item_id"` values within the file
- R12: JSON must be strictly valid (no trailing commas, no comments)

#### INTEGRITY (scope: segments.training[] exclusively)
- R13: Source set is defined as: `bank_v1_enriched.json → segments.training[]` only
- R14: Every `item_id` in `explanations_v1.json` must exist in `segments.training[]`
- R15: Every `item_id` in `segments.training[]` must exist in `explanations_v1.json`
- R16: `count(explanations items)` must equal `count(segments.training items)`
- R17: Mapping must be exactly 1:1 — no `item_id` may appear more than once in either set
- R18: Any `item_id` belonging to `segments.diagnostic[]` found in explanations → FAIL
- R19: Any `item_id` belonging to `segments.simulation.sim_1[]` found in explanations → FAIL
- R20: Any `item_id` belonging to `segments.simulation.sim_2[]` found in explanations → FAIL

#### CONTENT
- R21: ~~Removed — covered by R30a/R30b~~
- R22: Each line must not exceed 120 characters
- R23: `"explanation_incorrect_common"` line 1 must begin with `"Error:"`
- R24: `"explanation_incorrect_common"` line 2 must begin with `"Corrección:"`
- R25: `"explanation_correct"` line 1 must match pattern: `/^[A-ZÁÉÍÓÚÑ][^?!]{10,}\.$/`
- R26: No line may end with `…` or equivalent ellipsis characters
- R27: Prohibited substrings: `["por ejemplo,", "cabe destacar", "es importante", "podemos ver", "nótese que"]`
- R28: No line may contain `?` character
- R29: No HTML or markdown syntax allowed
- R30a: Every `"explanation_correct"` value must contain exactly 1 `"\n"` character
- R30b: Every `"explanation_incorrect_common"` value must contain exactly 1 `"\n"` character
- R30c: Line 1 of `"explanation_correct"` must end with `"."`
- R30d: Line 2 of `"explanation_correct"` must end with `"."`
- R31: `items[]` must be sorted ascending by `item_id` (lexicographic, case-sensitive)

---

### FAIL_CONDITIONS

#### STRUCTURAL
- F01: Missing any of: `"version"`, `"items"` at root level
- F02: Extra key found at root level
- F03: `"version"` value is not exactly `"v1"`
- F04: `"items"` is null, absent, or empty array
- F05: Any item missing one or more of the 3 required keys
- F06: Any item containing keys beyond the 3 required
- F07: Any field value is null or empty string `""`
- F08: Duplicate `item_id` found within the file
- F09: JSON parse error of any kind

#### INTEGRITY
- F10: Any `item_id` in explanations not found in `segments.training[]`
- F11: Any `item_id` in `segments.training[]` not found in explanations
- F12: `count(explanations)` ≠ `count(segments.training)`
- F13: Any `item_id` found in explanations that belongs to `segments.diagnostic[]`
- F14: Any `item_id` found in explanations that belongs to `segments.simulation.sim_1[]`
- F15: Any `item_id` found in explanations that belongs to `segments.simulation.sim_2[]`

#### CONTENT
- F16: ~~Removed — covered by F25 (R30a/R30b)~~
- F17: Any single line exceeds 120 characters
- F18: `"explanation_incorrect_common"` line 1 does not start with `"Error:"`
- F19: `"explanation_incorrect_common"` line 2 does not start with `"Corrección:"`
- F20: `"explanation_correct"` line 1 does not match required pattern
- F21: Any prohibited substring detected in any field
- F22: Any `?` character found in any field
- F23: Any HTML or markdown syntax detected in any field
- F24: Ellipsis character found at end of any line
- F25: Any field does not contain exactly 1 `"\n"` character
- F26: Line 1 or line 2 of `"explanation_correct"` does not end with `"."`
- F27: `items[]` is not sorted ascending by `item_id` (lexicographic, case-sensitive)

---

### PASS_CRITERIA

#### STRUCTURAL
- P01: Root contains exactly 2 keys: `"version"` and `"items"`
- P02: `"version"` === `"v1"`
- P03: `"items"` is a non-empty array
- P04: Every item has exactly 3 keys: `item_id`, `explanation_correct`, `explanation_incorrect_common`
- P05: All field values are non-null, non-empty strings
- P06: Zero duplicate `item_id` values within the file
- P07: JSON parses without error

#### INTEGRITY
- P08: Source set confirmed as `segments.training[]` — no other segment used
- P09: Every `item_id` in explanations maps to exactly one `item_id` in `segments.training[]`
- P10: Every `item_id` in `segments.training[]` maps to exactly one `item_id` in explanations
- P11: `count(explanations)` === `count(segments.training)`
- P12: Zero `item_id` values from `segments.diagnostic[]` present in explanations
- P13: Zero `item_id` values from `segments.simulation.sim_1[]` present in explanations
- P14: Zero `item_id` values from `segments.simulation.sim_2[]` present in explanations

#### CONTENT
- P15: All field values contain exactly 1 `"\n"` (exactly 2 lines)
- P16: All lines ≤ 120 characters
- P17: All `"explanation_incorrect_common"` follow format: line1=`"Error: ..."`, line2=`"Corrección: ..."`
- P18: All `"explanation_correct"` line 1 matches pattern `/^[A-ZÁÉÍÓÚÑ][^?!]{10,}\.$/`
- P19: Zero prohibited substrings across all fields
- P20: Zero `?` characters in any field
- P21: Zero HTML or markdown syntax in any field
- P22: All lines in `"explanation_correct"` end with `"."`
- P23: `items[]` is sorted ascending by `item_id` (lexicographic, case-sensitive)

---

## 6. Pipeline

```
STEP 1 — GENERATION
  Input (permitted fields only):
    - item.item_id
    - item.content.stem
    - item.content.correct_answer
    - item.content.justification
    - item.metadata.skill
    - item.metadata.error_type
  Prohibited: any field not listed above may not be read or used
  Action: For each item in segments.training[], sorted ascending by item_id,
          produce one explanation object containing:
          item_id, explanation_correct, explanation_incorrect_common
  Output: candidate explanations_v1.json with items[] sorted ascending by item_id
  Constraint: No item from segments.diagnostic[] or segments.simulation[] may be processed
  Failure policy:
    - If any single item fails to produce a valid explanation object → entire file rejected
    - No partial output is permitted
    - No partial regeneration is permitted
    - Pipeline halts at STEP 1 — STEP 2 does not execute

STEP 2 — VALIDATION
  Input:  candidate explanations_v1.json + bank_v1_enriched.json
  Action: Execute validation levels 1→2→3→4 sequentially
  Output: PASS report or FAIL report with specific rule ID(s) and item_id references
  Constraint: Any FAIL blocks pipeline — file is not promoted

STEP 3 — AUDIT
  Input:  PASS report + explanations_v1.json
  Sample size: ceil(count(items) × 0.10) — rounded up, no exceptions
  Sample selection: first N items from items[] ordered ascending by item_id
  Checklist (binary — each item in sample must pass all checks):
    [ ] explanation_correct contains exactly 1 \n
    [ ] explanation_correct line 1 ends with "."
    [ ] explanation_correct line 2 ends with "."
    [ ] explanation_incorrect_common line 1 begins with "Error:"
    [ ] explanation_incorrect_common line 2 begins with "Corrección:"
    [ ] No line exceeds 120 characters
    [ ] No prohibited substring present
  Output: AUDIT_PASS (all sampled items pass all checks)
          AUDIT_FAIL with item_id and failed check ID for each failure
  Constraint: Any single checklist failure in any sampled item → AUDIT_FAIL

STEP 4 — APPROVAL
  Input:  AUDIT_PASS + explanations_v1.json
  Action: Authorized sign-off before file is promoted to production
  Output: Approved explanations_v1.json — ready for server-side use
  Constraint: No file may enter production without explicit approval
```

---

## 7. Governance Rules

### What Invalidates the System

| Condition | Result |
|---|---|
| Any `item_id` in explanations not in `segments.training[]` | File invalid |
| Any `item_id` from diagnostic or simulation present in explanations | File invalid |
| `count(explanations)` ≠ `count(segments.training)` | File invalid |
| Any field value is null, empty, or missing | File invalid |
| Any content rule violation (lines, prefixes, prohibited substrings) | File invalid |
| JSON is not strictly valid | File invalid |
| Duplicate `item_id` within the file | File invalid |

### When Build Must Be Blocked

- Any validation level produces one or more FAIL conditions → **build blocked**
- Audit returns AUDIT_FAIL → **build blocked**
- Approval step not completed → **build blocked**
- `bank_v1_enriched.json` is updated and `explanations_v1.json` is not regenerated and re-validated → **build blocked**

### Immutability Rules

- `item_id` values are immutable — they must match the source dataset exactly
- `version` value is immutable within v1 — any schema change requires a new versioned file
- Approved `explanations_v1.json` may not be modified in place — changes require full pipeline re-execution

### Dependency

- `explanations_v1.json` is strictly dependent on `bank_v1_enriched.json`
- Any change to `segments.training[]` in the dataset (add, remove, modify `item_id`) requires full regeneration and re-validation of `explanations_v1.json`
- The two files must always be validated as a pair — neither is independently valid in isolation

---

## 8. Generation Prompt Specification

### 8.1 Prompt Template

The following template is fixed and immutable. No modification is permitted between runs.

```
SYSTEM:
You are a deterministic text generator. You produce structured JSON output only.
You do not add explanation, commentary, examples, or any text outside the JSON object.
You do not use creativity. You follow the output format exactly.

USER:
Generate an explanation object for the following training item.

INPUT:
- item_id: {{item_id}}
- stem: {{content.stem}}
- correct_answer: {{content.correct_answer}}
- justification: {{content.justification}}
- skill: {{metadata.skill}}
- error_type: {{metadata.error_type}}

OUTPUT FORMAT (strict — return this object and nothing else):
{
  "item_id": "{{item_id}}",
  "explanation_correct": "<line 1: rule or principle, ends with period>\n<line 2: reason or operative consequence, ends with period>",
  "explanation_incorrect_common": "Error: <line 1: common error, ends with period>\nCorrección: <line 2: correction, ends with period>"
}

CONSTRAINTS:
- explanation_correct: exactly 2 lines separated by \n, each ending with ".", no "?" or "!" allowed
- explanation_incorrect_common: line 1 must begin with "Error:", line 2 must begin with "Corrección:"
- Each line must not exceed 120 characters
- No narrative, no external context, no additional examples
- No prohibited substrings: "por ejemplo,", "cabe destacar", "es importante", "podemos ver", "nótese que"
- No HTML or markdown syntax
- Return only the JSON object — no text before or after
- explanation_correct line 1 MUST express a generalizable rule or principle
- It MUST NOT reference the specific answer choice (A, B, C, or D)
- Forbidden patterns in explanation_correct: "La opción correcta es", "La respuesta correcta es", and any direct reference to A, B, C, or D as answer labels
- explanation_correct line 1 must be abstract and transferable to similar items — it must describe the cognitive rule, not the answer outcome
- explanation_correct line 2 must connect the rule to the specific item context — it must explain why the rule applies in this case
- explanation must be transferable: it should remain valid for structurally similar items, not only the current one
- Any explanation that only states correctness without explaining the underlying rule is INVALID
```

### 8.2 Input Binding

| Template variable | Source field in `bank_v1_enriched.json` |
|---|---|
| `{{item_id}}` | `item.item_id` |
| `{{content.stem}}` | `item.content.stem` |
| `{{content.correct_answer}}` | `item.content.correct_answer` |
| `{{content.justification}}` | `item.content.justification` |
| `{{metadata.skill}}` | `item.metadata.skill` |
| `{{metadata.error_type}}` | `item.metadata.error_type` |

**Prohibited:** Any field not listed above must not be read, injected, or referenced in the prompt.

### 8.3 Prompt Rules

| Rule | Value |
|---|---|
| Creativity | Prohibited |
| External context | Prohibited |
| Additional examples | Prohibited |
| Narrative | Prohibited |
| Output format compliance | Mandatory — must match Section 4 Content Model exactly |
| Prefix compliance | Mandatory — `"Error:"` / `"Corrección:"` required |
| Output parseability | Output must be directly parseable as JSON with no preprocessing |
| Extra text | Prohibited — no text before or after the JSON object |

### 8.4 Determinism Parameters

These parameters must be applied to every LLM call in STEP 1. No exceptions.

| Parameter | Value |
|---|---|
| `temperature` | `0` |
| `top_p` | `1` |
| `top_k` | `1` (if supported by model) |
| `seed` | Fixed value per run batch (same seed for all items in one generation run) |
| Random sampling | Disabled |

**Guarantee:** Given identical input fields and these parameters, the model must produce identical output across executions.

### 8.5 Failure Handling (Generation)

For each item processed in STEP 1, the raw model output is evaluated before the item is accepted:

```
FOR each item in segments.training[]:
  1. Submit prompt with bound input fields
  2. Receive raw output string
  3. Attempt JSON.parse(raw_output)
     → If parse fails: item is INVALID
  4. Validate parsed object structure:
     → Must contain exactly 3 keys: item_id, explanation_correct, explanation_incorrect_common
     → item_id must match the input item_id exactly
     → If structure invalid: item is INVALID
  5. If item is INVALID:
     → Entire generation run is REJECTED
     → No partial file is written
     → No partial regeneration is attempted
     → Pipeline halts — STEP 2 does not execute
     → Error report must include: item_id, failure reason
  6. Semantic validation (pre-validation stage):
     → If explanation_correct contains:
        - any reference to answer labels A, B, C, or D
        - the phrase "La opción correcta es"
        - the phrase "La respuesta correcta es"
        - any phrase indicating answer selection instead of rule abstraction
     → item is INVALID (same consequences as step 5)
```

**Policy:** A single invalid item output invalidates the entire generation run. There is no retry per item. The full pipeline must be restarted from STEP 1 with corrected inputs or prompt.

---

*This document is binding. Any implementation diverging from this specification is non-compliant.*

---

## 9. Runtime Rendering Contract

The explanation system is server-authoritative and display-only in the client.

---

### Rendering Conditions

- Explanation is rendered ONLY after answer submission.
- Explanation is rendered ONLY if feedback is visible.
- Explanation MUST NOT render in pre-answer state.

---

### Display Position

Explanation appears:

- After feedback
- Before continuation action

Order is strictly enforced:

```
feedback → explanation → continue
```

---

### Scope

- Applies exclusively to `segments.training[]`
- Must NOT render in:
  - diagnostic
  - simulation

---

### Client Constraints

The client MUST:

- NOT compute explanation
- NOT modify explanation content
- NOT fetch explanation directly
- NOT cache explanation

The client is display-only.

---

### Server Authority

- Explanation content originates exclusively from:
  → `explanations_v1.json`

- Retrieved via:
  → `getExplanationByItemId(item_id)`

- Delivered via:
  → server action (`submitItemAnswer`)

---

### Failure Conditions

System MUST throw error if:

- explanation is missing
- explanation is null when feedback is visible
- item_id not found in explanation store

No fallback allowed.

---

### Determinism

- Same `item_id` MUST always produce identical explanation
- explanation store MUST be immutable
