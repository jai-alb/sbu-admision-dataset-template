---
area: PROD
confidentiality: INTERNAL
depends_on:
- UCR26_Fase_3C_Muestra_Piloto_Controlada.md
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: UCR26_Fase_4A_Production_System.md
version:
  major: 1
  minor: 0
---

# UCR26_Fase_4A_Production-System.md

---

## Template System

### Fuente
Derivado exclusivamente de patrones estructurales validados en Fase 3C

### Estructura del Template

Cada template debe contener:

- template_id
- macro_area (RCV / RCM)
- skill (H2–H7)
- estructura_logica
- tipo_razonamiento
- tipo_distractor
- trampa_recurrente
- nivel_dificultad
- rango_H1 (baja / media / alta)

### Reglas de Construcción

- Basado únicamente en patrones repetibles detectados en Fase 3B/3C
- No incluye contenido textual instanciado
- No mezcla habilidades dominantes
- Mantiene coherencia con taxonomía STRAT
- ❌ Prohibido crear templates fuera de patrones validados en Fase 3C
- ❌ Prohibido modificar estructura lógica original del patrón
- ❌ Prohibido reutilizar estructura superficial entre templates distintos

### Hard Constraint: Template Library Dependency

Si Template-Library no existe o no está accesible:
→ el sistema no puede generar ítems
→ ejecución bloqueada

Prohibir fallback o generación sin template validado.

### Criterios de Invalidez Automática

Un template se invalida si:

- Genera ≥2 ítems rechazados consecutivos
- Genera ambigüedad estructural >10%
- Produce conflicto GEN vs ADV recurrente
- Viola estructura cognitiva del patrón original

Template inválido:

→ bloqueado automáticamente  
→ no reutilizable hasta revisión  

### Template Lifecycle

Estados posibles:

- active → usable en generación
- flagged → bajo observación por métricas
- invalid → bloqueado automáticamente
- deprecated → retirado manual o sistémicamente

Reglas:

- flagged se activa por señales métricas (rechazo, ambigüedad)
- invalid implica bloqueo inmediato
- deprecated no puede volver a usarse
- todo cambio de estado debe ser trazable

---

## Prompt System

### Prompt Registry

Cada prompt debe estar registrado en un sistema centralizado.

#### Estructura mínima

- prompt_id
- tipo (GEN / ADV)
- objetivo
- input_schema
- output_schema
- constraints
- version
- estado (active / deprecated / invalid)

#### Reglas

- Versionado obligatorio ante cualquier cambio
- Prohibido uso de prompts no registrados
- Todo prompt inválido debe ser bloqueado inmediatamente
- El sistema debe mantener historial de cambios trazable

### Prompt-GEN

#### Input Schema

- template_id
- macro_area
- skill
- nivel_dificultad
- estructura_logica
- tipo_distractor
- trampa_recurrente

#### Output Schema

- template_id
- prompt_id
- stem
- opciones (A, B, C, D)
- respuesta_correcta
- justificacion
- metadata completa

#### Constraints

- Exactamente 4 opciones
- 1 única respuesta correcta
- Sin ambigüedad
- Nivel cognitivo 7º–9º (RCM)
- No reutilización de estructura superficial
- Detección de repetición estructural superficial debe ser evaluada por el sistema ADV como patrón inválido
- Justificación obligatoria paso a paso
- Debe respetar skill única dominante

---

### Prompt-ADV

#### Input Schema

- item completo generado
- metadata

#### Output Schema

- verdict (valid / reject)
- error_type
- conflict_flag (true / false)

#### Constraints

- Evaluación independiente
- No reutiliza lógica de GEN
- Debe verificar unicidad de respuesta correcta mediante resolución explícita
- Detecta:
  - ambigüedad
  - non_unique_solution
  - error lógico
  - mala clasificación
  - distractores débiles
- Conflicto con GEN → rechazo automático

---

## Item Generation System

### Estructura Obligatoria del Ítem

Cada ítem debe incluir:

- item_id
- template_id
- prompt_id
- stem claro y autocontenido
- 4 opciones (A–D)
- respuesta correcta única
- justificación estructurada
- metadata:
  - item_type (diagnostic | simulation | training)
  - macro_area
  - skill
  - dificultad
  - tiempo_estimado
  - tipo_error
  - H1 (baja / media / alta)

### Reglas

- Cumplimiento estricto de PROD
- Ítem sin metadata completa = inválido
- Prohibido conocimiento externo
- Distractores plausibles (mínimo 2 fuertes)
- Coherencia con dificultad definida
- Prohibido reutilizar ítems entre tipos
- Prohibido duplicar ítems dentro del mismo item_type
- El sistema debe detectar y bloquear duplicación estructural intra-tipo
- El sistema debe bloquear automáticamente cualquier duplicación estructural entre tipos

#### Validación de Simulacro (Coherencia Individual)

Los ítems con item_type = simulation solo validan coherencia individual:
- Skill declarada corresponde a estructura lógica
- Nivel de dificultad es coherente con trampa y distractor
- H1 es identificable en justificación

La validación de distribución por skill, distribución 12 / 22 / 11 y progresión de dificultad es responsabilidad exclusiva de Fase 4B (Bank System).

Si el ítem rompe coherencia individual:
→ rechazo automático

---

## Adversarial Validation System

### Output Estructurado

- verdict: valid / reject
- error_type:
  - ambiguity
  - non_unique_solution
  - logical_error
  - weak_distractors
  - misclassification
- conflict_flag: true / false

### Reglas

- Validación binaria obligatoria
- No estados intermedios
- Conflicto GEN vs ADV:

→ bloqueo automático del ítem

#### Compatibilidad con PROD (Validación Editorial)

Verificación explícita de:
- unicidad de respuesta
- claridad del enunciado
- plausibilidad de distractores
- ausencia de ambigüedad
- justificación paso a paso presente
- identificación de paso crítico presente
- explicación de error típico presente
- H1 identificable en justificación

Debe mapear explícitamente a reglas de PROD_Item-System-Design.

Si falta cualquiera de los anteriores → reject automático

---

## Failure Handling System

### Reintentos

- Máximo N intentos por ítem
- N definido externamente

### Reglas de Descarte

Todos los thresholds deben definirse en SSoT externo

- Si falla N veces → descarte automático
- Si error recurrente por template → invalidar template
- Si gen_vs_adv_conflict_rate > threshold sostenido → invalidar prompt

### Acciones Automáticas

- Rechazo → no reuso del ítem
- Template inválido → bloqueo inmediato
- Prompt inválido → bloqueado + reemplazo obligatorio versionado

---

## Metrics System

### Métricas Obligatorias

- rejection_rate_template
- rejection_rate_prompt
- ambiguity_rate
- gen_vs_adv_conflict_rate
- level_2_inflation_rate
- skill_distribution
- difficulty_distribution

### Uso de Métricas

→ Toda métrica debe mapear a una acción del sistema

- ambiguity_rate ↑ → ajuste prompt
- gen_vs_adv_conflict_rate ↑ → invalidar prompt
- rejection_template ↑ → invalidar template
- rejection_rate_prompt ↑ → ajustar o reemplazar prompt
- level_2_inflation_rate ↑ → ajuste obligatorio de generación
- skill_distribution ↑/↓ → restringir templates activos
- difficulty_distribution ↑/↓ → ajustar generación

### STRAT Enforcement

La distribución por habilidades y dificultad debe cumplir estrictamente lo definido en STRAT.

- Desviaciones no son solo señal → son condición de bloqueo
- Si skill_distribution o difficulty_distribution salen de rango:

→ se detiene generación automáticamente  
→ se restringen templates activos  
→ no se permite continuar hasta corrección  

No se permite convergencia pasiva.

---

## Execution Rules

- Flujo cerrado
- Sin intervención humana
- Sin estados intermedios
- Todo output del sistema debe ser trazable a template_id y prompt_id
- No se permite generación sin origen estructural

### Verificación STRAT (Pre-aprobación)

Esta verificación debe ocurrir antes del estado final del ítem.

#### Nivel ítem (verificación individual)

Verifica:
- Skill declarada pertenece a H2–H7
- Dificultad es 1, 2 o 3
- H1 está clasificada (baja / media / alta) e identificable en justificación

Si cualquier condición individual falla:
→ bloqueo automático de aprobación del ítem
→ el ítem no puede ser marcado como "valid"

#### Nivel sistema (distribución global)

La validación de distribución global por skill y dificultad es responsabilidad exclusiva de Fase 4B (Bank System).

Este sistema no bloquea aprobación de ítems por métricas globales.

- Cada ítem termina en:

→ aprobado  
→ descartado  

- Conflictos no resolubles → descarte inmediato
- Sistema completamente reactivo

---

## TEST OBLIGATORIO

### Verificación

1. Generación

→ Se puede generar 1 ítem completo válido: SÍ

2. Validación

→ Se puede validar sin intervención humana: SÍ

3. Descarte

→ Se puede descartar automáticamente si falla: SÍ

4. Trazabilidad

¿Se puede rastrear cualquier ítem hasta template + prompt? → SÍ
Si NO → inválido

Resultado:

→ Documento válido