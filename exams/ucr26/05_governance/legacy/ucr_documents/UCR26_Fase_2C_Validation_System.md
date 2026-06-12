---
area: VALIDATION
confidentiality: INTERNAL
depends_on:
- UCR26_Fase_2A_Explanation_System.md
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: UCR26_Fase_2C_Validation_System.md
version:
  major: 1
  minor: 0
---

# F2 — Validation System

Status: ACTIVE  
Scope: Explanation System (F2)  
Authority: GOVERNED  

---

## Overview

This document defines the production-grade validation system for F2.

It ensures:

- zero false positives
- semantic compliance
- structural integrity

This system was introduced after detection of a false PASS in pipeline execution.

---

## Validation Layers

### Layer 1 — Structural Validation
- JSON parse
- required fields
- schema integrity

---

### Layer 2 — Integrity Validation
- 1:1 mapping with segments.training[]
- ordering by item_id
- no duplicates

---

### Layer 3 — Content Validation (R01–R31)

Defined in:

→ F2_Explanation-System_Spec_v1.md

---

### Layer 4 — Hardened Validation (R32–R37)

---

## R32 — No Truncated Sentences (BLOCKER)

A line is INVALID if it ends with ANY of the following:

- "de."
- "que."
- "con."
- "para."
- "y."
- "o."
- "ni."
- "a."

OR contains:

- open parentheses without closing
- trailing symbols: "=", "→", ":", "—"
- incomplete comparisons: "mayor que.", "menor que."

All lines must form a complete grammatical clause.

---

## R33 — No Generic Subjects (BLOCKER)

Forbidden in explanation_correct line 1:

- "El estudiante"
- "El usuario"
- "El reactivo"
- "La pregunta"

---

## R34 — Abstraction Consistency (BLOCKER)

explanation_correct line 1 MUST:

- NOT contain:
  - "El estudiante"
  - "El usuario"
  - "El reactivo"
  - "La pregunta"
  - "Se debe"
  - "Debe"
  - "Hay que"
  - "Es necesario"

- MUST:
  - start with a domain concept (not subject)
  - be impersonal
  - express a rule, not an instruction

If ANY violation:

→ FAIL

---

## R35 — Error Quality (BLOCKER)

explanation_incorrect_common line 1 MUST:

- include a verb from this set:
  ["confunde", "invierte", "omite", "generaliza", "aplica", "ignora", "escala", "compara", "asume"]

AND

- describe the type of reasoning failure

Forbidden:

- numeric-only expressions
- isolated operations
- results without explanation

If not compliant:

→ FAIL

---

## R36 — Minimum Length

Each line:

→ ≥ 40 characters

---

## R37 — No Placeholder Language

Forbidden:

- "1 operación."
- "Relación directa."
- "Reconocimiento directo."
- similar low-information phrases

---

## Audit System (Production)

Selection criteria (deterministic):

Include items where ANY condition is true:

- any line length < 60 chars
- contains digits
- contains symbols: = × ÷ ( )
- contains uppercase emphasis words
- contains known failure substrings

Sample size:

→ max(20 items, ceil(total_items × 0.15))

---

## Audit Rules

For each selected item:

Re-run ALL validation rules:

→ R01–R37

PLUS:

A1 — Sentence is semantically complete  
A2 — No truncated structure  
A3 — Error explanation names misconception type  

Any violation → AUDIT_FAIL

---

## Failure Policy

- Single violation → FAIL
- No partial approval
- Pipeline must restart from STEP 1

---

## Governance Rules

- This system is IMMUTABLE
- Any change requires:
  → new version (v2)
  → explicit approval

---

## Critical Note

This validation system is the enforcement layer of F2.

If it fails:

→ the entire pipeline becomes unreliable
