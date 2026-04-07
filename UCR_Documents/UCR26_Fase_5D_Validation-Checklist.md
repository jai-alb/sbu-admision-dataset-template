# F5_Validation-Checklist.md

## Scope

Define the final validation checklist for `bank_v1_enriched.json` before
it is declared usable.

This document is binding.

All distribution validations MUST match exactly the rules defined in Phase 4B Bank System. No independent interpretation is allowed.

------------------------------------------------------------------------

## Validation Type

Binary only:

-   approved
-   blocked

No intermediate states.

------------------------------------------------------------------------

## 1. Completeness

-   All segments present:
    -   diagnostic
    -   simulation (sim_1, sim_2)
    -   training
-   No empty segment
-   Total_items matches sum of all segments

------------------------------------------------------------------------

## 2. Schema Compliance

-   100% items match F5_Data-Schema_Bank-Enriched.md
-   No extra fields
-   No missing fields
-   JSON is valid and parseable

------------------------------------------------------------------------

## 3. Segment Integrity

-   No item in wrong segment
-   simulation items correctly split into sim_1 and sim_2
-   No cross-segment duplication

------------------------------------------------------------------------

## 4. Count Validation (STRAT)

-   Diagnostic: 18--20 items
-   Simulation:
    -   sim_1 = 45 items
    -   sim_2 = 45 items
-   Training: ≥ required per skill
-   Total bank size within 252–265
-   Minimum allowed total: 252 (approved exception)

### Exception Override (Phase 5)

- Approved via Decision Log [UCR26-GOV-004]
- Final dataset total: 252
- This override supersedes original STRAT minimum constraints
- All other constraints remain unchanged

------------------------------------------------------------------------

## 5. Distribution Integrity

-   Skill distribution matches STRAT
-   Difficulty distribution matches STRAT (simulation exact 12/22/11)
-   H1 distribution within required ranges
-   Difficulty progression inside each simulation is strictly ascending (violation = blocked)

------------------------------------------------------------------------

## 6. Traceability

-   100% items include:
    -   template_id
    -   prompt_id
    -   source_batch_id
-   All traceability fields valid and non-null

------------------------------------------------------------------------

## 7. Duplication Control

-   No duplicate item_id
-   No structural duplication intra-segment
-   No structural duplication inter-segment
-   No overlap between sim_1 and sim_2

------------------------------------------------------------------------

## 8. Metadata Integrity

-   metadata fields match Phase 4B exactly
-   No recalculated values
-   No missing H1, difficulty, skill

------------------------------------------------------------------------

## 9. Content Integrity

-   Stem unchanged
-   Options unchanged
-   Correct answer unchanged
-   Justification unchanged

------------------------------------------------------------------------

## 10. Serialization

-   UTF-8 valid
-   No broken characters
-   Deterministic structure

------------------------------------------------------------------------

## Failure Conditions

If any check fails:

→ status = blocked\
→ dataset cannot be used\
→ return to 5C (Build Protocol)

------------------------------------------------------------------------

## Approval Condition

Only if ALL checks pass:

→ status = approved\
→ `bank_v1_enriched.json` becomes usable source of truth

------------------------------------------------------------------------

## Final Rule

No partial approval.

If any ambiguity exists: → block immediately
