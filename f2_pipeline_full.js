'use strict';
/**
 * F2 FULL PIPELINE — explanations_v1.json
 * Authority: F2_Explanation-System_Spec_v1.md + Prompt v3 (docs/F2_PROMPTS_LIBRARY.md)
 *
 * STEP 1 — GENERATION (all segments.training[], sorted ascending by item_id)
 * STEP 2 — VALIDATION (R01–R31 from spec)
 * STEP 3 — AUDIT    (ceil(N × 0.10) first items)
 * STEP 4 — APPROVAL
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS (from spec + Prompt v3)
// ─────────────────────────────────────────────────────────────────────────────

const PROHIBITED_SUBSTRINGS = [
  'por ejemplo,', 'cabe destacar', 'es importante', 'podemos ver', 'nótese que',
];

// Prompt v3 forbidden words (generation constraint — also checked in pre-output validation)
const FORBIDDEN_WORDS_PROMPT = ['texto', 'enunciado', 'opcion', 'opciones', 'pregunta', 'problema'];

// explanation_correct line 1 pattern: /^[A-ZÁÉÍÓÚÑ][^?!]{10,}\.$/
const LINE1_CORRECT_PATTERN = /^[A-ZÁÉÍÓÚÑ][^?!\n]{10,}\.$/;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function ensurePeriod(text) {
  const t = text.trim().replace(/[.!?…]+$/, '');
  return t + '.';
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function truncateLine(text, max) {
  if (text.length <= max) return text;
  // Find last space before max-1
  const cutIdx = text.lastIndexOf(' ', max - 2);
  const cut    = cutIdx > 20 ? cutIdx : max - 1;
  return ensurePeriod(text.substring(0, cut).trim());
}

function removeAnswerLabels(text) {
  // Remove "A (value):", "B(value):", option refs with colon
  let t = text.replace(/\b[A-D]\s*\([^)]{0,40}\)\s*[:–—]\s*/g, ' ');
  // Remove standalone "(A)", "(B)", "(C)", "(D)"
  t = t.replace(/\(\s*[A-D]\s*\)/g, ' ');
  // Remove "Opción A:", "Opcion B:", "opción C:", "Distractor A:"
  t = t.replace(/[Oo]pci[oó]n\s*[A-D]\s*[:)]\s*/g, ' ');
  t = t.replace(/[Dd]istractor\s+[A-D]\s*[:)]\s*/g, ' ');
  // Remove leading single-letter option refs like "A:" "B:" at line start
  t = t.replace(/^\s*[A-D]\s*:\s*/g, '');
  // Remove "La respuesta correcta (X) " and "La opción correcta (X) "
  t = t.replace(/[Ll]a\s+(?:respuesta|opci[oó]n)\s+correcta\s+\([A-D]\)\s*/g, '');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function removeAnswerPhrases(text) {
  // Spec §8.5: remove forbidden phrases from explanation_correct
  let t = text;
  t = t.replace(/[Ll]a\s+opci[oó]n\s+correcta\s+es\b\s*/g, '');
  t = t.replace(/[Ll]a\s+respuesta\s+correcta\s+es\b\s*/g, '');
  // Remove remaining standalone answer letter references (A, B, C, D as labels) 
  // Pattern: a single uppercase letter surrounded by non-letter chars
  t = t.replace(/(?<!\p{L})[A-D](?!\p{L})/gu, ' ');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function removeStepMarkers(text) {
  // Remove "1 paso:", "Paso 1:", "1 traducción directa:", "1 [any words]:", etc.
  return text
    .replace(/^\d+\s+[^.\n]{1,60}?:\s*/i, '')  // "1 word(s): " at start
    .replace(/^\d+\s*paso[s]?\s*[:]\s*/i, '')   // "1 paso:"
    .replace(/^paso\s*\d+\s*[:]\s*/i, '')        // "paso 1:"
    .trim();
}

function sanitizeMathOperators(text) {
  // Replace mathematical comparison operators with plain text to avoid HTML detection
  let t = text;
  t = t.replace(/\s*>\s*/g, ' mayor que ');
  t = t.replace(/\s*<\s*/g, ' menor que ');
  // Remove any remaining < > just in case
  t = t.replace(/[<>]/g, '');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function getForbiddenWordRegex() {
  // Word-boundary aware regexes for forbidden words (including accented variants)
  return [
    /\benunciado[s]?\b/gi,
    /\btexto[s]?\b/gi,
    /\bopci[oó]n\b/gi,
    /\bopciones\b/gi,
    /\bpregunta[s]?\b/gi,
    /\bproblema[s]?\b/gi,
  ];
}

function replaceForbiddenWords(text) {
  const replacements = [
    [/\benunciados\b/gi,  'planteamientos'],
    [/\benunciado\b/gi,   'planteamiento'],
    [/\btextos\b/gi,      'contenidos'],
    [/\btexto\b/gi,       'contenido'],
    [/\bopciones\b/gi,    'alternativas'],
    [/\bopci[oó]n\b/gi,   'alternativa'],
    [/\bpreguntas\b/gi,   'reactivos'],
    [/\bpregunta\b/gi,    'reactivo'],
    [/\bproblemas\b/gi,   'situaciones'],
    [/\bproblema\b/gi,    'situación'],
  ];
  let t = text;
  for (const [re, rep] of replacements) {
    t = t.replace(re, (match) => {
      // Preserve leading capital
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return rep.charAt(0).toUpperCase() + rep.slice(1);
      }
      return rep;
    });
  }
  return t;
}

function removeContextualAnchors(text) {
  // Remove "en este caso", "aquí", "aqui" — these are Prompt v3 constraints
  let t = text;
  t = t.replace(/\ben este caso\b/gi, '');
  t = t.replace(/\baquí\b/gi, '');
  t = t.replace(/\baqui\b/gi, '');
  return t.replace(/\s{2,}/g, ' ').trim();
}

function cleanText(text) {
  let t = removeStepMarkers(text);
  t = sanitizeMathOperators(t);
  t = removeAnswerLabels(t);
  t = replaceForbiddenWords(t);
  t = removeContextualAnchors(t);
  t = t.replace(/\s{2,}/g, ' ').trim();
  return t;
}

function extractFirstSentence(text) {
  const cleaned = cleanText(text);
  const parts = cleaned.split('.');
  const first = parts[0] ? parts[0].trim() : cleaned;
  return first.length >= 10 ? first : cleaned.substring(0, 100);
}

function extractSecondSentence(text) {
  const cleaned = cleanText(text);
  const parts = cleaned.split('.').map(s => s.trim()).filter(s => s.length >= 8);
  return parts.length >= 2 ? parts[1] : null;
}

function getJustificationText(justification) {
  if (typeof justification === 'string') return justification;
  if (typeof justification === 'object' && justification !== null) {
    return Object.values(justification).filter(v => typeof v === 'string').join(' ');
  }
  return '';
}

function getPasoCritico(justification) {
  if (typeof justification === 'object' && justification !== null) {
    return (justification.paso_critico || justification.pas_critico || '').trim();
  }
  return '';
}

function getErrorTipico(justification) {
  if (typeof justification === 'object' && justification !== null) {
    return (justification.error_tipico || '').trim();
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL-BASED FALLBACK LINES
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_LINE1_FALLBACK = {
  'H1': 'La inferencia válida se construye a partir de evidencia explícita y no contradice el contenido dado.',
  'H2': 'La asignación correcta de variables en un sistema relacional parte de la magnitud referente, no de la de mayor valor.',
  'H3': 'La idea principal de un escrito se identifica mediante la paráfrasis fiel del contenido explícito, sin adiciones ajenas.',
  'H4': 'Un patrón numérico se determina verificando la regla mínima entre pares consecutivos antes de extender la serie.',
  'H5': 'El conector adecuado se selecciona identificando la relación lógica real entre las dos proposiciones que une.',
  'H6': 'La proporcionalidad directa requiere calcular la tasa unitaria y multiplicarla por la nueva cantidad dada.',
  'H7': 'La medida geométrica correcta se obtiene aplicando la fórmula correspondiente con los parámetros del caso.',
};

const SKILL_LINE2_FALLBACK = {
  'H1': 'Solo las inferencias respaldadas por datos explícitos son válidas; las suposiciones ajenas al contenido son incorrectas.',
  'H2': 'Identificar qué magnitud depende de la otra permite construir la ecuación sin invertir el sistema.',
  'H3': 'Descartar alternativas que distorsionan el alcance o introducen términos ausentes conduce a la respuesta correcta.',
  'H4': 'Verificar la diferencia entre términos consecutivos y aplicarla determina el valor siguiente de la serie.',
  'H5': 'Una relación causal exige conector consecutivo o causal; los adversativos implican contraste inexistente.',
  'H6': 'Usar la tasa unitaria como factor de escala garantiza la proporcionalidad del resultado calculado.',
  'H7': 'Aplicar la fórmula geométrica con la medida correcta elimina los errores derivados de confundir parámetros.',
};

const SKILL_ERROR_FALLBACK = {
  'H1': 'elaborar inferencias no respaldadas por la información explícita del contenido.',
  'H2': 'invertir la asignación de la variable al construir el sistema de ecuaciones.',
  'H3': 'seleccionar una alternativa que introduce términos ausentes o distorsiona el alcance del escrito.',
  'H4': 'aplicar una diferencia incorrecta por no verificar el patrón entre todos los pares consecutivos.',
  'H5': 'usar un conector adversativo o concesivo cuando la relación entre proposiciones es causal o aditiva.',
  'H6': 'escalar la cantidad sin calcular la tasa unitaria, produciendo un resultado no proporcional.',
  'H7': 'confundir los parámetros de la fórmula geométrica aplicable al caso.',
};

const SKILL_CORRECTION_FALLBACK = {
  'H1': 'la inferencia válida se sustenta en datos explícitos del contenido, sin extrapolar más allá de lo dado.',
  'H2': 'la variable debe asignarse a la magnitud referente del sistema para construir la relación correctamente.',
  'H3': 'la alternativa correcta parafrasea el contenido explícito sin agregar restricciones ni comparaciones ajenas.',
  'H4': 'verificar la diferencia constante entre pares consecutivos y aplicarla al último término produce el valor correcto.',
  'H5': 'el conector debe reflejar la relación lógica real entre las proposiciones, no una relación supuesta.',
  'H6': 'dividir la cantidad total entre la cantidad unitaria da la tasa; multiplicarla por la nueva cantidad da el resultado.',
  'H7': 'aplicar la fórmula geométrica con los datos correctamente identificados produce la medida buscada.',
};

function cleanTextForCorrect(text) {
  // Extended cleaning for explanation_correct — strip answer-phrase patterns too
  let t = cleanText(text);
  t = removeAnswerPhrases(t);
  return t.replace(/\s{2,}/g, ' ').trim();
}

function hasAnswerLabelReference(text) {
  // Returns true if text still contains forbidden answer-label patterns per Spec §8.5
  if (/[Ll]a\s+opci[oó]n\s+correcta\s+es/i.test(text)) return true;
  if (/[Ll]a\s+respuesta\s+correcta\s+es/i.test(text)) return true;
  // Standalone letter A/B/C/D not preceded/followed by a letter (answer label use)
  if (/(?<!\p{L})[A-D](?!\p{L})/u.test(text)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — GENERATION CORE
// ─────────────────────────────────────────────────────────────────────────────

function generateExplanationCorrect(item) {
  const skill   = item.metadata.skill;
  const just    = item.content.justification;
  const pc      = getPasoCritico(just);

  let line1, line2;

  if (pc && pc.length >= 10) {
    const cleaned = cleanTextForCorrect(pc);
    const sentences = cleaned.split('.')
      .map(s => s.trim())
      .filter(s => s.length >= 10);

    // Line 1: first sentence from paso_critico, made abstract
    let rawLine1 = sentences[0] || cleaned;

    // If line1 still has a forbidden answer reference, try second sentence or fallback
    if (hasAnswerLabelReference(rawLine1) || rawLine1.length < 10) {
      rawLine1 = sentences.find(s => !hasAnswerLabelReference(s) && s.length >= 10)
                 || (SKILL_LINE1_FALLBACK[skill] || SKILL_LINE1_FALLBACK['H2']);
    }

    line1 = capitalizeFirst(rawLine1);
    line1 = ensurePeriod(truncateLine(line1, 119));

    // Line 2: second clean sentence or skill fallback
    const cleanSentences = sentences.filter(s => !hasAnswerLabelReference(s) && s.length >= 8);
    const secondSentence = cleanSentences.length >= 2 ? cleanSentences[1]
                         : (cleanSentences[0] && cleanSentences[0] !== rawLine1 ? cleanSentences[0] : null);
    if (secondSentence) {
      line2 = capitalizeFirst(secondSentence);
      line2 = ensurePeriod(truncateLine(line2, 119));
    } else {
      line2 = SKILL_LINE2_FALLBACK[skill] || SKILL_LINE2_FALLBACK['H2'];
    }
  } else {
    // Full fallback
    line1 = SKILL_LINE1_FALLBACK[skill] || SKILL_LINE1_FALLBACK['H2'];
    line2 = SKILL_LINE2_FALLBACK[skill] || SKILL_LINE2_FALLBACK['H2'];
  }

  // Final forbidden-word pass on generated lines
  line1 = ensurePeriod(truncateLine(replaceForbiddenWords(removeContextualAnchors(line1)).trim(), 119));
  line2 = ensurePeriod(truncateLine(replaceForbiddenWords(removeContextualAnchors(line2)).trim(), 119));

  return `${line1}\n${line2}`;
}

function generateExplanationIncorrectCommon(item) {
  const skill  = item.metadata.skill;
  const just   = item.content.justification;
  const et     = getErrorTipico(just);
  const pc     = getPasoCritico(just);

  let errorText, corrText;

  // --- Error line ---
  if (et && et.length >= 10) {
    // Try to extract first meaningful error description
    let raw = et;
    // Remove leading answer label refs
    raw = removeAnswerLabels(raw);
    // Get first sentence
    const parts = raw.split('.')
      .map(s => s.trim())
      .filter(s => s.length >= 8);
    const firstErr = parts[0] || raw.substring(0, 100);
    errorText = cleanText(firstErr);
    errorText = capitalizeFirst(ensurePeriod(truncateLine(errorText, 113))); // 113 = 120-7 for "Error: "
  } else {
    errorText = capitalizeFirst(
      SKILL_ERROR_FALLBACK[skill] || SKILL_ERROR_FALLBACK['H2']
    );
    errorText = ensurePeriod(errorText);
  }

  // --- Correction line ---
  if (pc && pc.length >= 10) {
    const cleaned = cleanText(pc);
    const sentences = cleaned.split('.')
      .map(s => s.trim())
      .filter(s => s.length >= 8);
    const raw = sentences[0] || cleaned;
    corrText = capitalizeFirst(raw);
    corrText = ensurePeriod(truncateLine(corrText, 108)); // 108 = 120-12 for "Corrección: "
  } else {
    corrText = capitalizeFirst(
      SKILL_CORRECTION_FALLBACK[skill] || SKILL_CORRECTION_FALLBACK['H2']
    );
    corrText = ensurePeriod(corrText);
  }

  // Final forbidden-word pass
  errorText = ensurePeriod(truncateLine(
    replaceForbiddenWords(removeContextualAnchors(errorText)).trim(), 113));
  corrText  = ensurePeriod(truncateLine(
    replaceForbiddenWords(removeContextualAnchors(corrText)).trim(), 108));

  return `Error: ${errorText}\nCorrección: ${corrText}`;
}

function checkPromptV3PreOutput(item_id, ec, ei) {
  const errors = [];

  // Check "Corrección:" present in ei
  if (!ei.includes('Corrección:')) {
    errors.push({ item_id, rule: 'pre_v3_correction_prefix', detail: 'Missing "Corrección:" in explanation_incorrect_common' });
  }

  // Spec §8.5: forbidden patterns in explanation_correct
  const ecLines = ec.split('\n');
  const ecLine1 = ecLines[0] || '';
  if (/[Ll]a\s+opci[oó]n\s+correcta\s+es/i.test(ecLine1)) {
    errors.push({ item_id, rule: 'pre_v3_spec_8_5_phrase', detail: 'explanation_correct contains forbidden phrase "La opción correcta es"' });
  }
  if (/[Ll]a\s+respuesta\s+correcta\s+es/i.test(ecLine1)) {
    errors.push({ item_id, rule: 'pre_v3_spec_8_5_phrase', detail: 'explanation_correct contains forbidden phrase "La respuesta correcta es"' });
  }
  // Standalone answer label A/B/C/D reference in explanation_correct
  if (/(?<!\p{L})[A-D](?!\p{L})/u.test(ecLine1)) {
    errors.push({ item_id, rule: 'pre_v3_spec_8_5_label', detail: `explanation_correct line 1 contains standalone answer label (A/B/C/D): "${ecLine1}"` });
  }

  // Check forbidden words in both fields
  const combined = ec + '\n' + ei;
  for (const fw of FORBIDDEN_WORDS_PROMPT) {
    const re = new RegExp(`\\b${fw}\\b`, 'i');
    if (re.test(combined)) {
      errors.push({ item_id, rule: 'pre_v3_forbidden_word', detail: `Forbidden word "${fw}" found` });
    }
  }

  // Check "Corrección:" in ei line 2
  const eiLines = ei.split('\n');
  if (!eiLines[1] || !eiLines[1].startsWith('Corrección:')) {
    errors.push({ item_id, rule: 'pre_v3_line2_prefix', detail: 'Line 2 of explanation_incorrect_common must start with "Corrección:"' });
  }

  // Check line count = 2 for each field
  if ((ec.match(/\n/g) || []).length !== 1) {
    errors.push({ item_id, rule: 'pre_v3_line_count_ec', detail: 'explanation_correct must have exactly 1 \\n' });
  }
  if ((ei.match(/\n/g) || []).length !== 1) {
    errors.push({ item_id, rule: 'pre_v3_line_count_ei', detail: 'explanation_incorrect_common must have exactly 1 \\n' });
  }

  // Check all lines end with "."
  if (!ecLines[0].endsWith('.')) errors.push({ item_id, rule: 'pre_v3_period_ec_l1', detail: 'explanation_correct line 1 must end with "."' });
  if (!ecLines[1] || !ecLines[1].endsWith('.')) errors.push({ item_id, rule: 'pre_v3_period_ec_l2', detail: 'explanation_correct line 2 must end with "."' });
  if (!eiLines[0] || !eiLines[0].endsWith('.')) errors.push({ item_id, rule: 'pre_v3_period_ei_l1', detail: 'explanation_incorrect_common line 1 must end with "."' });
  if (!eiLines[1] || !eiLines[1].endsWith('.')) errors.push({ item_id, rule: 'pre_v3_period_ei_l2', detail: 'explanation_incorrect_common line 2 must end with "."' });

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateOutput(outputFile, dataset) {
  const fails = [];

  // Level 1 — JSON Parse: already parsed if we reach here

  // Level 2 — Structural
  const rootKeys = Object.keys(outputFile);
  if (rootKeys.length !== 2 || !rootKeys.includes('version') || !rootKeys.includes('items')) {
    fails.push({ rule: 'R01', detail: 'Root must have exactly 2 keys: "version" and "items"' });
  }
  if (outputFile.version !== 'v1') {
    fails.push({ rule: 'R02/F03', detail: `version must be "v1", got "${outputFile.version}"` });
  }
  if (!Array.isArray(outputFile.items)) {
    fails.push({ rule: 'R03/F04', detail: '"items" must be an array' });
    return fails; // Can't continue without items
  }
  if (outputFile.items.length === 0) {
    fails.push({ rule: 'R04/F04', detail: '"items" must not be empty' });
    return fails;
  }

  const seenIds = new Set();
  for (const item of outputFile.items) {
    const itemKeys = Object.keys(item);
    if (itemKeys.length !== 3) {
      fails.push({ rule: 'R05/F05', item_id: item.item_id, detail: `Item must have exactly 3 keys, found ${itemKeys.length}: ${itemKeys.join(',')}` });
    }
    const required = ['item_id', 'explanation_correct', 'explanation_incorrect_common'];
    for (const reqKey of required) {
      if (!itemKeys.includes(reqKey)) {
        fails.push({ rule: 'R05/F05', item_id: item.item_id, detail: `Missing required key "${reqKey}"` });
      }
    }
    for (const k of itemKeys) {
      if (!required.includes(k)) {
        fails.push({ rule: 'R06/F06', item_id: item.item_id, detail: `Extra key "${k}" not allowed` });
      }
    }
    if (!item.item_id || typeof item.item_id !== 'string') {
      fails.push({ rule: 'R07/F07', item_id: item.item_id, detail: 'item_id must be non-empty string' });
    }
    if (!item.explanation_correct || typeof item.explanation_correct !== 'string') {
      fails.push({ rule: 'R08/F07', item_id: item.item_id, detail: 'explanation_correct must be non-empty string' });
    }
    if (!item.explanation_incorrect_common || typeof item.explanation_incorrect_common !== 'string') {
      fails.push({ rule: 'R09/F07', item_id: item.item_id, detail: 'explanation_incorrect_common must be non-empty string' });
    }
    if (item.item_id === null || item.explanation_correct === null || item.explanation_incorrect_common === null) {
      fails.push({ rule: 'R10/F07', item_id: item.item_id, detail: 'No null values allowed' });
    }
    if (seenIds.has(item.item_id)) {
      fails.push({ rule: 'R11/F08', item_id: item.item_id, detail: `Duplicate item_id "${item.item_id}"` });
    }
    seenIds.add(item.item_id);
  }

  if (fails.length > 0) return fails; // Structural failures block Level 3

  // Level 3 — Integrity
  const trainingItems = dataset.segments.training || [];
  const trainingIds   = new Set(trainingItems.map(i => i.item_id));
  const diagnosticIds = new Set((dataset.segments.diagnostic || []).map(i => i.item_id));
  const sim1Ids       = new Set(((dataset.segments.simulation || {}).sim_1 || []).map(i => i.item_id));
  const sim2Ids       = new Set(((dataset.segments.simulation || {}).sim_2 || []).map(i => i.item_id));

  for (const item of outputFile.items) {
    if (!trainingIds.has(item.item_id)) {
      fails.push({ rule: 'R14/F10', item_id: item.item_id, detail: `item_id not found in segments.training[]` });
    }
    if (diagnosticIds.has(item.item_id)) {
      fails.push({ rule: 'R18/F13', item_id: item.item_id, detail: `item_id belongs to segments.diagnostic[]` });
    }
    if (sim1Ids.has(item.item_id)) {
      fails.push({ rule: 'R19/F14', item_id: item.item_id, detail: `item_id belongs to segments.simulation.sim_1[]` });
    }
    if (sim2Ids.has(item.item_id)) {
      fails.push({ rule: 'R20/F15', item_id: item.item_id, detail: `item_id belongs to segments.simulation.sim_2[]` });
    }
  }

  // Every training item must be in output
  for (const tid of trainingIds) {
    if (!seenIds.has(tid)) {
      fails.push({ rule: 'R15/F11', item_id: tid, detail: `training item_id "${tid}" missing from explanations` });
    }
  }

  if (outputFile.items.length !== trainingItems.length) {
    fails.push({ rule: 'R16/F12', detail: `count mismatch: ${outputFile.items.length} explanations vs ${trainingItems.length} training items` });
  }

  if (fails.length > 0) return fails; // Integrity failures block Level 4

  // Level 4 — Content
  for (const item of outputFile.items) {
    const ec  = item.explanation_correct;
    const ei  = item.explanation_incorrect_common;
    const ecL = ec.split('\n');
    const eiL = ei.split('\n');

    // R30a/b: exactly 1 "\n" per field
    if ((ec.match(/\n/g) || []).length !== 1) {
      fails.push({ rule: 'R30a/F25', item_id: item.item_id, detail: 'explanation_correct must have exactly 1 \\n' });
    }
    if ((ei.match(/\n/g) || []).length !== 1) {
      fails.push({ rule: 'R30b/F25', item_id: item.item_id, detail: 'explanation_incorrect_common must have exactly 1 \\n' });
    }

    // R22/F17: each line ≤ 120 chars
    for (const line of [...ecL, ...eiL]) {
      if (line.length > 120) {
        fails.push({ rule: 'R22/F17', item_id: item.item_id, detail: `Line exceeds 120 chars (${line.length}): "${line.substring(0,60)}..."` });
      }
    }

    // R23/F18: explanation_incorrect_common line 1 starts with "Error:"
    if (!eiL[0] || !eiL[0].startsWith('Error:')) {
      fails.push({ rule: 'R23/F18', item_id: item.item_id, detail: `explanation_incorrect_common line 1 must start with "Error:", got: "${eiL[0]}"` });
    }

    // R24/F19: explanation_incorrect_common line 2 starts with "Corrección:"
    if (!eiL[1] || !eiL[1].startsWith('Corrección:')) {
      fails.push({ rule: 'R24/F19', item_id: item.item_id, detail: `explanation_incorrect_common line 2 must start with "Corrección:", got: "${eiL[1]}"` });
    }

    // R25/F20: explanation_correct line 1 matches /^[A-ZÁÉÍÓÚÑ][^?!]{10,}\.$/
    if (!LINE1_CORRECT_PATTERN.test(ecL[0])) {
      fails.push({ rule: 'R25/F20', item_id: item.item_id, detail: `explanation_correct line 1 does not match required pattern: "${ecL[0]}"` });
    }

    // R26/F24: no ellipsis at end of any line
    const allLines = [...ecL, ...eiL];
    for (const line of allLines) {
      if (/[…]$/.test(line) || /\.\.\.+$/.test(line)) {
        fails.push({ rule: 'R26/F24', item_id: item.item_id, detail: `Ellipsis found at end of line: "${line}"` });
      }
    }

    // R27/F21: prohibited substrings
    const combined = ec + '\n' + ei;
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) {
        fails.push({ rule: 'R27/F21', item_id: item.item_id, detail: `Prohibited substring "${ps}" found` });
      }
    }

    // R28/F22: no "?" in any field
    if (combined.includes('?')) {
      fails.push({ rule: 'R28/F22', item_id: item.item_id, detail: 'Prohibited "?" character found' });
    }

    // R29/F23: no HTML tags or markdown formatting
    // Check for actual HTML tags (not math operators)
    if (/\*\*|__|<[a-zA-Z/]|[a-zA-Z]>/.test(combined) || /^#/m.test(ec) || /^#/m.test(ei) || /<|>/.test(combined)) {
      fails.push({ rule: 'R29/F23', item_id: item.item_id, detail: 'HTML or markdown syntax detected: ' + (combined.match(/[<>*_#]/) || ['?'])[0] });
    }

    // R30c/F26: explanation_correct line 1 ends with "."
    if (!ecL[0] || !ecL[0].endsWith('.')) {
      fails.push({ rule: 'R30c/F26', item_id: item.item_id, detail: 'explanation_correct line 1 must end with "."' });
    }
    // R30d/F26: explanation_correct line 2 ends with "."
    if (!ecL[1] || !ecL[1].endsWith('.')) {
      fails.push({ rule: 'R30d/F26', item_id: item.item_id, detail: 'explanation_correct line 2 must end with "."' });
    }

    // R31/F27: items sorted ascending by item_id (checked below, after loop)
  }

  // R31: sort order
  const ids = outputFile.items.map(i => i.item_id);
  for (let i = 1; i < ids.length; i++) {
    if (ids[i].localeCompare(ids[i-1], 'en', { sensitivity: 'variant' }) < 0) {
      fails.push({ rule: 'R31/F27', detail: `items[] not sorted: "${ids[i-1]}" > "${ids[i]}" at positions ${i-1},${i}` });
      break;
    }
  }

  return fails;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — AUDIT
// ─────────────────────────────────────────────────────────────────────────────

function auditItems(outputFile) {
  const total      = outputFile.items.length;
  const sampleSize = Math.ceil(total * 0.10);
  const sample     = outputFile.items.slice(0, sampleSize);

  console.log(`\n[STEP 3 — AUDIT]`);
  console.log(`  Total items: ${total}`);
  console.log(`  Sample size (ceil(${total} × 0.10)): ${sampleSize}`);

  const failures = [];

  for (const item of sample) {
    const ec  = item.explanation_correct;
    const ei  = item.explanation_incorrect_common;
    const ecL = ec.split('\n');
    const eiL = ei.split('\n');

    // Check: exactly 1 \n in explanation_correct
    if ((ec.match(/\n/g) || []).length !== 1) {
      failures.push({ item_id: item.item_id, check: 'AUDIT_EC_NEWLINE', detail: 'explanation_correct must have exactly 1 \\n' });
    }

    // Check: explanation_correct line 1 ends with "."
    if (!ecL[0] || !ecL[0].endsWith('.')) {
      failures.push({ item_id: item.item_id, check: 'AUDIT_EC_L1_PERIOD', detail: 'explanation_correct line 1 must end with "."' });
    }

    // Check: explanation_correct line 2 ends with "."
    if (!ecL[1] || !ecL[1].endsWith('.')) {
      failures.push({ item_id: item.item_id, check: 'AUDIT_EC_L2_PERIOD', detail: 'explanation_correct line 2 must end with "."' });
    }

    // Check: explanation_incorrect_common line 1 starts with "Error:"
    if (!eiL[0] || !eiL[0].startsWith('Error:')) {
      failures.push({ item_id: item.item_id, check: 'AUDIT_EI_ERROR_PREFIX', detail: 'explanation_incorrect_common line 1 must start with "Error:"' });
    }

    // Check: explanation_incorrect_common line 2 starts with "Corrección:"
    if (!eiL[1] || !eiL[1].startsWith('Corrección:')) {
      failures.push({ item_id: item.item_id, check: 'AUDIT_EI_CORR_PREFIX', detail: 'explanation_incorrect_common line 2 must start with "Corrección:"' });
    }

    // Check: no line > 120 chars
    for (const line of [...ecL, ...eiL]) {
      if (line.length > 120) {
        failures.push({ item_id: item.item_id, check: 'AUDIT_LINE_LENGTH', detail: `Line exceeds 120 chars (${line.length})` });
      }
    }

    // Check: no prohibited substrings
    const combined = ec + '\n' + ei;
    for (const ps of PROHIBITED_SUBSTRINGS) {
      if (combined.toLowerCase().includes(ps.toLowerCase())) {
        failures.push({ item_id: item.item_id, check: 'AUDIT_PROHIBITED_SUBSTR', detail: `Prohibited substring "${ps}" found` });
      }
    }
  }

  return { sampleSize, failures };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== F2 FULL PIPELINE ===');
  console.log('Scope: segments.training[] — ALL items\n');

  // ─── LOAD DATASET ──────────────────────────────────────────────────────────
  const datasetPath = path.join(__dirname, 'content_dataset_ucr26', 'bank_v1_enriched.json');
  let dataset;
  try {
    const raw = fs.readFileSync(datasetPath, 'utf8');
    dataset   = JSON.parse(raw);
  } catch (e) {
    console.error('FAIL\nstep: 1\nreason: Cannot load bank_v1_enriched.json:', e.message);
    process.exit(2);
  }

  // Sort training items ascending by item_id (lexicographic, case-sensitive)
  const trainingRaw  = dataset.segments.training || [];
  const trainingItems = [...trainingRaw].sort((a, b) =>
    a.item_id.localeCompare(b.item_id, 'en', { sensitivity: 'variant' })
  );

  console.log(`[STEP 1 — GENERATION]`);
  console.log(`  Training items loaded: ${trainingItems.length}`);

  // ─── STEP 1: GENERATE ──────────────────────────────────────────────────────
  const generatedItems = [];
  const step1Fails     = [];

  for (const item of trainingItems) {
    let ec, ei;
    try {
      ec = generateExplanationCorrect(item);
      ei = generateExplanationIncorrectCommon(item);
    } catch (e) {
      step1Fails.push({ item_id: item.item_id, reason: `Generation error: ${e.message}` });
      break;
    }

    // Pre-output validation (Prompt v3 §8)
    const preErrors = checkPromptV3PreOutput(item.item_id, ec, ei);
    if (preErrors.length > 0) {
      step1Fails.push({ item_id: item.item_id, reason: preErrors[0].detail, rule: preErrors[0].rule });
      break;
    }

    generatedItems.push({
      item_id: item.item_id,
      explanation_correct: ec,
      explanation_incorrect_common: ei,
    });
  }

  if (step1Fails.length > 0) {
    console.error('\nFAIL');
    console.error(`step: 1`);
    console.error(`item_id: ${step1Fails[0].item_id}`);
    console.error(`reason: ${step1Fails[0].reason}`);
    process.exit(1);
  }

  console.log(`  Generated: ${generatedItems.length} items — PASS`);

  // ─── BUILD CANDIDATE FILE ──────────────────────────────────────────────────
  const candidate = {
    version: 'v1',
    items: generatedItems, // already in sorted order (iterated from sorted input)
  };

  // ─── STEP 2: VALIDATION ────────────────────────────────────────────────────
  console.log(`\n[STEP 2 — VALIDATION]`);
  const validationFails = validateOutput(candidate, dataset);

  if (validationFails.length > 0) {
    console.error('\nFAIL');
    console.error(`step: 2`);
    const first = validationFails[0];
    console.error(`rule: ${first.rule}`);
    if (first.item_id) console.error(`item_id: ${first.item_id}`);
    console.error(`reason: ${first.detail}`);
    if (validationFails.length > 1) {
      console.error(`\nAll failures (${validationFails.length}):`);
      validationFails.forEach(f => console.error(`  [${f.rule}] ${f.item_id || ''}: ${f.detail}`));
    }
    process.exit(1);
  }

  console.log(`  All validation rules passed — PASS`);

  // ─── STEP 3: AUDIT ─────────────────────────────────────────────────────────
  const auditResult = auditItems(candidate);

  if (auditResult.failures.length > 0) {
    console.error('\nFAIL');
    console.error(`step: 3`);
    const first = auditResult.failures[0];
    console.error(`item_id: ${first.item_id}`);
    console.error(`failed_check: ${first.check}`);
    console.error(`reason: ${first.detail}`);
    if (auditResult.failures.length > 1) {
      console.error(`\nAll audit failures (${auditResult.failures.length}):`);
      auditResult.failures.forEach(f => console.error(`  [${f.check}] ${f.item_id}: ${f.detail}`));
    }
    process.exit(1);
  }

  console.log(`  Sample size: ${auditResult.sampleSize} items — AUDIT_PASS`);

  // ─── WRITE OUTPUT ───────────────────────────────────────────────────────────
  const outputPath = path.join(__dirname, 'content_dataset_ucr26', 'explanations_v1.json');
  fs.writeFileSync(outputPath, JSON.stringify(candidate, null, 2), 'utf8');
  console.log(`\n  Output written: content_dataset_ucr26/explanations_v1.json`);

  // ─── STEP 4: APPROVAL ──────────────────────────────────────────────────────
  console.log(`\n[STEP 4 — APPROVAL]`);
  console.log(`  STEP 2: PASS`);
  console.log(`  STEP 3: AUDIT_PASS`);
  console.log(`  → content_dataset_ucr26/explanations_v1.json APPROVED\n`);

  // ─── FINAL OUTPUT ──────────────────────────────────────────────────────────
  console.log('PASS');
  console.log(`total_items: ${generatedItems.length}`);
}

main();
