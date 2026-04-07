# Version Log - UCR26 Content System

## 2026-03-12 - v0.1 - System Initialization
- Completion of Phase 3A: Marco Operativo Mínimo.
- Directory structure verified and cleaned of .keep contamination.
- Ready for Phase 3B: Protocolo de Extracción Estructural.

---

## 2026-03-25 - v1.0 — bank_v1_enriched.json

- First fully valid bank
- Passed F4B systemic audit
- All STRAT constraints satisfied
- Ready for Phase 5 consumption

## 2026-03-25 - v1.2 — bank_size_adjustment (Final 252)

- Minor version increment.
- Minimum bank size adjusted to 252 (v1.4) due to validated exclusions in Phase 5.
- Status updated to approved_with_exception.

---

## 2026-03-25 - v1.5 — Phase 5 Closure (Production Ready)

- Dataset `bank_v1_enriched.json` declared as **SSoT Definitivo**.
- Pipeline frozen. No further modifications allowed.
- Marked as: **Production Ready Dataset**.
- Total items: 252 (diagnostic + training + simulations 45/45).

---

## 2026-04-04 - v1.6 — Engine Feedback Alignment (Preview Consistency)

- **File:** `sbu-admision-dashboard/src/components/module-item-card.tsx`
- **Change:** Post-response render in training modules aligned with `InteractivePreview.tsx`.
- Options now remain visible after answer submission.
- Correct option highlighted in green (`border-[#2E7D6B] bg-[#F0FDF4]`).
- Incorrect selected option highlighted in red (`border-red-400 bg-[#FEF2F2]`).
- Remaining options rendered neutral with reduced opacity.
- Feedback text and explanation block preserved, rendered below options.
- Interaction lock (`disabled`) maintained on all options post-submission.
- No changes to flow, backend, or progression logic.
