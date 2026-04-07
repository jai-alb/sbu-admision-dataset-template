# FASE 3A --- MARCO OPERATIVO MÍNIMO

## UCR 2026 · Sistema de Extracción Estructural

------------------------------------------------------------------------

# 1. ESTRUCTURA DE ALMACENAMIENTO (OBLIGATORIA)

Raíz del proyecto:

/UCR26_Content/

Estructura:

UCR26_Content/ ├── 00_SOURCE_RAW/ │ ├── UCR_YYYY_VX.pdf │ ├──
01_EXTRACTION_STRUCTURAL/ │ ├── UCR_YYYY_VX.md │ ├──
02_PATTERN_REGISTRY/ │ └── MASTER_Structural_Patterns.md │ ├──
03_ITEM_PRODUCTION/ │ ├── DRAFT/ │ ├── VALIDATED/ │ └── REJECTED/ │ ├──
04_VALIDATION/ │ └── Cross_Review_Log.md │ └── 05_GOVERNANCE/ ├──
Decision_Log.md └── Version_Log.md

Reglas: - RAW es intocable. - Extraction solo contiene análisis
estructural. - Production nunca contiene texto literal UCR. - VALIDATED
requiere doble revisión. - Todo conflicto debe registrarse.

------------------------------------------------------------------------

# 2. CONVENCIÓN DE NOMBRADO DE EXÁMENES

Formato obligatorio:

UCR\_{YEAR}\_V{VERSION}

Ejemplos: - UCR_2022_V1 - UCR_2023_V1 - UCR_2023_V2

No se permiten nombres informales.

------------------------------------------------------------------------

# 3. PLANTILLA OFICIAL DE EXTRACCIÓN

Cada archivo dentro de 01_EXTRACTION_STRUCTURAL debe seguir este
formato:

# EXAM: UCR_YYYY_VX

## METADATA

-   Total Items: 45
-   Modelo estructural confirmado: Sí / No
-   Observaciones generales:

------------------------------------------------------------------------

## ITEM 01

-   Macro-área: RCV / RCM
-   Habilidad dominante: H2--H7
-   H1 presente: Baja / Media / Alta
-   Dificultad estimada: 1 / 2 / 3
-   Tipo de razonamiento:
-   Estructura lógica subyacente:
-   Tipo de distractor:
-   Trampa recurrente:
-   Tiempo implícito estimado:
-   Patrón estructural repetible:
-   Notas ambiguas:

------------------------------------------------------------------------

(Repetir estructura hasta ITEM 45)

Regla crítica: No copiar texto literal del ítem. Solo describir
estructura cognitiva.

------------------------------------------------------------------------

# 4. REGLA DE REVISIÓN CRUZADA

Proceso obligatorio:

1.  Revisor A clasifica.
2.  Revisor B clasifica sin ver la clasificación de A.
3.  Comparación estructurada.

Resultados posibles:

-   Coincidencia total → Validado.
-   Diferencia menor (nivel o carga inferencial) → Documentar.
-   Diferencia mayor (habilidad dominante distinta) → Registrar en
    Cross_Review_Log.
-   Sin consenso tras discusión → Registrar como "Ambiguo estructural"
    en Decision_Log.

Nunca se fuerza consenso sin registro.

------------------------------------------------------------------------

# 5. CONTROL MÍNIMO DE VERSIONES

Versionado por archivo de extracción:

-   v0.1 → Clasificación inicial.
-   v0.2 → Tras revisión cruzada.
-   v1.0 → Validado estructuralmente.

Toda actualización debe registrarse en:

05_GOVERNANCE/Version_Log.md

------------------------------------------------------------------------

# 6. REGISTRO DE DECISIONES AMBIGUAS

Formato obligatorio en Decision_Log.md:

## DEC-XXX

Fecha: Examen: Item: Conflicto: Resolución: Impacto en taxonomía:

Si el conflicto afecta estructura formal, prevalece STRAT y PROD.

------------------------------------------------------------------------
# 7. BATCH CONSISTENCY CONTROL (OBLIGATORIO EN FASE 3B)

Este control es obligatorio cuando la Fase 3B se ejecuta sobre múltiples lotes de ítems o mediante múltiples agentes.

Su objetivo es evitar deriva estructural, inconsistencias de clasificación y pérdida de coherencia del modelo cognitivo.

7.1 Unidad de Control

Un "batch" se define como:

Un conjunto de ítems procesados en una misma ejecución del agente
O una unidad lógica de procesamiento (ej. 10–25 ítems)

Cada batch debe generar métricas agregadas obligatorias.

7.2 Métricas Obligatorias por Batch

Para cada batch se deben registrar:

Distribución por habilidades (H2–H7)
Distribución por dificultad (1 / 2 / 3)
Porcentaje de H1 alta
Número de ítems con ambigüedad estructural
Número de patrones estructurales detectados

Estas métricas deben almacenarse junto al archivo de extracción o en registro de control.

7.3 Control de Deriva

Se debe comparar cada batch contra:

Promedio acumulado del proyecto
Otros batches del mismo examen

Se consideran señales de deriva:

Variación > ±10% en distribución de habilidades
Inflación anómala de dificultad nivel 2
Disminución significativa de H1 alta
Incremento no explicado de ambigüedad

Si se detecta deriva:

Detener procesamiento
Revisar criterios de clasificación
Ajustar prompt o agente antes de continuar

7.4 Consistencia Entre Agentes

Cuando múltiples agentes participan:

Se debe comparar clasificación entre agentes sobre muestras comunes
Medir tasa de desacuerdo en:
Habilidad dominante
Dificultad
Carga inferencial

Criterio:

Desacuerdo estructural >15% → requiere revisión obligatoria

Nunca asumir consenso implícito.

7.5 Condición de Continuidad

La Fase 3B solo puede continuar si:

Las métricas por batch son generables
No hay deriva estructural significativa
La ambigüedad se mantiene controlada (≤10%)

Si no se cumplen estas condiciones:

El sistema de extracción se considera inestable
Se debe pausar la ejecución y ajustar antes de escalar

CIERRE OPERATIVO

Este control no reemplaza el protocolo de Fase 3B.

Actúa como capa de validación sistémica para garantizar que la extracción estructural mantiene coherencia bajo ejecución real.

------------------------------------------------------------------------

# CIERRE OPERATIVO

Este documento define el marco mínimo obligatorio antes de cualquier
extracción.

No se inicia Fase 3B sin cumplimiento completo de 3A.
