# axion-u-content-engine — INDEX

**STATUS: CLOSED (ARCHIVED PRODUCTION SYSTEM)**

### System Role:
Cognitive content production engine for UCR 2026.

### System State:
- Phases 3A–5D fully completed
- Pipeline frozen
- No active execution allowed
- System is immutable unless explicitly versioned

### Final Output:
- **File:** `UCR26_Content/03_ITEM_PRODUCTION/bank_v1_enriched.json`
- **Total items:** 252
- **Status:** `production_ready`
- **Role:** Single Source of Truth (SSoT), exported to main system.

---

## System Layers

### 1. Normative Layer (Execution Rules)
**Location:** `/UCR_Documents/`

- **`F2_Explanation-System_Spec_v1.md`**  
  Specification for the Phase 2 explanation generation system, defining prompt constraints, system behavior, and structured item explanation rules.

- **`F2_PROMPTS_LIBRARY.md`**  
  Central repository of prompt templates and system instructions used during Phase 2 execution.

- **`F2_VALIDATION_SYSTEM.md`**  
  Defines the validation protocols and quality assurance checks applied to the explanation generation outputs.

- **`UCR26_Fase_3A_Marco_Operativo_Minimo.md`**  
  Defines the minimum operational framework for Phase 3, establishing the baseline rules and conditions for execution.

- **`UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md`**  
  Protocol detailing the methodology for the structural extraction of cognitive patterns from source materials.

- **`UCR26_Fase_3C_Muestra_Piloto_Controlada.md`**  
  Outlines the controlled pilot sample execution, defining the scope and expected outcomes for initial verification.

- **`UCR26_Fase_4A_Production-System.md`**  
  Defines the architecture and operational rules for the Phase 4 item production system.

- **`UCR26_Fase_4B_Bank-System.md`**  
  Specifies the structure and management protocols for the staging bank system prior to compilation.

- **`UCR26_Fase_4C_Pipeline-Execution.md`**  
  Details the execution steps and orchestration of the automated production pipeline.

- **`UCR26_Fase_5A_Governance_Bank-Build.md`**  
  Establishes the governance rules and decision-making criteria for assembling the final Phase 5 bank build.

- **`UCR26_Fase_5B_Data-Schema_Bank-Enriched.md`**  
  Defines the definitive JSON data schema for the final enriched item bank dataset.

- **`UCR26_Fase_5C_Build-Protocol.md`**  
  Step-by-step protocol for assembling against schemas and compiling the final production-ready dataset.

- **`UCR26_Fase_5D_Validation-Checklist.md`**  
  Final validation checklist ensuring the structural integrity and compliance of the complete bank before system lock.

**Rule:**
These documents define the full execution system but are now **CLOSED** and **NON-EXECUTABLE**.

---

### 2. Data Layer (Core Assets)
**Location:** `/UCR26_Content/`

- **`03_ITEM_PRODUCTION/bank_v1_enriched.json`** → FINAL DATASET (SSoT)  
  The final compiled dataset and Absolute Single Source of Truth containing all cognitive items (252) ready for runtime consumption.

- **`02_PATTERN_REGISTRY/MASTER_Structural_Patterns.md`** → cognitive pattern base  
  The definitive registry of cognitive patterns and structural rules used during structural extraction and item generation.

**Notes:**
- `bank_v1_enriched.json` is the **ONLY** valid output of this system.
- No regeneration or modification allowed.

---

### 3. Governance & Traceability Layer
**Location:** `/UCR26_Content/05_GOVERNANCE/` and `/UCR26_Content/04_VALIDATION/`

- **`Decision_Log.md`**  
  Records all structural and architectural decisions, acting as the governance override for systematic exceptions.

- **`Version_Log.md`**  
  Tracks historical phases, repository versions, and execution progression throughout the project.

- **`Cross_Review_Log.md`**  
  Documents peer reviews, cross-validations, and exception handlings executed during the final validation phases.

**Purpose:**
- Record all structural decisions.
- Track exceptions (e.g. bank size adjustment to 252).
- Ensure full auditability of the system.

---

### 4. Execution Evidence (Non-SSoT)
**Location:**
- `/UCR26_Content/03_ITEM_PRODUCTION/BATCHES/`
- `/UCR26_Content/03_ITEM_PRODUCTION/_deprecated/`
- scripts (.js, .py, .ps1)

**Purpose:**
- Historical evidence of execution.
- Debugging and reproducibility.

**Rule:**
These are **NOT SSoT** and must not be used for rebuilding without explicit reactivation.

---

## System Rules (Critical)
1. This engine is **CLOSED**.
2. No phase (3–5) can be re-executed.
3. No item generation is allowed.
4. No modification to dataset is allowed.
5. All documents are historical except logs.

---

## Authority Hierarchy (Internal)
1. **bank_v1_enriched.json** → Absolute SSoT
2. **Decision_Log.md** → governance overrides
3. **Normative documents** (F3–F5)
4. **Execution artifacts** (non-binding)

---

## Relationship to Main System
- This repository is upstream of **AXION U**.
- AXION U consumes **ONLY** the dataset.
- No runtime dependency exists between systems.
- Engine is not part of production runtime.

---

## Final Rule
If any attempt is made to:
- regenerate items
- modify dataset
- reinterpret phases

→ system must be considered **VIOLATED**
