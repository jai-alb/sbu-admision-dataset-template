# Source Raw Input — Format Guide

Place this file in `exams/<exam-id>/00_source_raw/` along with your actual exam files.

---

## What goes here

The `00_source_raw/` folder is the immutable input layer. It holds the original exam exactly as it was published, plus a structured markdown extraction of each item.

| File | Description |
|------|-------------|
| `source_raw_vN.pdf` | The official exam PDF (immutable, never modify) |
| `source_raw_vN.md`  | A structured markdown extraction of the PDF items |

If you have multiple exam versions (e.g., Form A and Form B), give each a separate file: `source_raw_v1.md`, `source_raw_v2.md`.

---

## Markdown extraction format

Each item in `source_raw_vN.md` must follow this structure:

```
## ITEM_001

**Stem:**
[Full question text, exactly as printed in the exam. Include any accompanying text, table, or diagram description.]

**Options:**
A. [Option A text]
B. [Option B text]
C. [Option C text]
D. [Option D text]

**Answer key:** [A / B / C / D]

---
```

### Rules

- Number items sequentially starting from 001: `ITEM_001`, `ITEM_002`, etc.
- Keep the stem verbatim — do not paraphrase or simplify.
- If the item depends on a reading passage or image, include the passage/description above the stem.
- If the answer key is unknown, write `Answer key: UNKNOWN` — it can be filled in later.
- Separate items with `---`.

---

## Example (Spanish exam)

```
## ITEM_001

**Stem:**
Si 3 obreros construyen una pared en 4 días, ¿cuántos días necesitarán 6 obreros para construir la misma pared?

**Options:**
A. 1
B. 2
C. 3
D. 8

**Answer key:** B

---

## ITEM_002

**Stem:**
El siguiente texto fue escrito para...

> "La innovación no es simplemente la introducción de algo nuevo, sino la capacidad de transformar lo existente en algo que genere mayor valor."

**Options:**
A. defender la creatividad como virtud personal
B. definir la innovación en términos de valor generado
C. criticar el sistema económico actual
D. promover el cambio tecnológico

**Answer key:** B

---
```

---

## After completing the extraction

→ Proceed to `01_extraction/` using `templates/extraction_template.md`.
