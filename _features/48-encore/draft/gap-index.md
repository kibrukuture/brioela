# Feature 48 — Encore — Draft index

Production snapshots for review. **None of these files exist in `backend/` or `shared/` yet** (except `recipe.origin.schema.ts` exists without `encore`).

| Draft file | Target production path | Gap ID |
|---|---|---|
| `encore.schema.gap.md` | `backend/src/agents/brain/_schemas/encore.schema.ts` | G1 |
| `encore.open.question.schema.gap.md` | `backend/src/agents/brain/_schemas/encore.open.question.schema.ts` | G1 |
| `encore.refinement.schema.gap.md` | `backend/src/agents/brain/_schemas/encore.refinement.schema.ts` | G1 |
| `recipe.origin.encore.gap.md` | `backend/src/agents/brain/_schemas/recipe.origin.schema.ts` | G2 |
| `encore.status.constant.gap.md` | `shared/constants/encore/encore.status.constant.ts` | G4 |
| `encore.sourcing.status.constant.gap.md` | `shared/constants/encore/encore.sourcing.status.constant.ts` | G4 |
| `encore.validator.schema.gap.md` | `shared/validator/encore/encore.schema.ts` | G3 |
| `encore.routes.gap.md` | `shared/routes/encore.routes.ts` | G13 |
| `encore.contract.gap.md` | `shared/contracts/encore.contract.ts` | G15 |
| `analyze.plate.vision.helper.gap.md` | `backend/src/agents/brain/_helpers/encore/analyze.plate.vision.helper.ts` | G6 |
| `fuse.encore.context.helper.gap.md` | `backend/src/agents/brain/_helpers/encore/fuse.encore.context.helper.ts` | G7 |
| `reconstruct.encore.recipe.helper.gap.md` | `backend/src/agents/brain/_helpers/encore/reconstruct.encore.recipe.helper.ts` | G8 |
| `adapt.encore.constraints.helper.gap.md` | `backend/src/agents/brain/_helpers/encore/adapt.encore.constraints.helper.ts` | G9 |
| `check.encore.sourcing.helper.gap.md` | `backend/src/agents/brain/_helpers/encore/check.encore.sourcing.helper.ts` | G10 |
| `write.encore.recipe.helper.gap.md` | `backend/src/agents/brain/_helpers/encore/write.encore.recipe.helper.ts` | G1 |
| `encore.reconstruction.workflow.gap.md` | `backend/src/api/encores/jobs/encore.reconstruction.workflow.ts` | G11 |
| `create.encore.handler.gap.md` | `backend/src/agents/brain/_handlers/encore/create.encore.handler.ts` | G12 |
| `get.encore.handler.gap.md` | `backend/src/agents/brain/_handlers/encore/get.encore.handler.ts` | G12 |
| `refine.encore.handler.gap.md` | `backend/src/agents/brain/_handlers/encore/refine.encore.handler.ts` | G23 |
| `inject.encore.session.context.helper.gap.md` | `backend/src/agents/brain/_helpers/encore/inject.encore.session.context.helper.ts` | G22 |
| `create.encore.tool.gap.md` | `backend/src/agents/brain/tools/encore/create.encore.tool.ts` | G14 |
| `encore.capture.screen.gap.md` | `mobile/features/encore/screens/encore.capture.screen.tsx` | G16 |
| `encore.draft.sheet.gap.md` | `mobile/features/encore/components/encore.draft.sheet.tsx` | G18 |
| `encore.discovery.card.trigger.gap.md` | `mobile/features/encore/components/encore.discovery.card.trigger.tsx` | G24 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft / owner |
|---|---|
| **24** | Vision extraction handlers — plate-specific prompt in **48** only |
| **25** | Import workflow — separate entry; no shared job tables |
| **26** | Menu scan session read for same-visit context |
| **27** | `match.find.to.cooking.gap.md` — consumes `ingredient_not_found` |
| **29** | Session-end hook calls `refine.encore` when `origin=encore` |
| **42** | Bela order create from sourcing list |
| **43** | `tier.entitlement.matrix.constant.gap.md` — `encore_recreation` |
| **47** | Passport tables — explicit boundary, no overlap |
| **51** | Discovery Card renderer + scrub pipeline |

## Critical boundary notes

- Encore ≠ Passport (**47**). Plate photo → private recipe, not temporary staff card.
- Encore ≠ share import (**25**). Explicit recreate action, not share sheet classifier.
- Passive visual intake (**34**) never triggers reconstruction — separate mobile route.
- Spec **44** `source_type = 'encore'` → implement as `recipes.origin = 'encore'` (**G2**).
- Capture always stores; Culina+ gates full draft view (**43** `encore_recreation`).
- Discovery Card generation is **51** — **48** triggers offer only after first cook.
- Heirloom send (**49**) does not list Encore recipes in spec **48** — resolve **G33** before bundling.
