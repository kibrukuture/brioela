# Feature 52 — Generative Grammar — Draft index

Production snapshots for review. **None of these files exist in `backend/`, `shared/`, or `mobile/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `grammar.version.constant.gap.md` | `shared/grammar/version.ts` | G7 |
| `generative.surface.constant.gap.md` | `shared/grammar/schema/surfaces.ts` | G3 |
| `emotional.tone.constant.gap.md` | `shared/grammar/schema/tokens/emotional-tone.ts` | G8 |
| `background.effect.schema.gap.md` | `shared/grammar/schema/tokens/background-effect.ts` | G8, G20 |
| `entrance.motion.schema.gap.md` | `shared/grammar/schema/tokens/entrance-motion.ts` | G8, G21 |
| `brioela.generative.ui.document.schema.gap.md` | `shared/grammar/schema/brioela-generative-ui.ts` | G7 |
| `layout.template.union.schema.gap.md` | `shared/grammar/schema/compositions/index.ts` | G9 |
| `primitive.node.union.schema.gap.md` | `shared/grammar/schema/primitives/index.ts` | G10 |
| `grammar.catalog.allowlists.gap.md` | `shared/grammar/catalog/allowlists.ts` | G11 |
| `grammar.catalog.pairing.gap.md` | `shared/grammar/catalog/pairing.ts` | G11 |
| `grammar.catalog.registry.gap.md` | `shared/grammar/catalog/registry.ts` | G11 |
| `brioela.generative.ui.renderer.gap.md` | `mobile/grammar/brioela-generative-ui-renderer.tsx` | G2, G17 |
| `node.renderers.gap.md` | `mobile/grammar/node-renderers.ts` | G17 |
| `client.validate.grammar.gap.md` | `mobile/grammar/client-validate.ts` | G15 |
| `renderer.fallback.gap.md` | `mobile/grammar/fallback.ts` | G16 |
| `background.effect.field.gap.md` | `mobile/grammar/background-effect/background-effect-field.tsx` | G20 |
| `entrance.motion.presets.gap.md` | `mobile/grammar/motion/entrance-motion.ts` | G21 |
| `scan.explanation.focus.scene.gap.md` | `mobile/grammar/compositions/scan-explanation-focus-scene.tsx` | G18 |
| `compose.brioela.generative.ui.helper.gap.md` | `backend/src/core/generative-grammar/compose-brioela-generative-ui.ts` | G13 |
| `compose.brioela.generative.ui.for.contract.helper.gap.md` | `backend/src/core/generative-grammar/compose-brioela-generative-ui-for-contract.ts` | G25 |
| `decide.if.worth.enhancing.helper.gap.md` | `backend/src/core/generative-grammar/decide-if-worth-enhancing.ts` | G12 |
| `present.moment.helper.gap.md` | `backend/src/core/generative-grammar/present-moment.ts` | G13 |
| `validate.brioela.generative.ui.helper.gap.md` | `backend/src/core/generative-grammar/validate-brioela-generative-ui.ts` | G14 |
| `safety.filter.brioela.generative.ui.policy.gap.md` | `backend/src/core/generative-grammar/safety-filter.ts` | G14 |
| `build.catalog.schema.helper.gap.md` | `backend/src/core/generative-grammar/build-catalog-schema.ts` | G13 |
| `render.artifact.static.helper.gap.md` | `backend/src/core/generative-grammar/render-artifact-static.ts` | G22 |
| `discovery.card.artifact.layout.gap.md` | `shared/grammar/schema/compositions/share-discovery-stamp.ts` | G22, G28 |
| `passport.render.surface.gap.md` | `shared/grammar/schema/compositions/passport-instruction-frame.ts` | G6, G19 |
| `harvest.chapter.document.helper.gap.md` | `backend/src/core/generative-grammar/render-harvest-chapter-document.ts` | G23 |
| `contract.key.helper.gap.md` | `shared/contracts/contract-key.ts` | G26 |
| `scan.contract.gap.md` | `shared/contracts/scan.contract.ts` | G24 |
| `grammar.system.prompt.gap.md` | `backend/src/core/generative-grammar/prompts/grammar-system.ts` | G29 |

## Cross-feature drafts (do not duplicate in 52)

| Feature | Draft / owner |
|---|---|
| **51** | `build.discovery.card.grammar.document.helper.gap.md` — maps scrubbed card → document (**G5** naming reconcile) |
| **51** | `render.discovery.card.static.helper.gap.md` — calls **52** `renderArtifactStatic` |
| **47** | `passport.generative.surface.gap.md` — superseded by **52** `passport.render.surface.gap.md` (naming law) |
| **47** | `render.passport.static.helper.gap.md` — static fallback; grammar wrap calls **52** |
| **53** | Harvest compose stores `document_set_json` — **52** renders |
| **40** | `build.demonstrated.skill.summary.helper.gap.md` — feeds `recipe_card_*` context only |

## Critical boundary notes

- **Scrub before Artifact** — **51** never passes raw moments to **52** render.
- **Validate before Passport frame** — **47** instruction blocks are immutable inside grammar.
- **Harvest skips 400ms** — pre-composed stored documents (`36-harvest/03`).
- **No product grammar routes** — delivery via feature `brioelaGenerativeUi` field only (`20`).
- **Naming law wins** — `emotionalTone`, `layoutTemplate`, `content`, `backgroundEffect`, `entranceMotion`, `typographyStyle`.
