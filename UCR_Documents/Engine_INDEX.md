# INDEX — sbu-admision-content-engine

**Sistema:** axion-u-content-engine · UCR 2026  
**Estado:** CLOSED (ARCHIVED PRODUCTION SYSTEM)  
**Output final:** `UCR26_Content/03_ITEM_PRODUCTION/bank_v1_enriched.json` — 252 ítems · SSoT

---

## UCR_Documents/ — Capa Normativa (Reglas de ejecución)

| Archivo | Descripción |
|---|---|
| **Blueprint.md** | Documento histórico de debate estratégico (ARCHIVED). Define el modelo de producción industrial IA para UCR 2026: arquitectura de 45 ítems / 110 min / 4 opciones, mapa cognitivo oficial con 7 habilidades nucleares (H2–H7), banco mínimo de ~250–255 ítems, decisiones de gobernanza multi-fuente y protocolo Clean Room. No es operativo; sirve como registro estratégico que antecede los SSoT. |
| **INDEX.md** | Índice maestro del sistema content-engine. Describe el estado general (CLOSED), el output final, las 4 capas del sistema (Normativa, Datos, Gobernanza, Evidencia de ejecución), las reglas críticas de inmutabilidad y la jerarquía de autoridad interna. Es el documento de referencia rápida del sistema completo. |
| **UCR26_Fase_3A_Marco_Operativo_Minimo.md** | Define el marco mínimo obligatorio antes de iniciar cualquier extracción. Establece estructura de directorios, convención de nombrado de exámenes, plantilla oficial de extracción por ítem, regla de revisión cruzada, control mínimo de versiones, registro de decisiones ambiguas y Batch Consistency Control (métricas obligatorias, control de deriva, consistencia entre agentes). Sin cumplimiento de 3A no se inicia Fase 3B. |
| **UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md** | Protocolo formal de extracción estructural para agentes de IA. Define la secuencia obligatoria de análisis ítem por ítem (11 pasos), criterios de clasificación (macro-área, habilidad dominante, H1, dificultad, tipología de razonamiento y distractores), formato de salida estructurado, validación sistémica continua por batch (BATCH SUMMARY, señales de convergencia, detección de deriva, inter-agent consistency), Cross-Source Convergence Check, Exit Rule y Failure Override Rule. |
| **UCR26_Fase_3C_Muestra_Piloto_Controlada.md** | Valida la coherencia global del sistema de extracción sobre un examen completo (45 ítems). No re-valida desde cero; confirma que los outputs de Fase 3B se mantienen coherentes al escalar. Define la condición de entrada desde 3B, secuencia operativa, outputs obligatorios del piloto, criterios de confirmación y prohibiciones. Se ejecuta una sola vez. |
| **UCR26_Fase_4A_Production-System.md** | Define el sistema de producción industrial de ítems. Cubre: Template System (estructura, lifecycle, criterios de invalidez), Prompt System (Prompt-GEN y Prompt-ADV), Item Generation System, Adversarial Validation System, Failure Handling, Metrics System y Execution Rules. Todo ítem debe ser trazable a template_id y prompt_id. El sistema opera sin intervención humana. |
| **UCR26_Fase_4B_Bank-System.md** | Define el sistema de ensamblaje y auditoría del banco completo. Establece la segmentación estricta (diagnostic / simulation / training), distribución exacta por habilidades y dificultad en simulacros, control de H1 por segmento, aislamiento estructural entre segmentos, trazabilidad, motor de ensamblaje, protocolo de auditoría sistémica (binary: approved / rejected) y reactive system. Output final aprobado: 252 ítems (post Phase 5). |
| **UCR26_Fase_4C_Pipeline-Execution.md** | Define la orquestación end-to-end del pipeline de producción. Cubre: estados del pipeline (active / blocked / completed), etapas del pipeline, flujo de ítems, sistema de reintentos, sistema de batches con métricas obligatorias, Drift Control System, Flow Control 4A→4B, gestión de errores con mapeo explícito error→acción, Locking System y reglas de completitud. Pipeline cerrado con 26 batches; 252 ítems finales. |
| **UCR26_Fase_5A_Governance_Bank-Build.md** | Gobernanza de Fase 5: construcción de `bank_v1_enriched.json`. Define reglas core (sin modificación de ítems ni reclasificación), transformaciones permitidas (normalización de metadata, formateo, estandarización de IDs), acciones prohibidas, integrity constraints y condiciones de bloqueo. Output binario: approved / blocked. |
| **UCR26_Fase_5B_Data-Schema_Bank-Enriched.md** | Define el esquema de datos exacto y vinculante de `bank_v1_enriched.json`. Especifica root structure, item structure (content, metadata, traceability), field rules para cada campo, content rules, metadata rules, traceability rules, normalization rules, prohibited fields e integrity constraints. Toda violación de esquema invalida el dataset. |
| **UCR26_Fase_5C_Build-Protocol.md** | Protocolo de ejecución para construir `bank_v1_enriched.json` desde los batches aprobados de Fase 4B. Define la secuencia estricta de 10 pasos (Batch Collection → Item Extraction → Segment Assignment → Schema Mapping → ID Normalization → Traceability Injection → Aggregation → Simulation Ordering → Pre-Validation → Serialization), control rules, versionado y condiciones de bloqueo. |
| **UCR26_Fase_5D_Validation-Checklist.md** | Checklist final de validación de `bank_v1_enriched.json` antes de declararlo usable. Cubre 10 áreas: completeness, schema compliance, segment integrity, count validation (STRAT), distribution integrity, traceability, duplication control, metadata integrity, content integrity y serialization. Incluye la excepción [UCR26-GOV-004] que aprueba 252 ítems como mínimo válido. Output binario: approved / blocked. |

---

## UCR26_Content/ — Capa de Datos y Ejecución

### 00_SOURCE_RAW/

| Archivo | Descripción |
|---|---|
| **UCR_2025_V1.md** | Fuente raw del examen UCR 2025 en formato Markdown. Insumo original para extracción estructural. Intocable según las reglas del sistema. |

### 01_EXTRACTION_STRUCTURAL/

| Archivo | Descripción |
|---|---|
| **UCR_2025_V1.md** | Extracción estructural del examen UCR 2025 V1. Contiene clasificación ítem por ítem (macro-área, habilidad dominante, H1, dificultad, patrones) siguiendo la plantilla de Fase 3A. |
| **UCR_2025_V3.md** | Extracción estructural del examen UCR 2025 V3. Segunda fuente independiente utilizada para el Cross-Source Convergence Check de Fase 3B. |

### 02_PATTERN_REGISTRY/

| Archivo | Descripción |
|---|---|
| **MASTER_Structural_Patterns.md** | Registro maestro de patrones estructurales repetibles detectados durante Fase 3B/3C. Archivo placeholder (vacío al cierre); los patrones quedaron integrados en el banco de producción. |

### 04_VALIDATION/

| Archivo | Descripción |
|---|---|
| **Cross_Review_Log.md** | Log de revisiones cruzadas entre agentes durante la extracción estructural. Archivo placeholder (vacío al cierre); conflictos relevantes escalaron a Decision_Log. |

### 05_GOVERNANCE/

| Archivo | Descripción |
|---|---|
| **Decision_Log.md** | Registro oficial de decisiones de gobernanza del sistema. Contiene 5 entradas: GOV-001 (corrección distribución RCV H3/H5), GOV-002 (fix rango total banco 259–265), GOV-003 (excepción banco 254 ítems), GOV-004 (ajuste final a 252 ítems) y GOV-005 (aprobación y cierre definitivo de Fase 5). Es el registro de autoridad sobre cualquier override estructural. |
| **Version_Log.md** | Historial de versiones del sistema de contenido. Registra: v0.1 (inicialización, Fase 3A), v1.0 (primer banco válido aprobado por F4B), v1.2 (ajuste a 252 ítems) y v1.5 (cierre definitivo, pipeline frozen, SSoT declarado). |
| **UCR_2025_V1_aggregates_v2.md** | Métricas agregadas v2 del examen UCR 2025 V1. Resumen cuantitativo de distribuciones estructurales generado durante la fase de extracción. |
| **UCR_2025_V1_comparison_FINAL.md** | Comparación final de clasificaciones estructurales del examen UCR 2025 V1. Evidencia del Cross-Source Convergence Check y revisión cruzada entre agentes. |
| **UCR_2025_V1_dataset_validation.md** | Registro de validación del dataset de extracción del examen UCR 2025 V1. Confirma cumplimiento de criterios de Fase 3B/3C antes del cierre de extracción. |
| **UCR_2025_V1_pilot_selection.md** | Registro de la selección del examen piloto para Fase 3C y criterios aplicados para su elección como muestra de validación controlada. |

---

## Notas finales

- **SSoT único:** `UCR26_Content/03_ITEM_PRODUCTION/bank_v1_enriched.json` (252 ítems, production_ready)
- **Sistema cerrado:** ningún documento es re-ejecutable sin reactivación explícita
- **Jerarquía de autoridad:** `bank_v1_enriched.json` → `Decision_Log.md` → documentos normativos F3–F5 → artefactos de ejecución
