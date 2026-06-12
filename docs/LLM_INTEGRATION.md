# LLM Integration

The engine supports two operation modes for the explanation generation step. Both produce identical output — only the means of generation differs.

---

## Modes

### Manual mode (default)

```bash
node engine/engine_pipeline.js --exam exams/<id>/exam_config.json
```

1. The pipeline writes all generation prompts to:
   `exams/<id>/03_item_production/PROMPTS/generation_batch_manual.txt`
2. The pipeline exits.
3. You run those prompts through any LLM (Claude.ai, API playground, etc.).
4. You write the LLM output to `exams/<id>/04_validation/explanations_v1.json`.
5. Re-run the pipeline — it detects the output file exists and validates it.

**No API key required. No SDK required. Works offline.**

---

### Auto mode

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm install @anthropic-ai/sdk
node engine/engine_pipeline.js --exam exams/<id>/exam_config.json --mode auto
```

The pipeline calls the Anthropic API directly for each training item and writes `explanations_v1.json` automatically.

Additional flags:
```bash
--dry-run       Run the full pipeline but do not write output to disk
--batches N     Process only the first N training items (default: all)
```

---

## Model selection

| Task | Model | Rationale |
|------|-------|-----------|
| Explanation generation | `claude-haiku-4-5-20251001` | High volume (one call per training item); cost-effective; sufficient quality for structured, constrained output |
| Adversarial validation (spot-check) | `claude-sonnet-4-6` | Higher accuracy for quality judgement; used only on a small sample, so cost is low |

The adversarial validation step (`validateItemADV`) is optional and runs internally within the auto-mode pipeline on high-risk items. It does not replace `engine_validate.js` — it supplements it.

---

## API key setup

The Anthropic API key must be available as an environment variable:

```bash
# Linux / macOS
export ANTHROPIC_API_KEY=sk-ant-...

# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Windows CMD
set ANTHROPIC_API_KEY=sk-ant-...
```

The adapter will throw a descriptive error if the key is missing or if the SDK is not installed.

---

## Error handling and retries

The adapter retries each API call up to 3 times:
- On rate-limit errors (HTTP 429): waits 4× the base delay before retrying.
- On other errors: waits 1 second between attempts.

If more than 10% of items fail after all retries, the pipeline aborts and does not write partial output.

If ≤10% fail, it writes partial output and logs a warning listing the failed `item_id` values.

---

## System prompt behavior

The system prompt is built dynamically from `exam_config.explanation_rules` at runtime. This means:
- The model is instructed to use the correct prefix strings for this specific exam.
- The model is given the correct line length limits, forbidden words, and prohibited substrings.
- No manual editing of prompts is required when onboarding a new exam.

---

## Cost guidance

For a typical training segment of 155 items:

| Step | Model | Estimated calls | Typical cost |
|------|-------|-----------------|--------------|
| Generation | claude-haiku-4-5-20251001 | 155 | ~$0.10–$0.20 |
| ADV spot-check | claude-sonnet-4-6 | ~20–25 | ~$0.05–$0.10 |
| **Total** | | | **~$0.15–$0.30** |

Costs depend on item complexity (input token count). Run with `--dry-run --batches 5` first to verify output quality before a full run.

---

## Manual mode vs auto mode comparison

| Concern | Manual | Auto |
|---------|--------|------|
| Setup | None | SDK + API key |
| Human review | Before writing output | After pipeline runs |
| Cost control | Full — you run each prompt | Automatic spend per item |
| Speed | Depends on paste/review cycle | Fast (~1–3 min for 155 items) |
| Auditability | Prompts on disk before output | System prompt built from config |
| Offline use | Yes | No |
