# Recipe Ingestion — Recipe Normalization

## What This File Covers

Turning extracted artifacts into a canonical, cookable recipe with ingredients, steps, timing, servings, source attribution, and confidence markers.

---

## Normalization Rule

The model may structure and infer lightly, but it must not fabricate.

Allowed:

- split a paragraph into steps
- normalize "a pinch" as a textual quantity
- infer step order from transcript order
- mark uncertain quantities as estimated

Blocked:

- invent missing ingredients
- invent exact quantities not present or implied
- invent cooking times without evidence
- remove source uncertainty
- convert a food review into a recipe if no recipe exists

---

## Canonical Recipe Shape

```typescript
type NormalizedImportedRecipe = {
  title: string
  source: "shared_url" | "video" | "image" | "browser"
  sourceUrl: string | null
  sourceApp: string | null
  attribution: {
    title: string | null
    authorName: string | null
    canonicalUrl: string | null
  }
  servings: {
    value: number | null
    confidence: number
  }
  totalTimeMinutes: {
    value: number | null
    confidence: number
  }
  ingredients: ImportedIngredient[]
  steps: ImportedStep[]
  cuisine: string | null
  difficulty: "easy" | "medium" | "hard" | "unknown"
  tags: string[]
  confidence: number
  warnings: string[]
}

type ImportedIngredient = {
  name: string
  quantityText: string | null
  unit: string | null
  preparation: string | null
  optional: boolean
  estimated: boolean
  confidence: number
}

type ImportedStep = {
  order: number
  instruction: string
  durationMinutes: number | null
  temperatureText: string | null
  confidence: number
}
```

Quantities are text-first because recipe content often uses human language. Structured unit conversion can come later, but the original text should not be lost.

---

## Normalization Prompt Rules

The prompt must require:

- valid JSON matching schema
- title if available, otherwise descriptive title with low confidence
- ingredients only from source evidence
- steps only from source evidence
- nullable quantities when unknown
- `estimated: true` when quantity is inferred
- source attribution preserved
- warnings for missing quantities, missing timings, missing steps, or ambiguous instructions

The model should explain uncertainty through fields, not prose outside the schema.

---

## Confidence Computation

Recipe confidence combines:

- source extraction confidence
- ingredient completeness
- step completeness
- quantity confidence
- timing confidence
- source type reliability

Example:

```typescript
type RecipeConfidenceBreakdown = {
  sourceExtraction: number
  ingredients: number
  steps: number
  quantities: number
  timing: number
  overall: number
}
```

Confidence should drive UI treatment and whether a recipe needs review before cooking.

---

## Immediate Cookability

Imported recipes should be usable by `08-cooking-session` immediately.

Minimum cookable recipe:

- title
- at least 2 ingredients
- at least 2 ordered steps
- source attribution
- confidence/warnings

If the source lacks enough steps, save as `partial` instead of pretending it is cookable.

---

## Source Attribution

Every imported recipe preserves where it came from.

Attribution supports:

- user trust
- recipe source display
- future reprocessing
- creator/source recognition

Do not strip attribution just because the recipe is normalized. The normalized recipe is the user's private copy, but source provenance remains visible.
