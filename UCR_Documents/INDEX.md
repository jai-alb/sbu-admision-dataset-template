---
area: ARCHITECTURE
confidentiality: INTERNAL
depends_on: []
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: INDEX.md
version:
  major: 1
  minor: 0
---

# INDEX — axion-u-content-engine

> **Introducción del Repositorio**  
> Este proyecto constituye el núcleo técnico diferencial (Technical Core) de **sbu-admision**, una unidad estratégica de negocio (SBU) perteneciente al holding **Cyboring Technologies LLC**. 
> 
> El propósito central de este motor fue resolver la alta complejidad técnica de realizar la **extracción estructural** y el procesamiento del contenido intelectual de los exámenes de admisión universitarios (UCR/UNA). Mediante un modelo estricto de **Producción Industrial IA** operado bajo protocolo *Clean Room*, el sistema decodificó el mapa cognitivo oficial en una taxonomía cerrada de habilidades nucleares para asimilar patrones lógicos, abstrayendo dependencias de fuentes estáticas. El resultado es la síntesis de Propiedad Intelectual (IP) propietaria: un banco de preguntas dinámico, rigurosamente estructurado y enriquecido con metadatos, que funge como el principal activo defensible (SSoT) de la infraestructura formativa comercial.

**Sistema:** UCR 2026 Content Engine  
**Estado:** **CLOSED (ARCHIVED PRODUCTION SYSTEM)**  

---

## Reglas Críticas e Inmutabilidad (System Rules)

1. **El motor está CERRADO.** No se permite la ejecución activa.
2. **Sistema inmutable:** Ninguna fase (F3–F5) puede ser re-ejecutada y no se permite la generación de ítems.
3. **Restricción de datos:** Ninguna modificación al dataset final está permitida. El sistema solo es modificable si es posicionado bajo un versionado explícitamente nuevo.
4. **Relación con Producción (Main System):** Este repositorio es *upstream* de AXION U. AXION U consume **ÚNICAMENTE** el dataset final. No existe dependencia de runtime entre los sistemas y este motor NO es parte de producción en vivo.

### Jerarquía de Autoridad (Internal Hierarchy)
1. **`bank_v1_enriched.json`** → Absolute SSoT (Single Source of Truth).
2. **`Decision_Log.md`** → Excepciones y overrides de gobernanza.
3. **Documentos normativos** (Fases 2–5) → Reglas teóricas y protocolos.
4. **Artefactos de ejecución** → Evidencia histórica (No vinculante, no SSoT).

> **FINAL RULE:**
> Si se intenta regenerar ítems, modificar el dataset, o reinterpretar las fases directamente aquí, el sistema debe considerarse **VIOLATED**.

---

## Capa 1: Normativa y Reglas de Ejecución
**Ubicación:** `/UCR_Documents/`  
*Estos documentos definen todo el sistema de ejecución pero actualmente son **CLOSED** y **NON-EXECUTABLE**.*

| Archivo | Descripción |
|---|---|
| **Blueprint.md** | Documento histórico de debate estratégico (ARCHIVED). Define el modelo de producción industrial IA para UCR 2026: arquitectura de 45 ítems / 110 min / 4 opciones, mapa cognitivo oficial con 7 habilidades nucleares (H2–H7), banco mínimo de ~250–255 ítems, decisiones de gobernanza multi-fuente y protocolo Clean Room. No es operativo; sirve como registro estratégico que antecede los SSoT. |
| **INDEX.md** | Índice maestro del motor de contenido. Describe el estado general del sistema, su jerarquía de autoridad (reglas de inmutabilidad), mapping de directorios y el dataset final operativo. Es el documento de referencia principal de arquitectura. |
| **F2_Explanation-System_Spec_v1.md** | Especificación para el sistema de generación de explicaciones (Fase 2). Define restricciones de prompts, comportamiento del sistema y reglas metodológicas para explicaciones estructuradas de ítems. |
| **F2_PROMPTS_LIBRARY.md** | Repositorio central de plantillas de prompts e instrucciones del sistema utilizadas durante la ejecución del sistema de generación en la Fase 2. |
| **F2_VALIDATION_SYSTEM.md** | Define los protocolos de validación y controles de aseguramiento de calidad QA aplicados exclusivamente a los outputs de generación de explicaciones. |
| **UCR26_Fase_3A_Marco_Operativo_Minimo.md** | Define el marco mínimo obligatorio antes de iniciar extracciones. Establece estructura de directorios, plantillas de extracción, revisión cruzada, registro de decisiones ambiguas y el Batch Consistency Control (métricas obligatorias, deriva, consistencia entre agentes). |
| **UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md** | Protocolo formal de extracción estructural para agentes de IA. Define la secuencia de 11 pasos, criterios de clasificación, validación por batch, Cross-Source Convergence Check y reglas de falla/salida. |
| **UCR26_Fase_3C_Muestra_Piloto_Controlada.md** | Valida la coherencia global del sistema de extracción sobre un examen (45 ítems). Confirma que los logs e inferencias escalan consistentemente, estableciendo la condición de entrada desde 3B. |
| **UCR26_Fase_4A_Production-System.md** | Define el sistema de producción industrial automático. Cubre Template System, Prompt System, Item Gen System, Adversarial Validation y Metrics System de generación directa. Operativo 100% sin humanos. |
| **UCR26_Fase_4B_Bank-System.md** | Define el ensamblaje lógico de batches. Establece segmentación estricta (diagnostic / simulation / training), aislamiento de segmentos, auditorías binarias, trazabilidad de fallos. Output pre-fase 5 dictó el bloque funcional de 252. |
| **UCR26_Fase_4C_Pipeline-Execution.md** | Orquestación end-to-end del pipeline de producción automatizada de contenido. Control de flujos, reintentos, error mapping (error→acción) manual e inyección de datos. |
| **UCR26_Fase_5A_Governance_Bank-Build.md** | Gobernanza de construcción final: reglas formales sin modificación conceptual o "reclasificación" de ítems tras la compilación exitosa en las fases previas. |
| **UCR26_Fase_5B_Data-Schema_Bank-Enriched.md** | Estructura vinculante del `bank_v1_enriched.json`. Especifica field rules, trazabilidad exigida, y constantes de normalización JSON. Toda violación de esquema invalida un dataset. |
| **UCR26_Fase_5C_Build-Protocol.md** | Protocolo explícito (10 pasos) para ensamblar el `bank_v1_enriched.json` mediante extracción de batch, normalizaciones ID y agregado analítico de simulación. |
| **UCR26_Fase_5D_Validation-Checklist.md** | Checklist definitivo del SSoT (Schema compliance, count validation STRAT, duplicaciones, serialization, entre otros). Aprueba a JSON final para uso en plataforma mediante [UCR26-GOV-004] excepción formal de "252" ítems mínimamente válidos. |

---

## Capa 2: Datos y Core Assets (Absolute SSoT)
**Ubicación:** `/UCR26_Content/`

### Output Final Operativo:
- **`03_ITEM_PRODUCTION/bank_v1_enriched.json`** → **FINAL DATASET (SSoT)**  
  El banco final compilado que actúa como única fuente de verdad validada. Contiene la totalidad de los ítems cognitivos (`252`) y es el único archivo listo para consumo runtime. No se permite regeneración ni modificación.

### Recursos Raw y Estructurales (Históricos):

| Subdirectorio / Archivo | Descripción |
|---|---|
| **`00_SOURCE_RAW/UCR_2025_V1.md`** | Fuente raw del examen UCR 2025 en formato Markdown. Insumo estricto original para extracción estructural. Inmutable. |
| **`01_EXTRACTION_STRUCTURAL/UCR_2025_V1.md`** | Extracción estructural y clasificación de tipología cognitiva ítem por ítem del examen UCR_2025_V1 siguiendo F3A. |
| **`01_EXTRACTION_STRUCTURAL/UCR_2025_V3.md`** | Segunda fuente independiente utilizada para Cross-Source Convergence Check validado transversalmente. |
| **`02_PATTERN_REGISTRY/MASTER_Structural_Patterns.md`** | Registro maestro base con leyes y patrones estructurales lógicos detectados repetidamente (Placeholder base; reglas se embebieron por pipeline). |
| **`03_ITEM_PRODUCTION/BATCHES/`** | Directorio con evidencia transitoria de ejecución temporal por automatización (Not SSoT). |

---

## Capa 3: Ejecución, Validación y Gobernanza
**Ubicación:** `/UCR26_Content/04_VALIDATION/` y `/UCR26_Content/05_GOVERNANCE/`  
*Propósito: Rastrear decisiones operativas de modificación masiva y justificar alteraciones métricas sobre la marcha.*

| Archivo | Descripción |
|---|---|
| **`04_VALIDATION/Cross_Review_Log.md`** | Log de evidencia de revisión cruzada inter-agente durante la extracción de datos inicial. Los conflictos relevantes terminaban en el Decision Log. |
| **`05_GOVERNANCE/Decision_Log.md`** | Registro oficial y de máxima autoridad humana sobre gobernanza. Contiene overriding estructurado (ej. ajuste oficial GOV-004 validando el tamaño del banco a 252 ítems por recortes estructurales vs targets originales). |
| **`05_GOVERNANCE/Version_Log.md`** | Historial progresivo de los estados de arquitectura (ej. v1.5: cierre definitivo, pipeline frozen, SSoT declarado). |
| **`05_GOVERNANCE/UCR_2025_V1_aggregates_v2.md`** | Resumen cuantitativo generado sobre métricas extraídas en fases investigativas. |
| **`05_GOVERNANCE/UCR_2025_V1_comparison_FINAL.md`** | Registro final sobre la comparación estructural (Cross-Source Convergence Check evidenciado). |
| **`05_GOVERNANCE/UCR_2025_V1_dataset_validation.md`** | Validación comprobada de cumplimiento de fase inicial (3B/3C). |
| **`05_GOVERNANCE/UCR_2025_V1_pilot_selection.md`** | Elección y registro explícito que determinó por qué un examen piloto específico operaría como muestra base en las validaciones tempranas. |
