# Generative Grammar — Spec

Feature **52**. Brioela's structured UI artifact rendering system: typed `BrioelaGenerativeUiDocument` language, Zod contracts, native renderer, Tier-0/Tier-1/Tier-2 generativity, Artifact Layer static export, and contract-spine delivery (`brioelaGenerativeUi` on feature responses — never a standalone product grammar route). Product rule: **the AI composes emotional food moments from a living grammar; it never writes runtime JSX.**

**Not in this feature:** Feature logic that *produces* payloads (scanner verdict assembly **24**, Mesa compatibility **41**, menu parsing **26**, cooking session transport **29**, Harvest chapter composition **53**, Passport instruction blocks **47**, Discovery Card scrub/consent **51**, growth-mirror trajectory extraction **40**, weekly summary generation body **34**, Kids explanation LLM **44**); Brain chat runtime shell (**20**); design-system token primitives (**02** — **52** consumes); guard/lexicon/reading-gate tooling.

**Living catalog note:** `GenerativeSurface` in `02-grammar-document.md` lists 10 surfaces; cross-feature docs add `passport_render_brioela_generative_ui`, `recipe_step_focus_brioela_generative_ui`, Harvest edition surfaces, and `illness_detective_result_brioela_generative_ui` — register in shared enum before implementation (**G3**). Naming law (`12-naming-law.md`) supersedes pre-rename examples (`hero_line` → `headline`, `mood` → `emotionalTone`, `composition` → `layoutTemplate`). Code namespace: `shared/grammar/`, `mobile/grammar/`, `backend/src/core/generative-grammar/`.

---

## Purpose

Most food apps render the same card regardless of emotional weight. Brioela needs expressive, context-aware UI without runtime code generation. **52** is the presentation spine: schema, catalog, renderer, validation, Artifact Layer export, and delivery contract every emotional surface shares.

```text
Feature owns moment data → (optional) AI selects BrioelaGenerativeUiDocument → validate → render native OR export static artifact
```

Without **52**, each feature would invent incompatible JSON shapes, unsafe JSX patterns, or broken share renders — and Discovery Cards, Passport frames, Harvest chapters, and scan explanations could not share one visual language.

---

## Product definition

| Term | Meaning |
|---|---|
| **Brioela Generative Grammar** | The full system: schema, catalog, renderer, producer, validation, Artifact Layer |
| **`BrioelaGenerativeUiDocument`** | Typed JSON the AI (or a feature helper) emits — never JSX |
| **`brioelaGenerativeUi`** | Response/stream field carrying an optional document |
| **`GenerativeSurface`** | Allowlisted surface id: `{feature}_{role}_brioela_generative_ui` |
| **Primitive** | Atomic layout/meaning node (structural, expressive, or domain layer) |
| **Layout template** | Art-directed scene (`{feature}_{purpose}_{form}_layout`) — discriminated union member |
| **Composition catalog** | Registry of layout templates + AI-facing descriptions |
| **Generativity tier** | 0 static safety · 1 grammar · 2 canvas (Skia/Reanimated tokens) · 3 mini-app (deferred) |
| **Artifact Layer** | Server/mobile static image/PDF export path for share artifacts (Discovery Cards, Passport image, Harvest cards) |
| **Registered Component Layer** | Named non-generative components for known surfaces (design-system registry) |
| **Build-Time Creation Lane** | AI proposes `.tsx` primitives/compositions; humans review before runtime selection |
| **Silence gate** | `decideIfWorthEnhancing` — no document when moment is mild/low-confidence |
| **400ms rule** | Live enhancement budget; late/invalid → static Tier-0 UI stays, no spinner |
| **Contract spine** | ts-rest contracts declare `brioela_generative_ui` policy per endpoint/stream |

**Design principles (non-negotiable):**

- AI does not generate runtime JSX, TSX, MDX, or remote imports.
- Static safety UI renders first and remains authoritative (`safetyLock`, Tier 0).
- Grammar is additive — every surface has a complete static fallback.
- Feature APIs deliver `brioelaGenerativeUi`; no normal `POST /v1/grammar/compose-*` product routes.
- Artifact share output is always static image/PDF after upstream privacy validation (**51** scrubs Discovery Cards; **47** validates Passport blocks).
- Names follow naming law — functional enums for AI; soul lives in pixels (`12`).

---

## Layer architecture

| Layer | Tier | Owner | AI may touch? | Examples |
|---|---|---|---|---|
| **Static Safety Layer** | 0 | Feature + design system | **Never** | Hard allergy block, recall, payment, consent, destructive actions, Ground gate |
| **Registered Component Layer** | 0 | Design system | **Never** | Tab chrome, settings forms, navigation |
| **Generative Grammar Layer** | 1 (+2 tokens) | **52** | **Select** layout, tone, copy in allowlist | Scan explanation, Mesa fit summary, recipe emphasis, cooking opener |
| **Artifact Layer** | 1 export | **52** render + feature/51/47/53 payload | **Layout only** — content pre-validated | Discovery Card PNG, Passport PDF, Harvest chapter card |
| **Build-Time Creation Lane** | — | Design + eng review | Propose new primitives/compositions offline | New `layoutTemplate`, Skia family, domain primitive |

### Three primitive layers (within Tier 1)

| Layer | Reuse | Target count | Examples |
|---|---|---|---|
| **Structural** | Every feature | ~15–25 | `stack`, `cluster`, `rail`, `focus_window`, `shared_artifact` |
| **Expressive** | Every feature | ~25–40 | `headline`, `caption`, `metric_single`, `swap_suggestion`, `stamp` |
| **Domain** | Feature-specific | ~15–25 growing | `mesa_member_row`, `recipe_step`, `ingredient_list`, `attribution_mark` |

---

## Document contract

Base shape (`02-grammar-document.md`) extended by six expressive layers (`10-the-stage-document.md`):

```typescript
type BrioelaGenerativeUiDocument = {
  grammarVersion: '1'
  surface: GenerativeSurface
  safetyLock: boolean
  expiresAt: number | null

  emotionalTone: EmotionalTone
  backgroundEffect: BackgroundEffectSelection | null
  layoutTemplate: LayoutTemplate              // discriminated union on `type`
  content: BrioelaGenerativeUiContent         // shape keyed by layoutTemplate.type
  entranceMotion: EntranceMotion | null
  typographyStyle: TypographyStyle
}
```

Legacy field names (`mood`, `composition`, `slots`, `beats`, `atmosphere`) are **banned** in new code (`12-naming-law.md`).

### Emotional tone tokens (`04`)

`neutral_factual` · `discovery_informational` · `caution_explanatory` · `positive_confirming` · `memory_reflective` · `focused_instructional` · `learning_gentle` · `group_considerate` · `savings_reassuring`

### Validation order (`15`)

1. Document schema → 2. `grammarVersion` → 3. Surface allowlist → 4. Recursive node/layout schema → 5. Token allowlists → 6. Pairing rules → 7. Size caps → 8. Safety/privacy filter → 9. `safetyLock` check.

Fail closed on live path — no repair retry within 400ms.

### Size caps (`05`)

Max depth 5 · max 8 children per parent · max 40 total nodes · per-node text caps surface-specific.

---

## Complete surface integration inventory

> **Living snapshot (2026-06-12 audit).** Sources: `06-surface-integration.md`, `02-grammar-document.md`, cross-feature build guides, neighbor `_features/`.

### Baseline `GenerativeSurface` (`02-grammar-document.md`)

| # | Surface | Feature owner | Delivery mode | Tier | Static fallback owner | Notes |
|---|---|---|---|---|---|---|
| 1 | `scan_explanation_brioela_generative_ui` | **24** scanner | HTTP optional on scan response | 1+2 | **24** `StaticScanSecondary` | Never generative: verdict level, hard allergy, condition flag |
| 2 | `recipe_card_brioela_generative_ui` | **25**/**29** recipes | HTTP/stream on recipe open | 1+2 | Recipe static card | **40** demonstrated-skill summary informs variant; grammar selects framing |
| 3 | `cooking_opener_brioela_generative_ui` | **29** cooking | Stream event | 1+2 | Cooking static opener | Agentic `present_moment` tool; never timer/safety controls |
| 4 | `weekly_summary_brioela_generative_ui` | **34** pantry/meal | HTTP on summary gen | 1+2 | Weekly static layout | **34** owns data; **51** may share `weekly_summary` card |
| 5 | `food_time_machine_brioela_generative_ui` | **38** time machine | HTTP | 1+2 | Time machine static | Memory/time moments |
| 6 | `mesa_compatibility_brioela_generative_ui` | **41** Mesa | HTTP on evaluate | 1+2 | Mesa static fit | No member names beyond approved labels |
| 7 | `menu_scan_summary_brioela_generative_ui` | **26** menu | HTTP on menu scan | 1+2 | Menu static summary | Fit counts, not accusatory restaurant copy |
| 8 | `discovery_card_brioela_generative_ui` | **51** viral sharing | Artifact static PNG | 1 → Artifact | Design-system card template | **51** scrubs before `buildDiscoveryCardGrammarDocument`; final output static only |
| 9 | `kids_learning_brioela_generative_ui` | **44** kids | HTTP after explanation | 1+2 | Kids static container | `learning_gentle` tone; no child identity |
| 10 | `savings_story_brioela_generative_ui` | **33** receipts | HTTP on savings moment | 1+2 | Savings static story | No receipt PII |

### Extension surfaces (cross-refs — add to enum **G3**)

| # | Surface | Feature owner | Delivery | Notes |
|---|---|---|---|---|
| 11 | `passport_render_brioela_generative_ui` | **47** Passport | Image/PDF artifact + on-screen | Frame only — cannot mutate instruction blocks (`28-passport/07`) |
| 12 | `recipe_step_focus_brioela_generative_ui` | **29** cooking | Stream event | Mid-session step emphasis (`21` cooking stream contract) |
| 13 | `harvest_chapter_brioela_generative_ui` | **53** Harvest | Pre-composed stored docs | No 400ms rule — documents stored at generation (`36-harvest/03`) |
| 14 | `harvest_cover_brioela_generative_ui` | **53** Harvest | Pre-composed + Artifact | Whole-year cover share card (`36-harvest/04`) |
| 15 | `illness_detective_result_brioela_generative_ui` | **32** illness | HTTP on result | Empathetic framing per **39** generative UI §5 |
| 16 | `verified_creator_attribution_brioela_generative_ui` | **46**/**25** | HTTP on creator cook | Attribution emphasis (`06` strong yes) |
| 17 | `encore_first_cook_brioela_generative_ui` | **48** Encore | Artifact via **51** | May map to `discovery_card_brioela_generative_ui` layout family — confirm at implement (**G4**) |

### Strong-no surfaces (never generative — Tier 0)

Hard allergy block · medical condition hard flag · recall alert · payment/checkout · permissions · account/security · practitioner/client consent · destructive deletes · child safety override · Ground submission/authenticity gate (`06`).

### Per-feature allowed vs forbidden (selected)

| Feature | Allowed grammar | Never generative |
|---|---|---|
| **24** Scanner | Secondary explanation, ingredient insight, first-time/familiar, swap presentation | Verdict level, hard allergy, condition flag |
| **41** Mesa | Table fit summary, member compatibility viz, substitution explanation | Per-member hard conflict calc, private names, medical redactions |
| **29** Cooking | Session opener, step rail emphasis, technique framing, low-energy mode | Timer controls, safety interrupts, destructive confirmations |
| **51** Discovery Card | Layout source JSON → static image | Raw moment payload (scrub first) |
| **47** Passport | Visual frame around validated blocks | Instruction text invention/change |
| **53** Harvest | Full chapter documents (no safety surfaces inside edition) | N/A at compose time — excluded categories never become chapters |

---

## Renderer architecture

### Live native renderer (`mobile/grammar/`)

```text
BrioelaGenerativeUiRenderer(document, fallback)
  → client-validate (shared schema)
  → surface allowlist check
  → layoutTemplate Scene component
  → recursive primitive NODE_RENDERERS
  → backgroundEffect Field (Tier 2 Skia)
  → entranceMotion choreography (Reanimated 4)
  → on any failure: render fallback (complete static UI)
```

Rules: renderer never fetches data; never reads app DB; no TanStack hooks inside `mobile/grammar/`.

### Artifact Layer static export

Used when output must be a **shareable file** (PNG/WebP/PDF):

```text
Validated BrioelaGenerativeUiDocument (+ feature-fixed content slots)
  → renderArtifactStatic (server and/or mobile snapshot)
  → bytes stored (R2 / inline) → **51** share sheet or **47** QR handoff
```

Discovery Cards: grammar is layout source; **final artifact is always static image after scrub** (`06`, `24-viral-sharing/02`).

Harvest: documents **pre-composed and stored** at edition generation — opening renders instantly (`36-harvest/03`).

---

## AI selection pipeline (`13`)

```text
1. Feature renders Tier-0 static UI
2. Brain gathers approved payload + context
3. decideIfWorthEnhancing → false → stop (silence)
4. present_moment (structured output or agent tool) → BrioelaGenerativeUiDocument
5. Server validate + safety filter → optional brioelaGenerativeUi on response/stream
6. Client re-validate → render within 400ms or keep static
```

HTTP: one-shot structured output. Agentic/realtime: `present_moment` in tool box alongside feature tools.

---

## Contract spine & delivery (`20`–`22`)

- No normal product grammar routes. Exception: internal preview/QA tooling only.
- Feature contracts include `brioelaGenerativeUi: brioelaGenerativeUiSchema.nullable().optional()`.
- Endpoint metadata: `brioela_generative_ui: { allowed, mode, surfaces, safetyLock }`.
- `composeBrioelaGenerativeUiForContract()` enforces policy.
- ts-rest in `shared/contracts/`; mobile uses `@ts-rest/react-query` via feature hooks; query keys from `contractKey()`.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** `rg 'BrioelaGenerativeUi|shared/grammar|mobile/grammar|generative-grammar' backend/src shared/ mobile/` — **zero product matches**.

| # | Component | Type | In **52**? | Shipped? | Consumer features |
|---|---|---|:---:|:---:|---|
| 1 | **`shared/grammar/` Zod schemas** | Shared | **Yes** | No | All surfaces |
| 2 | **Token enums** | Shared constants | **Yes** | No | AI + renderer |
| 3 | **`GenerativeSurface` allowlists** | Catalog | **Yes** | No | Per-feature |
| 4 | **Layout template union** | Shared Zod | **Yes** | No | Compositions |
| 5 | **Primitive node union** | Shared Zod | **Yes** | No | Recursive render |
| 6 | **Catalog registry + descriptions** | Shared | **Yes** | No | AI steering |
| 7 | **Pairing rules** | Shared | **Yes** | No | Validation |
| 8 | **`BrioelaGenerativeUiRenderer`** | Mobile | **Yes** | No | All live surfaces |
| 9 | **`NODE_RENDERERS` map** | Mobile | **Yes** | No | Primitives |
| 10 | **Layout template Scene components** | Mobile | **Yes** | No | Compositions |
| 11 | **Background effect / Skia fields** | Mobile Tier 2 | **Yes** | No | Emotional peaks |
| 12 | **Entrance motion presets** | Mobile | **Yes** | No | Choreography |
| 13 | **Client re-validation** | Mobile | **Yes** | No | Defense in depth |
| 14 | **Static fallback handler** | Mobile | **Yes** | No | 400ms / invalid |
| 15 | **`composeBrioelaGenerativeUi`** | Backend core | **Yes** | No | Feature handlers |
| 16 | **`decideIfWorthEnhancing`** | Backend core | **Yes** | No | Silence gate |
| 17 | **`present_moment` tool** | Backend core | **Yes** | No | Agentic flows |
| 18 | **Server validate + safety filter** | Backend core | **Yes** | No | Pre-stream |
| 19 | **`buildCatalogSchema`** | Backend core | **Yes** | No | Model input_schema |
| 20 | **`renderArtifactStatic`** | Backend + mobile | **Yes** | No | Artifact Layer |
| 21 | **Contract helpers** | Shared | **Yes** | No | `composeForContract`, `contractKey` |
| 22 | **Few-shot prompt library** | Backend prompts | **Yes** | No | Per-surface gold docs |
| 23 | **Build-time creation lane registry** | Process + code | **Yes** | No | New primitives/compositions |
| 24 | **Internal grammar preview route** | Backend dev | **Yes** | No | QA only — not product |
| 25 | **Grammar tests** | Tests | **Yes** | No | Validate, pairing, artifact |
| 26 | **Discovery card grammar builder** | **51** helper | **Cross** | No | **51** calls; **52** owns schema surface |
| 27 | **Passport static+grammar wrap** | **47** helper | **Cross** | No | **47** validates blocks; **52** frames |
| 28 | **Harvest document set storage** | **53** | **Cross** | No | **53** composes JSON; **52** renders |
| 29 | **Demonstrated-skill summary input** | **40** → recipe surface | **Cross** | No | Context for `recipe_card_*` only |

### Shipped in repo today (grammar-related)

- `build-guide/27-generative-grammar/` — **22 numbered files + research/** (docs complete per sessions **034**, **036**).
- `brioela-specs/42-brioela-generative-grammar.md`, `brioela-specs/39-generative-ui.md`.
- `build-guide/01-design-system/06-generative-ui.md` — foundation pattern.
- `_records/connections/24-generative-grammar-connections.md`, `_records/build-order/25-layer-generative-grammar.md`.
- `_records/session-log/034-generative-grammar-complete.md`, `_records/session-log/036-generative-grammar-contract-delivery.md`.
- **Zero** `shared/grammar/`, `mobile/grammar/`, or `backend/src/core/generative-grammar/` production code.

---

## Neighbor boundaries

### vs **51** Viral Sharing

| **52** owns | **51** owns |
|---|---|
| `BrioelaGenerativeUiDocument` schema + renderer + Artifact export | Moment detection, scrub, consent, share transport |
| `discovery_card_brioela_generative_ui` surface + layout templates | `DiscoveryCard` payload, CTA rules, preview sheet |
| `renderArtifactStatic` implementation | `buildDiscoveryCardGrammarDocument` (maps scrubbed card → document) |
| Grammar failure → static template fallback | Privacy scrub mandatory before any card build |

**51** draft `build.discovery.card.grammar.document.helper.gap.md` uses legacy field names — reconcile to naming law at implement (**G5**).

### vs **47** Passport

| **52** owns | **47** owns |
|---|---|
| `passport_render_brioela_generative_ui` surface + frame renderer | Instruction blocks, minimization, translation, expiry/revoke |
| Visual tokens for handoff mood | `PassportKind` builders, medical boundary |
| Image/PDF render pipeline | QR/link routes, audit events |

Passport grammar **frames** validated instructions; it cannot invent or change them (`28-passport/07`).

### vs **53** Harvest

| **52** owns | **53** owns |
|---|---|
| Render stored `BrioelaGenerativeUiDocument` sets + chapter Artifact export | Annual gather/compose/salience, `harvest_edition` tables |
| `harvest_chapter_*` / `harvest_cover_*` surfaces | `document_set_json`, `share_card_ref` R2 refs |
| Fallback typographic render on validation failure | Category exclusion at compose (no health/location chapters) |

Harvest skips live 400ms enhancement — pre-composed at generation (`36-harvest/03`).

### vs **39** Generative UI (product spec)

**39** defines *which moments* should feel alive and example variants. **52** defines *how* those moments are implemented safely. **39** is product intent; **42** + `27-generative-grammar/` are engineering source of truth.

### vs **02** Design System

**02** owns tokens, motion configs, haptics, base components, CVA variants. **52** consumes them — renderer holds zero raw numbers (`19`).

---

## Dependencies

| Layer | Feature | Why |
|---|---|---|
| Design tokens + motion + Skia base | **02** | Renderer pulls all visual values from theme |
| Expo/RN runtime | **03**/**01** | Compiled primitives, Reanimated 4, Skia 2.6 |
| Brain AI clients | **04**/**20** | `present_moment`, structured output |
| Contract spine | **01** shared | ts-rest + `brioela_generative_ui` metadata |
| Discovery Card payloads (scrubbed) | **51** | Artifact Layer consumer |
| Passport validated blocks | **47** | Frame-only render |
| Harvest composed documents | **53** | Stored edition render |

---

## Obsolete sources / conflicts

| Source | Issue | Resolution |
|---|---|---|
| `51` draft grammar helper | Uses `discovery_card_render`, `mood`, `layout.kind` | Migrate to `discovery_card_brioela_generative_ui`, `emotionalTone`, `layoutTemplate` (**G5**) |
| `28-passport/07` node list | `hero_line` pre-rename | Use `headline`, `instruction_block` as domain primitive (**G6**) |
| `01-design-system/06` registry path | References `src/generative-ui/registry.ts` | Superseded by `shared/grammar/` + `mobile/grammar/` (`19`) |
| `_records/connections/24` | Omits files `09`–`18`, `10`–`17` | Ledger snapshot only; `00-overview.md` is complete index |
| `_records/build-order/25` | Minimal deps | Real deps: **02**, **04**, **20**, consumers **24**–**53** |
| Tier 3 WebView mini-app | `18` deferred | Not v1; Tier 1+2 cover product |
| `52` status blocked by **51** | Ordering for Discovery Card Artifact | **51** can ship static template fallback before full grammar; not a hard circular block |
| Spec **42** `layout` + `motion` fields | Superseded by `layoutTemplate` + `entranceMotion` in `10` | **42** is summary; `10`/`12` win for implementation |

---

## Sources

- `brioela-specs/42-brioela-generative-grammar.md`
- `brioela-specs/39-generative-ui.md`
- `build-guide/27-generative-grammar/` (all numbered files `00`–`22`, `research/`)
- `build-guide/01-design-system/06-generative-ui.md`
- `build-guide/28-passport/07-rendering-with-grammar.md`
- `build-guide/36-harvest/03-grammar-rendering.md`, `04-share-cards.md`
- `build-guide/40-growth-mirror/04-recipe-confidence-touch.md`
- `_records/connections/24-generative-grammar-connections.md`
- `_records/build-order/25-layer-generative-grammar.md`
- Neighbor `_features/39` (acoustic — no), `40-growth-mirror/`, `47-passport/`, `51-viral-sharing/`, `53-harvest/`
