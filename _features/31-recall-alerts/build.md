# Recall Alerts — Build

Feature **31**. Production paths under `backend/src/jobs/recall/` (global poll + match), `backend/src/api/recall/` (user-facing alerts API), `backend/src/agents/brain/_handlers/recall/` (Path B Brain HTTP), `shared/drizzle/schema/recall.schema.ts`, `shared/validator/recall/`, and `mobile/features/recall/`.

**Scope:** FDA/EFSA/RASFF/CFIA feed polling, `recall_entry` ingestion, batch matching against `scan_events` / `product_exposure`, Path B Brain notify handler, critical push trigger via **21**, recall detail + resolve API, mobile recall screen. **Not in 31 build:** `scan_events` writer (**24**), `send-push` tool body (**21**), illness ranking (**32**), receipt/pantry/Bela exposure writers (**33**, **34**, **42**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/15-recall-alerts/` (6 files) | ✓ docs only |
| `brioela-specs/26-personalized-recall-alerts.md` | ✓ spec |
| `backend/src/api/recall/` | ✗ |
| `backend/src/jobs/recall/` | ✗ |
| Brain `/internal/recall-match` handler | ✗ |
| `shared/drizzle/schema/recall.schema.ts` | ✗ |
| `shared/validator/recall/` | ✗ |
| `shared/routes/recall.routes.ts` | ✗ |
| QStash recall poll cron | ✗ |
| Upstash Workflow match pipeline | ✗ |
| Mobile `features/recall/` | ✗ |
| Tests | ✗ |

**Zero recall code.** `rg recall backend/src shared/` — no product recall matches.

---

## File manifest

### Shared — Supabase Drizzle (**31**)

| File | Role |
|---|---|
| `shared/drizzle/schema/recall.schema.ts` | `recall_entry`, `recall_scan_match` |
| `shared/drizzle/schema/product.exposure.schema.ts` | Unified exposure ledger |
| `shared/drizzle/migrations/*` | Postgres migrations + indexes |
| `shared/validator/recall/recall.alert.schema.ts` | `RecallEntrySchema`, `RecallScanMatchSchema`, confidence enum |
| `shared/validator/recall/recall.notify.schema.ts` | Brain HTTP payload for Path B |
| `shared/routes/recall.routes.ts` | `RECALL_ROUTES`, `RECALL_ROUTE_PATTERNS` |

### Backend — global jobs (**31**)

| File | Role |
|---|---|
| `backend/src/jobs/recall/poll.recall.feeds.job.ts` | QStash cron entry — FDA 15m, others hourly |
| `backend/src/jobs/recall/_adapters/fda.recall.adapter.ts` | FDA API normalize |
| `backend/src/jobs/recall/_adapters/efsa.recall.adapter.ts` | EFSA normalize |
| `backend/src/jobs/recall/_adapters/cfia.recall.adapter.ts` | CFIA normalize |
| `backend/src/jobs/recall/_adapters/rasff.recall.adapter.ts` | RASFF normalize |
| `backend/src/jobs/recall/_helpers/diff.recall.cursor.helper.ts` | Last-seen cursor per source |
| `backend/src/jobs/recall/_helpers/upsert.recall.entry.helper.ts` | Insert net-new `recall_entry` |
| `backend/src/jobs/recall/match.recall.entry.handler.ts` | One recall → batch exposure query |
| `backend/src/jobs/recall/_helpers/classify.match.confidence.helper.ts` | confirmed / probable / informational |
| `backend/src/jobs/recall/_helpers/notify.user.recall.match.helper.ts` | HTTP → Brain DO per user |
| `backend/src/jobs/recall/recall.match.workflow.ts` | Upstash Workflow: ingest → match → notify |
| `backend/src/jobs/recall/index.ts` | Barrel |

Register QStash schedules in Worker bootstrap (**01**). FDA cron: `*/15 * * * *`; others: `0 * * * *` unless env override.

### Backend — scan-time reverse check (**31** + **24** hook)

| File | Role |
|---|---|
| `backend/src/jobs/recall/check.recall.on.scan.handler.ts` | Called from **24** after `scan_events` insert |
| `backend/src/jobs/recall/_helpers/find.active.recalls.for.product.helper.ts` | UPC/lot lookup |

**24** calls `enqueueRecallScanCheck({ scanEventId, userId, upc, lot?, capturedAt })` — does not implement match logic.

### Backend — user API (**31**)

| File | Role |
|---|---|
| `backend/src/api/recall/recall.route.ts` | Hono mount |
| `backend/src/api/recall/recall.controller.ts` | Controller |
| `backend/src/api/recall/_handlers/list.recall.alerts.handler.ts` | `GET /api/recall/alerts` |
| `backend/src/api/recall/_handlers/get.recall.alert.handler.ts` | `GET /api/recall/alerts/:matchId` |
| `backend/src/api/recall/_handlers/resolve.recall.alert.handler.ts` | `POST …/resolve` — "I discarded it" |
| `backend/src/api/recall/_handlers/index.ts` | Barrel |
| `backend/src/api/recall/index.ts` | Module export |

### Backend — Brain DO Path B (**31**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_handlers/recall/handle.recall.match.handler.ts` | `POST /internal/recall-match` |
| `backend/src/agents/brain/_handlers/recall/handle.recall.retraction.handler.ts` | Retraction follow-up push |
| `backend/src/agents/brain/_helpers/build.recall.push.payload.helper.ts` | Copy rules confirmed vs probable |
| Brain fetch route registration | Wire internal recall endpoints on `BrioelaBrain` |

Handler calls **21** `send-push` executable (when shipped) — not raw OneSignal.

### Mobile (**31**)

| File | Role |
|---|---|
| `mobile/features/recall/recall.feature.tsx` | Detail screen root |
| `mobile/features/recall/_components/recall-detail-card.tsx` | Product photo, lots, reason |
| `mobile/features/recall/_components/discard-confirm-button.tsx` | "I discarded it" CTA |
| `mobile/network/recall/recall.api.ts` | List/get/resolve API |
| `mobile/network/recall/use.recall.alerts.hook.ts` | React Query |
| `mobile/app/recall/[matchId].tsx` | Deep link from push `data.screen` |

### Integration hooks (other features write; **31** reads)

| Caller | Hook |
|---|---|
| **24** `resolve.scan.handler.ts` | `enqueueRecallScanCheck` after `scan_events` insert |
| **33** receipt match | Insert `product_exposure` + optional match enqueue |
| **34** pantry confirm | Insert `product_exposure` |
| **42** Bela checkout | Insert `product_exposure` |
| **32** illness detective | Read `recall_entry` WHERE active — no write |

---

## Dependency order

```text
01-platform-foundation (Hono, Supabase, QStash, Workflow clients)
  → 04-brain-foundation (Brain DO internal routes)
  → 21-platform-notifications (send-push + critical bypass — partial today)
  → 24-scanner (scan_events — unshipped; blocks MVP match)
  → 31-recall-alerts (this feature)
      → 32-illness-detective (recall_entry read for ranking)
```

`product_exposure` ledger can ship with **31** before **33**/**34**/**42** — MVP matches `scan_events` only.

---

## Acceptance criteria

### Feed polling

- [ ] FDA poll runs on 15-minute QStash schedule; EFSA/RASFF/CFIA on hourly
- [ ] Polling runs in global Worker job — never inside per-user Brain DO
- [ ] Net-new recalls upserted to `recall_entry`; duplicates skipped via source+external id
- [ ] Retracted recalls update `recall_entry.status` and enqueue retraction notify

### Matching

- [ ] One SQL query per `recall_entry` against all `scan_events` (indexed UPC/product_id)
- [ ] `match_confidence` = `confirmed` | `probable` | `informational` per spec rules
- [ ] Probable: product match + (all lots OR unknown lot) + scan within 90 days
- [ ] Informational: lot mismatch → no critical push
- [ ] `recall_scan_match` idempotent — no duplicate notify for same recall+user+exposure

### Path B notification

- [ ] Match worker calls Brain HTTP — **no** `scheduled_alarms` row for recall
- [ ] **No** `recall_check` case in **14** `dispatchAlarm`
- [ ] Confirmed → `recall_alert_confirmed` critical push via **21**
- [ ] Probable → `recall_alert_probable` critical push; copy never says "you have this"
- [ ] Critical bypasses quiet hours and suppression (**21** rules)
- [ ] `notified_at` set on `recall_scan_match` after successful send

### Scan-time reverse check

- [ ] **24** triggers check on new `scan_events` row
- [ ] Active recall for UPC/lot → same Brain Path B path as feed-driven match

### API + mobile

- [ ] `GET /api/recall/alerts` returns user's open matches
- [ ] Detail shows product photo, verbatim reason, lot highlight, official link
- [ ] `POST resolve` sets `resolved_at`
- [ ] Push deep link opens recall detail screen

### Conflicts resolved at implementation

- [ ] Brain init does **not** seed `recall_check` scheduled alarm
- [ ] `05-alarm-system.md` scheduled `recall_check` not implemented in **14**

### Tests

- [ ] `classify.match.confidence` unit tests (confirmed / probable / informational)
- [ ] Batch match query integration test with fixture `scan_events`
- [ ] Brain handler mock: critical push payload shape
- [ ] Idempotent notify — second enqueue does not double-push

---

## Obsolete sources (do not implement)

| Source | Why obsolete |
|---|---|
| `05-alarm-system.md` `recall_check` every 6h | Replaced by global QStash poll + Path B notify |
| `06-brain-memory/01-sqlite-schema.md` recall_check first-boot seed | Same |
| Per-user FDA polling inside Brain DO | Spec forbids — global cron only |
