# Brioela Generative Grammar — Grammar Document

## What This File Covers

The `GenerativeUIDocument` contract, layout node schema, validation, grammar versioning, and data binding rules.

---

## Document Shape

```typescript
type GenerativeUIDocument = {
  grammarVersion: "1"
  surface: GenerativeSurface
  safetyLock: boolean
  mood: UIMood
  layout: UILayoutNode
  motion: MotionToken | null
  haptics: HapticToken | null
  skia: SkiaTreatment | null
  expiresAt: number | null
}
```

`safetyLock = true` means the document may enhance only non-safety areas. The renderer must preserve static safety UI exactly.

---

## Surfaces

```typescript
type GenerativeSurface =
  | "scan_secondary"
  | "recipe_card"
  | "cooking_opener"
  | "weekly_summary"
  | "food_time_machine"
  | "mesa_compatibility"
  | "menu_scan_summary"
  | "discovery_card"
  | "kids_learning"
  | "savings_story"
```

Each surface has an allowlist of permitted node types.

---

## Layout Node

```typescript
type UILayoutNode =
  | { type: "stack"; gap: SpacingToken; children: UILayoutNode[] }
  | { type: "cluster"; align: "start" | "center" | "end"; children: UILayoutNode[] }
  | { type: "hero_line"; text: string; tone: ToneToken }
  | { type: "whisper_note"; text: string; tone: ToneToken }
  | { type: "metric_petal"; label: string; value: string; tone: ToneToken }
  | { type: "ingredient_thread"; items: IngredientThreadItem[] }
  | { type: "swap_pair"; from: string; to: string; reason: string }
  | { type: "mesa_grid"; members: MesaMemberVerdict[] }
  | { type: "recipe_step_rail"; steps: RecipeStepPreview[] }
  | { type: "memory_moment"; text: string; timestampLabel: string | null }
  | { type: "discovery_stamp"; label: string; icon: IconToken }
```

This is the alphabet. Creativity comes from composition.

---

## Validation

Every node type has a Zod schema.

Validation order:

1. document schema
2. surface allowlist
3. recursive node schema
4. token allowlist
5. string length limits
6. privacy/safety filters where applicable

Any failure discards the grammar layer.

---

## Data Binding

Grammar documents receive already-approved data from feature APIs. They cannot fetch data themselves.

Nodes can reference only payload fields passed to the decision model.

No hidden data fetches. No client-side database reads from grammar nodes.
