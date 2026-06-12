# Platform Notifications — Spec

Feature **21**. Platform-level **push infrastructure**: device token lifecycle, send/delivery API, priority and suppression rules, quiet hours, active-session queueing, and the shared contract product features use to surface moments. **21 defines HOW** notifications are delivered; product features define **WHAT** to send and **WHEN** to trigger.

**Not in this feature:** alarm scheduling and dispatch handlers (**09**, **14**); permission UX timing and onboarding copy (**03**); recall matching (**31**); medication call/Vapi webhooks (**22**); in-app inbox UI for legacy fintech notifications (partial Schnl shell — separate from ambient push strategy); Mira cooking-timer fire (in-session injection — **29**); generative-grammar card rendering (**52**).

**Living catalog note:** `notification_type` / push `data.type` is **free text** at the platform layer — not a Drizzle enum on send path. Product features register types in this inventory when they add a trigger; no schema migration required for new kinds.

---

## Purpose

Brioela's default is silence. Feature **21** is the shared delivery spine so every product moment that *earns* interruption:

1. Respects priority (critical / high / medium / low).
2. Checks suppression, quiet hours, daily caps, and active-session state (Brain DO).
3. Resolves device tokens and calls the push provider.
4. Logs delivery, open, and dismiss for quality metrics.
5. Queues non-critical work during voice/cooking/live-scan/Bela sessions.

Without **21**, features either bypass rules (noise) or cannot deliver at all.

**Product rule (authoritative):** `brioela-specs/23-ambient-notification-strategy.md` — *Brioela does not push notifications. Brioela surfaces moments.*

---

## Platform stack decision

### Authoritative target (specs + session logs)

| Layer | Choice | Source |
|---|---|---|
| Mobile permission + foreground handler | `expo-notifications` plugin in `app.json`; `Notifications.setNotificationHandler` in root layout | `build-guide/03-foundation/05-mobile-setup.md`, Expo docs |
| Mobile subscription SDK | **OneSignal** (`react-native-onesignal`) — `OneSignal.login(userId)` on Supabase auth | `build-guide/04-auth-and-onboarding/01-supabase-auth-setup.md`, `_records/session-log/037-health-intelligence-and-doc-cleanup.md` ("OneSignal-only") |
| Backend send (product path) | **OneSignal REST API** — `include_aliases.external_id = [userId]` | `backend/src/core/clients/onesignal.ts`, `02-medication-reminders.md` |
| Token store (Postgres) | `push_notification` table — `provider`: `expo` \| `apns` \| `fcm` | `shared/drizzle/schema/push-notification.schema.ts` |
| Delivery orchestration (intended) | **Brain DO** — `send-push` / `queue-notification` tools; suppression + queue in Brain SQLite | `build-guide/12-notifications/06-data-model-and-tools.md` |

### Shipped production drift (document — resolve in build)

| Area | Spec says | Production today | Resolution |
|---|---|---|---|
| Send provider | OneSignal only | **Both** OneSignal client + **Courier** SDK in stress-test and token registration | **G1** — pick OneSignal-only for product send; Courier is legacy/experimental unless product adopts multi-channel |
| Token registration | Mobile → backend → provider | Backend `push.service.ts` registers tokens with **Courier REST** (`PUT /users/{id}/tokens/{token}`); mobile profile screen only toggles OneSignal locally — **does not call** `POST /v1/notifications/push/register` | **G2** — wire OneSignal token → backend or drop Courier registration |
| `push.send` route | Defined in `shared/api/notifications.routes.ts` | **Not mounted** — only stress-test endpoints send | **G3** |
| Brain DO tables | `notification_log`, `notification_suppression`, `notification_queue` | **Not in Brain migrations** | **G4–G6** |
| `devices.push_token` vs `push_notification` | Single source of truth | **Dual** — `devices` bind API + separate `push_notification` table | **G7** |

### Expo push token (when using `provider: expo`)

Per [Expo push notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/):

- Requires **development build** (not Expo Go on modern Android SDKs).
- `Notifications.getExpoPushTokenAsync({ projectId })` where `projectId = Constants.expoConfig?.extra?.eas?.projectId` — present in `mobile/app.json` `extra.eas.projectId`.
- Android 13+: create notification channel before token fetch.
- Expo Push Service wraps FCM/APNs; backend maps `provider: expo` → Courier `firebase-fcm` / OneSignal Expo channel per adapter.

**21 does not require direct APNs/FCM** unless product moves off OneSignal/Expo abstraction.

---

## Architecture placement

```text
Product trigger (alarm dispatch, recall worker, scan, Bela order, …)
        │
        ▼
Brain DO  OR  Worker → Brain RPC          ← intended: all sends check rules here
        │
        ├── read notification_suppression / active session / quiet hours / daily cap
        ├── queue-notification (if blocked) → notification_queue
        └── send-push tool
                │
                ├── resolve tokens (Postgres push_notification and/or OneSignal external_id)
                └── OneSignal.createNotification (authoritative) OR Courier.send (legacy path)
                        │
                        ▼
                  APNs / FCM / Expo Push Service
                        │
                        ▼
                  Mobile (OneSignal SDK + expo-notifications foreground handler)
```

**Path B (QStash) example:** recall match worker → HTTP to user Brain → Brain evaluates critical bypass → send-push (**31** owns match; **21** owns send).

**Path A (alarm) example:** `medication_reminder` fires (**14**) → **22** `triggerMedicationPush` → should call **21** send helper, not raw OneSignal from handler (**G8**).

---

## Priority model

Source: `brioela-specs/23-ambient-notification-strategy.md`, `build-guide/12-notifications/01-priority-model.md`.

| Priority | Delivery | Quiet hours | Suppression | Daily cap | Examples |
|---|---|:---:|:---:|:---:|---|
| **critical** | Immediate; interrupt context | Bypass | Never | Unlimited | Allergy/safety scan match; hard allergen in active cooking; confirmed recall lot match |
| **high** | Contextual; may queue in active session | Respect (except safety) | Per-type rules where safe | No fixed cap in spec | Cooking invite; travel intel ready; recipe saved; first confirmed constraint; Bela delivery window; medication reminder (non-call path) |
| **medium** | Batched | Respect | Yes | **Max 1 push/day** | Weekly food summary; price alert; Ground moment; map opportunity; Tonight (when earned); Harvest edition (once) |
| **low** | **In-app only — never push** | — | — | — | Recipe suggestions; feature announcements; subscription prompts; pattern stats; growth mirror |

---

## Delivery rules

Source: `build-guide/12-notifications/02-delivery-rules.md`.

- **Quiet hours:** 11pm–7am user local time — no push except critical safety.
- **Active sessions:** no non-critical push during voice, cooking, live scan, Bela shopping — queue until session ends.
- **Geo timing:** map/location alerts only when user near relevant place, signal fresh, category not suppressed.
- **One thing rule:** one information + one optional action per push — no compound CTAs.
- **No marketing push:** ever (`brioela-specs/25-viral-growth-and-sharing.md`).

---

## Suppression state

Source: `build-guide/12-notifications/03-suppression-state.md`, Brain DO storage per `23-ambient-notification-strategy.md`.

| Rule | Behavior |
|---|---|
| 2 dismissals same type | Suppress 14 days |
| 3 dismissals same type | Permanent until user re-enables |
| Applies to | Medium; high where safe; ambient in-app dismissals |
| Does **not** apply to | Critical allergy/safety; confirmed dangerous recall |

**Ambient families** (separate counters per `18-ambient-intelligence/06-surfacing-and-privacy.md`): `patterns`, `travel`, `time_machine`, `guest_mode`.

---

## Surfaces (push vs in-app vs other)

Source: `build-guide/12-notifications/04-surfaces.md`.

| Surface | Use |
|---|---|
| **Push** | Moments worth interrupting — critical safety, recall, high-value timed events, delivery windows |
| **In-app ambient** | Ground below scan, map pre-filter, weekly summary on open, pattern cards |
| **Haptic** | Ground walking discovery — not push (`09-ground/05-haptic-walking-discovery.md`) |
| **Session inline** | Mira timer message injection; Bela live-scan **banner** (explicitly not push — `bela/04-live-scan-session.md`) |
| **Local scheduled** | Legacy `mobile/lib/academic-notifications.ts` — Schnl academic reminders via `expo-notifications` schedule API; **not** platform push |

---

## Permission timing

**Owner: 03-platform-auth-onboarding** — **21** consumes `push_notification` rows only after permission granted.

Rules from `brioela-specs/21-onboarding.md` + `05-permission-timing.md`:

- **Not** at install or onboarding tour.
- **Valid:** after useful scan; contextual Ground moment; after third scan; before feature that clearly needs alerts.
- Copy explains immediate value, not marketing.

**Shipped drift:** `mobile/components/onboarding/notif-setup.tsx` uses raw `expo-notifications` with Schnl/Feymark copy — legacy; not Brioela permission flow (**G9**).

---

## Token registration contract

### API (shipped)

| Route | Method | Body | Effect |
|---|---|---|---|
| `/v1/notifications/push/register` | POST | `pushRegisterSchema`: `device_id`, `provider`, `token`, `platform?`, `model?` | Upsert `push_notification`; Courier token PUT |
| `/v1/notifications/push/unregister` | POST | `device_id` | Delete row; Courier token delete |
| `/v1/notifications/courier/mint-jwt` | POST | — | Issue Courier user JWT (7d scope) |

### Mobile (partial)

- `OneSignal.login(supabaseUserId)` on auth — external_id for OneSignal send.
- Profile toggle: `registerForPushNotifications` / opt in/out — **local SDK only**.
- `useRegisterPush` + `notifications.api.ts` exist but **not wired** from profile screen (**G2**).

### Intended end state

1. User grants OS permission (OneSignal or expo-notifications request).
2. Mobile obtains token (OneSignal subscription token or Expo push token).
3. Mobile `POST push/register` with `provider` + `token` + stable `device_id`.
4. Backend stores Postgres row; syncs provider alias (OneSignal external_id already set via login).

---

## Send contract (intended)

### Brain tools (not shipped)

From `build-guide/12-notifications/06-data-model-and-tools.md`:

**`send-push`** — respects suppression, caps, quiet hours, active session (or fails closed to queue).

**`queue-notification`** — writes `notification_queue` with `earliest_deliver_at`, `expires_at`.

### HTTP send (defined, not shipped)

`shared/api/notifications.routes.ts` defines `push.send` — no production handler (**G3**).

### Stress-test only (shipped)

- `POST /v1/stress-test/send-push` — Courier `client.send.message` routing `push` channel.
- `POST /v1/stress-test/send-onesignal` — `sendOneSignalPush`.

### Payload shape (convention)

```typescript
type PlatformPushPayload = {
  type: string           // notification kind — see inventory
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  body: string
  data?: Record<string, string>  // deep link keys: screen, id, alarm_id, etc.
  idempotency_key?: string       // e.g. reminderId, recall_match_id
  collapse_id?: string
}
```

Medication example from `02-medication-reminders.md`: `data: { type: 'medication_reminder', drug_name }`, `idempotency_key: reminderId`, `collapse_id: medication_reminder:${reminderId}`.

---

## Brain DO data model (intended)

Per `06-data-model-and-tools.md` + `23-ambient-notification-strategy.md`:

### `notification_log`

`user_id`, `type`, `priority`, `content_ref`, `delivered_at`, `opened_at`, `dismissed_at`

### `notification_suppression`

`user_id`, `notification_type`, `suppressed_until`, `permanent`, dismiss count (extend per `03-suppression-state.md`)

### `notification_queue`

`user_id`, `type`, `priority`, `payload_json`, `earliest_deliver_at`, `expires_at`

**Execution rule:** all delivery checks run through Brain DO so suppression and active-session state are authoritative.

---

## Complete notification kinds inventory

> **Living snapshot (2026-06-12 audit).** For each kind: trigger owner, priority, delivery path, payload notes.

### Critical (always deliver)

| `type` / kind | Trigger source | Owner feature | Delivery path | Payload / copy notes |
|---|---|---|---|---|
| `allergy_safety_scan` | Active product scan — hard allergy/safety match | **24** scanner | Brain → send-push (immediate) | Critical; interrupt scan UI + push |
| `cooking_allergen_block` | Hard allergen in ingredient user about to cook with | **29** / **24** | Brain or Mira → send-push | Critical |
| `recall_alert_confirmed` | Recall worker match — confirmed lot | **31** Path B → Brain HTTP | Brain → send-push; no quiet hours | Title `Recall: [Product]`; body per `15-recall-alerts/03-critical-notification.md` |
| `recall_alert_probable` | Recall match — probable/broad lot | **31** | Same; lower copy certainty | Never "you have this" unless confirmed |

### High (contextual)

| `type` / kind | Trigger source | Owner | Path | Notes |
|---|---|---|---|---|
| `medication_reminder` | `scheduled_alarms` `medication_reminder` fire | **14** dispatch → **22** | OneSignal push (fallback after Vapi miss) | `idempotency_key` = alarm row id; deep link confirm |
| `travel_preload_ready` | `travel_preload` alarm complete | **14** → **35** | One quiet push allowed (`06-surfacing-and-privacy.md`) | "Food intel is ready" + map/deep link |
| `recipe_captured` | Post cooking session save | **29** | Brain → send-push or in-app | Spec 23 high example |
| `cooking_session_invite` | Family/friend invite | **29** / social TBD | send-push when contextual | High |
| `constraint_confirmed` | First confirmed allergy/preference | **04** brain / onboarding | send-push once | High |
| `bela_delivery_window` | Checkout / delivery confirmation | **42** Bela | send-push | High per spec 23 |
| `bela_order_placed_recipient` | Order placed for someone else | **42** | send-push to recipient | `bela/11-for-others.md` |
| `bela_groceries_arrived` | Delivery confirmed | **42** | push if app backgrounded | Recipient notification |
| `bela_standing_order_confirm` | Day-before delivery confirm prompt | **42** | push + in-app | Standing order flow |
| `bela_shopper_approved` | Shopper KYC approved | **42** shopper | push to shopper | Shopper mode |
| `bela_shopper_at_door` | Shopper arrival | **42** | push to user | |
| `sickness_followup` | `sickness_followup` alarm | **14** → **32** | Primarily inline **alarm session**; push optional | 24h after illness signal |

### Medium (max 1/day aggregate)

| `type` / kind | Trigger source | Owner | Path | Notes |
|---|---|---|---|---|
| `weekly_food_summary` | `weekly_food_summary` alarm / Sunday cron | **14** → **34** | Medium; Sunday AM local; competes for daily slot | `14-pantry-meal-plan/06-weekly-food-summary.md` |
| `price_alert` | Map/receipt threshold crossed | **28** map | Queue + geo timing | >15% increase / >10% decrease thresholds |
| `ground_moment` | Community note / find near user | **27** ground | Medium; geo + freshness | |
| `map_nearby_opportunity` | Farmers market / health store discovered | **28** | Medium + geo | |
| `tonight_dinner` | Learned decision window | **54** tonight | Push only after 2-week in-app-only cold start | Competes for medium slot |
| `harvest_edition_ready` | Anniversary Brain alarm | **53** harvest | **One notification once** — never re-pushed | `36-harvest/00-overview.md` |
| `scan_followup` | 7d after certain scans | **14** → **24** | Medium unless escalated | Alarm session or push TBD |
| `community_note_alert` | Multi-scan product + new note | **27** / scanner | Medium | Spec 23 medium example |
| `pantry_nudge` | Predictive pantry low stock | **34** | Medium or in-app | Pantry feature |
| `passport_prompt` | Passport generation milestone | **47** passport | Medium? — spec mentions push ask | `28-passport/03-generation-flow.md` |

### Low (in-app only — no push)

| Kind | Owner | Surface |
|---|---|---|
| Recipe suggestions | **08** / browse | In-app |
| Feature announcements | platform | In-app |
| Subscription prompts | **43** | In-app |
| Food pattern stats | **35** | On app open |
| Growth mirror observations | **40** | Conversational / in-app only |
| Recall informational (lot mismatch) | **31** | In-app downgrade |
| Wearables routine stats | **36** | Spec conflict: `20-wearables/05` mentions push for sleep/recovery — **prefer spec 23 low/in-app** unless product elevates (**G10**) |
| Viral / re-engagement | **51** | **Never push** |

### Not platform push (explicit)

| Kind | Mechanism | Owner |
|---|---|---|
| `cooking_timer` | Mira SDK schedule → inject Gemini message | **29** |
| `bela_live_scan_banner` | In-app persistent banner | **42** |
| `bela_soft_reconnect` | In-app soft notification | **42** |
| `ground_haptic_discovery` | Haptic pulse | **27** |
| Academic local reminders | `expo-notifications` local schedule | Legacy Schnl — ignore for Brioela |
| `in_app_notification` (payment/alert/transaction) | Postgres + WebSocket inbox | Legacy Schnl fintech — parallel system |

### Alarm types that may surface via push (via **14** dispatch)

Cross-ref **14** inventory: `medication_reminder`, `weekly_food_summary`, `travel_preload` (completion push), `sickness_followup` (usually session), `scan_followup`. Dispatch lives in **14**; send contract lives in **21**.

---

## In-app notifications (parallel system — not ambient push)

Shipped Postgres + WebSocket path for **legacy Schnl** inbox:

- Schema: `in_app_notifications` — types `payment`, `alert`, `transaction`, `security`, `system`
- API: `/v1/in-app-notifications/*`, WS ticket mint, broadcast on create
- **Not** governed by `23-ambient-notification-strategy.md` today

**Boundary:** Product food moments use Brain push path (**21**). Fintech inbox remains until replaced or unified (**G11**).

---

## Feature boundaries

| Concern | Owner |
|---|---|
| Push provider SDK (mobile), `OneSignal.login` | **21** mobile + **03** auth hook |
| Permission timing UX copy | **03** |
| `push/register`, token Postgres schema | **21** |
| `sendOneSignalPush` / unified send service | **21** |
| Brain `send-push`, `queue-notification`, suppression tables | **21** |
| Priority/delivery/suppression **rules** (product) | **21** spec; enforced in Brain tools |
| **What** to send (copy, trigger logic) | Product features (**31**, **22**, **42**, …) |
| Alarm fire → call push | **14** dispatch case → **21** send API |
| Recall match event → Brain | **31** |
| Medication Vapi call + fallback push | **22** calls **21** send helper |
| Mira timer | **29** — not **21** |
| Scanner critical allergy interrupt | **24** triggers **21** critical send |
| Tonight / Harvest copy + timing | **54** / **53** — **21** delivers |

---

## Naming drift and conflicts

| Drift | Resolution |
|---|---|
| Spec: OneSignal only | Production also uses Courier for register + stress send — **G1** |
| Build guide: Brain DO owns all sends | Production sends only in stress-test; no Brain tools — **G4–G6** |
| `devices.push_token` vs `push_notification` | Consolidate on `push_notification` + OneSignal external_id — **G7** |
| `notif-setup.tsx` / profile "Schnl" copy | Replace with Brioela **03** flow — **G9** |
| Medication helper raw OneSignal fetch in build guide | Route through **21** `sendPlatformPush` — **G8** |
| Wearables push mention vs low-priority stats | Prefer in-app unless product decision — **G10** |
| `push.send` in shared routes | Implement or remove from API surface — **G3** |
| In-app fintech inbox vs ambient push | Document dual systems — **G11** |
| Expo Go vs dev build for push | Document dev build requirement per Expo docs |

---

## Success metrics

From `23-ambient-notification-strategy.md`:

- Push open rate (target >30% medium)
- Dismissal rate per type
- Suppression trigger rate (quality proxy)
- Weekly summary re-engagement within 24h

---

## Sources (read for this migration)

### Implementable specs
- `implementable-specs/10-scheduled-alarms.md` (Path B recall — not scheduled push)
- `implementable-specs/bela/01-order-creation.md`, `04-live-scan-session.md`, `09-standing-order.md`, `11-for-others.md`, `02-shopper-platform.md`
- `implementable-specs/07-sessions.md` (alarm sessions that may send)

### Brioela specs
- `brioela-specs/23-ambient-notification-strategy.md`
- `brioela-specs/21-onboarding.md`
- `brioela-specs/26-personalized-recall-alerts.md`
- `brioela-specs/25-viral-growth-and-sharing.md`
- `brioela-specs/09-per-user-brain.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `brioela-specs/20-platform-and-app-distribution.md`
- `brioela-specs/49-harvest.md`
- `brioela-specs/53-growth-mirror.md`

### Build guides
- `build-guide/12-notifications/` (all 7 files)
- `build-guide/03-foundation/05-mobile-setup.md`
- `build-guide/04-auth-and-onboarding/01-supabase-auth-setup.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/14-pantry-meal-plan/06-weekly-food-summary.md`
- `build-guide/15-recall-alerts/03-critical-notification.md`, `00-overview.md`
- `build-guide/16-illness-detective/05-output-privacy-and-followup.md`
- `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`, `03-pre-trip-food-intelligence.md`, `06-surfacing-and-privacy.md`
- `build-guide/29-health-intelligence/02-medication-reminders.md`, `00-overview.md`
- `build-guide/10-map/05-price-alerts.md`
- `build-guide/38-tonight/02-timing-and-delivery.md`
- `build-guide/36-harvest/00-overview.md`
- `build-guide/20-wearables/05-feature-integration.md`
- `build-guide/08-cooking-session/05-timers.md`
- `build-guide/28-passport/03-generation-flow.md`

### Ledgers & records
- `_records/session-log/012-notifications-complete.md`
- `_records/session-log/037-health-intelligence-and-doc-cleanup.md`
- `_records/connections/08-notifications-connections.md`
- `_records/build-order/10-layer-notifications.md`

### Neighbor feature migrations
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/03-platform-auth-onboarding/status.md`

### External
- [Expo Notifications SDK](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo push notifications setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
