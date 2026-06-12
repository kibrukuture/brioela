# Feature 41 — Mesa — Draft index

Production snapshots for review. **None of these files exist in `backend/` or `shared/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `mesa.schema.gap.md` | `backend/src/agents/brain/_schemas/mesa.schema.ts` | G2 |
| `mesa.member.schema.gap.md` | `backend/src/agents/brain/_schemas/mesa.member.schema.ts` | G2 |
| `mesa.constraint.schema.gap.md` | `backend/src/agents/brain/_schemas/mesa.constraint.schema.ts` | G2 |
| `mesa.food.audience.schema.gap.md` | `backend/src/agents/brain/_schemas/mesa.food.audience.schema.ts` | G7 |
| `mesa.potential.member.schema.gap.md` | `backend/src/agents/brain/_schemas/mesa.potential.member.schema.ts` | G11 |
| `mesa.invite.schema.gap.md` | `backend/src/agents/brain/_schemas/mesa.invite.schema.ts` | G13 |
| `mesa.contribution.event.schema.gap.md` | `backend/src/agents/brain/_schemas/mesa.contribution.event.schema.ts` | G14, G15 |
| `food.audience.schema.gap.md` | `shared/validator/mesa/food.audience.schema.ts` | G3, G6 |
| `mesa.compatibility.result.schema.gap.md` | `shared/validator/mesa/mesa.compatibility.result.schema.ts` | G3, G5 |
| `load.active.food.audience.helper.gap.md` | `backend/src/agents/brain/_helpers/mesa/load.active.food.audience.helper.ts` | G6 |
| `merge.mesa.constraints.for.audience.helper.gap.md` | `backend/src/agents/brain/_helpers/mesa/merge.constraints.for.audience.helper.ts` | G5 |
| `evaluate.mesa.compatibility.helper.gap.md` | `backend/src/agents/brain/_helpers/mesa/evaluate.mesa.compatibility.helper.ts` | G5 |
| `set.food.audience.handler.gap.md` | `backend/src/agents/brain/_handlers/mesa/set.food.audience.handler.ts` | G7 |
| `create.mesa.handler.gap.md` | `backend/src/agents/brain/_handlers/mesa/create.mesa.handler.ts` | G9 |
| `create.mesa.invite.handler.gap.md` | `backend/src/agents/brain/_handlers/mesa/create.mesa.invite.handler.ts` | G1, G13 |
| `accept.mesa.contribution.handler.gap.md` | `backend/src/agents/brain/_handlers/mesa/accept.mesa.contribution.handler.ts` | G14 |
| `apply.mesa.pantry.enrichment.helper.gap.md` | `backend/src/agents/brain/_handlers/mesa/apply.mesa.pantry.enrichment.helper.ts` | G15, G30 |
| `propose.potential.member.handler.gap.md` | `backend/src/agents/brain/_handlers/mesa/propose.potential.member.handler.ts` | G11 |
| `check.mesa.entitlement.helper.gap.md` | `backend/src/agents/brain/_helpers/mesa/check.mesa.entitlement.helper.ts` | G16, G17 |
| `mesa.tools.registry.gap.md` | `backend/src/agents/brain/tools/mesa/` | G4, G9 |
| `mesa.routes.gap.md` | `shared/routes/mesa.routes.ts`, `backend/src/api/mesa/` | G1, G13 |
| `mesa.compatibility.row.feature.gap.md` | `mobile/features/mesa/components/mesa.compatibility.row.tsx` | G18, G27 |

**Not drafted (owned by other features):** product scan pipeline (**24**), personal pantry tables (**34**), `guest_session` lifecycle (**35**), Bela orders (**42**), Passport render (**47**), viral scrub (**51**), grammar renderer (**52**), practitioner client scope (**46**), Brain DO routing shell (**04**).
