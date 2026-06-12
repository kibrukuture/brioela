# Generative Grammar — Build

Feature **52**. Production paths under `shared/grammar/`, `mobile/grammar/`, `backend/src/core/generative-grammar/`, `shared/contracts/` (grammar-aware helpers + `brioela_generative_ui` metadata on feature contracts), and grammar tests. **Not in 52 build:** Feature moment payloads (**24**, **26**, **29**, **33**, **34**, **40**, **41**, **44**, **48**), Discovery Card scrub/consent (**51**), Passport instruction generation (**47**), Harvest annual composition (**53**), design-system token definitions (**02**), Brain chat session shell (**20**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/27-generative-grammar/` (`00`–`22` + `research/`) | ✓ docs only |
| `brioela-specs/42-brioela-generative-grammar.md`, `39-generative-ui.md` | ✓ specs |
| `build-guide/01-design-system/06-generative-ui.md` | ✓ foundation doc |
| `_records/connections/24-generative-grammar-connections.md` | ✓ ledger |
| `_records/build-order/25-layer-generative-grammar.md` | ✓ ledger |
| `_records/session-log/034-*`, `036-*` | ✓ session logs |
| `shared/grammar/`, `mobile/grammar/`, `backend/src/core/generative-grammar/` | ✗ |
| Grammar renderer + Artifact export | ✗ |
| Contract spine `brioela_generative_ui` metadata | ✗ |
| Grammar tests | ✗ |

**Zero generative-grammar production code.** `rg 'BrioelaGenerativeUi|shared/grammar|mobile/grammar|generative-grammar' backend/src shared/ mobile/` — no matches.

---

## File manifest

### `shared/grammar/` — language (single source of truth)

| File | Role |
|---|---|
| `shared/grammar/index.ts` | Public exports |
| `shared/grammar/version.ts` | `grammarVersion` + version policy |
| `shared/grammar/schema/document.ts` | Base document Zod |
| `shared/grammar/schema/brioela-generative-ui.ts` | Six expressive layers |
| `shared/grammar/schema/surfaces.ts` | `GenerativeSurface` enum (baseline + extensions) |
| `shared/grammar/schema/tokens/emotional-tone.ts` | `EmotionalTone` |
| `shared/grammar/schema/tokens/tone.ts` | `ToneToken` |
| `shared/grammar/schema/tokens/typography-style.ts` | `TypographyStyle` |
| `shared/grammar/schema/tokens/spacing.ts` | `space_xs` … `space_2xl` |
| `shared/grammar/schema/tokens/motion.ts` | `MotionToken` |
| `shared/grammar/schema/tokens/haptic.ts` | `HapticToken` |
| `shared/grammar/schema/tokens/background-effect.ts` | `BackgroundEffectSelection` |
| `shared/grammar/schema/tokens/entrance-motion.ts` | `EntranceMotion` |
| `shared/grammar/schema/primitives/structural/*.ts` | Layout atoms |
| `shared/grammar/schema/primitives/expressive/*.ts` | Generic meaning atoms |
| `shared/grammar/schema/primitives/domain/*.ts` | Feature data shapes |
| `shared/grammar/schema/primitives/index.ts` | Primitive union |
| `shared/grammar/schema/compositions/*.ts` | Layout template discriminated union members |
| `shared/grammar/schema/compositions/index.ts` | `LayoutTemplate` union |
| `shared/grammar/catalog/registry.ts` | type → { schema, defaults } |
| `shared/grammar/catalog/descriptions.ts` | AI-facing catalog steering |
| `shared/grammar/catalog/allowlists.ts` | Per-surface permitted `layoutTemplate` types |
| `shared/grammar/catalog/pairing.ts` | emotionalTone ↔ backgroundEffect ↔ entranceMotion |

### `mobile/grammar/` — renderer

| File | Role |
|---|---|
| `mobile/grammar/index.ts` | Barrel |
| `mobile/grammar/brioela-generative-ui-renderer.tsx` | Entry: document + fallback |
| `mobile/grammar/node-renderers.ts` | `NODE_RENDERERS` map |
| `mobile/grammar/client-validate.ts` | Re-validate received document |
| `mobile/grammar/fallback.ts` | Fail-closed fallback behavior |
| `mobile/grammar/nodes/structural/*.tsx` | Primitive renderers |
| `mobile/grammar/nodes/expressive/*.tsx` | Primitive renderers |
| `mobile/grammar/nodes/domain/*.tsx` | Domain renderers |
| `mobile/grammar/compositions/*.tsx` | Layout template Scene components |
| `mobile/grammar/background-effect/background-effect-field.tsx` | Skia field host |
| `mobile/grammar/background-effect/uniform-ranges.ts` | Intensity → clamped uniforms |
| `mobile/grammar/background-effect/degradation.ts` | full → static → gradient ladder |
| `mobile/grammar/background-effect/shaders/*.sksl.ts` | Hand-authored SkSL |
| `mobile/grammar/motion/entrance-motion.ts` | Preset → Reanimated sequence |
| `mobile/grammar/motion/springs.ts` | Design-system spring configs |
| `mobile/grammar/motion/reduced-motion.ts` | OS accessibility contract |
| `mobile/grammar/artifact/render-artifact-static.tsx` | PNG/WebP snapshot (Artifact Layer) |

### `backend/src/core/generative-grammar/` — producer

| File | Role |
|---|---|
| `backend/src/core/generative-grammar/index.ts` | Barrel |
| `backend/src/core/generative-grammar/present-moment.ts` | AI tool / structured output |
| `backend/src/core/generative-grammar/decide-if-worth-enhancing.ts` | Silence gate |
| `backend/src/core/generative-grammar/compose-brioela-generative-ui.ts` | Feature handler entry |
| `backend/src/core/generative-grammar/compose-brioela-generative-ui-for-contract.ts` | Contract policy enforcement |
| `backend/src/core/generative-grammar/build-catalog-schema.ts` | Zod → provider `input_schema` |
| `backend/src/core/generative-grammar/validate-brioela-generative-ui.ts` | Server-side validation |
| `backend/src/core/generative-grammar/safety-filter.ts` | PII / safety-surface filter |
| `backend/src/core/generative-grammar/stream-brioela-generative-ui.ts` | Realtime stream helper |
| `backend/src/core/generative-grammar/render-artifact-static.ts` | Server-side Artifact PNG/PDF |
| `backend/src/core/generative-grammar/prompts/grammar-system.ts` | System prompt |
| `backend/src/core/generative-grammar/prompts/fewshot/*.ts` | Gold documents per surface |

### `shared/contracts/` — spine integration (**52** cross-cutting)

| File | Role |
|---|---|
| `shared/contracts/index.ts` | Re-export `@ts-rest/core` + `API_CONTRACT` |
| `shared/contracts/contract-key.ts` | `contractKey()` stable query keys |
| `shared/contracts/contract.ts` | `endpoint`, `stream`, `BrioelaGenerativeUiPolicy` helpers |
| `shared/contracts/api-error.schema.ts` | Common error envelope |
| `shared/contracts/scan.contract.ts` | First vertical slice with `brioela_generative_ui` metadata |
| `shared/contracts/passport.contract.ts` | Passport + grammar policy (with **47**) |
| Feature contracts… | Each eligible endpoint declares `brioela_generative_ui` policy |

### Cross-feature grammar consumers (call **52**, implement in owner features)

| Surface | Owner build helper | **52** provides |
|---|---|---|
| Discovery Card artifact | **51** `build.discovery.card.grammar.document.helper.ts` | `discovery_card_brioela_generative_ui` schema + `renderArtifactStatic` |
| Passport image/PDF | **47** `render.passport.artifact.handler.ts` | `passport_render_brioela_generative_ui` Scene |
| Harvest chapter card | **53** compose step 6 | `harvest_chapter_brioela_generative_ui` + stored doc render |
| Scan explanation | **24** `build-scan-brioela-generative-ui-payload.ts` | `scan_explanation_*` catalog + renderer |
| Recipe card variant | **40** demonstrated-skill summary → **25**/**29** | `recipe_card_*` allowlist |

### Tests (**52**)

| File | Role |
|---|---|
| `shared/grammar/schema/brioela-generative-ui.test.ts` | Document + union parsing |
| `shared/grammar/catalog/pairing.test.ts` | Illegal emotionalTone pairings fail |
| `backend/src/core/generative-grammar/safety-filter.test.ts` | PII / safety-surface rejection |
| `backend/src/core/generative-grammar/validate-brioela-generative-ui.test.ts` | Size caps, allowlists |
| `mobile/grammar/client-validate.test.ts` | Client defense in depth |
| `mobile/grammar/artifact/render-artifact-static.test.ts` | Snapshot dimensions, no crash |
| `shared/contracts/scan.contract.test.ts` | `brioela_generative_ui` policy enforcement |

### Internal dev-only

| File | Role |
|---|---|
| `backend/src/api/dev/grammar-preview.route.ts` | QA catalog preview — not product runtime |

---

## Acceptance criteria

### Core schema & catalog

- [ ] `brioelaGenerativeUiSchema` parses gold fixtures for scan, Mesa, discovery card, passport frame.
- [ ] All baseline `GenerativeSurface` values (10) registered in `surfaces.ts` with allowlists.
- [ ] Extension surfaces (`passport_render_*`, `harvest_*`, `recipe_step_focus_*`, `illness_detective_*`) registered (**G3**).
- [ ] Naming law: no `mood`, `composition`, `slots`, `hero_line` in new schemas.
- [ ] Pairing rules reject illegal emotionalTone ↔ backgroundEffect combinations.

### Renderer (live)

- [ ] `BrioelaGenerativeUiRenderer` renders one vertical slice (`scan_explanation_focus_layout`) end-to-end.
- [ ] Invalid document → fallback only; no user-visible error.
- [ ] Document arriving after 400ms → static UI unchanged.
- [ ] `safetyLock: true` preserves Tier-0 regions exactly.
- [ ] Renderer performs zero network/DB reads.
- [ ] Reduced motion → opacity-only or instant entrance.

### Producer (backend)

- [ ] `decideIfWorthEnhancing` returns false for mild/low-confidence → `brioelaGenerativeUi: null`.
- [ ] Server validates before streaming; invalid model output never reaches client.
- [ ] `safety-filter` rejects documents referencing safety-surface content or disallowed PII.
- [ ] `present_moment` tool schema matches shared Zod catalog.

### Artifact Layer

- [ ] `renderArtifactStatic` produces PNG from `discovery_card_brioela_generative_ui` document.
- [ ] **51** can call Artifact render after scrub; grammar failure falls back to design-system template (share not blocked).
- [ ] Passport image render shows validated blocks unchanged (**47** integration).
- [ ] Harvest stored document renders offline without 400ms gate (**53**).

### Contract spine

- [ ] Scan contract includes `brioelaGenerativeUi` optional field + metadata policy.
- [ ] `composeBrioelaGenerativeUiForContract` rejects surface not in contract policy.
- [ ] Response with `brioelaGenerativeUi` when `allowed: false` fails contract test.
- [ ] `contractKey()` stable for equivalent inputs.
- [ ] No new product code uses raw `api.post<T>()` when contract exists.

### Boundaries

- [ ] **51** scrub runs before Discovery Card grammar document build — **52** never sees raw moments.
- [ ] **47** instruction text validated before passport grammar frame.
- [ ] **53** composes Harvest documents; **52** does not run annual salience logic.
- [ ] No standalone `/v1/grammar/compose-*` in product router (dev preview excepted).

### Build-time lane

- [ ] New layout template requires: Zod schema, Scene component, catalog description, allowlist entry, few-shot example.
- [ ] Registry append-first — deprecated templates remain until prompts stop referencing.

---

## Build order

Per `19-code-package-structure.md` and `20-contracts-and-stage-delivery.md`:

1. **Tokens** → **primitives** → **document + layoutTemplate union** → **catalog** (`shared/grammar/`).
2. **Renderer vertical slice** — scan surface, one layout template, handful of nodes (`mobile/grammar/`).
3. **Producer** — validate, safety-filter, silence gate, mocked `present_moment` (`backend/src/core/generative-grammar/`).
4. **Contract spine** — `scan.contract.ts` + ts-rest mount + `BrioelaGenerativeUiRenderer` on scan screen.
5. **Tier 2** — background effect + entrance motion (can lag step 2–4).
6. **Artifact Layer** — `renderArtifactStatic` + **51** Discovery Card wire-up.
7. **Widen catalog** — Mesa, recipe, cooking stream, passport frame, Harvest chapter.
8. **Realtime** — cooking `brioela_generative_ui` stream events.

**Recommended first slice:** `scan_explanation_brioela_generative_ui` + `scan_explanation_focus_layout` + HTTP delivery on scan contract.

---

## Sources

- `build-guide/27-generative-grammar/` (`00`–`22`)
- `brioela-specs/42-brioela-generative-grammar.md`
- `_records/build-order/25-layer-generative-grammar.md`
- Neighbor `_features/47-passport/`, `51-viral-sharing/`, `53-harvest/`, `40-growth-mirror/`
