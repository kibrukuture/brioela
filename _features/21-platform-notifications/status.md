# Status

open

**Platform push partially shipped.** Postgres token table + register/unregister API (Courier sync) + OneSignal send client + mobile OneSignal auth login exist. **No** Brain notification tables, **no** send/queue tools, **no** delivery rule enforcement, **no** production `push.send` route, **no** mobile backend token sync, **no** product integrations (recall, medication, weekly summary).

**Living catalog:** Notification kinds inventory in `spec.md` is a snapshot — new product triggers add a `type` row and caller integration; no Postgres enum migration.

# Shipped (partial)

## Backend
- [x] `shared/drizzle/schema/push-notification.schema.ts`
- [x] `backend/src/api/notifications/push.service.ts` — register/unregister + Courier PUT/DELETE
- [x] `backend/src/api/notifications/notif.controller.ts`
- [x] `backend/src/api/notifications/notif.routes.ts`
- [x] `backend/src/api/notifications/courier.controller.ts`
- [x] `backend/src/core/clients/onesignal.ts` — `sendOneSignalPush`
- [x] Stress-test: `send-push` (Courier), `send-onesignal` — `stress-test.route.ts`
- [ ] `push.send` production handler
- [ ] `send-platform-push.ts` unified service
- [ ] Brain `notification_log` / `notification_suppression` / `notification_queue`
- [ ] Brain `send-push` / `queue-notification` tools
- [ ] `evaluate.delivery.rules.helper.ts`
- [ ] Product integration helpers (`trigger-medication-push`, recall send, …)

## Mobile
- [x] `mobile/lib/push-notifications/one-signal.ts`
- [x] `mobile/app/_layout.tsx` — OneSignal init + expo foreground handler
- [x] `mobile/stores/account/use-auth-store.ts` — `OneSignal.login/logout`
- [x] `mobile/network/notifications/notifications.api.ts` + hooks
- [ ] Profile/settings → `registerPush` backend call
- [ ] `use-sync-push-token.ts` on auth + permission grant
- [ ] Brioela permission flow (**03**) — replace Schnl `notif-setup.tsx`

## Shared
- [x] `shared/validators/notifications.validator.ts`
- [x] `shared/api/notifications.routes.ts` (includes unimplemented `push.send`)

## Legacy parallel (Schnl — not ambient push)
- [x] In-app notifications Postgres + API + WebSocket (fintech types)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **Courier vs OneSignal dual stack** — specs say OneSignal-only; production registers tokens with Courier REST | `push.service.ts` Courier PUT; `012-notifications` + `037` say OneSignal-only |
| G2 | Mobile never calls `POST push/register` | `notifications.tsx` only OneSignal opt-in; `rg useRegisterPush mobile/app` — no usage outside hooks file |
| G3 | `push.send` route defined but not implemented | `NOTIFICATIONS_ROUTES['push.send']` — no handler in `notif.routes.ts` |
| G4 | No Brain `notification_log` table | `rg notification_log backend/src/agents/brain` — zero |
| G5 | No Brain `notification_suppression` table | `06-data-model-and-tools.md` — not migrated |
| G6 | No Brain `notification_queue` table | Same |
| G7 | Dual token storage: `devices.push_token` + `push_notification` | `devices.schema.ts` vs `push-notification.schema.ts`; `devices.service.ts` bind accepts `pushToken` |
| G8 | Medication push spec shows raw OneSignal fetch in feature handler | `02-medication-reminders.md` — should use **21** `sendPlatformPush` |
| G9 | Legacy Schnl onboarding notification screen | `notif-setup.tsx` — Feymark copy, expo-notifications only |
| G10 | Wearables doc mentions push for sleep/recovery vs spec 23 low/in-app | `20-wearables/05-feature-integration.md` vs `23-ambient-notification-strategy.md` |
| G11 | In-app fintech inbox vs ambient push — two systems | `in-app-notification.schema.ts` types `payment/transaction/...` |
| G12 | No `send-push.ts` / `queue-notification.ts` Brain tools | `build-guide/12-notifications/00-overview.md` tools list — files absent |
| G13 | No quiet hours / daily cap / active-session enforcement code | `rg quietHours backend` — zero product enforcement |
| G14 | No recall → Brain → push integration | **31** open; `03-critical-notification.md` describes path only |
| G15 | No weekly summary push from **14** handler | **14** G18; **34** content gen open |
| G16 | Profile notifications UI says "Schnl" | `notifications.tsx` line 111 |
| G17 | `academic-notifications.ts` legacy local scheduler | Schnl — not Brioela product |
| G18 | No implementation ledger entries for notifications | `_records/implementation-ledger/` grep — zero |
| G19 | Expo dev build required for Android push — not documented in feature folder until this migration | Expo docs SDK 53+ |
| G20 | Courier mint JWT mounted but mobile Courier SDK usage unclear | `use-courier.ts` exists; token sync path incomplete |

# 21 vs neighbor boundaries

| In **21** (this feature) | In separate feature |
|---|---|
| Token register API, Postgres `push_notification` | Device trust bind — `devices` API (**01**) |
| `sendPlatformPush`, OneSignal client, delivery rules | **WHAT** to send — product features |
| Brain suppression / queue / log tables | Alarm rows — **09**; dispatch — **14** |
| Permission timing UX | **03** |
| `OneSignal.login` on auth | **03** auth store (hook lives in mobile auth) |
| Critical recall **delivery** | Recall **matching** — **31** |
| Medication **push** send | Vapi call + webhook — **22**; dispatch case — **14** |
| Mira cooking timer | **29** — in-session, not push |
| Bela live-scan banner | **42** — in-app only |
| In-app fintech inbox | Legacy — unify later |

# Blocked by

- 01-platform-foundation (Worker shell — shipped)
- 03-platform-auth-onboarding (permission UX — open)
- 04-brain-foundation (Brain DO — shipped; notification tables not added)

# Blocks

- 31-recall-alerts (critical push delivery)
- 22-health-intelligence (medication push fallback)
- 14-brain-alarm-dispatch (weekly/medication/travel push outcomes)
- 35-ambient-intelligence (travel preload push)
- 34-pantry-meal-plan (weekly summary delivery)
- 54-tonight (earned push slot)
- 53-harvest (single edition notification)
- 42-bela (order/delivery pushes)
- 28-map (price alert delivery)
- 27-ground (Ground moment push)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| *(none)* | No `_records/implementation-ledger/` entries for notifications — build-guide session log `012-notifications-complete.md` is the only completion record |

# Ambiguous / conflicting sources

1. **OneSignal-only vs Courier:** Session logs `037`, `038` lock OneSignal-only; shipped `push.service.ts` uses Courier for token registration; stress-test sends via both. **Production should converge on OneSignal for product send; deprecate Courier or document as dev-only (G1).**
2. **All sends through Brain DO vs direct Worker send:** `12-notifications/06` + `26-personalized-recall-alerts.md` require Brain evaluation; stress-test bypasses Brain. **21 MVP adds Brain tools; Worker may call Brain RPC.**
3. **Wearables push:** build-guide wearables integration mentions push for routine changes; spec 23 puts stats in-app low priority. **Default: in-app unless product elevates (G10).**
4. **`devices` vs `push_notification`:** Two tables can diverge. **Prefer `push_notification` + OneSignal external_id (G7).**
5. **Expo token vs OneSignal token:** Mobile uses OneSignal SDK but register schema accepts `expo|apns|fcm`. **Clarify which token is posted to backend (G2).**

# Draft count

**19** files in `draft/` (8 production snapshots + 10 gap/intended snapshots + `gap-index.md`).

# Sources

- `brioela-specs/23-ambient-notification-strategy.md`
- `brioela-specs/21-onboarding.md`
- `brioela-specs/26-personalized-recall-alerts.md`
- `brioela-specs/25-viral-growth-and-sharing.md`
- `brioela-specs/09-per-user-brain.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `brioela-specs/49-harvest.md`
- `brioela-specs/53-growth-mirror.md`
- `brioela-specs/20-platform-and-app-distribution.md`
- `build-guide/12-notifications/00-overview.md`
- `build-guide/12-notifications/01-priority-model.md`
- `build-guide/12-notifications/02-delivery-rules.md`
- `build-guide/12-notifications/03-suppression-state.md`
- `build-guide/12-notifications/04-surfaces.md`
- `build-guide/12-notifications/05-permission-timing.md`
- `build-guide/12-notifications/06-data-model-and-tools.md`
- `build-guide/03-foundation/05-mobile-setup.md`
- `build-guide/04-auth-and-onboarding/01-supabase-auth-setup.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/14-pantry-meal-plan/06-weekly-food-summary.md`
- `build-guide/15-recall-alerts/00-overview.md`
- `build-guide/15-recall-alerts/03-critical-notification.md`
- `build-guide/16-illness-detective/05-output-privacy-and-followup.md`
- `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`
- `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`
- `build-guide/18-ambient-intelligence/06-surfacing-and-privacy.md`
- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/02-medication-reminders.md`
- `build-guide/10-map/05-price-alerts.md`
- `build-guide/38-tonight/02-timing-and-delivery.md`
- `build-guide/36-harvest/00-overview.md`
- `build-guide/20-wearables/05-feature-integration.md`
- `build-guide/08-cooking-session/05-timers.md`
- `build-guide/28-passport/03-generation-flow.md`
- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/bela/01-order-creation.md`
- `implementable-specs/bela/04-live-scan-session.md`
- `implementable-specs/bela/09-standing-order.md`
- `implementable-specs/bela/11-for-others.md`
- `implementable-specs/bela/02-shopper-platform.md`
- `implementable-specs/07-sessions.md`
- `_records/session-log/012-notifications-complete.md`
- `_records/session-log/037-health-intelligence-and-doc-cleanup.md`
- `_records/connections/08-notifications-connections.md`
- `_records/build-order/10-layer-notifications.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/14-brain-alarm-dispatch/status.md`
