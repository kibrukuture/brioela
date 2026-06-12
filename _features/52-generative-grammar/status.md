# Status

open

**Generative grammar not shipped.** Build-guide **27-generative-grammar** is complete (22 numbered files + research). Zero `shared/grammar/`, `mobile/grammar/`, or `backend/src/core/generative-grammar/` production code. Cross-feature grammar consumer drafts exist in **47** (passport surface) and **51** (discovery card document builder) only.

# Shipped in backend (partial / unrelated)

- [x] `build-guide/27-generative-grammar/` (`00`–`22` + `research/`) — docs complete per sessions **034**, **036**
- [x] `brioela-specs/42-brioela-generative-grammar.md` — primary spec
- [x] `brioela-specs/39-generative-ui.md` — product intent spec
- [x] `build-guide/01-design-system/06-generative-ui.md` — registry/400ms foundation
- [x] `_records/connections/24-generative-grammar-connections.md` — ledger
- [x] `_records/build-order/25-layer-generative-grammar.md` — layer deps
- [x] `_records/session-log/034-generative-grammar-complete.md` — session log
- [x] `_records/session-log/036-generative-grammar-contract-delivery.md` — contract delivery log
- [x] `_features/47-passport/draft/passport.generative.surface.gap.md` — surface stub (owner **52**)
- [x] `_features/51-viral-sharing/draft/build.discovery.card.grammar.document.helper.gap.md` — **51** consumer stub
- [ ] `shared/grammar/` Zod schemas + catalog
- [ ] `mobile/grammar/` renderer + Artifact export
- [ ] `backend/src/core/generative-grammar/` producer
- [ ] `brioelaGenerativeUi` on feature contracts
- [ ] Scan vertical slice end-to-end
- [ ] Discovery Card Artifact Layer wired (**G28** with **51**)
- [ ] Passport frame renderer (**G19** with **47**)
- [ ] Harvest stored document render (**G23** with **53**)
- [ ] Grammar tests

# Blocked by

- 02-platform-design-system (tokens, motion, Skia base components)
- 01-platform-foundation (monorepo paths, ts-rest install)
- 20-brain-chat-runtime (AI client for `present_moment` — mockable for slice)
- 04-brain-foundation (producer runs in Brain context for agentic flows)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `shared/grammar/` package | `rg shared/grammar backend/src shared/ mobile/` — zero |
| G2 | No `mobile/grammar/` renderer | No `BrioelaGenerativeUiRenderer` in repo |
| G3 | **Extension `GenerativeSurface` values missing from `02` enum** | `passport_render_*`, `harvest_*`, `recipe_step_focus_*`, `illness_detective_*` in cross-refs only |
| G4 | `encore_first_cook` surface mapping undecided | May reuse `discovery_card_*` layout — spec **48** + **51** |
| G5 | **51** grammar helper uses legacy field names | `mood`, `discovery_card_render`, `layout.kind` vs naming law |
| G6 | **47** passport node list pre-rename | `hero_line` in `28-passport/07` — use `headline` |
| G7 | No `brioelaGenerativeUiSchema` Zod export | `19-code-package-structure.md` — not implemented |
| G8 | No token enums (`emotionalTone`, `backgroundEffect`, …) | `04`, `12` — not in `shared/` |
| G9 | No layout template discriminated union | `10`, `11` — compositions not coded |
| G10 | No primitive node union (3 layers) | `03`, `14` — not in `shared/grammar/` |
| G11 | No catalog `allowlists.ts` / `pairing.ts` | Per-surface + emotional pairing — docs only |
| G12 | No `decideIfWorthEnhancing` silence gate | `13` — product law not enforced in code |
| G13 | No `present_moment` / `composeBrioelaGenerativeUi` | Backend producer missing |
| G14 | No server `validate` + `safety-filter` | `15` defense-in-depth server path missing |
| G15 | No client re-validation | `mobile/grammar/client-validate.ts` missing |
| G16 | No 400ms enhancement timer in renderer | `05` rule untested |
| G17 | No `NODE_RENDERERS` map | `05` recursive render not started |
| G18 | No layout template Scene components | Composition catalog art-directed scenes — zero `.tsx` |
| G19 | No `passport_render_brioela_generative_ui` Scene | **47** G19 — frame renderer unwired |
| G20 | No Tier-2 Skia background effect system | `16` — shaders not in repo |
| G21 | No entrance motion presets (Reanimated 4) | `17` — choreography layer missing |
| G22 | No `renderArtifactStatic` (Artifact Layer) | Discovery Card / Passport / Harvest PNG export |
| G23 | Harvest pre-composed document render unwired | **53** step 6 — `document_set_json` consumer missing |
| G24 | No `brioelaGenerativeUi` on scan contract | `20`/`22` vertical slice — `scan.contract.ts` missing |
| G25 | No `composeBrioelaGenerativeUiForContract` | `21` policy enforcement — not implemented |
| G26 | No `contractKey()` helper | `21`/`22` — manual query keys still pattern in legacy code |
| G27 | No ts-rest `@ts-rest/react-query` mobile setup | `mobile/network/tsr.ts` missing |
| G28 | **51** Artifact render depends on **52** G22 | `51` status G28 — static template fallback OK for v1 |
| G29 | No few-shot prompt library | `prompts/fewshot/` — gold documents not written |
| G30 | No internal grammar preview route (dev) | Allowed exception in `20` — not built |
| G31 | Design-system `06` registry path obsolete | `src/generative-ui/registry.ts` — superseded by `19` layout |
| G32 | Connections ledger `24` incomplete file list | Omits `09`–`17`; use `00-overview.md` as index |
| G33 | Build-order ledger `25` minimal | Missing **02**, **20**, consumer features |
| G34 | Tier 3 WebView mini-app deferred | `18` not written — intentional |
| G35 | No grammar tests | `rg brioelaGenerativeUi *.test.ts` — zero |
| G36 | **40** demonstrated-skill → recipe surface unwired | `04-recipe-confidence-touch.md` — context injection only in docs |
| G37 | Cooking stream `brioela_generative_ui` event type | `20` schema example — not in cooking contract |
| G38 | PWA/web renderer parity | `07` — same schema, web Scene components not started |
| G39 | Build-time creation lane process only | `08` — no registry promotion tooling |
| G40 | `01-design-system/06` says "implementation not determined" | Superseded by `27-generative-grammar/` — update **02** feature when coding starts |

# 52 vs neighbor boundaries

| In **52** (this feature) | In separate feature |
|---|---|
| `BrioelaGenerativeUiDocument` schema + catalog | Scan verdict body (**24**) |
| Native renderer + Artifact PNG export | Discovery Card scrub (**51**) |
| `passport_render_*` frame Scene | Passport instruction blocks (**47**) |
| Harvest document render from stored JSON | Harvest compose/salience (**53**) |
| `decideIfWorthEnhancing` + `present_moment` | Brain chat transport (**20**) |
| Contract `brioela_generative_ui` policy | Feature business handlers |
| Design tokens consumption | Token definitions (**02**) |
| Recipe card layout selection | Demonstrated-skill extraction (**40**) |
| `buildDiscoveryCardGrammarDocument` schema target | Card payload build (**51**) |

# Sources

- `brioela-specs/42-brioela-generative-grammar.md`
- `build-guide/27-generative-grammar/`
- `_records/connections/24-generative-grammar-connections.md`
- `_records/build-order/25-layer-generative-grammar.md`
- Neighbor `_features/40-growth-mirror/`, `47-passport/`, `51-viral-sharing/`, `53-harvest/`
