---
area: PROD
confidentiality: INTERNAL
depends_on:
- STRAT_Content-Blueprint_UCR26_v1.md
- PROD_Item-System-Design_UCR26_v1.md
last_updated: 2026-02-17
owner: System Architect
scope: UCR26
status: ACTIVE
title: UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md
version:
  major: 1
  minor: 1
---

# FASE 3B --- PROTOCOLO FORMAL DE EXTRACCIÓN ESTRUCTURAL

## UCR 2026 · Guía Operativa para Agentes de IA

------------------------------------------------------------------------

# PROPÓSITO

Este documento define el protocolo obligatorio que un agente de
inteligencia artificial debe seguir para analizar preguntas provenientes
de exámenes históricos UCR.

Objetivo:

-   Extraer estructura cognitiva.
-   Clasificar bajo taxonomía cerrada.
-   Detectar patrones estructurales.
-   Evitar arbitrariedad.
-   Mantener coherencia con STRAT y PROD.

Este documento NO autoriza producción de ítems nuevos. Solo extracción
estructural.

------------------------------------------------------------------------

# REGLAS INNEGOCIABLES

1.  No copiar texto literal del examen.
2.  No reformular el ítem.
3.  No crear versiones alternativas.
4.  No modificar taxonomía.
5.  No inventar nuevas categorías.
6.  No asignar doble habilidad dominante.
7.  No omitir justificación de clasificación.

Si existe ambigüedad estructural, debe registrarse.

------------------------------------------------------------------------

# SECUENCIA OBLIGATORIA DE ANÁLISIS POR ÍTEM

El agente debe ejecutar los siguientes pasos en orden estricto:

1.  Identificar macro-área (RCV o RCM).
2.  Determinar operación cognitiva dominante.
3.  Asignar habilidad (H2--H7).
4.  Evaluar carga inferencial (H1 baja / media / alta).
5.  Clasificar dificultad (1 / 2 / 3).
6.  Describir estructura lógica subyacente.
7.  Identificar tipo de razonamiento.
8.  Identificar tipo dominante de distractor.
9.  Detectar trampa recurrente.
10. Estimar tiempo implícito de resolución.
11. Formular patrón estructural abstracto.

No se permite alterar el orden.

------------------------------------------------------------------------

# CRITERIOS DE CLASIFICACIÓN

## 1. Macro-área

RCV → Núcleo semántico / comprensión textual. RCM → Núcleo formal /
modelado matemático.

El núcleo operativo decide.

------------------------------------------------------------------------

## 2. Habilidad Dominante

Criterio:

"¿Qué operación mental explica el error más frecuente?"

Si dos parecen dominantes: - Identificar punto crítico de resolución. -
Elegir una sola. - Documentar duda si persiste.

Nunca doble etiqueta.

------------------------------------------------------------------------

## 3. Carga Inferencial (H1)

Alta: - Conclusión no explícita. - Restricción lógica implícita. -
Múltiples pasos no visibles.

Media: - Inferencia directa no trivial.

Baja: - Aplicación directa o lectura literal.

------------------------------------------------------------------------

## 4. Difficulty (Refined Operational Definition)

Difficulty is not determined solely by the number of steps.

It is classified according to structural load, discrimination, and quality of distractors.

### Level 1 — Fundamental

Must meet at least 3 of the following criteria:

* Direct solution.
* No implicit inference.
* Weak or obvious distractors.
* Does not require reinterpretation of the problem statement.
* Superficial typical error.

### Level 2 — Intermediate

Must meet at least 3 of the following criteria:

* Requires careful interpretation.
* Two chained operations.
* Plausible distractors.
* May induce error due to inaccurate reading.
* Moderate inference (not fully explicit).

### Level 3 — High Discrimination

Must meet at least 3 of the following criteria:

* Strong implicit inference (high H1).
* Conceptual step not evident.
* Clear structural trap.
* Highly plausible distractors.
* Attractive alternative incorrect solution.
* Requires structural reorganization of information.

Level 3 does not imply more calculation, but rather a higher structural standard.

**Warning: There is a natural bias toward over-classifying items as Level 2. The agent must actively monitor for this bias.**

------------------------------------------------------------------------

# TIPOLOGÍA DE RAZONAMIENTO (CERRADA)

El agente debe seleccionar UNA categoría dominante:

-   Inferencia deductiva
-   Traducción simbólica
-   Comparación proporcional
-   Generalización de patrón
-   Identificación de tesis
-   Evaluación de coherencia
-   Visualización geométrica

No se permiten nuevas categorías.

------------------------------------------------------------------------

# TIPOS DE DISTRACTOR (CERRADOS)

Seleccionar el dominante:

-   Error de cálculo
-   Lectura superficial
-   Modelado incorrecto
-   Confusión de proporcionalidad
-   Inferencia inválida
-   Generalización excesiva
-   Interpretación literal errónea

------------------------------------------------------------------------

# MANEJO DE PREGUNTAS HÍBRIDAS

Si el ítem mezcla habilidades:

1.  Identificar salto cognitivo decisivo.
2.  Clasificar según ese punto.
3.  Registrar ambigüedad si existe conflicto real.

Nunca dividir clasificación.

------------------------------------------------------------------------

# FORMATO DE SALIDA OBLIGATORIO (POR ÍTEM)

El agente debe producir exactamente este formato:

-   Macro-área:
-   Habilidad dominante:
-   H1 (carga inferencial):
-   Dificultad:
-   Tipo de razonamiento:
-   Estructura lógica subyacente:
-   Tipo de distractor:
-   Trampa recurrente:
-   Tiempo implícito estimado:
-   Patrón estructural repetible:
-   Justificación breve:

No agregar texto adicional fuera del formato.

------------------------------------------------------------------------

# CONTROL DE CONSISTENCIA AL FINAL DEL EXAMEN

Al finalizar la extracción completa, el agente debe generar:

1.  Distribución por habilidades.
2.  Distribución por dificultad.
3.  Porcentaje de H1 alta.
4.  Matriz RCV vs RCM.
5.  Lista consolidada de patrones estructurales repetibles.

Si no puede generar estos cinco outputs, el protocolo fue mal aplicado.

------------------------------------------------------------------------

# POST-EXAM CALIBRATION RULE

Upon completion of the full classification of a pilot exam:

Order the 45 items according to perceived actual difficulty.

Verify consistency with the target structural distribution (12 / 22 / 11).

If there is significant inflation of Level 2 items:

Review comparatively.

Reassign levels according to relative discrimination.

The classification must reflect a real internal hierarchy, not isolated perception.

Classification by simply counting steps is prohibited.

------------------------------------------------------------------------

# RESOLUCIÓN DE DESACUERDOS ENTRE AGENTES

Si dos agentes producen clasificaciones distintas:

1.  Comparar justificaciones.
2.  Revisar punto crítico de resolución.
3.  Aplicar criterio de "operación dominante".

Si no hay consenso técnico: Registrar conflicto en Decision_Log.

Nunca resolver por votación.

------------------------------------------------------------------------

# SISTEMIC VALIDATION LAYER (OBLIGATORIO EN EJECUCIÓN REAL)

Este bloque introduce validación estructural en tiempo real durante la ejecución de Fase 3B.

Su objetivo es asegurar que el sistema no solo clasifica ítems, sino que está capturando correctamente el modelo cognitivo del examen.

1. Batch-Level Aggregation (Obligatorio)

El agente debe generar un bloque de salida estructurado al finalizar cada batch.

Formato obligatorio:

BATCH SUMMARY
Batch ID:
Total ítems:
Distribución por habilidades:
Distribución por dificultad:
% H1 alta:
Ítems ambiguos (count):
Patrones detectados (count):

Este bloque debe producirse inmediatamente después del procesamiento del batch.

Si este bloque no se genera, la ejecución se considera inválida.

2. Convergence Signals (Modelo Cognitivo)

El sistema debe monitorear señales de convergencia.

Se considera que el modelo está siendo correctamente capturado si:

La distribución por habilidades es estable entre batches (variación ≤ ±10%)
La dificultad muestra jerarquía real (no concentración artificial en nivel 2)
Los patrones estructurales se estabilizan (no crecen indefinidamente)
La ambigüedad se mantiene ≤10% y es no aleatoria

Si estas condiciones no se cumplen, el modelo no está convergiendo.

3. Drift Detection (Obligatorio)

El agente debe comparar cada batch contra:

Promedio acumulado del proyecto
Otros batches del mismo examen

Se consideran señales de deriva:

Variaciones estructurales > ±10% en habilidades
Inflación de dificultad nivel 2
Caída de H1 alta
Incremento no explicado de ambigüedad

Ante deriva detectada:

Marcar batch como "INVALID"
Registrar evento en Decision_Log
Detener ejecución automáticamente

La ejecución no puede continuar hasta que:

Se revise el criterio de clasificación
Se ajuste el agente o prompt
Se reinicie el batch

4. Inter-Agent Consistency

Cuando múltiples agentes participan:

Se deben comparar clasificaciones sobre muestras comunes
Evaluar desacuerdo en:
Habilidad dominante
Dificultad
Carga inferencial

Criterio:

Desacuerdo estructural >15% → requiere intervención

Nunca asumir consenso implícito.

5. Operational Validity Condition

La ejecución de Fase 3B es válida solo si TODOS los batches cumplen:

Generación correcta de BATCH SUMMARY
No están marcados como INVALID
Ambigüedad ≤10%
No hay señales activas de deriva
Patrones estructurales muestran estabilización

Si cualquier batch falla:

La ejecución completa se considera inválida
No se puede escalar a Fase 3C

Este layer no reemplaza la secuencia de análisis por ítem.

Actúa como validación sistémica continua para garantizar coherencia estructural bajo ejecución real.

## Cross-Source Convergence Check

Antes de declarar completada la Fase 3B, se debe ejecutar una validación de convergencia entre al menos dos fuentes independientes del examen.

Objetivo

Verificar que el modelo estructural extraído es estable y no depende de una única muestra.

Inputs requeridos
Dataset estructurado (Fase 3B) de al menos dos exámenes distintos
Ambos datasets deben haber sido aprobados previamente por el agente 3B
Restricciones
No reinterpretar ítems
No modificar clasificaciones
No ajustar metadata
Solo comparar resultados estructurales existentes
Métricas de validación
Distribución de habilidades (H2–H7)
Diferencia máxima permitida: ±10%
Distribución de dificultad
Sin inflación de nivel 2
Jerarquía coherente entre niveles
Porcentaje de H1 (Alta dificultad)
Variación máxima permitida: ±5%
Patrones estructurales
Deben repetirse entre fuentes
No deben aparecer nuevos patrones dominantes
Ambigüedad estructural
Máximo permitido: 10%
No concentrada en un solo tipo de ítem
Resultado

Caso A — Convergencia

Métricas dentro de los rangos aceptables
Patrones consistentes

→ Se autoriza cierre de Fase 3B
→ Se permite transición a Fase 3C

Caso B — Divergencia

Métricas fuera de rango
Patrones inconsistentes o nuevos relevantes

→ No se puede cerrar Fase 3B
→ Se requiere revisión del modelo estructural

Nota operativa

Esta validación es obligatoria y forma parte del criterio real de finalización de la Fase 3B.
No puede omitirse, incluso si un único dataset parece consistente de manera interna.

## EXIT RULE — FASE 3B (OBLIGATORIO)

### 1. Condición de Estabilidad

Se considera que el sistema alcanza estabilidad cuando se cumplen simultáneamente en batches consecutivos:

*   Variación en distribución por habilidades ≤ ±10%
*   Distribución de dificultad sin inflación dominante en nivel 2
*   % H1 alta estable (variación ≤ ±5%)
*   Ambigüedad estructural ≤10%
*   Número de patrones nuevos detectados tiende a 0 o crecimiento marginal (≤1 patrón nuevo por batch)

### 2. Número Mínimo de Batches

Mínimo obligatorio: 3 batches consecutivos válidos
Todos deben cumplir:
*   BATCH SUMMARY generado
*   No marcados como INVALID
*   Sin señales activas de deriva

### 3. Criterio de Convergencia

Se considera convergencia suficiente cuando:

*   Las métricas de los últimos 3 batches cumplen condición de estabilidad
*   No hay cambios estructurales relevantes entre batches
*   Los patrones detectados se repiten (no emergen nuevos de forma significativa)

### 4. Condición de Cierre Obligatoria

La Fase 3B debe cerrarse inmediatamente cuando:

*   Se cumplen los criterios de estabilidad en 3 batches consecutivos
*   No existen batches INVALID en la ventana evaluada

Una vez cumplido:

*   Se prohíbe continuar extracción adicional con fines de refinamiento
*   Se autoriza transición directa a Fase 3C

## FAILURE OVERRIDE RULE (OBLIGATORIO)

Si no se alcanza convergencia perfecta:

Avanzar a Fase 3C cuando se cumpla:

*   Al menos 5 batches válidos ejecutados
*   ≥80% de los batches cumplen condición de estabilidad
*   Ambigüedad promedio ≤12%
*   No existe deriva sistemática (solo variación local)

Prohibido:

*   Extender ejecución buscando convergencia perfecta
*   Reprocesar batches sin señal clara de error estructural

Este override fuerza progresión bajo incertidumbre controlada.

## FAST ITERATION PRINCIPLE (OBLIGATORIO)

Regla operativa:

*   El sistema optimiza por estabilidad suficiente, no perfección local
*   Cualquier mejora que no altere métricas de batch ≥5% se considera irrelevante
*   No se permite iterar sobre micro-ajustes sin impacto en métricas agregadas

Criterio de corte:

*   Si un ajuste no cambia distribución, ambigüedad o H1 de forma significativa → se descarta automáticamente

Objetivo:

*   Mantener velocidad de ejecución
*   Evitar sobre-optimización
*   Preservar coherencia sistémica

------------------------------------------------------------------------

# CIERRE OPERATIVO


Este protocolo es obligatorio antes de cualquier producción masiva.

No autoriza creación de banco. No autoriza diseño de simulacros. No
autoriza modificación estructural.

Solo extracción estructural disciplinada.
