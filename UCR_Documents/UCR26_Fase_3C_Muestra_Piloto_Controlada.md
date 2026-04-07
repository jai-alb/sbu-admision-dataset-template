---
area: VALIDATION
confidentiality: INTERNAL
depends_on:
- UCR26_Fase_3B_Protocolo_Extraccion_Estructural.md
last_updated: 2026-04-06
owner: System Architect
scope: UCR26
status: ARCHIVED
title: UCR26_Fase_3C_Muestra_Piloto_Controlada.md
version:
  major: 1
  minor: 0
---

# FASE 3C --- MUESTRA PILOTO CONTROLADA

## UCR 2026 · Validación del Protocolo de Extracción

------------------------------------------------------------------------

# PROPÓSITO

Confirmar que el sistema de extracción estructural (Fase 3B), ya ejecutado bajo condiciones reales, produce resultados coherentes a nivel de examen completo.

Esta fase NO valida el protocolo desde cero.

Asume que:

Fase 3B ha sido ejecutada sobre múltiples batches
Existen métricas agregadas y control de deriva activo

Su función es:

Verificar coherencia global en un examen completo
Consolidar outputs estructurales finales
Detectar inconsistencias no visibles a nivel batch

------------------------------------------------------------------------

# ALCANCE

Aplicar el protocolo completo de Fase 3B a:

1 examen histórico UCR (source) → Modelo objetivo: 45 ítems / 110 minutos

No aplicar parcialmente. No seleccionar subconjuntos. No usar múltiples
exámenes.

------------------------------------------------------------------------

# CONDICIÓN DE FUENTE EXTENDIDA

Si el examen fuente excede el modelo objetivo (ej. 75 ítems):

- La extracción 3B se realiza sobre el total (75)
- La validación 3C se ejecuta sobre una selección estructural de 45 ítems

## Criterios de selección
- Representatividad de habilidades
- Distribución de dificultad
- Preservación de patrones estructurales

## PROHIBICIÓN
- No usar los 75 ítems directamente como modelo final
- No alterar el modelo objetivo de 45

------------------------------------------------------------------------

# SECUENCIA OPERATIVA

1. Seleccionar examen piloto (ej. UCR_2023_V1).
2. Verificar condición de entrada obligatoria desde Fase 3B:

   El sistema 3B debe cumplir TODOS los siguientes criterios:

   - Todos los batches tienen BATCH SUMMARY generado
   - Ningún batch está marcado como INVALID
   - No existen señales activas de deriva
   - La ambigüedad estructural se mantiene ≤10%
   - Los patrones estructurales muestran estabilización

   Si alguna condición no se cumple:

   - Se prohíbe iniciar Fase 3C
   - Se debe regresar a Fase 3B para corrección
3. Aplicar el protocolo completo de Fase 3B al examen completo (source).
4. Generar outputs agregados del examen.
5. Comparar contra métricas previas de batches.
6. Ejecutar revisión cruzada.
7. Consolidar versión v1.0 validada.

------------------------------------------------------------------------

# OUTPUT OBLIGATORIO DEL PILOTO

Al finalizar la extracción del examen completo, el agente debe generar:

1.  Distribución por habilidades (H2--H7).
2.  Distribución por dificultad (1 / 2 / 3).
3.  Porcentaje de H1 alta.
4.  Matriz RCV vs RCM.
5.  Lista consolidada de patrones estructurales repetibles.
6.  Lista de ítems con ambigüedad estructural.
7.  Registro de fricciones operativas detectadas.

Si alguno de estos outputs no puede generarse, el protocolo fue mal
aplicado.

------------------------------------------------------------------------

# CRITERIOS DE CONFIRMACIÓN DEL SISTEMA

El sistema se considera confirmado si:

- 100% de los ítems son clasificables
- ≤10% presentan ambigüedad estructural
- La distribución global es consistente con:
  - métricas de batches previos
  - modelo estructural STRAT
- Se identifican ≥8–12 patrones estructurales estables
- No aparecen nuevos patrones no observados previamente
- No hay contradicciones con señales de convergencia de Fase 3B

Si estos criterios no se cumplen:

- El problema se considera originado en Fase 3B
- Se debe regresar a ajuste de extracción antes de escalar

------------------------------------------------------------------------

# DETECCIÓN DE FRICCIONES

El agente debe registrar:

-   Dificultad ambigua frecuente.
-   Confusión recurrente entre habilidades.
-   Problemas en tipología de razonamiento.
-   Problemas en tipología de distractores.
-   Limitaciones de la plantilla.
-   Inconsistencias estructurales del examen.

Cada fricción debe documentarse en:

05_GOVERNANCE/Decision_Log.md

------------------------------------------------------------------------

# PROHIBICIONES

Durante la Fase 3C no está permitido:

-   Reescribir preguntas.
-   Mejorar ítems.
-   Ajustar dificultad artificialmente.
-   Reinterpretar taxonomía.
-   Introducir nuevas categorías.
-   Crear versiones "mejoradas".

El examen se analiza tal cual existe.

------------------------------------------------------------------------

# RESULTADO ESPERADO

Al finalizar la Fase 3C debe existir:

-   1 archivo de extracción validado (v1.0).
-   1 reporte estructural consolidado.
-   1 lista formal de patrones repetibles.
-   1 registro claro de fricciones reales.

Solo después de esto se autoriza extracción sistemática de más exámenes.

------------------------------------------------------------------------

# RELACIÓN CON FASE 3B

Fase 3C no opera de forma aislada.

Depende directamente de los outputs generados en Fase 3B:

- BATCH SUMMARY
- Métricas agregadas
- Señales de convergencia
- Registro de deriva

Fase 3C no revalida estos elementos.

Solo verifica que:

- Se mantienen coherentes al escalar a nivel de examen completo
- No emergen contradicciones estructurales

Si existe conflicto entre 3B y 3C:

- Prevalece la evidencia agregada de Fase 3B
- Se debe revisar el caso específico, no redefinir el sistema

------------------------------------------------------------------------

# CIERRE OPERATIVO

Fase 3C ocurre una sola vez.

Si el sistema resiste el piloto, se considera listo para escala
disciplinada.
