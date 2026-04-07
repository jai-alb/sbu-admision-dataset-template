---
area: PROD
confidentiality: INTERNAL
depends_on:
- UCR26_Fase_4A_Production-System.md
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: UCR26_Fase_4B_Bank-System.md
version:
  major: 1
  minor: 0
---

## 1. SYSTEM DEFINITION

### Scope

Sistema responsable de:

- Ensamblaje completo del banco
- Segmentación estricta
- Control de distribución global
- Auditoría sistémica pre-cierre
- Trazabilidad total
- Validación estructural del banco

### Inputs

- Ítems aprobados por Production System (4A)
- STRAT_Content-Blueprint
- PROD_Item-System-Design

### Outputs

- Banco completo aprobado o rechazado (binario)

---

## 2. BANK STRUCTURE

### Segmentación Obligatoria

Cada ítem pertenece a exactamente un segmento:

- diagnostic
- simulation
- training

### Reglas

- Prohibida reutilización entre segmentos
- Prohibida duplicación estructural inter-segmento
- Prohibida duplicación intra-segmento
- Violación → rechazo sistémico inmediato

---

## 3. TARGET STRUCTURE

### 3.1 Bank Size

- Target: total ∈ [259,265] ítems
- Buffer mínimo: ≥10 ítems
- total debe ser ≥259 (mínimo estructural derivado de constraints de segmentos)

---

### 3.2 Segment Composition

#### Diagnostic

- 18–20 ítems
- Proporcional por habilidades
- Enfoque en H1 + H2
- Mayoría dificultad nivel 2

#### Simulation

- 2 simulacros
- 45 ítems cada uno
- Total: 90 ítems

#### Training

- ~140 ítems
- ≥18 ítems por habilidad

---

## 4. DISTRIBUTION CONTROL SYSTEM

### 4.1 Skill Distribution (Simulation)

RCV (23):
H3 = 11
H5 = 12

H3 + H5 debe ser exactamente 23 (constraint estructural obligatorio)

RCM (22):
- H2: 8
- H4: 5
- H6: 6
- H7: 3

### Enforcement

- Desviación → rechazo del simulacro → rechazo del banco

---

### 4.2 Difficulty Distribution (Simulation)

- Nivel 1: 12
- Nivel 2: 22
- Nivel 3: 11

### Enforcement

- Distribución exacta obligatoria
- Los 45 ítems de cada simulacro deben estar ordenados por dificultad creciente (Nivel 1 → 2 → 3)
- El sistema debe verificar que la secuencia es estrictamente ascendente
- Si la secuencia no cumple → rechazo inmediato del simulacro completo

---

### 4.3 H1 Distribution

#### Por segmento

- **Simulation**: 30–40% de los 45 ítems deben tener H1 alta (obligatorio)
- **Training**: mínimo ≥30% de ítems con H1 alta (obligatorio)
- **Diagnostic**: Diagnostic_H1_rate must be strictly greater than both Simulation_H1_rate and Training_H1_rate

### Enforcement

- Simulation: <30% o >40% → rechazo del simulacro
- Training: <30% → rechazo del segmento
- Diagnostic: If Diagnostic_H1_rate ≤ max(Simulation_H1_rate, Training_H1_rate) → rechazo del segmento

---

### 4.4 Global Distribution (Training)

- H2: 28
- H5: 28
- H3: 22
- H4: 22
- H6: 22
- H7: 18

### Enforcement

- Cada skill ≥18 ítems
- Cada skill ≥2–3 nivel 3

---

### 4.5 Macro-area Distribution (Simulation)

- RCV: exactly 23 items
- RCM: exactly 22 items

### Enforcement

- Any deviation from RCV = 23 or RCM = 22 → rechazo del simulacro

---

## 5. SEGMENT ISOLATION SYSTEM

### Rules

- Ítem_type es inmutable
- No migración entre segmentos
- No reutilización estructural
- Prohibido que Simulacro 1 y Simulacro 2 compartan estructura lógica, patrón de distractor o equivalencia semántica

### Detection

- Hash estructural obligatorio por ítem
- Comparación semántica obligatoria entre segmentos
- Comparación estructural cruzada completa entre Simulacro 1 y Simulacro 2 (obligatoria, no opcional)

### Violation

- Cualquier coincidencia estructural entre Simulacro 1 y Simulacro 2 → rechazo total del banco
- Cualquier reutilización entre segmentos → rechazo automático del banco completo

---

## 6. TRACEABILITY SYSTEM

### Required Fields

Cada ítem debe permitir rastreo completo a:

- template_id
- prompt_id
- skill
- dificultad
- H1

### Rule

- Si trazabilidad incompleta → banco inválido

---

## 7. BANK ASSEMBLY ENGINE

### Input Pool

- Solo ítems con verdict = valid (4A)

### Assembly Process

1. Separar por item_type
2. Validar unicidad estructural
3. Construir segmentos
4. Aplicar distribución STRAT
5. Ejecutar auditoría global

### Constraint

- No intervención humana

---

## 8. SYSTEMIC AUDIT PROTOCOL

### 8.0 Audit Trigger Condition

La auditoría sistémica se ejecuta **única y exclusivamente** cuando:

1. Todos los segmentos (diagnostic, simulation, training) están completos
2. No existen ítems pendientes de validación en ningún segmento
3. El banco ha pasado el ensamblaje completo (sección 7)

**Prohibida la auditoría parcial.**  
Si alguna condición no se cumple → auditoría no ejecutada → banco en estado bloqueado.

---

### 8.1 Audit Scope

Verifica:

- Distribución por habilidades
- Distribución por dificultad
- % H1 por segmento
- Separación por segmentos
- Tamaño del banco
- Coherencia con STRAT
- Cumplimiento PROD
- Progresión de dificultad en simulacros
- Separación estructural entre Simulacro 1 y Simulacro 2

---

### 8.2 Audit Output

- approved
- rejected

No estados intermedios

---

### 8.3 Rejection Conditions

El banco se rechaza si:

- Violación de skill distribution
- Violación de difficulty distribution
- % H1 fuera de rango por segmento
- Secuencia de dificultad no progresiva en simulacro
- Coincidencia estructural entre Simulacro 1 y Simulacro 2
- Reutilización detectada entre segmentos
- Falta de trazabilidad
- Skill < mínimo requerido
- Falta de buffer mínimo
- Ítems sin validación editorial (PROD)
- Simulacro con número de ítems distinto de 45 → rechazo del simulacro → rechazo del banco
- Número de simulacros distinto de 2 → rechazo del banco

---

## 9. REACTIVE SYSTEM

### Alcance del Bank System

El Bank System **NO modifica generación de ítems** ni controla templates ni prompts.  
Su única autoridad de acción es sobre el banco ensamblado.

### Error → Action Mapping

| Condición detectada | Acción del Bank System |
|---|---|
| Skill imbalance | Rechazar banco |
| Difficulty imbalance | Rechazar banco |
| H1 fuera de rango por segmento | Rechazar banco |
| Secuencia de dificultad no progresiva | Rechazar simulacro → rechazar banco |
| Duplicación estructural inter-segmento | Rechazar banco |
| Coincidencia estructural entre simulacros | Rechazar banco |
| Falta de trazabilidad | Bloquear ensamblaje |
| Ítems pendientes al momento de auditoría | Bloquear auditoría |
| Segmento incompleto al momento de auditoría | Bloquear auditoría |

### Regla

- Las acciones permitidas son: **rechazar banco** o **bloquear ensamblaje/auditoría**
- Prohibido cualquier intento de corrección automática interna
- Prohibido estado pasivo ante error detectado

---

## 10. INTEGRITY CONTROL

### Structural Integrity Rules

- Cada ítem cumple PROD completo
- Cada distribución cumple STRAT
- Segmentos completamente aislados

### Failure

→ rechazo total del banco

---

## 11. EXECUTION FLOW

1. Recepción de ítems válidos
2. Segmentación estricta
3. Detección de duplicación estructural (no eliminación)
4. Construcción de estructuras
5. Aplicación de constraints STRAT
6. Auditoría global
7. Output binario

---

## 12. FINAL RULE

El banco solo puede existir en dos estados:

- aprobado
- rechazado

No existe estado parcial.

---

## 13. TEST OBLIGATORIO

### Verificación

1. Ensamblaje automático completo → SÍ  
2. Validación global sin intervención → SÍ  
3. Detección de desviaciones → SÍ  
4. Trazabilidad completa → SÍ  

Si cualquiera falla:

→ sistema inválido

---

## 14. GOVERNANCE

Este documento es vinculante para:

- Ensamblaje del banco
- Validación global
- Control de distribución
- Auditoría sistémica

Si una regla no está aquí:

→ no existe

---

## 15. EXECUTION RESULT — UCR26

### Historical Execution Result (Pre-Phase 5)

Status: APPROVED

Final Bank:
- bank_v1_enriched.json

Total Items: 264

Simulations:
- sim_1: validated
- sim_2: validated (post structural fix)

Key Corrections Applied:
- duplicate removal (ITEM_010_B010)
- sim_2 skill rebalance (H3/H5)
- L3 coverage completion (H2, H3, H6, H7)

System Behavior Confirmed:
- rejection conditions triggered correctly
- no false approvals observed
- structural enforcement validated end-to-end

## Post-Phase 5 Final State

- Final dataset: bank_v1_enriched.json
- Final total_items: 252
- Status: approved (final)
- This overrides the previously approved 264-item bank due to Phase 5 governance filtering

- The 264-item bank is considered a pre-governance artifact
- The 252-item dataset is the only valid SSoT

---

**END OF DOCUMENT — UCR26_Fase_4B_Bank-System.md**