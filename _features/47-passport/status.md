# Status

open

**Passport not shipped.** Build-guide **28-passport** is complete (docs only). Zero Passport Brain tables, zero block builders, zero privacy minimization helpers, zero preview/confirm handlers, zero public QR link route, zero mobile Passport surfaces. Partial: design-system Passport UX guidance (**02**); grammar contract references `passport.contract.ts` (**52** unwired); **21** lists `passport_prompt` notification kind (conflicts with generation-flow block rule).

# Shipped in backend (partial / unrelated)

- [x] `build-guide/28-passport/` (8 files) — docs complete per session 035
- [x] `brioela-specs/43-passport.md` — spec marked complete in inventory
- [x] `build-guide/01-design-system/13-evidence-first-ui.md` — Passport boarding-pass UX pattern
- [x] `build-guide/27-generative-grammar/21-contract-spine-hardening.md` — `passport.contract.ts` placeholder in manifest
- [ ] `passport` / `passport_instruction_block` / `passport_audit_event` tables
- [ ] `shared/validator/passport/` + `shared/constants/passport/`
- [ ] `_helpers/passport/` block builders + privacy + medical boundary
- [ ] `_handlers/passport/` preview/create/revoke/render
- [ ] `tools/passport/` AI tools
- [ ] `/api/passport/*` + public link handler
- [ ] `mobile/features/passport/`
- [ ] Menu / Bela / Mesa / travel / practitioner integration CTAs
- [ ] Passport tests
- [ ] Tier gate (**43** — spec silent)
- [ ] "What Brioela knows about me" inventory UI (neighbor refs — primary definition in spec **34**)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No Passport Brain schemas | `rg passport backend/src/agents/brain/_schemas` — zero |
| G2 | No `shared/validator/passport/` | `rg passport shared/validator` — zero |
| G3 | No `shared/constants/passport/` | Kind/share/consent enums missing |
| G4 | No `_helpers/passport/` directory | Block builders not started |
| G5 | No `build.passport.blocks` orchestrator | `03-generation-flow.md` — not built |
| G6 | No `minimize.passport.privacy` helper | `04-privacy-and-consent.md` — not built |
| G7 | No `check.passport.medical.boundary` helper | `04` blocked language list — not enforced |
| G8 | No `build.passport.mesa.blocks` | **41** G24 mirror — Mesa audience unwired |
| G9 | No `build.passport.menu.blocks` | **26** waiter Q handoff unwired |
| G10 | No `build.passport.bela.blocks` | **42** G40 — Bela hook blocked |
| G11 | No `build.passport.travel.blocks` | **35** language hints — no travel tables |
| G12 | No `build.passport.practitioner.blocks` | **46** annotation path unshipped |
| G13 | No `build.passport.caregiver.blocks` | **44** child scrub policy — no code |
| G14 | No preview-before-share handler | `03` preview required — missing |
| G15 | No create/revoke handlers | `02` revocation rules — not implemented |
| G16 | No expiration helper per kind | Same-day menu/Mesa defaults — not coded |
| G17 | No `translate.passport.blocks` | `05-translation-and-display.md` — missing |
| G18 | No static renderer | `07` fallback requirement — missing |
| G19 | No generative surface wiring | **52** `passport_render_brioela_generative_ui` — unwired |
| G20 | No image/PDF artifact handler | `05`, `07` share modes — missing |
| G21 | No public QR/link route | `04` link privacy — no edge handler |
| G22 | No `tools/passport/` | **19** registry — zero |
| G23 | No `passport.contract.ts` | `27-generative-grammar/21` — manifest only |
| G24 | No `backend/src/api/passport/` | API module missing |
| G25 | No mobile `features/passport/` | `rg passport mobile/features` — zero |
| G26 | No menu scan "Create Passport" CTA | **26** integration — unwired |
| G27 | No Bela shopper Passport entry | **42** integration — unwired |
| G28 | **`passport_prompt` vs generation-flow conflict** | **21** spec lists medium push; `03-generation-flow.md` blocks "push notification asking user to make a Passport" |
| G29 | **No tier placement in spec** | `rg passport build-guide/25-pricing-tiers` — zero; spec **43** silent |
| G30 | **Image/PDF storage unspecified** | Spec/build-guide say render artifact; no R2 vs ephemeral vs client-only decision |
| G31 | No Passport tests | `rg passport *.test.ts` — zero |
| G32 | Session 035 "complete" = docs only | No production implementation followed |
| G33 | No implementable-specs Passport entries | `rg passport implementable-specs` — zero |
| G34 | `passport.link.token` schema undecided | Token inline on `passport` vs separate table — not specified |
| G35 | **"What Brioela knows" ownership split** | Spec **34** defines settings screen; **36**, **37**, **38** cite **47**; `build-guide/28-passport/` does not define inventory UI |
| G36 | Mesa export/delete category | `26-mesa/09` + **41** G29 — Passport export handler missing |
| G37 | Offline travel Passport cache | `06-feature-integration.md` Travel — no mobile cache spec |
| G38 | Audit event `viewed`/`shared` instrumentation | `passport_audit_event` — no analytics wiring |

# 47 vs neighbor boundaries

| In **47** (this feature) | In separate feature |
|---|---|
| Passport tables + block builders | Personal `constraints` — **07** |
| Privacy minimization + medical boundary | Condition detection/rules — **23** |
| `restaurant_menu` block source adapter | Menu scan pipeline — **26** |
| `mesa_table` block source adapter | Mesa tables + compatibility — **41** |
| `bela_shopper` block source adapter | Bela order FSM — **42** |
| Travel translation + offline snapshot | Travel intent + preload + cache write — **35** |
| — (no map data in Passport) | Map travel cache display — **28** |
| `practitioner_guidance` blocks | Practitioner relationship APIs — **46** |
| Child-name scrub on caregiver kind | Kids explanations — **44** |
| Static/grammar render + share modes | Grammar engine — **52** |
| Explicit handoff artifact | Discovery Cards — **51** |
| — | Dish recreation — **48** Encore |
| `passport_prompt` policy resolution | Push transport — **21** |
| Tier gate (if product adds) | Tier matrix — **43** |

# Blocked by

- 04-brain-foundation (Passport table migrations)
- 07-brain-constraint-tools (constraint read for personal blocks)
- 19-brain-tool-registry (passport tools)
- 23-medical-conditions (food-rule sources — partial OK with stub)
- 26-menu-scanning (`restaurant_menu` source)
- 41-mesa (`mesa_table` source)
- 42-bela (`bela_shopper` source)
- 35-ambient-intelligence (travel language hints — soft)
- 46-verified-profiles (practitioner notes — soft)
- 52-generative-grammar (presentation — soft; static ships first)

# Soft blocked by

- 44-kids-mode (caregiver scrub policy)
- 21-platform-notifications (`passport_prompt` decision)
- 43-pricing-tiers (if tier gate added)

# Sources

- `brioela-specs/43-passport.md`
- `build-guide/28-passport/00-overview.md` through `07-rendering-with-grammar.md`
- `build-guide/17-menu-scanning/08-language-bridge.md`
- `build-guide/26-mesa/09-privacy-permissions.md`
- `build-guide/01-design-system/13-evidence-first-ui.md`
- `build-guide/27-generative-grammar/21-contract-spine-hardening.md`, `22-ts-rest-full-stack-standard.md`
- `brioela-specs/22-pre-trip-food-intelligence.md`
- `brioela-specs/34-universal-visual-intake.md`
- `brioela-specs/44-encore.md`
- `_records/connections/25-passport-connections.md`
- `_records/build-order/26-layer-passport.md`
- `_records/session-log/035-passport-complete.md`
- `_features/21-platform-notifications/spec.md`
- `_features/35-ambient-intelligence/spec.md`, `status.md`
- `_features/41-mesa/spec.md`, `build.md`, `status.md`
- `_features/28-map/spec.md`
- `_features/42-bela/spec.md`
- `_features/46-verified-profiles/spec.md`
- `_features/48-encore/status.md`
- `_features/51-viral-sharing/status.md`
