# Feature 54 — Tonight — Draft index

Production snapshots for review. **None of these files exist in `backend/`, `shared/`, or `mobile/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `tonight.reasoning.tag.constant.gap.md` | `shared/constants/tonight/tonight.reasoning.tag.constant.ts` | G3 |
| `tonight.response.constant.gap.md` | `shared/constants/tonight/tonight.response.constant.ts` | G4 |
| `tonight.answer.schema.gap.md` | `backend/src/agents/brain/_schemas/tonight.answer.schema.ts` | G1 |
| `tonight.delivery.preference.schema.gap.md` | `backend/src/agents/brain/_schemas/tonight.delivery.preference.schema.ts` | G2 |
| `assemble.tonight.context.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/assemble.tonight.context.helper.ts` | G5 |
| `converge.with.meal.plan.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/converge.with.meal.plan.helper.ts` | G6, G31 |
| `rank.tonight.recipe.pool.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/rank.tonight.recipe.pool.helper.ts` | G9 |
| `generate.tonight.swaps.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/generate.tonight.swaps.helper.ts` | G10 |
| `read.readiness.bias.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/read.readiness.bias.helper.ts` | G11 |
| `resolve.mesa.audience.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/resolve.mesa.audience.helper.ts` | G12 |
| `learn.tonight.delivery.time.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/learn.tonight.delivery.time.helper.ts` | G13 |
| `evaluate.single.item.pickup.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/evaluate.single.item.pickup.helper.ts` | G22 |
| `tonight.silence.policy.gap.md` | `backend/src/agents/brain/_policies/tonight/tonight.silence.policy.ts` | G23 |
| `check.tonight.tier.gate.helper.gap.md` | `backend/src/agents/brain/_helpers/tonight/check.tonight.tier.gate.helper.ts` | G16 |
| `generate.tonight.answer.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/generate.tonight.answer.handler.ts` | G21 |
| `compose.tonight.card.document.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/compose.tonight.card.document.handler.ts` | G14, G15 |
| `store.tonight.answer.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/store.tonight.answer.handler.ts` | G1 |
| `run.tonight.generation.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/run.tonight.generation.handler.ts` | G24 |
| `deliver.tonight.card.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/deliver.tonight.card.handler.ts` | G25, G26, G27 |
| `trigger.tonight.dinner.notification.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/trigger.tonight.dinner.notification.handler.ts` | G17 |
| `record.tonight.response.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/record.tonight.response.handler.ts` | G28, G29 |
| `apply.craving.tonight.adjustment.handler.gap.md` | `backend/src/agents/brain/_handlers/tonight/apply.craving.tonight.adjustment.handler.ts` | G30 |
| `handle.tonight.generation.alarm.handler.gap.md` | `backend/src/agents/brain/_handlers/alarms/handle.tonight.generation.alarm.handler.ts` | G24 |
| `tonight.contract.gap.md` | `shared/contracts/tonight.contract.ts` | G32 |
| `tonight.routes.gap.md` | `shared/routes/tonight.routes.ts` | G32 |
| `get.tonight.answer.handler.gap.md` | `backend/src/api/tonight/_handlers/get.tonight.answer.handler.ts` | G32 |
| `tonight.ambient.card.screen.gap.md` | `mobile/features/tonight/screens/tonight.ambient.card.screen.tsx` | G33 |
| `tonight.card.actions.component.gap.md` | `mobile/features/tonight/components/tonight.card.actions.tsx` | G19, G34 |

## Cross-feature drafts (do not duplicate in 54)

| Feature | Draft / owner |
|---|---|
| **34** | `assembleInventorySnapshot`, `meal_plan_slot` — pantry/meal-plan handlers |
| **37** | `match.craving.offer.helper.gap.md` — `tonight_adjust` offer phrase |
| **43** | `tier.entitlement.matrix.constant.gap.md` — `tonight_card` gate |
| **52** | `ambient_surface` renderer + `GenerativeSurface` enum extension |
| **21** | `tonight_dinner` send path + `notification_suppression` |
| **41** | Mesa active audience tables + clearance |
| **36** | `health.biometrics` memory writes |

## Critical boundary notes

- **Convergence is strict** — active **34** plan slot is the answer; never compete.
- **Exactly two swaps** — browsing is the failure mode this feature kills.
- **Silence over filler** — no row when bar not cleared.
- **Pre-composed grammar** — card open is instant; no 400ms live gate (**52** doctrine).
- **Spec 51 / folder 54** — expected numbering split (like spec **49** / feature **53**).
- **Core = Luma** — tier gate uses **43** product names, not legacy Core string.
