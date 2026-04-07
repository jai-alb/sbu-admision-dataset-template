---
area: DATA_SCHEMA
confidentiality: INTERNAL
depends_on:
- UCR26_Fase_5A_Governance_Bank-Build.md
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: UCR26_Fase_5B_Data-Schema_Bank-Enriched.md
version:
  major: 1
  minor: 0
---

# F5_Data-Schema_Bank-Enriched.md

## Scope

Define the exact data schema for `bank_v1_enriched.json`.

This document is binding. No field outside this schema is allowed.

------------------------------------------------------------------------

## Root Structure

``` json
{
  "version": "v1",
  "generated_at": "ISO-8601",
  "total_items": number,
  "segments": {
    "diagnostic": [],
    "simulation": {
      "sim_1": [],
      "sim_2": []
    },
    "training": []
  }
}
```

------------------------------------------------------------------------

## Item Structure (Mandatory)

``` json
{
  "item_id": "string",
  "item_type": "diagnostic | simulation | training",
  "simulation_id": "sim_1 | sim_2 | null",

  "content": {
    "stem": "string",
    "options": {
      "A": "string",
      "B": "string",
      "C": "string",
      "D": "string"
    },
    "correct_answer": "A | B | C | D",
    "justification": "string"
  },

  "metadata": {
    "macro_area": "RCV | RCM",
    "skill": "H2 | H3 | H4 | H5 | H6 | H7",
    "difficulty": 1 | 2 | 3,
    "h1": "low | medium | high",
    "estimated_time_sec": number,
    "error_type": "string"
  },

  "traceability": {
    "template_id": "string",
    "prompt_id": "string",
    "source_batch_id": "string"
  }
}
```

------------------------------------------------------------------------

## Field Rules

### item_id

-   Unique globally
-   Immutable

### item_type

-   Must match original segment
-   Immutable

### simulation_id

-   Required if item_type = simulation
-   Null otherwise
-   Not derived in Phase 5 → mandatory input from Phase 4B

------------------------------------------------------------------------

## Content Rules

-   No modification allowed from Phase 4B
-   All fields mandatory
-   Options must remain exactly 4

------------------------------------------------------------------------

## Metadata Rules

-   Must match Phase 4B exactly
-   No recalculation allowed
-   No inference or enrichment beyond formatting

------------------------------------------------------------------------

## Traceability Rules

-   All fields mandatory
-   Must map to real existing values from Phase 4A
-   No synthetic IDs allowed

------------------------------------------------------------------------

## Normalization Rules

Allowed: - Enum standardization (e.g. H1 → high) - Key naming
consistency - Ordering of fields

Not allowed: - Changing meaning of any field - Dropping fields - Merging
fields

------------------------------------------------------------------------

## Prohibited Fields

-   Any scoring field
-   Any percentile
-   Any ranking
-   Any derived cognitive metric
-   Any user-related data

------------------------------------------------------------------------

## Integrity Constraints

-   100% items must comply with schema
-   No nulls except simulation_id when not applicable
-   No extra fields allowed
-   JSON must be strictly valid

------------------------------------------------------------------------

## Final Rule

If schema violation exists: → dataset invalid → build must be blocked
