---
area: GOVERNANCE
confidentiality: INTERNAL
depends_on:
- UCR26_Fase_4B_Bank_System.md
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: UCR26_Fase_5A_Governance_Bank_Build.md
version:
  major: 1
  minor: 0
---

# F5_Governance_Bank-Build.md

## Scope

Define the governance rules for Phase 5: construction of
`bank_v1_enriched.json`.

This document is binding. If a rule is not here, it does not exist.

------------------------------------------------------------------------

## Objective

Transform approved batches (Phase 4B) into a single, consumable,
immutable dataset.

No semantic modification of items is allowed.

------------------------------------------------------------------------

## Inputs

-   Approved items from Phase 4B
-   STRAT_Content-Blueprint
-   PROD_Item-System-Design
-   UCR26_Fase_4B_Bank-System

------------------------------------------------------------------------

## Output

-   `bank_v1_enriched.json`

Single source of truth for: - diagnostic - simulations - training

------------------------------------------------------------------------

## Core Rules

1.  No item modification (stem, options, answer, justification)
2.  No reclassification (skill, difficulty, H1)
3.  No cross-segment movement
4.  No duplication introduction
5.  Full traceability must be preserved
6.  simulation_id is a pre-existing, mandatory field from Phase 4B
7.  Simulation assignment MUST originate from Phase 4B output. No inference, repartition, or rebalancing is allowed in Phase 5.

------------------------------------------------------------------------

## Allowed Transformations

-   Metadata normalization
-   Field formatting
-   ID standardization
-   Structural wrapping for JSON

------------------------------------------------------------------------

## Prohibited Actions

-   Rewriting items
-   Changing difficulty
-   Changing skill
-   Adding new cognitive tags
-   Removing metadata
-   Mixing segments

------------------------------------------------------------------------

## Integrity Constraints

-   100% items must come from Phase 4B (approved)
-   Segment isolation must remain intact
-   Traceability fields must remain complete
-   No loss of information allowed

------------------------------------------------------------------------

## Blocking Conditions

-   Missing metadata
-   Broken traceability
-   If simulation_id is missing in any item → build must stop
-   Segment contamination
-   Count mismatch vs STRAT
-   Any transformation affecting semantics

------------------------------------------------------------------------

## Acceptance Criteria

-   Dataset complete
-   Dataset structurally valid
-   Dataset fully traceable
-   Dataset aligned with STRAT and PROD
-   No rule violations

Output is binary: - approved - blocked

------------------------------------------------------------------------

## Final Rule

If any ambiguity exists: → stop execution → governance must be updated
before proceeding
