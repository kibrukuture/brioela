# Status

open

**Heirloom not shipped.** Build-guide **35-heirloom** is complete (5 files, docs only). Zero heritage capture tables, zero style profile tables, zero Heirloom bundle tables, zero Supabase invitation/succession tables, zero DO-to-DO broker, zero API routes, zero mobile Heirloom surfaces, zero tests. Partial: `recipes` table + `normalizedRecipeContentSchema` (**08**); `recipeOriginValues` includes `family_capture` but no capture writer; `heirloom_send` / `generational_recipe_capture` `FeatureAction` drafts in **43** only.

# Shipped in backend (partial / unrelated)

- [x] `build-guide/35-heirloom/` (5 files) — docs complete per session **038** (folder renamed from `35-food-inheritance/`)
- [x] `brioela-specs/48-heirloom.md` — delivery spec (spec number **48**, feature folder **49**)
- [x] `brioela-specs/13-generational-recipe-capture.md` — capture spec
- [x] `brioela-specs/32-grandma-style-flavor-profile.md` — style spec
- [x] `_records/connections/31-heirloom-connections.md` — ledger
- [x] `_records/build-order/32-layer-heirloom.md` — layer deps
- [x] `recipeOriginValues` includes `family_capture` (**08**) — no heritage writer
- [x] `recipes` Drizzle schema + `normalizedRecipeContentSchema` — target write surface
- [ ] `heritage_recipe_capture` / `heritage_recipe_draft` tables
- [ ] `cook_style_profile` / `cook_style_attribute` / `recipe_style_variant` tables
- [ ] `heirloom` / `heirloom_item` tables
- [ ] Supabase `heirloom_invitation` / `heirloom_succession`
- [ ] `shared/validator/heirloom/` + `shared/constants/heirloom/`
- [ ] `_helpers/heritage/` + `_helpers/cook.style/` + `_helpers/heirloom/`
- [ ] `_handlers/heritage/` + `_handlers/cook.style/` + `_handlers/heirloom/`
- [ ] `tools/heirloom/`
- [ ] `/api/heirlooms/*` + heirloom broker route
- [ ] `mobile/features/heirloom/`
- [ ] `generational_recipe_capture` tier gate wired (**43**)
- [ ] `heirloom_send` tier gate wired (**43**)
- [ ] Inheritance-entry onboarding (**03**)
- [ ] Style profile 30-day deletion grace (**32**)
- [ ] Heirloom tests

# Blocked by

- 04-brain-foundation (heritage/style/heirloom migrations)
- 08-brain-recipe-tools (`family_capture` writer, `writeUserRecipe`)
- 29-cooking-session (heritage session mode, session-end reconstruction hook)
- 03-platform-auth-onboarding (inheritance-entry landing, deletion succession)
- 01-platform-foundation (R2 photo copy, Worker broker, Supabase)
- 43-pricing-tiers (`generational_recipe_capture`, `heirloom_send`)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `heritage_recipe_capture` Brain schema | `rg heritage backend/src/agents/brain/_schemas` — zero |
| G2 | No `heritage_recipe_draft` Brain schema | spec **13** — not started |
| G3 | No `reconstruct.heritage.recipe` helper | `29` spec §10 — shared path not built |
| G4 | No `finalize.heritage.recipe` handler | Draft → library path missing |
| G5 | No heritage capture consent UI | `01-heirloom-assembly.md` — session consent |
| G6 | `generational_recipe_capture` tier gate unwired | **43** draft matrix only |
| G7 | No `cook_style_profile` schema | spec **32** — zero code |
| G8 | No `cook_style_attribute` schema | spec **32** — zero code |
| G9 | No `recipe_style_variant` schema | spec **32** — zero code |
| G10 | No style extraction workflow | Post-session async job — missing |
| G11 | No `adapt.recipe.to.style` helper | "Cook in [name]'s style" — missing |
| G12 | No style profile 30-day deletion grace | spec **32** warning — unwired |
| G13 | No real-time style inject for Mira | `inject.style.into.session` — missing |
| G14 | No `heirloom` Brain schema | spec **48** — zero code |
| G15 | No `heirloom_item` Brain schema | spec **48** — zero code |
| G16 | No Supabase `heirloom_invitation` table | Routing metadata — missing |
| G17 | No Supabase `heirloom_succession` table | Succession — missing |
| G18 | No `assemble.heirloom` helper | Curation → rows — missing |
| G19 | No DO-to-DO broker route | `03-do-to-do-delivery.md` — missing |
| G20 | No `ingest.heirloom.recipient` helper | Recipient write paths — missing |
| G21 | No R2 photo copy at acceptance | spec **48** — recipients must not depend on owner objects |
| G22 | No invitation link/QR flow | `02-invitation-flow.md` — missing |
| G23 | No inheritance-entry onboarding landing | spec **21** — first experience = Heirloom |
| G24 | No push-forward delta flow | Version N+1 accept prompt — missing |
| G25 | No succession designation handler | `04-succession.md` — missing |
| G26 | `heirloom_send` tier gate unwired | **43** draft only |
| G27 | Receive-free path not implemented | Policy in spec **48** — no accept gate code |
| G28 | Zero Heirloom production code | `rg heirloom backend/src shared/ mobile/` — zero |
| G29 | No `shared/validator/heirloom/` | Validator spine missing |
| G30 | No `shared/constants/heirloom/` | Role/item/status enums missing |
| G31 | No `/api/heirlooms/*` routes | API surface in spec **48** — missing |
| G32 | No `mobile/features/heirloom/` | `rg heirloom mobile/` — zero |
| G33 | No `assemble_heirloom` Brain tool | spec **48** namespace — missing |
| G34 | **Encore recipes not in Heirloom assembly scope** | spec **48** lists `heritage_recipe_capture` only — **48** G33 |
| G35 | **`family_capture` vs `generational` naming conflict** | Shipped `recipe.origin.schema.ts` vs spec **38** `recipe.source='generational'` |
| G36 | No Heirloom tests | `rg heirloom *.test.ts` — zero |
| G37 | Recipe Preservation Discovery Card unwired | **51** trigger on capture — not Heirloom send |
| G38 | Food Time Machine generational moments unwired | spec **38** — read path missing |
| G39 | Harvest heritage chapter unwired | **53** — audience-level refs |
| G40 | Session **038** "Food Inheritance" vs **Heirloom** rename | Ledger row 48; `35-heirloom/` current — cosmetic |
| G41 | **`Heirloom_edition` vs `heirloom_invitation` naming** | Spec **48** prose vs implementable table names |
| G42 | Multi-person copy precedent unwired | spec **12** each-participant copy — delivery model depends on **29** rooms |

# 49 vs neighbor boundaries

| In **49** (this feature) | In separate feature |
|---|---|
| Heritage capture tables + finalize | MiraSession DO runtime (**29**) |
| Style profile extraction + adaptation | Growth mirror skill trajectories (**40**) |
| Heirloom bundle assembly + DO-to-DO delivery | Encore reconstruction (**48**) |
| Invitation + succession routing | Auth/onboarding shell (**03**) |
| `heirloom_send` / `generational_recipe_capture` gates | Tier matrix implementation (**43**) |
| Recipe Preservation card *trigger* on capture | Discovery Card renderer + scrub (**51**) |
| Heritage recipes in recipient library | Share import pipeline (**25**) |
| Copy-on-accept family infrastructure | Viral sharing loops (**51**) |

# Sources

- `brioela-specs/48-heirloom.md`
- `brioela-specs/13-generational-recipe-capture.md`
- `brioela-specs/32-grandma-style-flavor-profile.md`
- `build-guide/35-heirloom/`
- `_records/connections/31-heirloom-connections.md`
- `_records/build-order/32-layer-heirloom.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_features/29-cooking-session/spec.md`
- `_features/43-pricing-tiers/spec.md`
- `_features/48-encore/status.md` (G33)
