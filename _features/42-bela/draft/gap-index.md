# Bela draft gap index

Production snapshots for feature **42**. None of these files exist in `backend/src`, `shared/`, or `mobile/` yet.

| Draft file | Target path | Gap ID |
|---|---|---|
| `bela.order.agent.gap.md` | `backend/src/agents/bela/bela.order.agent.ts` | G2, G3 |
| `order.state.machine.handler.gap.md` | `agents/bela/_handlers/order.state.machine.handler.ts` | G2 |
| `scan.session.handler.gap.md` | `agents/bela/_handlers/scan.session.handler.ts` | G9 |
| `auto.capture.alarm.handler.gap.md` | `agents/bela/_handlers/auto.capture.alarm.handler.ts` | G11 |
| `order.schema.gap.md` | `shared/validator/bela/order.schema.ts` | G4, G5 |
| `order.items.schema.gap.md` | `shared/validator/bela/order.item.schema.ts` | G4 |
| `shoppers.schema.gap.md` | `shared/validator/bela/shopper.schema.ts` | G4, G12 |
| `order.constraint.snapshot.schema.gap.md` | `shared/validator/bela/order.constraint.snapshot.schema.ts` | G5, G8 |
| `order.payment.events.schema.gap.md` | `shared/validator/bela/order.payment.event.schema.ts` | G10 |
| `standing.orders.schema.gap.md` | `shared/validator/bela/standing.order.schema.ts` | G20 |
| `disputes.schema.gap.md` | `shared/validator/bela/dispute.schema.ts` | G25 |
| `recipient.profile.schema.gap.md` | `backend/src/agents/brain/_schemas/recipient.profile.schema.ts` | G18 |
| `check.constraint.for.order.helper.gap.md` | `_helpers/bela/check.constraint.for.order.helper.ts` | G7, G45 |
| `create.order.handler.gap.md` | `api/bela/_handlers/post.create.order.handler.ts` | G8 |
| `release.escrow.handler.gap.md` | `_helpers/bela/capture.and.transfer.helper.ts` | G10 |
| `shopper.onboarding.handler.gap.md` | `api/bela/_handlers/post.shopper.register.bela.card.handler.ts` | G12, G14 |
| `build.bela.shopper.mira.scene.gap.md` | `agents/mira/_scenes/build.bela.shopper.mira.scene.ts` | G1, G16, G17 |
| `smart.routing.helper.gap.md` | `_helpers/bela/compute.smart.route.helper.ts` | G23 |
| `cooking.intent.trigger.helper.gap.md` | `_helpers/bela/detect.cooking.intent.helper.ts` | G21, G22 |
| `ground.contribution.draft.helper.gap.md` | `_helpers/bela/draft.ground.finds.from.session.helper.ts` | G24 |
| `bela.routes.gap.md` | `shared/routes/bela.routes.ts` | G5 |
| `bela.tools.registry.gap.md` | `tools/bela/index.ts` | G6 |

**Architecture conflict (G1):** `build.bela.shopper.mira.scene.gap.md` follows build-guide + **30-mira**. Do not also implement `shopperGeminiWs` on BelaOrderAgent.
