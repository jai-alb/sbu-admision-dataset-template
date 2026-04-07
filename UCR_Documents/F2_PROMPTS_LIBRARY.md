# F2 — Prompt Library

Status: ACTIVE  
Scope: Explanation System (F2)  
Authority: GOVERNED  

---

## Prompt v3 — Generation (Hardened · Semantic Purge)

**Status:** Approved  
**Usage:** STEP 1 — GENERATION  
**Scope:** segments.training[] only  
**Determinism:** Required  

---

### Description

This prompt enforces strict semantic abstraction and eliminates contextual anchoring.

It introduces:

- Forbidden word enforcement
- Prefix strictness
- Semantic purity constraints
- Pre-output validation

This version is required after failure of v1 and v2 due to semantic leakage.

---

### Prompt (IMMUTABLE)

```
ROLE

You are a deterministic execution agent.

You enforce strict semantic compliance.
You do not approximate.
You do not allow forbidden language.

Any violation = FAIL.

---

CONTEXT

Authority:

→ F2_Explanation-System_Spec_v1.md

All rules are binding.

---

OBJECTIVE

Re-execute STEP 1 — GENERATION

Scope:

→ SAME TEST BATCH (first 10 items from segments.training[])

---

INPUT

1. Load bank_v1_enriched.json
2. Extract segments.training[]
3. Sort ascending by item_id
4. Select first 10 items ONLY

---

TASK

Generate FULL explanations_v1.json (10 items)

Regenerate from scratch.

---

CRITICAL HARD CONSTRAINTS

### 1. PREFIX (BLOCKER)

Must be EXACT:

- "Error:"
- "Corrección:"

No variation allowed.

---

### 2. FORBIDDEN WORDS (ZERO TOLERANCE)

The following words are STRICTLY PROHIBITED anywhere:

- "texto"
- "enunciado"
- "opcion"
- "opciones"
- "pregunta"
- "problema"

If ANY appears → FAIL

---

### 3. REQUIRED REPLACEMENT LOGIC

Instead of forbidden words, you MUST use abstract language:

Replace:

- "enunciado" → "planteamiento"
- "texto" → "contenido"
- "opción" → "alternativa"
- "problema" → "situación"

But:

→ Prefer eliminating the reference entirely

---

### 4. explanation_correct — RULE PURITY (BLOCKER)

Line 1 MUST be:

- Fully abstract
- Domain-level rule
- No contextual anchor
- No reference to:
  - source
  - content
  - item
  - wording

GOOD:

- "La idea principal se define como la síntesis de información sin adiciones externas."

BAD:

- "La idea principal del contenido..."
- "En el planteamiento..."
- "Según el contenido..."

---

### 5. explanation_correct — LINE 2

- Applies rule to case
- Still NO forbidden words
- No contextual anchors like:
  - "en este caso"
  - "aquí"
  - "este"

---

### 6. STRUCTURE (STRICT)

Each field:

- Exactly 2 lines
- Exactly 1 "\n"
- Each line ≤120 chars
- Each line ends with "."

---

### 7. CONSISTENCY

All 10 items must:

- Use same abstraction level
- Same tone
- Same structure

No variation.

---

### 8. PRE-OUTPUT VALIDATION (MANDATORY)

For EACH item:

Check:

- Contains "Corrección:" exactly
- Does NOT contain any forbidden word
- Does NOT contain:
  - "este"
  - "esta"
  - "aqui"
  - "en este caso"

- explanation_correct line 1 is abstract
- Line count = 2
- "\n" count = 1 per field
- All lines end with "."

If ANY check fails:

→ RETURN:

FAIL
item_id: <id>
reason: forbidden_word_or_semantic_violation

---

OUTPUT FORMAT

Return ONLY:

{
  "version": "v1",
  "items": [ ...10 items... ]
}

No extra text.

---

FAIL POLICY

Single violation = total FAIL.

No partial output.

---

EXECUTE
```

---

### Governance Rules

- This prompt is IMMUTABLE
- No inline edits allowed
- Any change requires:
  → new version (v5)
  → explicit approval

---

### Failure History

- v1 → FAIL (semantic weakness)
- v2 → FAIL (context leakage + prefix inconsistency)
- v3 → PASS (test batch validated)

---

### Critical Notes

- This prompt MUST be used for:
  → full batch generation
- Any deviation risks:
  → dataset contamination
  → full pipeline invalidation

---

## Prompt v4 — Generation (Production Hardened)

**Status:** Approved  
**Replaces:** v3 for full batch  
**Reason:** Validation upgrade — rules R32–R37 require stricter generation constraints  
**Usage:** STEP 1 — GENERATION  
**Scope:** segments.training[] only  
**Determinism:** Required  

---

### Description

Prompt v4 extends v3 with production-grade constraints that eliminate:

- Truncated sentences (R32)
- Generic/instructional subjects in explanation_correct line 1 (R33, R34)
- Weak error descriptions that state only operations or results (R35)
- Lines under 40 characters (R36)
- Semantic placeholder phrases (R37)

All constraints from v3 remain in force. v4 adds hard blockers on top.

---

### Prompt (IMMUTABLE)

```
ROLE

You are a deterministic execution agent.

You enforce strict semantic compliance.
You do not approximate.
You do not allow forbidden language.
You do not allow truncated output.
You do not allow placeholder language.

Any violation = FAIL.

---

CONTEXT

Authority:

→ F2_Explanation-System_Spec_v1.md

All rules are binding.

---

OBJECTIVE

Execute STEP 1 — GENERATION

Scope:

→ ALL items in segments.training[]
→ Sorted ascending by item_id (lexicographic, case-sensitive)

---

INPUT

1. Load bank_v1_enriched.json
2. Extract segments.training[]
3. Sort ascending by item_id
4. Process ALL items

Permitted input fields per item (ONLY these):

- item_id
- content.stem
- content.correct_answer
- content.justification
- metadata.skill
- metadata.error_type

Do NOT read or reference any other field.

---

TASK

Generate FULL explanations_v1.json

---

OUTPUT SCHEMA (STRICT)

{
  "version": "v1",
  "items": [
    {
      "item_id": "<exact from source>",
      "explanation_correct": "<line 1>\n<line 2>",
      "explanation_incorrect_common": "Error: <line 1>\nCorrección: <line 2>"
    }
  ]
}

No extra keys. No extra text before or after the JSON object.

---

## HARD CONSTRAINTS — ALL ARE BLOCKERS

---

### C1 — PREFIX EXACTNESS

explanation_incorrect_common MUST contain:

- Line 1 starting with: "Error:"
- Line 2 starting with: "Corrección:"

No variation. No accent omission.

---

### C2 — FORBIDDEN WORDS (ZERO TOLERANCE)

Prohibited anywhere in output:

- "texto"
- "enunciado"
- "opcion"
- "opciones"
- "pregunta"
- "problema"

Required replacements:

- "enunciado" → "planteamiento"
- "texto" → "contenido"
- "opción" → "alternativa"
- "problema" → "situación"

Preference: eliminate the reference entirely.

---

### C3 — SEMANTIC PURITY (explanation_correct LINE 1)

Line 1 of explanation_correct MUST be:

- Fully abstract
- A transferable domain-level rule or principle
- Impersonal phrasing (no agent)
- No contextual anchor

REQUIRED style:

- "La proporcionalidad directa se resuelve calculando la tasa unitaria antes de escalar."
- "Identificar la relación entre magnitudes dependientes evita la inversión del sistema."
- "El conector adecuado refleja la relación lógica real entre las proposiciones que une."

FORBIDDEN patterns in line 1:

- "El estudiante..."
- "El usuario..."
- "El reactivo..."
- "La pregunta..."
- "Se debe..."
- "Debes..."
- "Hay que..."
- Any phrasing that refers to the specific item content directly

---

### C4 — NO INSTRUCTIONAL TONE

explanation_correct line 1 MUST NOT contain:

- "debe"
- "no debe"
- "hay que"
- "es necesario"

Line 1 states a RULE, not an instruction.

Wrong: "El estudiante debe identificar la tasa antes de multiplicar."
Right: "La proporcionalidad directa requiere calcular la tasa unitaria antes de escalar."

---

### C5 — ERROR QUALITY

explanation_incorrect_common line 1 MUST:

- Name the TYPE of cognitive mistake
- Use a verb that identifies the failure mode:
  - confunde, invierte, omite, generaliza, aplica, ignora, escala, compara, asume

REQUIRED style:

- "Error: Confunde proporcionalidad directa con inversa al escalar la cantidad."
- "Error: Invierte la asignación de variables al construir el sistema de ecuaciones."
- "Error: Generaliza la diferencia entre un par de términos sin verificar todos los pares."

FORBIDDEN:

- Pure numeric operations: "Error: 18×2=36."
- Bare result: "Error: 25500÷3500≈7."
- Single operation without context: "Error: Divide entre 4."
- Computational description without naming the misconception

---

### C6 — LENGTH ENFORCEMENT

Every line (explanation_correct lines 1 and 2, explanation_incorrect_common lines 1 and 2) MUST:

→ be ≥ 40 characters
→ be ≤ 120 characters

If any line is under 40 characters: INVALID.

This eliminates trivial outputs such as:

- "Dividir por 2."
- "1 operación."
- "Relación directa."
- "Reconocimiento directo."

---

### C7 — NO TRUNCATED SENTENCES

Each line MUST be a complete sentence.

A line is INVALID if it:

- ends with a connector: "de.", "que.", "con.", "para.", "y.", "o.", "ni."
- ends with an unclosed parenthesis: "(texto."
- contains an unfinished comparison: "mayor que."
- ends with a dangling symbol: "→.", ":.", "—."

Every period MUST close a grammatically complete clause.

---

### C8 — NO PLACEHOLDER LANGUAGE

Prohibited phrases anywhere in output:

- "1 operación."
- "Reconocimiento directo."
- "Relación directa."
- "Relación explícita."
- "Sin variable oculta."
- "1 paso."
- "Patrón simple."
- "Dividir por 2." (or any bare arithmetic instruction without context)

Replace any such phrase with a complete conceptual statement.

---

### C9 — MINIMUM SEMANTIC DENSITY

Each line MUST contain at least one conceptual term that identifies the domain or operation type.

Examples of required conceptual terms:

- proporcionalidad, tasa, razón, relación, variable, magnitud
- patrón, secuencia, diferencia, razón constante
- inferencia, idea principal, paráfrasis, conector
- ángulo, fórmula, propiedad, transformación

A line that contains only specific numbers, answer labels, or vague phrases is INVALID.

---

### C10 — CONTEXTUAL ANCHORS FORBIDDEN

No line may contain:

- "en este caso"
- "aquí"
- "aqui"
- "este" (as standalone demonstrative adjective or pronoun)
- "esta" (as standalone demonstrative)

---

### C11 — ANSWER LABELS FORBIDDEN

explanation_correct lines 1 and 2 MUST NOT reference:

- Specific answer labels: A, B, C, D (as standalone characters)
- Phrases: "La opción correcta es", "La respuesta correcta es"
- Direct reference to which option was selected

explanation_correct MUST describe the rule, not the answer outcome.

---

## PRE-OUTPUT SELF-VALIDATION (MANDATORY — ALL CHECKS)

Before emitting each item, verify ALL of the following:

1. [ ] item_id matches source exactly
2. [ ] explanation_correct contains exactly 1 "\n"
3. [ ] explanation_incorrect_common contains exactly 1 "\n"
4. [ ] explanation_correct line 1 ends with "."
5. [ ] explanation_correct line 2 ends with "."
6. [ ] explanation_incorrect_common line 1 ends with "."
7. [ ] explanation_incorrect_common line 2 ends with "."
8. [ ] explanation_incorrect_common line 1 starts with "Error:"
9. [ ] explanation_incorrect_common line 2 starts with "Corrección:"
10. [ ] No forbidden word (C2) appears anywhere
11. [ ] explanation_correct line 1 contains NO generic subject (C3)
12. [ ] explanation_correct line 1 contains NO instructional verb (C4): debe, no debe, hay que
13. [ ] explanation_incorrect_common line 1 names a cognitive error type (C5)
14. [ ] All 4 lines are ≥ 40 characters (C6)
15. [ ] All 4 lines are ≤ 120 characters (C6)
16. [ ] No line ends with truncated structure (C7)
17. [ ] No placeholder phrase present (C8)
18. [ ] Each line contains at least one conceptual term (C9)
19. [ ] No contextual anchor present (C10)
20. [ ] No answer label A/B/C/D in explanation_correct (C11)

If ANY check fails:

→ DO NOT emit item
→ RETURN:

FAIL
item_id: <id>
check: <number>
reason: <description>

---

## FAIL POLICY

Single violation in any item = total FAIL.

No partial output.
No retry per item.
Full pipeline must restart from STEP 1.

---

## OUTPUT FORMAT

Return ONLY:

{
  "version": "v1",
  "items": [ ...all items... ]
}

No text before. No text after. No comments.

---

EXECUTE
```

---

### Governance Rules

- This prompt is IMMUTABLE
- No inline edits allowed
- Any change requires:
  → new version (v5)
  → explicit approval

---

### Failure History

- v1 → FAIL (semantic weakness)
- v2 → FAIL (context leakage + prefix inconsistency)
- v3 → FAIL (validation upgrade R32–R37 exposed 106 violations)
- v4 → Pending first full run
