---
area: EXECUTION
confidentiality: INTERNAL
depends_on:
- UCR26_Fase_4A_Production-System.md
- UCR26_Fase_4B_Bank-System.md
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: UCR26_Fase_4C_Pipeline-Execution.md
version:
  major: 1
  minor: 0
---

# UCR26_Fase_4C_Pipeline-Execution.md

---

## 1. SYSTEM DEFINITION

### Scope

Sistema responsable de:

- Orquestación end-to-end del pipeline
- Producción por batches
- Control de deriva estructural
- Gestión de estados del pipeline
- Control de flujo entre 4A → 4B
- Sistema reactivo (error → acción)
- Gestión de errores, reintentos y descarte
- Cierre operativo del pipeline

### Inputs

- Templates activos (4A)
- Prompts activos (4A)
- Ítems generados y validados (4A)
- Reglas STRAT y PROD
- Parámetros externos (thresholds, N reintentos)

### Outputs

- Batches procesados
- Ítems aprobados o descartados
- Flujo controlado hacia Bank System (4B)
- Estado final del pipeline

---

## OBJETIVOS POR SEGMENTO (OBLIGATORIO)

El pipeline debe aplicar objetivos de producción explícitos:

- diagnostic: 18–20 ítems
- simulation:
  - sim_1: exactamente 45 ítems
  - sim_2: exactamente 45 ítems
- training: definido externamente (ya satisfecho o en progreso)

Los objetivos son acumulativos entre batches.

---

## SEGUIMIENTO DE COMPLETITUD POR SEGMENTO

El pipeline debe mantener:

- diagnostic_count
- sim_1_count
- sim_2_count
- training_count

Un segmento está completo ÚNICAMENTE cuando su objetivo está totalmente satisfecho.

La completitud parcial es inválida.

---


## 2. PIPELINE STATES

Sistema de estados unificado. Batch y pipeline usan el mismo set:

- `active`
- `blocked`
- `completed`

Definiciones:

- `active` → batch en ejecución; todas las métricas dentro de rango
- `blocked` → detención obligatoria; no puede avanzar; requiere resolución automática antes de continuar
- `completed` → batch cumple todos los criterios; apto para envío a 4B

Reglas de batch:

* active → batch en ejecución
* blocked → cualquier desviación detectada; no puede avanzar; acción correctiva automática obligatoria
* completed → batch cumple todos los criterios; apto para envío a 4B

No existen estados adicionales. `validated`, `rejected` y `flagged` no son estados válidos en este sistema.

---

## 3. PIPELINE STAGES

1. Generación (4A)
2. Validación (4A)
3. Acumulación
4. Batch Control
5. Envío a Bank (4B)
6. Auditoría final (4B)
7. Cierre

---

## 4. ITEM FLOW CONTROL

- verdict = valid → continúa
- reject / conflict / N intentos → descarte

Estados finales obligatorios del ítem:

* `approved` → equivale a verdict = valid en 4A
* `discarded` → equivale a reject | N intentos agotados | conflict

Reglas:

* No existen estados intermedios persistentes
* Todo ítem debe terminar en uno de los dos estados
* Consistencia con 4A: approved = verdict valid; discarded = reject | N attempts | conflict

---

## 5. RETRY SYSTEM

- Máximo N intentos
- N alcanzado → descarte automático → ítem pasa a state: discarded

---

## 6. BATCH SYSTEM

### Métricas (Obligatorio)

Cada batch debe registrar y validar las siguientes métricas con naming consistente:

- `skill_distribution` — distribución por habilidades (H2–H7)
- `difficulty_distribution` — distribución por dificultad
- `h1_rate` — % H1 dentro de rango
- `rejection_rate` — tasa de rechazo
- `ambiguity_rate` — tasa de ambigüedad
- `gen_vs_adv_conflict_rate` — conflict_rate GEN vs ADV

### Metric Validation (Obligatorio)

Cada batch valida consistencia interna. No evalúa cumplimiento global STRAT.

Un batch es válido si:

* No hay deriva interna significativa (skill_distribution estable respecto a batches previos)
* No hay inflación anómala (ej. `level_2_inflation_rate` fuera de threshold)
* `h1_rate` dentro de rango
* `ambiguity_rate` ≤ threshold
* `gen_vs_adv_conflict_rate` ≤ threshold

El batch no evalúa cumplimiento exacto de distribución STRAT. Esa responsabilidad es exclusiva de 4B (Bank System).

Resultado de validación de métricas:

* Cualquier desviación de consistencia interna detectada → batch_state = blocked
* Todo cumple → batch_state = completed

No existe gradación de severidad. No existe estado intermedio.

---

## 7. DRIFT CONTROL SYSTEM

Toda desviación operativa detectada dispara una acción automática. No existe modo observacional.

- deriva interna de habilidades (drift entre batches) → batch_state = blocked; acción automática: restringir templates activos
- inflación nivel 2 (dificultad inflada, anomalía interna) → batch_state = blocked; acción automática: ajustar parámetros de generación
- caída H1 → batch_state = blocked; acción automática: forzar templates con H1 alta
- ambigüedad > threshold → batch_state = blocked; acción automática: invalidar template origen
- conflict_rate alto → batch_state = blocked; acción automática: invalidar prompt

Este sistema detecta desviaciones operativas (drift interno). No valida cumplimiento exacto STRAT. La validación global STRAT es responsabilidad exclusiva de 4B.

Cada desviación tiene:

* trigger explícito
* acción automática definida
* efecto verificable

---

## 8. FLOW CONTROL 4A → 4B

- Todo batch DEBE declarar:
  item_type ∈ {diagnostic, simulation, training}

- Si item_type = simulation:
  simulation_id ∈ {sim_1, sim_2} es obligatorio

Declaración ausente → batch_state = blocked

- Un batch solo puede enviarse a 4B si:
  - pertenece a un segmento definido
  - contribuye a un segmento aún no completado

- 4B NO DEBE activarse a menos que TODOS los segmentos estén completos

Batch pasa a 4B solo si:

* batch_state = completed
* 0 desviaciones de consistencia interna fuera de threshold
* 100% ítems con estado = approved
* todas las métricas internas dentro de rango
* el batch pertenece a un segmento definido (diagnostic / simulation / training)
* el batch contribuye a completar la estructura del segmento al que pertenece

El pipeline debe acumular batches de un mismo segmento hasta cubrir el tamaño requerido por ese segmento antes de permitir el ensamblaje en 4B. El sistema mantiene conteo acumulado por segmento.

Si cualquier condición falla:

→ batch_state = blocked
→ pipeline no puede avanzar
→ batch no puede continuar generación
→ batch no puede acumular ítems
→ batch no puede enviarse a 4B

---

## 9. ERROR MANAGEMENT

Todo error → acción automática

### Error → Action Mapping (Obligatorio)

* skill deviation → batch_state = blocked; restringir templates activos
* difficulty imbalance → batch_state = blocked; ajustar parámetros de generación
* H1 bajo → batch_state = blocked; forzar templates con H1 alta
* ambiguity_rate alto → batch_state = blocked; invalidar template origen
* gen_vs_adv_conflict_rate alto → batch_state = blocked; invalidar prompt
* rejection_rate alto → batch_state = blocked; bloquear template

Toda acción es automática y obligatoria.

---

## 10. TRACEABILITY

Cada ítem debe persistir individualmente con:

- `template_id` — identificador del template origen
- `prompt_id` — identificador del prompt usado
- metadata completa (skill, dificultad, H1, macro_area, item_type)
- estado final (approved / discarded), verdict, número de intento

Prohibida agregación que pierda nivel ítem. Cada ítem es trazable de forma individual en todo momento del pipeline.

Cada batch registra adicionalmente:

- métricas completas de consistencia interna (ver sección 6)
- conteo acumulado por segmento (diagnostic / simulation / training)

---

## 11. LOCKING SYSTEM

Condiciones de bloqueo a nivel batch:

- cualquier métrica de consistencia interna fuera de rango
- ambigüedad > threshold
- gen_vs_adv_conflict_rate alto
- drift detectado en batch

→ batch_state = blocked
→ acción correctiva automática se activa de inmediato

Condición de salida del estado blocked:

Un batch sale de estado `blocked` única y exclusivamente si:

1. La acción correctiva fue aplicada
2. Las métricas del batch se recalculan
3. Todas las métricas vuelven a rango válido

Si alguna de las tres condiciones no se cumple → el batch permanece en estado `blocked` sin excepción.

Reposición tras descarte:

Todo ítem descartado dentro de un batch debe ser reemplazado automáticamente dentro del mismo batch. El batch no puede finalizar con déficit de volumen respecto a su tamaño objetivo.

Condiciones de bloqueo a nivel pipeline:

- cualquier batch con batch_state = blocked sin resolución
- pipeline_state = blocked si no hay resolución automática disponible

Si pipeline_state = blocked:

* Se prohíbe generación de nuevos ítems
* Se prohíbe avance de batches
* Se prohíbe acumulación de nuevos ítems
* Se requiere resolución automática antes de continuar

---

## 12. CONTINUITY RULE

Pipeline continúa solo si:

- no blocked (ni batch ni pipeline)
- métricas válidas en todos los batches activos
- 0 desviaciones activas

---

## 13. HARD RULES

Las siguientes reglas son absolutas y no tienen excepciones:

- Ningún batch con desviaciones pasa a 4B
- Ningún batch continúa si está bloqueado
- Ningún ítem pasa sin validación completa
- Ningún banco se ensambla sin pipeline completamente cerrado
- No existen estados observacionales: toda métrica dispara acción
- No existen estados intermedios persistentes en ítems
- No existen estados intermedios en batches

---

## 14. COMPLETION

El pipeline termina ÚNICAMENTE si:

- diagnostic_count ∈ [18,20]
- sim_1_count = 45
- sim_2_count = 45
- todos los batches = completed
- ningún batch está bloqueado
- no hay desviaciones activas

Si algún segmento está incompleto:

→ pipeline_state DEBE permanecer `active`

---

## PREVENCIÓN DE CIERRE INVÁLIDO

Si pipeline_state = completed Y algún objetivo de segmento no está satisfecho:

→ el estado es inválido
→ pipeline_state debe revertir a `active`
→ la producción debe reanudarse

---

---

## 15. FINAL RULES

- automático
- sin intervención humana
- sin loops
- sin estados pasivos
- error → acción

---

## FINAL EXECUTION — UCR26

### Historical Pipeline Result (Pre-Phase 5)

pipeline_state: completed

All segments reached target:
- diagnostic: 19
- sim_1: 45
- sim_2: 45
- training: 155

No active blocks
No unresolved drift
All batches completed: 26

Pipeline behavior validated under:
- drift conditions
- correction cycles
- structural enforcement

## Post-Phase 5 Final State

- Final dataset: bank_v1_enriched.json
- Final total_items: 252
- Segment distribution:
  - diagnostic: 19
  - sim_1: 45
  - sim_2: 45
  - training: 143

- This overrides pipeline output due to Phase 5 governance filtering and item exclusion.

- The pipeline output (training: 155) reflects pre-governance production state
- The final dataset (training: 143) is the only valid SSoT

---

**END OF DOCUMENT**
