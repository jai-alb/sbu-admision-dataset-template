'use strict';
/**
 * Dataset Engine — LLM Adapter (Anthropic)
 *
 * Wraps Anthropic SDK calls for the engine pipeline in --mode auto.
 * Requires: npm install @anthropic-ai/sdk
 * Requires: ANTHROPIC_API_KEY environment variable
 *
 * Model assignment (from REFACTOR_PLAN.md Stage 4.5):
 *   Generation (GEN):              claude-haiku-4-5-20251001  — fast, cost-effective for volume
 *   Adversarial validation (ADV):  claude-sonnet-4-6          — higher accuracy for quality checks
 *
 * Public API:
 *   generateExplanations({ trainingItems, config, outputPath, dryRun }) → Promise<void>
 */

const fs   = require('fs');
const path = require('path');

const GEN_MODEL = 'claude-haiku-4-5-20251001';
const ADV_MODEL = 'claude-sonnet-4-6';

const MAX_TOKENS_GEN = 512;
const MAX_TOKENS_ADV = 256;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD SDK (lazy — only required when this module is imported)
// ─────────────────────────────────────────────────────────────────────────────

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');
} catch (e) {
  throw new Error(
    'The @anthropic-ai/sdk package is not installed. ' +
    'Run: npm install @anthropic-ai/sdk — then set ANTHROPIC_API_KEY and retry with --mode auto.'
  );
}

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set. Required for --mode auto.');
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// RETRY HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const isRateLimit = e.status === 429 || (e.message && e.message.includes('rate'));
      if (attempt < maxRetries) {
        const wait = isRateLimit ? delayMs * 4 : delayMs;
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD SYSTEM PROMPT FROM CONFIG
// ─────────────────────────────────────────────────────────────────────────────

function buildGenSystemPrompt(config) {
  const rules   = config.explanation_rules;
  const l1pfx   = rules.incorrect_line1_prefix;
  const l2pfx   = rules.incorrect_line2_prefix;
  const maxLen  = rules.max_line_length;
  const minLen  = rules.min_line_length;
  const forbidden = (rules.forbidden_words || []).join(', ');
  const prohibited = (rules.prohibited_substrings || []).map(s => `"${s}"`).join(', ');

  return `You are a dataset explanation generator for an educational assessment engine.

For each item provided, generate TWO explanation fields:

1. explanation_correct: a 2-line explanation of why the correct answer is right.
   - Line 1: ${maxLen} chars max, ${minLen} chars min. Must match: ${rules.correct_line1_pattern}
   - Line 2: ${maxLen} chars max, ${minLen} chars min. Ends with "."
   - Do NOT reference answer options by letter (A/B/C/D).
   - Do NOT start with "La opción correcta es" or "La respuesta correcta es".

2. explanation_incorrect_common: a 2-line explanation of the most common error.
   - Line 1: starts exactly with "${l1pfx} " then describes the misconception type (NOT just the numeric result).
   - Line 2: starts exactly with "${l2pfx} " then describes how to correct the error.
   - Each line: ${maxLen} chars max, ${minLen} chars min. Ends with "."

FORBIDDEN WORDS (must not appear anywhere): ${forbidden}
PROHIBITED SUBSTRINGS: ${prohibited}
DO NOT use "?", HTML tags, markdown formatting, or ellipsis ("...") at end of lines.
Exactly ONE newline (\\n) between the two lines of each field. No trailing newline.

Respond ONLY with a JSON object:
{
  "explanation_correct": "line1\\nline2",
  "explanation_incorrect_common": "${l1pfx} ...\\n${l2pfx} ..."
}`;
}

function buildGenUserPrompt(item, config) {
  const skill = item.metadata.skill;
  const skillDef = config.skill_taxonomy[skill] || {};
  const just  = item.content.justification;
  const justText = typeof just === 'string' ? just : JSON.stringify(just, null, 2);

  return `Generate explanations for this assessment item.

Skill: ${skill} — ${skillDef.label || ''}
Stem: ${item.content.stem}
Correct answer: ${item.respuesta_correcta || item.correct_answer || '(see justification)'}
Justification: ${justText}

Return the JSON object as instructed.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE ONE ITEM
// ─────────────────────────────────────────────────────────────────────────────

async function generateOneItem(item, config, systemPrompt, maxRetries) {
  const userPrompt = buildGenUserPrompt(item, config);

  const response = await withRetry(async () => {
    return client.messages.create({
      model:      GEN_MODEL,
      max_tokens: MAX_TOKENS_GEN,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });
  }, maxRetries);

  const raw = response.content[0]?.text || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON in LLM response for ${item.item_id}: ${raw.substring(0, 200)}`);

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.explanation_correct || !parsed.explanation_incorrect_common) {
    throw new Error(`Missing fields in LLM response for ${item.item_id}`);
  }

  return {
    item_id:                       item.item_id,
    explanation_correct:           parsed.explanation_correct,
    explanation_incorrect_common:  parsed.explanation_incorrect_common,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVERSARIAL VALIDATION (optional spot-check on high-risk items)
// ─────────────────────────────────────────────────────────────────────────────

async function validateItemADV(item, explItem, config) {
  const rules  = config.explanation_rules;
  const prompt = `You are a quality validator for educational assessment explanations.

Rules to check:
- explanation_correct line 1 must match: ${rules.correct_line1_pattern}
- explanation_incorrect_common line 1 must start with: "${rules.incorrect_line1_prefix}"
- explanation_incorrect_common line 2 must start with: "${rules.incorrect_line2_prefix}"
- Each line: ≤${rules.max_line_length} chars, ≥${rules.min_line_length} chars, ends with "."
- No forbidden words: ${(rules.forbidden_words || []).join(', ')}
- Error line must describe a misconception TYPE, not just a numeric result.

Item:
${JSON.stringify(explItem, null, 2)}

Respond ONLY with: {"verdict": "PASS" | "FAIL", "issues": []}`;

  const response = await withRetry(async () => {
    return client.messages.create({
      model:      ADV_MODEL,
      max_tokens: MAX_TOKENS_ADV,
      messages:   [{ role: 'user', content: prompt }],
    });
  }, 2);

  const raw      = response.content[0]?.text || '';
  const match    = raw.match(/\{[\s\S]*\}/);
  if (!match) return { verdict: 'UNKNOWN', issues: [] };
  try   { return JSON.parse(match[0]); }
  catch { return { verdict: 'UNKNOWN', issues: [] }; }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: generateExplanations
// ─────────────────────────────────────────────────────────────────────────────

async function generateExplanations({ trainingItems, config, outputPath, dryRun = false }) {
  const maxRetries   = (config.validation_thresholds && 3) || 3;
  const systemPrompt = buildGenSystemPrompt(config);

  const results  = [];
  const failures = [];
  let   generated = 0;

  console.log(`\n[AUTO MODE] Generating ${trainingItems.length} explanations via Anthropic API`);
  console.log(`  GEN model: ${GEN_MODEL}  |  ADV model: ${ADV_MODEL}\n`);

  for (const item of trainingItems) {
    process.stdout.write(`  [${++generated}/${trainingItems.length}] ${item.item_id} ... `);
    try {
      const explItem = await generateOneItem(item, config, systemPrompt, maxRetries);
      results.push(explItem);
      process.stdout.write('GEN_OK\n');
    } catch (e) {
      failures.push({ item_id: item.item_id, error: e.message });
      process.stdout.write(`FAIL: ${e.message.substring(0, 80)}\n`);
    }
  }

  if (failures.length > 0) {
    console.error(`\nGeneration failures: ${failures.length}`);
    failures.forEach(f => console.error(`  ${f.item_id}: ${f.error}`));
    if (failures.length > trainingItems.length * 0.1) {
      throw new Error(`Too many generation failures (${failures.length}/${trainingItems.length}). Aborting.`);
    }
    console.warn(`  Warning: ${failures.length} items failed — continuing with partial results.`);
  }

  // Sort ascending by item_id (same as manual pipeline)
  results.sort((a, b) => a.item_id.localeCompare(b.item_id, 'en', { sensitivity: 'variant' }));

  const candidate = { version: 'v1', items: results };

  if (!dryRun) {
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(candidate, null, 2), 'utf8');
    console.log(`\n  Output written: ${outputPath}`);
    console.log(`  Items: ${results.length} generated, ${failures.length} failed`);
  } else {
    console.log(`\n  [dry-run] ${results.length} items generated — output NOT written.`);
  }

  return candidate;
}

module.exports = { generateExplanations };
