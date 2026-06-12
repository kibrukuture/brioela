# Feature 47 — Passport — Draft index

Production snapshots for review. **None of these files exist in `backend/` or `shared/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `passport.schema.gap.md` | `backend/src/agents/brain/_schemas/passport.schema.ts` | G1 |
| `passport.instruction.block.schema.gap.md` | `backend/src/agents/brain/_schemas/passport.instruction.block.schema.ts` | G1 |
| `passport.audit.event.schema.gap.md` | `backend/src/agents/brain/_schemas/passport.audit.event.schema.ts` | G1 |
| `passport.kind.constant.gap.md` | `shared/constants/passport/passport.kind.constant.ts` | G3 |
| `passport.validator.schema.gap.md` | `shared/validator/passport/passport.schema.ts` | G2 |
| `passport.routes.gap.md` | `shared/routes/passport.routes.ts` | G24 |
| `passport.contract.gap.md` | `shared/contracts/passport.contract.ts` | G23 |
| `build.passport.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/build.passport.blocks.helper.ts` | G5 |
| `build.passport.mesa.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/build.passport.mesa.blocks.helper.ts` | G8 |
| `build.passport.menu.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/build.passport.menu.blocks.helper.ts` | G9 |
| `build.passport.bela.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/build.passport.bela.blocks.helper.ts` | G10 |
| `build.passport.travel.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/build.passport.travel.blocks.helper.ts` | G11 |
| `build.passport.practitioner.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/build.passport.practitioner.blocks.helper.ts` | G12 |
| `build.passport.caregiver.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/build.passport.caregiver.blocks.helper.ts` | G13 |
| `minimize.passport.privacy.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/minimize.passport.privacy.helper.ts` | G6 |
| `check.passport.medical.boundary.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/check.passport.medical.boundary.helper.ts` | G7 |
| `compute.passport.expiration.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/compute.passport.expiration.helper.ts` | G16 |
| `translate.passport.blocks.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/translate.passport.blocks.helper.ts` | G17 |
| `render.passport.static.helper.gap.md` | `backend/src/agents/brain/_helpers/passport/render.passport.static.helper.ts` | G18 |
| `preview.passport.handler.gap.md` | `backend/src/agents/brain/_handlers/passport/preview.passport.handler.ts` | G14 |
| `create.passport.handler.gap.md` | `backend/src/agents/brain/_handlers/passport/create.passport.handler.ts` | G15 |
| `revoke.passport.handler.gap.md` | `backend/src/agents/brain/_handlers/passport/revoke.passport.handler.ts` | G15 |
| `create.passport.tool.gap.md` | `backend/src/agents/brain/tools/passport/create.passport.tool.ts` | G22 |
| `get.passport.link.handler.gap.md` | `backend/src/api/passport/_handlers/get.passport.link.handler.ts` | G21 |
| `passport.preview.sheet.gap.md` | `mobile/features/passport/components/passport.preview.sheet.tsx` | G25 |
| `passport.generative.surface.gap.md` | `shared/constants/grammar/passport.generative.surface.ts` | G19 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft / owner |
|---|---|
| **41** | `load.active.food.audience.helper.gap.md` — Mesa audience read |
| **26** | Menu scan session + waiter questions |
| **42** | Bela order constraint read |
| **35** | `travel.intent.schema.gap.md` — language hints only |
| **46** | `write.practitioner.annotation.handler.gap.md` — approved notes |
| **52** | Grammar renderer body — surface contract only in **47** |
| **21** | `passport_prompt` policy — resolve **G28** before wiring |

## Critical boundary notes

- Passport ≠ Discovery Card (**51**). Do not route through viral share scrub pipeline.
- Passport ≠ Encore (**48**). No recipe reconstruction tables or plate-photo intake.
- **35** owns travel preload; **47** `travel_translation` consumes language hints + user-confirmed rules only.
- **28** displays travel geo cache; Passport does not embed map data.
- `03-generation-flow.md` blocks push asking user to make Passport — conflicts with **21** `passport_prompt` (**G28**).
- "What Brioela knows about me" primary definition is spec **34**; neighbor migrations cite **47** — inventory UI not in `build-guide/28-passport/` (**G35**).
