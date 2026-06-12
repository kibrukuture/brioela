# Platform Notifications — Build

Feature **21**. Production paths under `backend/src/api/notifications/`, `backend/src/core/clients/`, `mobile/lib/push-notifications/`, `mobile/network/notifications/`, `shared/drizzle/schema/push-notification.schema.ts`, and (intended) `backend/src/agents/brain/_tools/` for Brain-orchestrated send/queue.

**Scope:** token register/unregister, unified send service, Brain DO notification tables + tools, mobile token sync to backend, priority/suppression enforcement, and integration hooks for product features. **Not in 21 build:** recall matching (**31**), alarm dispatch cases (**14**), medication Vapi webhooks (**22**), inbox UI polish for legacy fintech notifications.

---

## Shipped today

| Area | Status |
|---|---|
| `push_notification` Drizzle schema + Postgres table | ✓ |
| `POST /v1/notifications/push/register` + unregister (Courier token sync) | ✓ |
| `POST /v1/notifications/courier/mint-jwt` | ✓ |
| `sendOneSignalPush` client helper | ✓ |
| Stress-test Courier + OneSignal send endpoints | ✓ |
| Mobile OneSignal init + auth `login`/`logout` | ✓ |
| Mobile `expo-notifications` foreground handler in `_layout.tsx` | ✓ |
| `useRegisterPush` / `notifications.api.ts` | ✓ (hooks exist) |
| Mobile profile push toggle wired to backend register | ✗ |
| `POST /v1/notifications/push/send` production handler | ✗ |
| Brain `notification_log` / `suppression` / `queue` tables | ✗ |
| Brain `send-push` / `queue-notification` tools | ✗ |
| Unified `sendPlatformPush` service (rules + provider) | ✗ |
| Suppression / quiet hours / daily cap enforcement | ✗ |
| Active-session queue drain on session close | ✗ |
| Product feature send integrations (recall, medication, weekly, …) | ✗ |
| Brioela permission flow (replace Schnl onboarding notif screen) | ✗ |
| Notification delivery tests | ✗ |

**Partial legacy (Schnl — out of Brioela ambient scope but shipped):** in-app notifications API + WS + Postgres schema.

---

## File manifest

### Backend — token + provider (21)

| File | Role | Status |
|---|---|---|
| `backend/src/api/notifications/push.service.ts` | Register/unregister token; Courier PUT/DELETE | ✓ shipped |
| `backend/src/api/notifications/notif.controller.ts` | HTTP handlers for register/unregister | ✓ |
| `backend/src/api/notifications/notif.routes.ts` | Route mount | ✓ |
| `backend/src/api/notifications/courier.controller.ts` | Mint Courier JWT for mobile SDK | ✓ |
| `backend/src/core/clients/onesignal.ts` | `sendOneSignalPush` | ✓ |
| `backend/src/api/notifications/push.send.service.ts` | **Gap** — production send with rules delegation to Brain | ✗ |
| `backend/src/api/notifications/push.send.controller.ts` | **Gap** — `push.send` route | ✗ |

### Backend — Brain DO (21 — intended)

| File | Role |
|---|---|
| `_schemas/notification.log.schema.ts` | Brain SQLite `notification_log` |
| `_schemas/notification.suppression.schema.ts` | `notification_suppression` |
| `_schemas/notification.queue.schema.ts` | `notification_queue` |
| `_repositories/read.notification.suppression.repository.ts` | Suppression lookups |
| `_repositories/write.notification.log.repository.ts` | Delivery audit |
| `_repositories/read.write.notification.queue.repository.ts` | Queue CRUD |
| `_helpers/evaluate.delivery.rules.helper.ts` | Quiet hours, cap, active session, priority |
| `_helpers/drain.notification.queue.helper.ts` | Flush queue after session end (**11** hook) |
| `_tools/send.push.tool.ts` | Brain tool — product features call via RPC or internal |
| `_tools/queue.notification.tool.ts` | Brain tool |
| `_executables/send.push.executable.ts` | Calls `sendPlatformPush` after rules pass |
| `_executables/queue.notification.executable.ts` | Inserts queue row |

### Backend — shared send helper (21)

| File | Role |
|---|---|
| `backend/src/core/notifications/send-platform-push.ts` | OneSignal send; optional Courier adapter behind flag |
| `backend/src/core/notifications/trigger-medication-push.helper.ts` | **22** calls this — idempotency + payload shape |

### Shared

| File | Role | Status |
|---|---|---|
| `shared/drizzle/schema/push-notification.schema.ts` | Token store | ✓ |
| `shared/validators/notifications.validator.ts` | Register/send schemas | ✓ |
| `shared/api/notifications.routes.ts` | Route constants incl. `push.send` | ✓ |

### Mobile (21)

| File | Role | Status |
|---|---|---|
| `mobile/lib/push-notifications/one-signal.ts` | OneSignal SDK wrappers | ✓ |
| `mobile/app/_layout.tsx` | Init OneSignal + expo foreground handler | ✓ |
| `mobile/stores/account/use-auth-store.ts` | `OneSignal.login/logout` | ✓ |
| `mobile/network/notifications/notifications.api.ts` | Register/unregister API | ✓ |
| `mobile/network/notifications/use-push-notifications.ts` | Mutations | ✓ |
| `mobile/app/profile/notifications.tsx` | Settings toggle | ✓ partial — no backend sync |
| `mobile/hooks/use-sync-push-token.ts` | **Gap** — permission → token → `registerPush` | ✗ |
| `mobile/components/onboarding/notif-setup.tsx` | Legacy Schnl screen | ✗ replace (**03**) |

### Tests

| File | Role |
|---|---|
| `backend/src/core/notifications/send-platform-push.test.ts` | OneSignal mock send |
| `backend/src/agents/brain/_helpers/evaluate.delivery.rules.helper.test.ts` | Quiet hours, cap, suppression |
| `backend/src/api/notifications/push.service.test.ts` | Register upsert + provider mapping |

---

## Provider mapping (register)

From shipped `push.service.ts`:

```typescript
const providerKey =
  provider === 'fcm' ? 'firebase-fcm'
  : provider === 'apns' ? 'apn'
  : 'expo'
```

Courier PUT: `/users/{userId}/tokens/{token}` with `{ token, provider_key }`.

**Target state:** register with OneSignal device API or rely on `external_id` + drop Courier (**G1**).

---

## Integration contracts (product → 21)

| Caller | Entry | Required payload fields |
|---|---|---|
| **31** recall worker → Brain HTTP | Internal `send-push` RPC | `type: recall_alert_*`, `priority: critical`, `content_ref`, deep link |
| **14** `handleMedicationReminder` | `triggerMedicationPush` → **21** | `type: medication_reminder`, `idempotency_key: alarmId` |
| **14** `handleWeeklyFoodSummary` | Brain tool after summary gen | `type: weekly_food_summary`, `priority: medium` |
| **35** travel preload complete | Brain alarm handler | `type: travel_preload_ready`, `priority: high` |
| **24** scanner critical match | Worker or session end | `type: allergy_safety_scan`, `priority: critical` |
| **42** Bela order events | Worker → Brain or direct send | Bela-specific `type` strings |
| **54** Tonight | Scheduled job | `type: tonight_dinner`, `priority: medium` |
| **53** Harvest | Anniversary alarm once | `type: harvest_edition_ready`, dedupe by edition id |

All callers **must not** call OneSignal/Courier directly in production once **21** ships (**G8**).

---

## wrangler / secrets

| Secret / env | Purpose |
|---|---|
| `ONESIGNAL_APP_ID` | Send |
| `ONESIGNAL_REST_API_KEY` | Send |
| `COURIER_AUTH_KEY` | Token register (legacy) + stress-test |
| `EXPO_PUBLIC_ONESIGNAL_APP_ID` | Mobile SDK |

No new DO bindings for **21**. Brain class already exists (**04**).

---

## Acceptance criteria

1. Mobile obtains push permission per **03** timing (not install); syncs token to `POST push/register` on grant.
2. `OneSignal.login(userId)` remains on auth; backend send uses same `external_id`.
3. `sendPlatformPush` enforces priority, quiet hours (user TZ from profile/geohash), medium daily cap, suppression, active-session queue.
4. Critical recall and allergy sends bypass quiet hours and suppression.
5. Brain SQLite has `notification_log`, `notification_suppression`, `notification_queue` with migrations in Brain agent.
6. `send-push` and `queue-notification` Brain tools callable from alarm handlers and Path B HTTP endpoints.
7. Queue drains when **11** closes last blocking session (voice/cooking/live-scan/Bela).
8. `POST /v1/notifications/push/send` implemented **or** route removed from shared API — no dangling contract.
9. Medication push uses **21** helper with idempotency/collapse per `02-medication-reminders.md`.
10. No product code calls OneSignal REST except **21** core module.
11. Resolve Courier vs OneSignal to single product path (**G1** closed).
12. Unit tests: rules helper, register upsert, send mock.
13. `bun run verify` passes after implementation.

**MVP for 21 shipped:** token sync mobile ↔ backend + `sendPlatformPush` + Brain suppression tables + `send-push` tool + recall/medication integration stubs callable from **31**/**14**.

---

## Verification commands

```sh
cd backend && bunx vitest run src/core/notifications/send-platform-push.test.ts
cd backend && bunx vitest run src/agents/brain/_helpers/evaluate.delivery.rules.helper.test.ts
cd backend && bunx vitest run src/api/notifications/push.service.test.ts
cd backend && bun run verify
```

Manual: stress-test OneSignal send with authenticated user id; confirm device receives push in dev build.

---

## 21 vs neighbor boundaries (build)

| In **21** build | In separate feature |
|---|---|
| Token API, send service, Brain notification tables/tools | Alarm schedule/fire — **09**, **14** |
| Permission timing UX | **03** |
| Recall match + worker | **31** |
| Medication Vapi call + webhook | **22** |
| Weekly summary content generation | **34** |
| Travel preload job body | **35** |
| Tonight card content + timing learn | **54** |
| In-app fintech inbox (legacy) | Deprecate or unify later — not blocking **21** MVP |
