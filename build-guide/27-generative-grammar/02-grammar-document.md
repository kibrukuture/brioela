# Brioela Generative Grammar — Grammar Document

## What This File Covers

The `GenerativeUIDocument` contract, layout node schema, validation, grammar versioning, and data binding rules.

> Note: `10-the-stage-document.md` is the evolved form of this contract — the **Stage**. There,
> `layout` is realized as `composition` + `slots`, plus `atmosphere`, `beats`, and `voice`. The
> node names below have been migrated to the naming law (`12-naming-law.md`) and grouped by the
> three primitive layers (`14-primitive-layers-and-reuse.md`).

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
// layer tags reference 14-primitive-layers-and-reuse.md
type UILayoutNode =
  // structural
  | { type: "stack"; gap: SpacingToken; children: UILayoutNode[] }
  | { type: "cluster"; align: "start" | "center" | "end"; children: UILayoutNode[] }
  // expressive (generic — every feature reuses these)
  | { type: "headline"; text: string; tone: ToneToken }
  | { type: "caption"; text: string; tone: ToneToken }
  | { type: "metric_single"; label: string; value: string; tone: ToneToken }
  | { type: "swap_suggestion"; from: string; to: string; reason: string }
  | { type: "timestamped_note"; text: string; timestampLabel: string | null }
  | { type: "stamp"; label: string; icon: IconToken }
  // domain (feature-specific data shapes)
  | { type: "ingredient_list"; items: IngredientItem[] }
  | { type: "mesa_member_row"; member: MesaMemberVerdict }
  | { type: "recipe_step"; step: RecipeStepPreview }
```

This is the alphabet — atoms across the structural, expressive, and domain layers. Multi-item
arrangements (a grid of members, a rail of steps) come from structural nodes (`grid`, `rail`)
and compositions (`11`), not from multi-item atoms. Creativity comes from composition.

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
