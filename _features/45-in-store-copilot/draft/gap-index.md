# Draft index — 45-in-store-copilot

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `shop.visit.schema.gap.md` | `_schemas/shop.visit.schema.ts` | **04** migrations |
| `shop.visit.event.schema.gap.md` | `_schemas/shop.visit.event.schema.ts` | **04** |
| `shop.session.validator.schema.gap.md` | `shared/validator/shop/shop.session.schema.ts` | — |
| `shop.context.payload.schema.gap.md` | `shared/validator/shop/shop.context.payload.schema.ts` | — |
| `shop.routes.gap.md` | `shared/routes/shop.routes.ts` | — |
| `build.in.store.copilot.mira.scene.gap.md` | `_scenes/build.in.store.copilot.mira.scene.helper.ts` | **29**, **30** G5 |
| `assemble.shop.session.context.helper.gap.md` | `_handlers/shop/assemble.shop.session.context.helper.ts` | **34**, **33**, **27**, **41**, **36** |
| `estimate.running.spend.helper.gap.md` | `_handlers/shop/estimate.running.spend.helper.ts` | **33**, **28** |
| `evaluate.swap.suggestion.helper.gap.md` | `_handlers/shop/evaluate.swap.suggestion.helper.ts` | **36**, **33**, **23** |
| `enforce.in.store.speech.policy.helper.gap.md` | `_handlers/shop/enforce.in.store.speech.policy.helper.ts` | — |
| `start.shop.mira.session.handler.gap.md` | `_handlers/shop/start.shop.mira.session.handler.ts` | **29** G7 |
| `post.shop.session.handler.gap.md` | `backend/src/api/shop/_handlers/post.shop.session.handler.ts` | G18 |
| `post.shop.session.events.handler.gap.md` | `backend/src/api/shop/_handlers/post.shop.session.events.handler.ts` | G19 |
| `post.shop.session.end.handler.gap.md` | `backend/src/api/shop/_handlers/post.shop.session.end.handler.ts` | G20 |
| `run.post.shop.visit.workflow.handler.gap.md` | `_handlers/shop/run.post.shop.visit.workflow.handler.ts` | **33**, **34** |
| `push.scan.verdict.to.shop.session.helper.gap.md` | `backend/src/api/scan/_helpers/push.scan.verdict.to.shop.session.helper.ts` | **24** G21 |
| `check.in.store.copilot.entitlement.helper.gap.md` | `_helpers/pricing/check.in.store.copilot.entitlement.helper.ts` | **43** |
| `in.store.copilot.feature.gap.md` | `mobile/features/in-store-copilot/in.store.copilot.feature.tsx` | G30 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **29** | `_features/29-cooking-session/draft/mira.session.agent.gap.md` — MiraSession DO |
| **30** | `_features/30-mira-speech-engine/` — add `in_store_copilot` to enum |
| **42** | `_features/42-bela/draft/check.constraint.for.order.helper.gap.md` — shared enforcement |
| **43** | `_features/43-pricing-tiers/draft/check.usage.limit.helper.gap.md` — voice cap |
| **33** | `_features/33-receipt-intelligence/draft/receipt.validator.schema.gap.md` — `source: shop_visit` |

## Critical boundary note

**45 `in_store_copilot`** and **42 `bela_shopper`** share MiraSession transport and constraint-check code. They must remain **separate scene kinds** with different speech policy and warn-vs-block behavior. See `spec.md` § Critical boundary.
