⚠️ Este documento es histórico. No usar para ejecución.

---
status: ARCHIVED
ssot: false
superseded_by:
  - UCR26_Fase_4A_Production-System.md
  - UCR26_Fase_4B_Bank-System.md
  - UCR26_Fase_4C_Pipeline-Execution.md
---

# UCR26 — Fase 4 (Arquitectura de Producción)

## Objetivo
**Inputs:** Patrones estructurales (Fase 3C), Reglas STRAT y PROD.
**Outputs:** Diseño arquitectónico de alto nivel (Blueprint) para estructurar el pipeline de generación de ~250 ítems.
**Reglas:**
- El documento opera como Arquitectura Meta / Blueprint Ejecutor (especificación).
- ❌ Prohibido incluir implementaciones SSoT o datos de instancia en este documento.
- Debe definir exclusivamente qué sistemas existen, qué contienen conceptualmente y qué contratos operativos cumplen.

---

# Sistemas requeridos

Este documento requiere la implementación de 3 SSoT operativos:
Production-System, Bank-System, Pipeline-Execution.
Cada uno constituye una capa ejecutable independiente del sistema.

**Convención de naming:**
Los SSoT derivados de esta fase deben seguir la nomenclatura:
- UCR26_Fase_4A_Production-System.md
- UCR26_Fase_4B_Bank-System.md
- UCR26_Fase_4C_Pipeline-Execution.md

Esta convención mantiene consistencia con el sistema de fases definido en Fase 3.

## Production System (spec) — Fase 4A
Alcance: Aseguramiento de la integridad estructural por unidad generada.

### Template-Library (Contrato)
**Inputs:** Estructuras conceptuales derivadas de Fase 3C.
**Outputs:** Requerimiento formal de la existencia de un repositorio o sistema separado (SSoT externo).
**Reglas:**
- Debe existir una librería documental independiente que consolide todas las plantillas.
- Los componentes obligatorios mínimos del objeto son: `template_id`, `skill`, `estructura lógica`, `distractores`, `dificultad`.
- ❌ Prohibidos los ejemplos, variaciones estructuradas o instanciadas en este documento de meta-arquitectura.
- **Template Failure Handling:** Si múltiples ítems derivados de un mismo template fallan la validación, el template debe ser marcado automáticamente como inválido. Un template inválido queda bloqueado para generación futura y requiere su revisión o reemplazo documentado en el SSoT externo.

### Validación Adversarial (Contrato)
**Inputs:** Ítem compilado + metadata adjunta del ciclo generativo.
**Outputs:** Veredicto binario y clasificación tipificada del error en caso de rechazo.
**Reglas:**
- Se requiere establecer un contrato algorítmico donde un conflicto entre agente generador y validador bloquea el ítem de forma total.
- Queda prohibida procesalmente la aprobación de instancias mediante esquemas de consenso débil.
- **Anti-Consenso IA Ilusorio Operacional:** Se exige imposición de separación estricta: agente generador ≠ agente validador. Debe imperar una divergencia estructural con prompts diferentes por diseño. ❌ Queda estrictamente prohibido reutilizar el prompt de generación como base para validar. La validación debe ser no simétrica; el validador debe evaluar el ítem bajo un criterio enteramente distinto al empleado por el generador.

---

## Bank System (spec) — Fase 4B
Alcance: Coherencia global, trazabilidad y ensamblaje final de la base de datos de ítems.

### Estructura de Banco
**Inputs:** Universo concurrente de ítems aprobados por las fases del Production System.
**Outputs:** Requisito de taxonomía (segmentación por diagnósticos, simulacros, training) y etiquetado multinivel.
**Reglas:**
- Existe una obligación intrínseca de incorporar salvaguardas arquitectónicas que prevengan la mezcla de habilidades primarias en instanciaciones del mismo contenedor.

### Bank-Audit-Protocol (Contrato)
**Inputs:** Banco intermedio o completado en fase de pre-cierre.
**Outputs:** Dictamen integral que valida la usabilidad comercial y técnica del sistema.
**Reglas:**
- Debe diseñarse una auditoría global para aseverar contra el compliance STRAT, midiendo: balance de dificultad objetivo, proporciones de inserción H1, y segregación inquebrantable en agrupadores paramétricos.
- Identificar discrepancias sistémicas o condiciones subóptimas agudas invalidará obligatoriamente la totalidad del banco hasta su recertificación.
- **Conexión SSoT:** Los parámetros y umbrales tolerables (habilidades, dificultad, H1) deben estar definidos forzosamente en un SSoT externo. Este sistema de auditoría debe estructurarse manteniendo la abstracción, con el rol único de verificar el cumplimiento estricto contra esos rangos externos.

---

## Pipeline Execution (spec) — Fase 4C
Alcance: Criterios operativos de orquestación transaccional y medición macro de embudos.

### Batch-Control-System
**Inputs:** Segmentos, volúmenes granulares y micro-lotes de producción continua.
**Outputs:** El sistema debe generar métricas agregadas por batch, consolidando un snapshot con estos componentes.
**Reglas:**
- Debe configurarse la captura forzosa de un resumen de validación por lote exponiendo su distribución en habilidades (H2–H7), sus niveles de dificultad estandarizados, y sus ratios métricos de ambigüedad.
- Divergencias sistémicas de habilidades o inflaciones constantes hacia una dificultad específica desatan flags insuprimibles a revisión de nivel superior.
- Sobrepasar la tolerancia estadística en ambigüedad forzará mecánicamente el estado de STOP deteniendo la máquina productiva de lote.
- **Cierre de Loop:** Ningún batch productivo puede continuar a etapas subsecuentes si existe un flag activo o si no se ha aplicado una acción correctiva al error detectado. El batch queda unívocamente en estado *bloqueado* hasta resolución de la corrección.
- Todas las métricas, umbrales y tolerancias operativas deben estar definidas en SSoT externos. Este sistema no define valores, solo exige su cumplimiento estricto.

### Etapas del Pipeline
**Inputs:** Estado transitorio del ítem o lote.
**Outputs:** Avance lineal hacia el sistema primario de entrega y almacenaje.
**Reglas:**
- Todo paso debe estar delimitado por fronteras Input/Output irrevocables.
- Prohibidas mecánicas de reversión ad hoc no trazables.
- **Gestión de Conflictos:** Si un ítem falla validación, se permite un reintento máximo de *N* veces (variable definida estrictamente en SSoT). Si el ítem falla nuevamente agotando la cuota, es sometido a descarte automático de inmediato.
- ❌ Quedan tajantemente prohibidos los estados intermedios estancados/sin salida. Todo ítem transitando el pipeline *debe* terminar exclusivamente en dos estados resolutivos posibles: **aprobado** o **descartado**.

---

## Prompt System (spec)
Alcance: Estándares inmutables para el despliegue de instrucciones de modelos generativos.

### Prompt Registry (Contrato)
**Inputs:** Directivas macro y pautas operativas.
**Outputs:** Obligatoriedad de implementar un SSoT externo independiente gestionando la base centralizada de Prompts.
**Reglas:**
- Se fuerza como obligatorio el almacenamiento centralizado en un *Prompt Registry*.
- Todo registro debe poseer mínimamente: `prompt_id`, `objetivo`, `inputs`, `constraints`, `output_schema`, y `versionado`.
- ❌ Prohibido en todos los niveles productivos el empleo o adaptación local de prompts implícitos indocumentados.
- Es mandatorio y auditable aplicar esquemas estandarizados de versionado tras toda modificación a plantillas de instrucción.
- El Prompt System gobierna tanto la generación de ítems como la validación adversarial. Se exige separación explícita de prompts entre ambos roles para garantizar asimetría estructural.

---

## System Correction Logic (spec)
Alcance: Lógica central para hacer al sistema verdaderamente reactivo y auto-correctivo frente a derrapes operativos.

**Inputs:** Señales dinámicas emitidas por el `Batch-Control-System` y resultados transaccionales de la `Validación Adversarial`.
**Outputs:** Acción sistémica obligatoria autoejecutable.
**Reglas:**
- **Regla Central Intransigente:** Todo error detectado debe disparar una acción automática estructural. ❌ Prohibido registrar o alertar errores sin una corrección automática asociada.
- **Mapeo Obligatorio (Error → Acción):**
  - *Desviación detectada en habilidades:* El sistema fuerza un reajuste restrictivo sobre la selección de templates activos en cola.
  - *Inflación sistémica de dificultad:* Ordena ajustar los constraints y variables de instanciación en la generación (intocando la estructura formal de los templates base).
  - *Ambigüedad operando en margen alto (warning/flag):* Acción inminente de ajustar el prompt o forzar descarte preventivo del template origen implicado temporalmente.
  - *Rechazos de ítem recurrentes estadísticamente agudos:* Dispara comando para invalidar el template o depreciar el prompt transaccional asociado de forma definitiva.

---

# Reglas globales

**Inputs:** Dinámica general concurrente en Fases y validaciones conectadas.
**Outputs:** Cumplimiento férreo y uniforme bajo la totalidad de la meta-arquitectura.
**Reglas:**
- La preservación estricta de la limpieza procesal mediante prioridades sistémicas domina sobre adaptaciones oportunistas para forzar proyecciones algorítmicas de volumen.
- Los módulos deben orquestarse rígidamente. No hay permisividad a adaptaciones informales del documento.
- **Comportamiento Reactivo Exclusivo:** El sistema general no puede, por diseño base, operar en un modo estructuralmente observacional o pasivo. Toda señal detectada asume en código el equivalente a una instrucción mandatoria, debiendo derivar de inmediato en una acción operativa.
- **Gobernanza de Almacenamiento:** Cada SSoT es responsable de definir su propia estructura de almacenamiento, versionado y organización de artefactos. La meta-arquitectura no define ni impone estructura física.

---

# Riesgos y mitigación (alto nivel)

**Inputs:** Identificación de posibles puntos ciegos a escala masiva de producción.
**Outputs:** Criterios pre-orquestados de contingencia.
**Reglas:**
- Homogeneización de iterantes $\rightarrow$ Impulsar dinámicas asimétricas sobre la extracción en el SSoT de Templates.
- Falsos positivos por consanguinidad algorítmica (Falsa validación) $\rightarrow$ Desacople mandatario forzando estaticidad asimétrica entre la formulación generativa y el dictamen adversarial.

---

# Execution Governance (condiciones de cierre)

**Inputs:** Chequeo panorámico integral entre los resultados del banco y reglas del blueprint operativo.
**Outputs:** Fallo perimetral formal y transaccional cerrando el ciclo expansivo del UCR26.
**Reglas:**
- La finalización de fase demanda el cumplimiento auditable contra umbrales externos de ~250 unidades bajo validación adversarial purgada de falsos consensos.
- Todo bucle o rechazo estructural está gobernado por parámetros de descarte, librando al pipeline de cuellos por recalibración.
- ❌ Prohibición absoluta de optimizaciones micro-locales o cosméticas para reflotar ítems fallidos enraizados en una estructura origen deficiente.
