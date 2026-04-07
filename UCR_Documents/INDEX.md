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
| **UCR26_Blueprint.md** | Documento histórico de debate estratégico (ARCHIVED). Define el modelo de producción industrial IA para UCR 2026: arquitectura de 45 ítems / 110 min / 4 opciones, mapa cognitivo oficial con 7 habilidades nucleares (H2–H7), banco mínimo de ~250–255 ítems, decisiones de gobernanza multi-fuente y protocolo Clean Room. No es operativo; sirve como registro estratégico que antecede los SSoT. |
| **INDEX.md** | Índice maestro del motor de contenido. Describe el estado general del sistema, su jerarquía de autoridad (reglas de inmutabilidad), mapping de directorios y el dataset final operativo. Es el documento de referencia principal de arquitectura. |
| **UCR26_Fase_2A_Explanation_System.md** | Especificación para el sistema de generación de explicaciones (Fase 2). Define restricciones de prompts, comportamiento del sistema y reglas metodológicas para explicaciones estructuradas de ítems. |
| **UCR26_Fase_2B_Prompt_Library.md** | Repositorio central de plantillas de prompts e instrucciones del sistema utilizadas durante la ejecución del sistema de generación en la Fase 2. |
| **UCR26_Fase_2C_Validation_System.md** | Define los protocolos de validación y controles de aseguramiento de calidad QA aplicados exclusivamente a los outputs de generación de explicaciones. |
| **UCR26_Fase_3A_Marco_Operativo_Minimo.md** | Define el marco mínimo obligatorio antes de iniciar extracciones. Establece estructura de directorios, plantillas de extracción, revisión cruzada, registro de decisiones ambiguas y el Batch Consistency Control (métricas obligatorias, deriva, consistencia entre agentes). |
| **UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md** | Protocolo formal de extracción estructural para agentes de IA. Define la secuencia de 11 pasos, criterios de clasificación, validación por batch, Cross-Source Convergence Check y reglas de falla/salida. |
| **UCR26_Fase_3C_Muestra_Piloto_Controlada.md** | Valida la coherencia global del sistema de extracción sobre un examen (45 ítems). Confirma que los logs e inferencias escalan consistentemente, estableciendo la condición de entrada desde 3B. |
| **UCR26_Fase_4A_Production_System.md** | Define el sistema de producción industrial automático. Cubre Template System, Prompt System, Item Gen System, Adversarial Validation y Metrics System de generación directa. Operativo 100% sin humanos. |
| **UCR26_Fase_4B_Bank_System.md** | Define el ensamblaje lógico de batches. Establece segmentación estricta (diagnostic / simulation / training), aislamiento de segmentos, auditorías binarias, trazabilidad de fallos. Output pre-fase 5 dictó el bloque funcional de 252. |
| **UCR26_Fase_4C_Pipeline_Execution.md** | Orquestación end-to-end del pipeline de producción automatizada de contenido. Control de flujos, reintentos, error mapping (error→acción) manual e inyección de datos. |
| **UCR26_Fase_5A_Governance_Bank_Build.md** | Gobernanza de construcción final: reglas formales sin modificación conceptual o "reclasificación" de ítems tras la compilación exitosa en las fases previas. |
| **UCR26_Fase_5B_Data_Schema_Bank_Enriched.md** | Estructura vinculante del `bank_v1_enriched.json`. Especifica field rules, trazabilidad exigida, y constantes de normalización JSON. Toda violación de esquema invalida un dataset. |
| **UCR26_Fase_5C_Build_Protocol.md** | Protocolo explícito (10 pasos) para ensamblar el `bank_v1_enriched.json` mediante extracción de batch, normalizaciones ID y agregado analítico de simulación. |
| **UCR26_Fase_5D_Validation_Checklist.md** | Checklist definitivo del SSoT (Schema compliance, count validation STRAT, duplicaciones, serialization, entre otros). Aprueba a JSON final para uso en plataforma mediante [UCR26-GOV-004] excepción formal de "252" ítems mínimamente válidos. |

---

## Capa 2: Árbol de Datos y Artefactos (UCR26_Content)
**Ubicación:** `/UCR26_Content/`

Este mapa detalla estrictamente la estructura estática consolidada (SSoT) tras finalizar la ejecución inmutable del motor. Todos los objetos en esta capa asumen su nomenclatura estructural basándose en el modelo fundacional definido en `UCR26_Fase_3A_Marco_Operativo_Minimo.md`.

```text
UCR26_Content/
├── 00_SOURCE_RAW/
│   ├── UCR_2025_V1.md                            # Insumo estricto original para extracción. Inmutable.
│   └── UCR_2025_V3.pdf                           # Examen independiente usado para alineación visual cruzada.
├── 01_EXTRACTION_STRUCTURAL/
│   ├── UCR_2025_V1.md                            # Primer vector: Clasificación de tipología cognitiva ítem por ítem.
│   └── UCR_2025_V3.md                            # Segundo vector: Validación de consistencia transversal (Convergence Check).
├── 02_PATTERN_REGISTRY/
│   └── MASTER_Structural_Patterns.md             # Base maestra histórica de patrones lógicos subyacentes.
├── 03_ITEM_PRODUCTION/
│   ├── BATCHES/                                  # Lotes pre-calculados (e.g. batch_001.json). Output transitorio evidencial.
│   ├── DRAFT/                                    # Recursos de trabajo estático temporal creados en pipeline.
│   ├── REJECTED/                                 # Almacenamiento frío de ítems defectuosos bloqueados por QA heurístico.
│   ├── SYSTEM_BOOTSTRAP/                         # Respuestas cognitivas de calentamiento, logs de inicialización inerte.
│   ├── VALIDATED/                                # Aprobaciones puras resultantes post-Adversarial Validation.
│   ├── _deprecated/                              # Reciclaje histórico y dumps analíticos previos.
│   ├── audit_bank.js                             # [SCRIPT] Node.js automatizado para control volumétrico y conteo.
│   ├── check_keys.js                             # [SCRIPT] Utilidad Node.js para integridad llave-valor de JSON strings.
│   ├── final_audit.js                            # [SCRIPT] Inspector profundo JS exigido antes del pasaje a Fase 5.
│   ├── inspect_pool.js                           # [SCRIPT] Visor en-memoria de segmentos lógicos (RCV vs RCM).
│   └── bank_v1_enriched.json                     # [ABSOLUTE SSoT] Dataset compilado inmutable de 252 ítems listos para platform runtime.
├── 04_VALIDATION/
│   ├── audit.ps1                                 # [SCRIPT] PowerShell crawler para auditoría y verificación de hashes en Windows.
│   ├── audit_script.py                           # [SCRIPT] Python JSON parser y validador algorítmico estricto.
│   └── Cross_Review_Log.md                       # Track record de revisión cruzada de agentes y resolución semántica.
└── 05_GOVERNANCE/
    ├── Decision_Log.md                           # SSoT de Gobernanza y directivas históricas (e.g. ajustes de cuotas [GOV-XXX]).
    ├── Version_Log.md                            # Timeline histórico y sellos de aprobación para estados de arquitectura.
    ├── UCR_2025_V1_aggregates_v2.md              # Datos de convergencia sobre exámenes experimentales.
    ├── UCR_2025_V1_comparison_FINAL.md           # Reporte de Cierre: Cross-Source Convergence Check entre exámenes.
    ├── UCR_2025_V1_dataset_validation.md         # Conformidad probatoria del cumplimiento 3B/3C sobre la muestra controlada.
    └── UCR_2025_V1_pilot_selection.md            # Razonamiento metodológico de la selección del piloto evaluado.
```
