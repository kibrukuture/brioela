# Brioela Generative Grammar — Code Package Structure

## What This File Covers

The exact file tree for the grammar, mapped to the **real** repo layout (verified, not invented),
the import flow between packages, the single-source-of-truth rule, and the order to build in. This
is the doc to open when we start writing code.

---

## Ground Truth (verified repo layout)

- bun-workspaces monorepo: `backend`, `shared`, `mobile`.
- **`shared/` is flat** — `api/`, `constants/`, `lib/`, `logic/`, `types/`, `validators/`, `zod/`,
  `drizzle/`. No `src/`. Package name: **`@brioela/shared`**.
- **`mobile/` is flat** — `app/` (Expo Router), `features/`, top-level subsystems like
  `biomarker/`, plus `components/`, `theme/`, `lib/`, `providers/`, `stores/`. No `src/`.
- **`backend/` uses `backend/src/`** — `api/`, `core/`, `lib/`, `message-queue/`. AI plumbing
  already lives at `backend/src/core/ai/{clients,config,functions,prompts,schemas,utils}`.
- Cross-package imports use the workspace specifier, e.g. `@brioela/shared/constants`. The grammar
  is imported as **`@brioela/shared/grammar`** from both `mobile` and `backend`.
- Note: `mobile/ui-schema/` is **form** validation schemas (auth/payments) — unrelated; do not
  conflate with the UI grammar.

---

## The Three Homes

The grammar lives in three places, one per role:

| Package | Role | Home |
|---|---|---|
| `shared` | **the language** — schema + catalog (single source of truth) | `shared/grammar/` |
| `mobile` | **the renderer** — native components that render a Stage | `mobile/grammar/` |
| `backend` | **the producer** — AI orchestration that emits a Stage | `backend/src/core/generative-grammar/` |

The schema in `shared/grammar` is imported by both the renderer (to validate + map) and the
producer (to constrain the model). One schema, three consumers — they cannot drift (`13`).

---

## `shared/grammar/` — the language (single source of truth)

One Zod schema per file (Rule 3, one responsibility). Built with the existing `zod` dependency.

```
shared/grammar/
  index.ts                         # public exports
  version.ts                       # grammarVersion + version policy
  schema/
    document.ts                    # base GenerativeUIDocument (Zod)
    stage.ts                       # the Stage (extends document with the 6 layers)
    surfaces.ts                    # GenerativeSurface enum
    tokens/
      mood.ts  tone.ts  voice.ts  spacing.ts  motion.ts  haptic.ts  icon.ts
      atmosphere.ts                # {character}_field tokens + AtmosphereSelection
      beats.ts                     # beat presets + BeatSequence
    primitives/
      structural/                  # one file per atom
        stack.ts  cluster.ts  split.ts  rail.ts  ribbon.ts  constellation.ts
        focus-window.ts  ambient-surface.ts  glass-surface.ts  verdict-field.ts
        quiet-sheet.ts  story-surface.ts  shared-artifact.ts  index.ts
      expressive/
        headline.ts  caption.ts  reason-statement.ts  question-line.ts
        micro-explainer.ts  source-caveat.ts  confidence-note.ts  metric-single.ts
        meter.ts  chip.ts  thread.ts  stamp.ts  timestamped-note.ts  index.ts
      domain/
        ingredient-list.ts  origin-mark.ts  mesa-member-row.ts  recipe-step.ts
        recipe-timing.ts  recipe-phase-marker.ts  attribution-mark.ts  index.ts
      index.ts                     # assembles the primitive union
    compositions/                  # one file per scene (discriminated union member)
      scan-verdict-focus.ts  scan-insight-secondary.ts  scan-swap-comparison.ts
      mesa-fit-grid.ts  mesa-conflict-spotlight.ts  recipe-steps-rail.ts
      memory-recall-reverent.ts  savings-story-scroll.ts  summary-week-overview.ts
      share-discovery-stamp.ts  kids-explainer-gentle.ts  index.ts
  catalog/
    registry.ts                    # type → { schema, defaults }
    descriptions.ts                # AI-facing descriptions (the steering, 12/13)
    allowlists.ts                  # per-surface permitted composition types
    pairing.ts                     # legal mood↔atmosphere↔beats↔voice combinations (04)
```

---

## `mobile/grammar/` — the renderer (mirrors the `biomarker/` subsystem pattern)

```
mobile/grammar/
  index.ts
  grammar-renderer.tsx             # recursive entry: takes a Stage + fallback (05)
  node-renderers.ts                # NODE_RENDERERS map: type → component (05)
  client-validate.ts               # re-validate received Stage (defense in depth, 15)
  fallback.ts                      # static fallback handling (05)
  hooks/
    use-stage.ts                   # receive → validate → 400ms budget (15)
  nodes/                           # one component per primitive, grouped by layer
    structural/  stack-node.tsx  cluster-node.tsx  rail-node.tsx  …
    expressive/  headline-node.tsx  caption-node.tsx  metric-single-node.tsx  …
    domain/      ingredient-list-node.tsx  mesa-member-row-node.tsx  recipe-step-node.tsx  …
  compositions/                    # one component per scene
    scan-verdict-focus-scene.tsx  mesa-fit-grid-scene.tsx  memory-recall-reverent-scene.tsx  …
  atmosphere/                      # Tier 2 (16)
    atmosphere-field.tsx           # selects + renders the Skia field
    uniform-ranges.ts             # intensity token → clamped uniform range
    degradation.ts                # full → static → fallback ladder
    shaders/  ambient-grain-field.sksl.ts  verdict-bloom-field.sksl.ts  …
  motion/                          # the beats layer (17)
    beats.ts                       # preset → Reanimated sequence
    springs.ts                     # design-system spring configs
    reduced-motion.ts
```

Every visual value comes from `mobile/theme/` and `01-design-system` — the renderer holds zero
raw numbers (Rule 7).

---

## `backend/src/core/generative-grammar/` — the producer (self-contained, Rule 1)

Self-contained per build-guide Rule 1; imports the shared LLM client from
`backend/src/core/ai/clients`.

```
backend/src/core/generative-grammar/
  index.ts
  present-moment.ts                # the AI function/tool: arguments = a Stage (13)
  decide-if-worth-enhancing.ts     # the silence gate (13, product law)
  build-catalog-schema.ts          # zod (@brioela/shared/grammar) → provider input_schema
  validate-stage.ts                # server-side validation (15)
  safety-filter.ts                 # PII / safety-surface / safetyLock enforcement (15)
  stream-stage.ts                  # stream to client within budget (05)
  prompts/
    grammar-system.ts              # system prompt
    fewshot/  scan.ts  mesa.ts  recipe.ts  memory.ts  …   # gold Stage examples (13)
```

---

## Import Flow

```
@brioela/shared/grammar
        │  (schema + catalog — single source of truth)
        ├──────────────► mobile/grammar/        (validate received Stage, map to components)
        └──────────────► backend/src/core/generative-grammar/
                                 (build-catalog-schema → constrain the model; validate; safety-filter)
```

- Backend turns the shared Zod schema into the model's `input_schema` via `build-catalog-schema`.
- Both sides validate against the *same* schema. The renderer never trusts the wire.

---

## Reconciling The `tools/` Rule

Build-guide Rule 2 describes an aspirational `tools/{feature}/` + `@/tools` aggregator. The real
backend organizes logic under `backend/src/core/{domain}/`, so the grammar follows reality and
lives at `backend/src/core/generative-grammar/`. `present-moment.ts` and
`decide-if-worth-enhancing.ts` are its AI function handlers. If a global `tools/index.ts`
aggregator is later adopted, it re-exports these — no relocation needed.

---

## Build Order (the careful coding sequence)

Bottom-up, so each layer compiles against a finished one beneath it:

1. **`shared/grammar/schema/tokens/`** — the enums (mood, tone, voice, spacing, motion, haptic,
   atmosphere, beats). Smallest, no dependencies.
2. **`shared/grammar/schema/primitives/`** — atoms, by layer (structural → expressive → domain).
3. **`shared/grammar/schema/compositions/` + `document.ts` + `stage.ts`** — the discriminated
   union and the Stage.
4. **`shared/grammar/catalog/`** — registry, descriptions, allowlists, pairing.
5. **`mobile/grammar/` renderer** — start with `grammar-renderer.tsx`, `node-renderers.ts`,
   a few structural + expressive nodes, and one composition end-to-end; then `client-validate`,
   `use-stage`, `fallback`.
6. **`mobile/grammar/atmosphere/` + `motion/`** — Tier 2 + beats (can lag step 5).
7. **`backend/src/core/generative-grammar/`** — `build-catalog-schema`, `validate-stage`,
   `safety-filter`, the gate, `present-moment`, prompts/few-shot, `stream-stage`.

Vertical slice first: one surface (scan), one composition (`scan-verdict-focus`), a handful of
atoms, end to end — prove the whole pipeline before widening the catalog.

---

## What This File Depends On

- All of `01`–`17` — this is where the design becomes a file tree.
- The verified repo layout (`shared` / `mobile` / `backend/src`).

## What Depends On This File

- The actual grammar code, once we start writing it.
