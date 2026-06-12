# Feature 49 — Heirloom — Draft index

Production snapshots for review. **None of these files exist in `backend/`, `shared/`, or `mobile/` yet** (except `recipe.origin.schema.ts` exists with `family_capture` but no heritage writer).

| Draft file | Target production path | Gap ID |
|---|---|---|
| `heritage.recipe.capture.schema.gap.md` | `backend/src/agents/brain/_schemas/heritage.recipe.capture.schema.ts` | G1 |
| `heritage.recipe.draft.schema.gap.md` | `backend/src/agents/brain/_schemas/heritage.recipe.draft.schema.ts` | G2 |
| `cook.style.profile.schema.gap.md` | `backend/src/agents/brain/_schemas/cook.style.profile.schema.ts` | G7 |
| `cook.style.attribute.schema.gap.md` | `backend/src/agents/brain/_schemas/cook.style.attribute.schema.ts` | G8 |
| `recipe.style.variant.schema.gap.md` | `backend/src/agents/brain/_schemas/recipe.style.variant.schema.ts` | G9 |
| `heirloom.schema.gap.md` | `backend/src/agents/brain/_schemas/heirloom.schema.ts` | G14 |
| `heirloom.item.schema.gap.md` | `backend/src/agents/brain/_schemas/heirloom.item.schema.ts` | G15 |
| `heirloom.role.constant.gap.md` | `shared/constants/heirloom/heirloom.role.constant.ts` | G30 |
| `heirloom.item.type.constant.gap.md` | `shared/constants/heirloom/heirloom.item.type.constant.ts` | G30 |
| `heirloom.invitation.status.constant.gap.md` | `shared/constants/heirloom/heirloom.invitation.status.constant.ts` | G30 |
| `heirloom.validator.schema.gap.md` | `shared/validator/heirloom/heirloom.schema.ts` | G29 |
| `heritage.capture.validator.schema.gap.md` | `shared/validator/heritage/heritage.capture.schema.ts` | G29 |
| `cook.style.profile.validator.schema.gap.md` | `shared/validator/cook.style/cook.style.profile.schema.ts` | G29 |
| `heirloom.routes.gap.md` | `shared/routes/heirloom.routes.ts` | G31 |
| `heirloom.contract.gap.md` | `shared/contracts/heirloom.contract.ts` | G31 |
| `reconstruct.heritage.recipe.helper.gap.md` | `backend/src/agents/brain/_helpers/heritage/reconstruct.heritage.recipe.helper.ts` | G3 |
| `finalize.heritage.recipe.helper.gap.md` | `backend/src/agents/brain/_helpers/heritage/finalize.heritage.recipe.helper.ts` | G4 |
| `extract.cook.style.profile.helper.gap.md` | `backend/src/agents/brain/_helpers/cook.style/extract.cook.style.profile.helper.ts` | G10 |
| `adapt.recipe.to.style.helper.gap.md` | `backend/src/agents/brain/_helpers/cook.style/adapt.recipe.to.style.helper.ts` | G11 |
| `assemble.heirloom.helper.gap.md` | `backend/src/agents/brain/_helpers/heirloom/assemble.heirloom.helper.ts` | G18 |
| `build.heirloom.payload.helper.gap.md` | `backend/src/agents/brain/_helpers/heirloom/build.heirloom.payload.helper.ts` | G19 |
| `ingest.heirloom.recipient.helper.gap.md` | `backend/src/agents/brain/_helpers/heirloom/ingest.heirloom.recipient.helper.ts` | G20 |
| `copy.heirloom.photos.helper.gap.md` | `backend/src/agents/brain/_helpers/heirloom/copy.heirloom.photos.helper.ts` | G21 |
| `push.heirloom.delta.helper.gap.md` | `backend/src/agents/brain/_helpers/heirloom/push.heirloom.delta.helper.ts` | G24 |
| `create.heirloom.handler.gap.md` | `backend/src/agents/brain/_handlers/heirloom/create.heirloom.handler.ts` | G31 |
| `invite.heirloom.handler.gap.md` | `backend/src/agents/brain/_handlers/heirloom/invite.heirloom.handler.ts` | G22 |
| `accept.heirloom.invitation.handler.gap.md` | `backend/src/agents/brain/_handlers/heirloom/accept.heirloom.invitation.handler.ts` | G19 |
| `push.heirloom.item.handler.gap.md` | `backend/src/agents/brain/_handlers/heirloom/push.heirloom.item.handler.ts` | G24 |
| `designate.heirloom.successor.handler.gap.md` | `backend/src/agents/brain/_handlers/heirloom/designate.heirloom.successor.handler.ts` | G25 |
| `heirloom.delivery.workflow.gap.md` | `backend/src/api/heirlooms/jobs/heirloom.delivery.workflow.ts` | G19 |
| `cook.style.extraction.workflow.gap.md` | `backend/src/api/heirlooms/jobs/cook.style.extraction.workflow.ts` | G10 |
| `heirloom.broker.route.gap.md` | `backend/src/api/heirloom-broker/heirloom.broker.route.ts` | G19 |
| `heirloom.invitation.supabase.schema.gap.md` | `supabase/migrations/*_heirloom_invitation.sql` | G16 |
| `heirloom.succession.supabase.schema.gap.md` | `supabase/migrations/*_heirloom_succession.sql` | G17 |
| `assemble.heirloom.tool.gap.md` | `backend/src/agents/brain/tools/heirloom/assemble.heirloom.tool.ts` | G33 |
| `heirloom.assembly.screen.gap.md` | `mobile/features/heirloom/screens/heirloom.assembly.screen.tsx` | G32 |
| `heirloom.invitation.landing.screen.gap.md` | `mobile/features/heirloom/screens/heirloom.invitation.landing.screen.tsx` | G23 |
| `heirloom.recipient.view.screen.gap.md` | `mobile/features/heirloom/screens/heirloom.recipient.view.screen.tsx` | G32 |
| `heirloom.push.accept.sheet.gap.md` | `mobile/features/heirloom/components/heirloom.push.accept.sheet.tsx` | G24 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft / owner |
|---|---|
| **29** | Heritage session mode flag; session-end calls `reconstruct.heritage.recipe` |
| **03** | Inheritance-entry deep link; deletion succession UI |
| **08** | `writeUserRecipe` with `origin=family_capture` |
| **43** | `tier.entitlement.matrix.constant.gap.md` — `heirloom_send`, `generational_recipe_capture` |
| **48** | Encore recipes — **G34** boundary; resolve with **48** G33 before bundling |
| **51** | Discovery Card preservation trigger on capture — not Heirloom send |
| **38** | Food Time Machine generational moments — read `family_capture` history |
| **53** | Harvest heritage chapter — audience-level only |

## Critical boundary notes

- Heirloom ≠ viral sharing (**51**). Private invitations only; no public discovery.
- Heirloom ≠ share import (**25**). `family_capture` vs `share_import` origins.
- Receive **free always**; assemble/send **Culina** (`heirloom_send`).
- Copy-on-accept: no shared mutable object; owner delete does not claw back copies.
- Spec **48** (brioela) = feature **49** (folder). Spec **49** (brioela) = Harvest feature **53**.
- `family_capture` (shipped enum) vs spec **38** `generational` prose — align at ship (**G35**).
- Encore `origin=encore` recipes not listed in Heirloom assembly spec — **G34**.
