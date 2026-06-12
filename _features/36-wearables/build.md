# Wearables — Build

Feature **36**. Production paths under `mobile/features/wearables/` (connectors, aggregation, Connected Devices UI), `backend/src/api/wearables/` (daily-summary + CGM window HTTP), `shared/validator/wearables/`, `shared/routes/wearables.routes.ts`, and `backend/src/agents/brain/_schemas/wearable.*.ts`, `_handlers/wearables/`, `_repositories/wearable.*.ts`.

**Scope:** connector interface, connection records, client daily summaries, Worker upload validation, Brain ingest + dual routing (`health_captures` + `user_memory`), CGM meal windows + spike triggers, disconnect/delete/audit, scan-hook for window open. **Not in 36 build:** `health_captures` table DDL (**22**), HealthInsightAgent (**22**), scanner constraint-check file (**24**), meal plan generator (**34**), ambient wellbeing tables (**35**), push platform (**21**), Kin Supabase pipeline (**50**), illness Sift ranking (**32**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/20-wearables/` (7 files) | ✓ docs only |
| `brioela-specs/40-wearables-integration.md` | ✓ spec |
| `_records/connections/16-wearables-connections.md` | ✓ ledger |
| `mobile/biomarker/types/biomarker-data.types.ts` | ✓ placeholder — **not** wearables |
| Brain `wearable_connection` / `glucose_meal_window` | ✗ |
| `POST /api/wearables/daily-summary` | ✗ |
| Mobile HealthKit / Oura connectors | ✗ |
| Connected Devices UI | ✗ |
| CGM meal window pipeline | ✗ |
| Wearables tests | ✗ |

**Zero wearables production code.** `rg 'wearable|HealthKit|glucose_meal|daily-summary' backend/src shared/ mobile/features` — no matches.

---

## File manifest

### Shared validator + routes (**36**)

| File | Role |
|---|---|
| `shared/validator/wearables/wearable.connection.schema.ts` | `WearableConnection`, provider enums |
| `shared/validator/wearables/wearable.daily.summary.schema.ts` | `WearableDailySummary` + request/response |
| `shared/validator/wearables/glucose.window.schema.ts` | Window, readings, derived metrics |
| `shared/routes/wearables.routes.ts` | `WEARABLES_ROUTES` constants |

### Brain SQLite schemas (**36**)

| File | Role |
|---|---|
| `_schemas/wearable.connection.schema.ts` | `wearable_connection` |
| `_schemas/glucose.meal.window.schema.ts` | `glucose_meal_window` |
| `_schemas/wearable.audit.event.schema.ts` | Private audit log (no raw values) |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add wearables tables to Brain chain |

**Cross-ref — owned by 22, written by 36:**

| File | Role |
|---|---|
| `_schemas/health.captures.schema.ts` | **22** DDL — **36** calls `write.health.capture` |

### Repositories (**36**)

| File | Role |
|---|---|
| `_repositories/read.wearable.connections.repository.ts` | List active connections |
| `_repositories/read.wearable.connection.by.id.repository.ts` | Validate upload ownership |
| `_repositories/write.wearable.connection.repository.ts` | Connect/disconnect/reauth |
| `_repositories/write.health.capture.repository.ts` | **22** repo — daily summary rows |
| `_repositories/read.glucose.meal.windows.repository.ts` | Product spike history |
| `_repositories/write.glucose.meal.window.repository.ts` | Open/update/derive windows |
| `_repositories/write.wearable.audit.event.repository.ts` | Audit trail |
| `_repositories/delete.wearable.data.by.connection.repository.ts` | Disconnect purge |

### Brain handlers — ingest + routing (**36**)

| File | Role |
|---|---|
| `_handlers/wearables/ingest.wearable.daily.summary.handler.ts` | RPC entry from Worker |
| `_handlers/wearables/route.wearable.memory.helper.ts` | `health_captures` + `user_memory` dual write |
| `_handlers/wearables/merge.resolved.wearable.summary.helper.ts` | Multi-provider conflict resolution |
| `_handlers/wearables/open.glucose.meal.window.handler.ts` | Called from scan pipeline hook |
| `_handlers/wearables/ingest.glucose.window.readings.handler.ts` | Short-window CGM batch |
| `_handlers/wearables/derive.glucose.window.metrics.helper.ts` | Peak, AUC, confidence; delete raw |
| `_handlers/wearables/evaluate.spike.trigger.helper.ts` | 3+ windows → spike memory |
| `_handlers/wearables/write.spike.trigger.memory.helper.ts` | `health.glucose:spike_triggers` |
| `_handlers/wearables/disconnect.wearable.handler.ts` | Stop sync + optional delete prompt data |
| `_handlers/wearables/delete.wearable.data.handler.ts` | Purge by `source_connection_id` |
| `_handlers/wearables/flag.wearable.personality.traits.helper.ts` | Brain maintenance queue |

### Backend API — wearables module (**36**)

| File | Role |
|---|---|
| `backend/src/api/wearables/wearables.route.ts` | Hono mount `/api/wearables` |
| `backend/src/api/wearables/wearables.controller.ts` | Controller wiring |
| `backend/src/api/wearables/_handlers/post.wearable.daily.summary.handler.ts` | Validate → Brain RPC |
| `backend/src/api/wearables/_handlers/post.wearable.connect.handler.ts` | Register connection metadata |
| `backend/src/api/wearables/_handlers/post.wearable.disconnect.handler.ts` | Disconnect flow |
| `backend/src/api/wearables/_handlers/get.wearable.connections.handler.ts` | List for settings UI |
| `backend/src/api/wearables/_handlers/post.glucose.window.readings.handler.ts` | CGM window upload |
| `backend/src/api/wearables/_handlers/index.ts` | Barrel |
| `backend/src/api/wearables/index.ts` | Module export |

Register in backend app router (**01**).

### Scanner integration hook (**36** body; **24** calls)

| File | Role |
|---|---|
| `_handlers/wearables/on.product.scan.open.glucose.window.helper.ts` | Scan event → open window if CGM |
| `tools/product-scan/build.glucose.verdict.overlay.helper.ts` | **24** consumer — personal line |

### Mobile — connectors + UI (**36**)

| File | Role |
|---|---|
| `mobile/features/wearables/types/wearable.connector.types.ts` | `WearableConnector`, `WearableDataType` |
| `mobile/features/wearables/connectors/apple.health.connector.ts` | HealthKit read + aggregate |
| `mobile/features/wearables/connectors/oura.connector.ts` | OAuth V2 + pull |
| `mobile/features/wearables/connectors/health.connect.connector.ts` | Phase 2 Android |
| `mobile/features/wearables/connectors/dexcom.connector.ts` | Phase 2 CGM |
| `mobile/features/wearables/helpers/build.daily.summary.helper.ts` | HRV baseline, sleep score derivation |
| `mobile/features/wearables/helpers/sync.wearable.summaries.helper.ts` | App-open batch upload |
| `mobile/features/wearables/helpers/sync.glucose.window.readings.helper.ts` | 15-min interval during open window |
| `mobile/features/wearables/api/wearables.api.ts` | HTTP client |
| `mobile/features/wearables/hooks/use-wearable-connections.ts` | Settings state |
| `mobile/features/wearables/screens/connected.devices.screen.tsx` | Connect/disconnect UX |
| `mobile/features/wearables/components/provider.card.tsx` | Per-provider row |
| `mobile/features/wearables/components/disconnect.confirm.sheet.tsx` | Delete data choice |

### Expo / native config (**36**)

| File | Role |
|---|---|
| `mobile/app.json` | HealthKit usage descriptions (iOS) |
| `mobile/plugins/with-health-connect.ts` | Phase 2 Android permissions |

---

## Acceptance criteria

### Connection (Phase 1)

- [ ] User can open Connected Devices and connect Apple Health with granular data-type grants.
- [ ] User can connect Oura via OAuth V2; V1 paths not used.
- [ ] Connection metadata stored in Brain `wearable_connection` — not Supabase.
- [ ] Reauth state stops sync without deleting existing data until user chooses delete.
- [ ] Server never calls HealthKit or Health Connect directly.

### Client aggregation

- [ ] Daily summary JSON ≤ ~500 bytes typical; no raw minute-level streams uploaded.
- [ ] Sync on app open succeeds; manual sync button works.
- [ ] Invalid field rejected without discarding valid sections of same summary.
- [ ] Summaries not sent to analytics or non-Brain endpoints.

### Brain ingest + routing

- [ ] Accepted summary creates `health_captures` row with `source_connection_id`.
- [ ] Rolling `user_memory.health.*` keys updated via validated memory path.
- [ ] Duplicate `(connectionId, localDate)` is idempotent update.
- [ ] Personality traits **not** written from single-day ingest.

### CGM (Phase 2 — may ship after Phase 1 connectors)

- [ ] Scan with CGM connected opens 2-hour `glucose_meal_window`.
- [ ] Mobile sends ~15-min interval readings only during open window.
- [ ] After close: derived metrics persisted; raw readings not retained.
- [ ] 3+ high-confidence same-product windows create `spike_triggers` memory.
- [ ] Scan overlay shows personal glucose line when memory exists; user can hide.
- [ ] No emergency alerts or insulin language.

### Privacy / disconnect

- [ ] Disconnect stops sync immediately.
- [ ] "Delete stored data" removes memories, captures, windows, tokens for that connection.
- [ ] Mixed-evidence personality traits flagged — not silently deleted.
- [ ] Default export excludes wearable data; opt-in export includes summaries + derived only.
- [ ] Audit events recorded without raw health values.

### Integrations (consumer smoke — after **36** data exists)

- [ ] **24** scan overlay reads spike triggers without blocking allergies.
- [ ] **34** meal plan rank receives readiness facts when present.
- [ ] **35** ambient pass can set `wearable_corroboration` on wellbeing signals.
- [ ] **32** Sift may include supporting wearable copy — never "proves poisoning."
- [ ] **21** no push fired for routine sleep/recovery change.

### Tests

- [ ] `derive.glucose.window.metrics` unit tests (peak, AUC, confidence gates).
- [ ] `route.wearable.memory` dual-write integration smoke.
- [ ] Daily summary validation rejects out-of-range without full reject.
- [ ] Disconnect purge removes all `source_connection_id` rows.
- [ ] Idempotent daily summary re-upload.

---

## Build order dependencies

| Depends on | Why |
|---|---|
| **04** Brain foundation + migrations | New SQLite tables |
| **05** memory tools | `write_user_memory` path for mirrors |
| **22** `health_captures` schema | Ingest target (can stub repo until **22** lands) |
| **24** scan events | CGM window trigger + overlay mount point |
| **01** Worker router | `/api/wearables` mount |

| Blocks | Why |
|---|---|
| **50** Kin | `glucose_meal_window` derived values |
| **32** optional wearable context | Reads summaries after ingest |
| **34**/**54** readiness modulation | Needs memory facts |
| **35** corroboration | Needs HRV/sleep summaries |
| **37** craving decoder physiological tier | Needs wearables memory |
| **45** in-store glucose swap copy | Needs spike triggers |

---

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **22** | `_features/22-health-intelligence/draft/health.captures.schema.gap.md` |
| **24** | Scanner constraint-check — glucose overlay hooks in **36** `scan.glucose.overlay.helper.gap.md` |
| **35** | `wellbeing.signal.schema.gap.md` — add `wearable_corroboration` column at implementation |
| **21** | No wearable push — policy in **21** G10 |

---

## Draft folder

See `draft/gap-index.md` — **20** snapshot files (schemas, handlers, API, mobile connectors, scan overlay).
