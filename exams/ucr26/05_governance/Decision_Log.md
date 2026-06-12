# Decision Log [exam: ucr26]

## DEC-XXX
- **Date:** 
- **Exam:** 
- **Item:** 
- **Conflict:** 
- **Resolution:** 
- **Impact on Taxonomy:** 

---

[UCR26-GOV-001] — Fix inconsistencia RCV skill distribution
Tipo

Structural governance correction

Error

Definición inconsistente en STRAT:

RCV total = 23
H3 = 7
H5 = 10
→ suma = 17 (imposible)
Impacto
Bloqueo completo del Bank Assembly (4B)
Imposibilidad matemática de construir simulacros
Abort correcto del sistema
Corrección

Se redefine distribución RCV:

H3 = 11
H5 = 12

Se introduce constraint estructural explícito:

H3 + H5 = 23 (obligatorio)
Propagación
STRAT_Content-Blueprint_UCR26_v1.md → actualizado
UCR26_Fase_4B_Bank-System.md → actualizado
Versión

v1.1

Fecha

2026-03-25T06:52:37-06:00

---

## [UCR26-GOV-002] — Fix incompatibilidad total vs constraints segmentarios

### Tipo

Structural governance correction

### Error

Conflicto entre:

- total ≤255
- training ≥140
- buffer ≥10
- simulacros + diagnostic fijos (=109)

→ mínimo real = 259 (incompatible con ≤255)

### Impacto

- Imposibilidad matemática de construir banco válido
- Bloqueo en Fase 4B
- Falsos negativos en auditoría

### Corrección

Se redefine rango total permitido:

- total: 259–265

Se introduce constraint estructural explícito:

- total ≥259

### Propagación

- STRAT_Content-Blueprint_UCR26_v1.md → actualizado
- UCR26_Fase_4B_Bank-System.md → actualizado

### Versión

v1.2

### Fecha

2026-03-25T07:36:33-06:00

---

## [DECISION] F4B Closure — Bank Approved

- Final bank required controlled trimming (not full regeneration)
- Assembly errors identified as primary failure mode
- Auditor variance detected across LLMs → deterministic checks enforced
- Structural fixes required post-assembly (not generation-level)

Key Insight:
Bank integrity depends more on assembly discipline than generation quality.

## [UCR26-GOV-003] — Exception: Bank Size Constraint

### Tipo
exception

### Scope
bank_size_constraint

### Motivo
déficit residual no recuperable sin re-ejecución de Fase 4

### Detalles
- valor_original: 259–265
- valor_aplicado: 254
- validación: todas las demás condiciones cumplen
- status: approved_with_exception

---

## [UCR26-GOV-004] — Update: Bank Size Constraint

### Tipo
exception_update

### Scope
bank_size_constraint

### Valor Anterior
254

### Valor Nuevo
252

### Motivo
exclusión de ítems inválidos durante validación schema/governance

### Impacto
no afecta integridad estructural

### Fecha
2026-03-25T18:52:00-06:00

---

## [UCR26-GOV-005] — Phase 5 Final Approval

### Tipo
final_approval

### Resultado
approved

### Detalles
- total_items: 252
- simulaciones completas: (45/45)
- fecha: 2026-03-25T19:11:26-06:00
- status: closed_ssot
- ssot_status: bank_v1_enriched.json is now the official SSoT.

---

## [UCR26-GOV-006] — Scope Restriction: Explanation Layer F2

### Tipo
scope_restriction

### Scope
explanation_layer_F2

### Definición
F2 applies exclusively to `segments.training`.

### Exclusiones
- `diagnostic`
- `simulation` (sim_1, sim_2)

### Justificación
- Consistencia con UX y Course Flow
- Preservación de condiciones de evaluación en simulaciones

### Impacto
- Reduce la superficie de intervención
- Elimina ambigüedad operativa

### Fecha
2026-04-02T09:42:46-06:00

---

## [UCR26-GOV-007] — Explanation Layer UI Integration (F2 Step 4)

### Tipo
system_closure

### Scope
explanation_layer_runtime

### Definición
Se integra la capa de explicación en UI bajo reglas estrictas:

- Renderizado posterior a respuesta del usuario
- Posición fija: después de feedback, antes de continuar
- No reemplaza feedback
- No altera flujo

### Restricciones
- Solo en training
- Prohibido en diagnóstico y simulaciones
- Cliente sin lógica (display-only)
- Server-authoritative

### Garantías
- Determinismo por item_id
- Contenido inmutable
- Sin fallback

### Resultado
- Sistema cerrado en capa F2
- Consistencia UX + PROD + backend

### Fecha
2026-04-02T00:00:00-06:00
