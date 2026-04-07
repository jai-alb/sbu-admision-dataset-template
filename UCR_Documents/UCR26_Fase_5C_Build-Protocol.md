# F5_Build-Protocol.md

## Scope

Define the execution protocol to construct `bank_v1_enriched.json` from
approved Phase 4B batches.

This document is binding.

------------------------------------------------------------------------

## Inputs

-   Approved batches (Phase 4B)
-   F5_Governance_Bank-Build.md
-   F5_Data-Schema_Bank-Enriched.md

------------------------------------------------------------------------

## Output

-   `bank_v1_enriched.json`

------------------------------------------------------------------------

## Execution Sequence (Strict Order)

1.  **Batch Collection**
    -   Gather all approved batches
    -   Verify all batches are marked complete
    -   No partial batches allowed
2.  **Item Extraction**
    -   Extract all items with verdict = valid
    -   Reject any item missing ANY of the following fields:
        -   macro_area
        -   skill
        -   difficulty
        -   h1
        -   estimated_time_sec
        -   error_type
3.  **Segment Assignment**
    -   Assign items to:
        -   diagnostic
        -   simulation (sim_1 / sim_2)
        -   training
    -   Must match original item_type
    -   No reassignment allowed
    -   simulation_id is a pre-existing, mandatory field from Phase 4B
    -   Simulation assignment MUST originate from Phase 4B output. No inference, repartition, or rebalancing is allowed in Phase 5.
4.  **Schema Mapping**
    -   Transform each item into F5 schema
    -   Apply field mapping only (no semantic changes)
5.  **ID Normalization**
    -   Ensure global uniqueness of item_id
    -   Preserve original IDs if valid
    -   No collisions allowed
6.  **Traceability Injection**
    -   Attach:
        -   template_id
        -   prompt_id
        -   source_batch_id
    -   Must match original data
7.  **Aggregation**
    -   Assemble segments into root structure
    -   Count items per segment
8.  **Simulation Ordering Enforcement**
    -   Items within sim_1 and sim_2 MUST be strictly ordered by difficulty: Level 1 → Level 2 → Level 3
    -   Ordering must be stable (no reordering within same difficulty unless already ordered)
    -   If ordering cannot be verified → build must stop
9.  **Pre-Validation Checks**
    -   Check schema compliance
    -   Check segment counts
    -   Check no duplication
10. **Serialization**
    -   Export to valid JSON
    -   UTF-8 encoding
    -   No formatting errors

------------------------------------------------------------------------

## Control Rules

-   No manual editing at any stage
-   No item rewriting
-   No metadata inference
-   No missing fields tolerated

------------------------------------------------------------------------

## Versioning

-   version = v1 for first build
-   Increment minor version only if:
    -   no structural change
    -   no semantic change

------------------------------------------------------------------------

## Blocking Conditions

-   Missing item
-   Missing metadata
-   Duplicate item_id
-   If simulation_id is missing in any item → build must stop
-   Segment mismatch
-   Traceability failure
-   Schema violation

→ Any condition triggers full stop

------------------------------------------------------------------------

## Final Rule

If any step cannot be executed deterministically: → stop build → update
governance before retry
