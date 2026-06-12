# Heirloom — Build

Feature **49**. Production paths under `backend/src/agents/brain/_schemas/heritage.*.ts`, `cook.style.*.ts`, `heirloom.*.ts`, `backend/src/agents/brain/_handlers/heirloom/`, `backend/src/agents/brain/_handlers/heritage/`, `backend/src/agents/brain/_helpers/heirloom/`, `backend/src/agents/brain/_helpers/heritage/`, `backend/src/agents/brain/_helpers/cook.style/`, `backend/src/agents/brain/tools/heirloom/`, `backend/src/api/heirlooms/`, `backend/src/api/heirloom-broker/`, `shared/validator/heirloom/`, `shared/validator/heritage/`, `shared/validator/cook.style/`, `shared/constants/heirloom/`, `shared/routes/heirloom.routes.ts`, `shared/contracts/heirloom.contract.ts`, Supabase migrations for `heirloom_invitation` / `heirloom_succession`, and `mobile/features/heirloom/`.

**Scope:** Three layers — (1) generational capture tables + session-end reconstruction + finalize path; (2) style profile extraction workflow + adaptation helpers; (3) Heirloom bundle assembly, Supabase invitation/succession routing, DO-to-DO broker delivery, R2 photo copy, push-forward deltas, succession on deletion, mobile assembly/landing/recipient surfaces, `heirloom_send` + `generational_recipe_capture` tier gates (**43**), inheritance-entry onboarding hook (**03**). **Not in 49 build:** MiraSession DO body (**29**); Encore reconstruction (**48**); share import pipeline (**25**); Discovery Card renderer (**51**); Food Time Machine moment queue (**38**); Harvest composition (**53**); account deletion UI shell beyond succession hook (**03**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/35-heirloom/` (5 files) | ✓ docs only |
| `brioela-specs/48-heirloom.md`, `13-*`, `32-*` | ✓ specs |
| `_records/connections/31-heirloom-connections.md` | ✓ ledger |
| `_records/build-order/32-layer-heirloom.md` | ✓ ledger |
| `recipeOriginValues` includes `family_capture` | ✓ enum only — no writer |
| `recipes` + `normalizedRecipeContentSchema` (**08**) | ✓ target write surface |
| `heirloom_send` / `generational_recipe_capture` in **43** draft | ✓ draft matrix only |
| Heritage / style / Heirloom Brain tables | ✗ |
| Heirloom API + broker | ✗ |
| Supabase invitation/succession tables | ✗ |
| `mobile/features/heirloom/` | ✗ |
| Heirloom tests | ✗ |

**Zero Heirloom production code.** `rg 'heirloom|heritage_recipe|cook_style' backend/src shared/ mobile/` — no product matches.

---

## File manifest

### Shared constants (**49**)

| File | Role |
|---|---|
| `shared/constants/heirloom/heirloom.role.constant.ts` | `owner` \| `keeper` \| `recipient` |
| `shared/constants/heirloom/heirloom.item.type.constant.ts` | `recipe` \| `style_profile` \| `moment` |
| `shared/constants/heirloom/heirloom.invitation.status.constant.ts` | `sent` \| `accepted` \| `declined` \| `expired` |
| `shared/constants/heirloom/heritage.capture.status.constant.ts` | Capture lifecycle |
| `shared/constants/heirloom/cook.style.attribute.type.constant.ts` | seasoning/technique/substitution/finishing |
| `shared/constants/heirloom/index.ts` | Barrel |

### Shared validators (**49**)

| File | Role |
|---|---|
| `shared/validator/heritage/heritage.capture.schema.ts` | Capture + draft shapes |
| `shared/validator/cook.style/cook.style.profile.schema.ts` | Profile + attributes |
| `shared/validator/cook.style/recipe.style.variant.schema.ts` | Adaptation output |
| `shared/validator/heirloom/heirloom.schema.ts` | Bundle + cover |
| `shared/validator/heirloom/heirloom.assemble.schema.ts` | POST assemble body |
| `shared/validator/heirloom/heirloom.invite.schema.ts` | Invitation create |
| `shared/validator/heirloom/heirloom.accept.schema.ts` | Accept payload |
| `shared/validator/heirloom/heirloom.push.schema.ts` | Push-forward delta |
| `shared/validator/heirloom/heirloom.transfer.payload.schema.ts` | DO-to-DO broker payload |
| `shared/validator/heirloom/index.ts` | Barrel |
| `shared/routes/heirloom.routes.ts` | `HEIRLOOM_ROUTES` |
| `shared/contracts/heirloom.contract.ts` | ts-rest assemble / invite / accept / push / successor |

### Brain SQLite schemas — capture (**49** / spec **13**)

| File | Role |
|---|---|
| `_schemas/heritage.recipe.capture.schema.ts` | `heritage_recipe_capture` |
| `_schemas/heritage.recipe.draft.schema.ts` | `heritage_recipe_draft` |
| `_schemas/recipe.origin.schema.ts` | Confirm `family_capture` writer path (**G35**) |
| `_schemas/index.ts` | Export + migration registration (**04**) |

### Brain SQLite schemas — style (**49** / spec **32**)

| File | Role |
|---|---|
| `_schemas/cook.style.profile.schema.ts` | `cook_style_profile` |
| `_schemas/cook.style.attribute.schema.ts` | `cook_style_attribute` |
| `_schemas/recipe.style.variant.schema.ts` | `recipe_style_variant` |

### Brain SQLite schemas — delivery (**49** / spec **48**)

| File | Role |
|---|---|
| `_schemas/heirloom.schema.ts` | `heirloom` header |
| `_schemas/heirloom.item.schema.ts` | `heirloom_item` |

### Supabase Postgres (**49** routing only)

| File | Role |
|---|---|
| `supabase/migrations/*_heirloom_invitation.sql` | `heirloom_invitation` |
| `supabase/migrations/*_heirloom_succession.sql` | `heirloom_succession` |

### Brain helpers — capture (**49**)

| File | Role |
|---|---|
| `_helpers/heritage/reconstruct.heritage.recipe.helper.ts` | Session-end LLM + vision reconstruction |
| `_helpers/heritage/finalize.heritage.recipe.helper.ts` | Draft → `recipes` insert (`origin=family_capture`) |
| `_helpers/heritage/mark.heritage.uncertainty.helper.ts` | Confidence fields per spec **02** |
| `_helpers/heritage/index.ts` | Barrel |

### Brain helpers — style (**49**)

| File | Role |
|---|---|
| `_helpers/cook.style/extract.cook.style.profile.helper.ts` | Post-session transcript analysis |
| `_helpers/cook.style/adapt.recipe.to.style.helper.ts` | "Cook in [name]'s style" structured call |
| `_helpers/cook.style/merge.style.profile.correction.helper.ts` | User edits to summary |
| `_helpers/cook.style/inject.style.into.session.helper.ts` | Real-time profile for **29** |
| `_helpers/cook.style/index.ts` | Barrel |

### Brain helpers — delivery (**49**)

| File | Role |
|---|---|
| `_helpers/heirloom/assemble.heirloom.helper.ts` | Owner curation → rows |
| `_helpers/heirloom/build.heirloom.payload.helper.ts` | Versioned transfer payload |
| `_helpers/heirloom/ingest.heirloom.recipient.helper.ts` | Recipient Brain write paths |
| `_helpers/heirloom/copy.heirloom.photos.helper.ts` | R2 copy + ref rewrite |
| `_helpers/heirloom/push.heirloom.delta.helper.ts` | Version N+1 delta assembly |
| `_helpers/heirloom/promote.heirloom.keeper.helper.ts` | Succession role transition |
| `_helpers/heirloom/index.ts` | Barrel |

### Brain handlers (**49**)

| File | Role |
|---|---|
| `_handlers/heritage/start.heritage.capture.handler.ts` | Open capture row at heritage session start |
| `_handlers/heritage/finalize.heritage.capture.handler.ts` | Post-session draft + enqueue style job |
| `_handlers/cook.style/get.cook.style.profile.handler.ts` | Read profile for UI / adaptation |
| `_handlers/cook.style/adapt.recipe.style.handler.ts` | Create `recipe_style_variant` |
| `_handlers/heirloom/create.heirloom.handler.ts` | `POST /api/heirlooms` |
| `_handlers/heirloom/invite.heirloom.handler.ts` | Create invitation + link/QR |
| `_handlers/heirloom/accept.heirloom.invitation.handler.ts` | Trigger delivery workflow |
| `_handlers/heirloom/push.heirloom.item.handler.ts` | Push-forward |
| `_handlers/heirloom/designate.heirloom.successor.handler.ts` | Succession row |
| `_handlers/heirloom/index.ts` | Barrel |

### Upstash Workflows (**49**)

| File | Role |
|---|---|
| `backend/src/api/heirlooms/jobs/heirloom.delivery.workflow.ts` | DO-to-DO copy + R2 photos |
| `backend/src/api/heirlooms/jobs/cook.style.extraction.workflow.ts` | Post-session style job |

### DO-to-DO broker (**49**)

| File | Role |
|---|---|
| `backend/src/api/heirloom-broker/heirloom.broker.route.ts` | Transient relay Worker route |
| `backend/src/api/heirloom-broker/heirloom.broker.controller.ts` | Owner DO → recipient DO |

### Brain tools — `tools/heirloom/` (**49**)

| File | Role |
|---|---|
| `tools/heirloom/assemble.heirloom.tool.ts` | Voice-first curation |
| `tools/heirloom/index.ts` | Barrel → **19** registry |

### Backend API (**49**)

| File | Role |
|---|---|
| `backend/src/api/heirlooms/heirlooms.route.ts` | Hono mount `/api/heirlooms` |
| `backend/src/api/heirlooms/heirlooms.controller.ts` | Wiring |
| `backend/src/api/heirlooms/_handlers/post.heirloom.handler.ts` | Assemble |
| `backend/src/api/heirlooms/_handlers/post.heirloom.invitation.handler.ts` | Invite |
| `backend/src/api/heirlooms/_handlers/post.heirloom.accept.handler.ts` | Accept |
| `backend/src/api/heirlooms/_handlers/post.heirloom.push.handler.ts` | Push |
| `backend/src/api/heirlooms/_handlers/post.heirloom.successor.handler.ts` | Successor |
| `backend/src/api/heirlooms/index.ts` | Module export |

Register in backend app router (**01**).

### Mobile (**49**)

| File | Role |
|---|---|
| `mobile/features/heirloom/screens/heirloom.assembly.screen.tsx` | Voice-first curation + preview |
| `mobile/features/heirloom/screens/heirloom.invitation.landing.screen.tsx` | Non-user landing (cover only) |
| `mobile/features/heirloom/screens/heirloom.recipient.view.screen.tsx` | "[Name]'s Heirloom" |
| `mobile/features/heirloom/components/heirloom.dedication.sheet.tsx` | Consent reminder before send |
| `mobile/features/heirloom/components/heirloom.item.preview.list.tsx` | Item-by-item preview |
| `mobile/features/heirloom/components/heirloom.push.accept.sheet.tsx` | Delta accept prompt |
| `mobile/features/heirloom/components/cook.style.profile.card.tsx` | Style summary display/edit |
| `mobile/features/heirloom/components/cook.in.style.cta.tsx` | Recipe adaptation entry |
| `mobile/features/heirloom/hooks/use.heirloom.assembly.hook.ts` | Assembly state |
| `mobile/features/heirloom/hooks/use.heirloom.invitation.hook.ts` | Invite + accept |
| `mobile/network/heirloom/heirloom.api.ts` | API client |
| Recipe library: Heirloom section | Tab or filter |
| Onboarding: inheritance-entry deep link | **03** integration |

### Integration entry surfaces

| Surface | Owner | Entry |
|---|---|---|
| Heritage mode in cooking session | **29** + **49** | Session flag → capture tables |
| Session-end reconstruction | **29** | Calls `reconstruct.heritage.recipe` when heritage |
| Post-session style extraction | **49** | Upstash job on transcript |
| "Cook in [name]'s style" on recipe | **49** | `adapt.recipe.to.style` |
| Account deletion succession offer | **03** | Reads `heirloom_succession` |
| `generational_recipe_capture` gate | **43** | Before heritage session start |
| `heirloom_send` gate | **43** | Before assemble/invite |
| Recipe Preservation Discovery Card | **51** | Trigger on capture finalize — not send |
| Food Time Machine generational moment | **38** | Read `family_capture` + cook history |
| Harvest heritage chapter | **53** | Audience-level Heirloom refs |

### Tests (**49**)

| File | Role |
|---|---|
| `reconstruct.heritage.recipe.helper.test.ts` | Uncertainty marking |
| `extract.cook.style.profile.helper.test.ts` | Attribute extraction shape |
| `assemble.heirloom.helper.test.ts` | Nothing included by default |
| `ingest.heirloom.recipient.helper.test.ts` | Independent copy semantics |
| `copy.heirloom.photos.helper.test.ts` | Ref rewrite |
| `heirloom.delivery.workflow.test.ts` | Idempotent accept; no partial state |
| `push.heirloom.delta.helper.test.ts` | Version increment |
| Tier gate tests | Receive free; send blocked below Culina |

---

## Acceptance criteria

### Capture (spec **13**)

- [ ] `heritage_recipe_capture` + `heritage_recipe_draft` tables migrate (**04**).
- [ ] Heritage session sets capture mode; consent obtained at session start.
- [ ] Session-end uses shared **29** reconstruction path with uncertainty markers.
- [ ] Finalize writes `recipes` with `origin=family_capture`.
- [ ] `generational_recipe_capture` gated at Culina (**43**).

### Style (spec **32**)

- [ ] `cook_style_profile`, `cook_style_attribute`, `recipe_style_variant` tables migrate.
- [ ] Post-session extraction workflow runs async — does not block session end.
- [ ] Human-language summary editable; corrections update attributes.
- [ ] "Cook in [name]'s style" returns attributed variant in <3s.
- [ ] Deletion flow shows 30-day grace warning for style profiles.

### Delivery (spec **48**)

- [ ] `heirloom` + `heirloom_item` in owner and recipient DOs.
- [ ] Supabase `heirloom_invitation` + `heirloom_succession` — routing metadata only.
- [ ] Assembly: explicit curation; preview matches payload; no bulk add-all.
- [ ] Invitation: 30-day expiry; hashed contact; landing has cover only.
- [ ] Accept triggers DO-to-DO workflow; broker holds payload transiently only.
- [ ] Photos copied to recipient R2; refs rewritten.
- [ ] Push-forward: delta only; explicit accept; append-only versions.
- [ ] Succession: keeper promotion on designated owner deletion.
- [ ] Undesignated deletion: delivered copies persist; no auto-transfer.
- [ ] `heirloom_send` Culina+; receive never tier-gated.

### Onboarding + acquisition

- [ ] Non-user accept → sign-in → Heirloom opens first.
- [ ] Inheritance-entry users tagged for retention metrics.

### Privacy + boundaries

- [ ] No scan history, memory, health, or personality in bundle.
- [ ] No voice cloning or session audio in transfer.
- [ ] Heirloom send ≠ Discovery Card publish (**51**).
- [ ] Encore recipes excluded until **G34** resolved (**48** G33).

### Tests

- [ ] Copy model: recipient delete does not affect owner.
- [ ] Double-accept idempotent.
- [ ] Tier: Sapor can accept; cannot assemble without Culina.

---

## Build order dependencies

1. **04-brain-foundation** — all heritage/style/heirloom table migrations.
2. **08-brain-recipe-tools** — `writeUserRecipe`, `NormalizedRecipeContent`, `family_capture` origin writer.
3. **29-cooking-session** — heritage session mode + session-end hook.
4. **03-platform-auth-onboarding** — inheritance-entry landing + deletion succession UI.
5. **01-platform-foundation** — API modules, R2, Worker broker, Supabase client.
6. **43-pricing-tiers** — `generational_recipe_capture`, `heirloom_send`.
7. **19-brain-tool-registry** — `tools/heirloom/*`.
8. **21-platform-notifications** — delivery complete + push-forward prompts.

**Soft depends:** **12** multi-person rooms (heritage capture scenario); **38** Time Machine read path; **39** acoustic cues from capture; **51** preservation card trigger; **53** Harvest heritage chapter; **48** Encore boundary (**G34**).

**Blocks:** Family inheritance loop; inheritance-entry acquisition channel; "cook in her style" for recipients; Harvest heritage chapters.

---

## Draft count

**40** files in `draft/` — 39 gap/intended snapshots + `gap-index.md`.
