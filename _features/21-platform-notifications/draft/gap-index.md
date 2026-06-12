# Gap index — feature 21 platform notifications

| Draft file | Kind | Target path | Gap ID |
|---|---|---|---|
| `push.service.production.md` | production | `backend/src/api/notifications/push.service.ts` | — |
| `onesignal.client.production.md` | production | `backend/src/core/clients/onesignal.ts` | — |
| `notif.routes.production.md` | production | `backend/src/api/notifications/notif.routes.ts` | G3 (no push.send) |
| `courier.controller.production.md` | production | `backend/src/api/notifications/courier.controller.ts` | G1 |
| `push-notification.schema.production.md` | production | `shared/drizzle/schema/push-notification.schema.ts` | — |
| `notifications.validator.production.md` | production | `shared/validators/notifications.validator.ts` | G3 |
| `one-signal.mobile.production.md` | production | `mobile/lib/push-notifications/one-signal.ts` | G2 |
| `mobile-notifications-screen.production.md` | production | `mobile/app/profile/notifications.tsx` | G2, G9, G16 |
| `send-platform-push.service.gap.md` | gap | `backend/src/core/notifications/send-platform-push.ts` | G8 |
| `send-push.brain.tool.gap.md` | gap | `backend/src/agents/brain/_tools/send.push.tool.ts` | G12 |
| `queue-notification.brain.tool.gap.md` | gap | `backend/src/agents/brain/_tools/queue.notification.tool.ts` | G12 |
| `notification-log.schema.gap.md` | gap | Brain `_schemas/notification.log.schema.ts` | G4 |
| `notification-suppression.schema.gap.md` | gap | Brain `_schemas/notification.suppression.schema.ts` | G5 |
| `notification-queue.schema.gap.md` | gap | Brain `_schemas/notification.queue.schema.ts` | G6 |
| `push.send.handler.gap.md` | gap | `push.send.controller.ts` | G3 |
| `mobile-push-backend-sync.gap.md` | gap | `mobile/hooks/use-sync-push-token.ts` | G2 |
| `trigger-medication-push.helper.gap.md` | gap | `trigger-medication-push.helper.ts` | G8 |
| `evaluate.delivery.rules.helper.gap.md` | gap | `evaluate.delivery.rules.helper.ts` | G13 |

**Total: 18 draft files** (8 production snapshots + 10 gap/intended).

**Priority build order:**

1. Resolve G1 (OneSignal vs Courier) + G2 (mobile token sync)
2. G4–G6 Brain tables + G13 rules helper
3. G12 Brain tools + G8 medication helper
4. G3 push.send or remove route
5. Product integrations (**31**, **14**, **35**, …)
