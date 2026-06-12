# Wearables — Spec

Feature **36**. Device connection (Apple HealthKit, Oura Ring Phase 1; CGM, Google Health Connect, Whoop, Withings Phase 2), client-side daily summary aggregation, Brain DO ingest, dual routing to `health_captures` (**22**) and `user_memory.health.*`, CGM scan-triggered meal windows and spike-trigger memory, privacy/disconnect/deletion, and consumer hooks for scanner, meal plan, ambient patterns, illness detective, Tonight, cooking session, craving decoder, Kin, and in-store copilot.

**Not in this feature:** `health_captures` / `health_events` table DDL and HealthInsightAgent reads (**22** — **36** writes captures; **22** owns schema); illness suspect ranking and Sift copy (**32** — optional read of wearable summaries); meal plan generation body (**34** — readiness modulation input only); ambient wellbeing capture and `wellbeing_signal` table (**35** — reads wearable corroboration); push delivery and suppression (**21** — wearables default in-app/low); medical condition profiles (**23**); Kin cluster aggregation and Supabase writes (**50** — consumes `glucose_meal_window` derived values only); scanner constraint-check orchestration (**24** — glucose overlay is additive); passport export UI (**47**).

**Living catalog note:** `WearableConnector.provider` and `WearableDataType` enums will grow as Phase 2 devices ship. New providers add client adapters + validation — not new Brain architecture. CGM vendors without compliant API access stay disabled until vendor review.

---

## Purpose

Population glycemic index and generic nutrition warnings ignore individual physiology. Brioela already knows what the user ate (scans, receipts, cooking). Wearables add what happened in the body after — sleep, recovery, HRV, and personal glucose response. The combination is personal metabolic intelligence tied to actual foods.

1. **Connect** devices with granular, platform-controlled permissions — never all-or-nothing health access.
2. **Aggregate** on the client — one compact daily summary per device (~500 bytes), never raw sensor streams to Cloudflare.
3. **Ingest** summaries into Brain DO SQLite privately — `health_captures` + rolling `user_memory.health.*` mirrors.
4. **Correlate** CGM readings with scan events in 2-hour meal windows; derive peak, AUC, time-to-peak; build `spike_trigger` facts after 3+ high-confidence windows.
5. **Integrate** derived state into scan verdicts, meal ranking, ambient corroboration, illness context, cooking tone — observational copy only.
6. **Protect** — disconnect stops sync; optional delete; no Supabase/Ground/analytics; export opt-in only.

Without **36**, all food intelligence uses population data; CGM cold-start blocks Kin (**50**); ambient and meal plan lack physiological modulation.

---

## Product definition

| Term | Meaning |
|---|---|
| **Connected Devices** | Settings surface where users connect/disconnect providers |
| **Wearable connector** | Brioela-owned adapter (`apple_health`, `oura`, `health_connect`, `dexcom`, …) — not a third-party aggregation SDK by default |
| **Daily summary** | Client-derived JSON for one local calendar day — sleep, recovery, activity, glucose aggregates |
| **Meal window** | 2-hour CGM observation opened on scan event; 15-minute interval readings during window only |
| **Derived metrics** | peak_mgdl, peak_time_min, auc, baseline_mgdl, return_to_baseline_min — raw readings deleted after derivation |
| **Spike trigger** | `user_memory` fact under `health.glucose:spike_triggers` after 3+ high-confidence windows for same product/pattern |
| **Readiness modulation** | Low recovery/sleep → simpler meals (**34**, **54**); high activity → higher-energy options when constraints allow |

**Design principle (non-negotiable):** Never stream raw sensor data to the Brain DO. Collect less, summarize early, store privately, surface rarely. Observations, not medical advice.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/20-wearables/`, `brioela-specs/40-wearables-integration.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/22`, `32`, `34`, `35`, `21`.

| Component | Type | In **36**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Connected Devices settings UI** | Mobile screen | **Yes** | No | User taps connect/disconnect | `01-connection-model.md` |
| **`WearableConnector` interface** | Mobile abstraction | **Yes** | No | Per-provider adapter | `01-connection-model.md` |
| **Apple HealthKit connector** | Mobile native (Phase 1) | **Yes** | No | iOS permission + local read | spec 40, `01` |
| **Oura Ring connector** | Mobile OAuth API V2 (Phase 1) | **Yes** | No | OAuth + pull summaries | spec 40, `01` |
| **Health Connect connector** | Mobile native (Phase 2) | **Yes** | No | Android aggregation | spec 40, `01` |
| **Dexcom / Abbott CGM connectors** | Mobile OAuth/API (Phase 2) | **Yes** | No | User-authorized APIs only | spec 40, `01`, `04` |
| **Whoop / Withings connectors** | Phase 2 | **Yes** | No | OAuth/native per vendor | spec 40 |
| **`wearable_connection` table** | Brain SQLite | **Yes** | No | Connection metadata + sync state | `01-connection-model.md` |
| **Client daily summary builder** | Mobile background + foreground | **Yes** | No | App open, foreground, BG task | `02-client-aggregation.md` |
| **`POST /api/wearables/daily-summary`** | Worker HTTP | **Yes** | No | Mobile upload batch | `02-client-aggregation.md` |
| **Daily summary validation** | Worker boundary | **Yes** | No | Plausible ranges, granted types | `02` |
| **Brain ingest handler** | Brain RPC/handler | **Yes** | No | Forward to DO memory routing | `03-memory-routing.md` |
| **`health_captures` append** | Brain SQLite write | **Yes** (writer) | No | **22** owns table | `06-brain-memory/01`, **22** |
| **`user_memory.health.*` mirror** | Brain `write_user_memory` path | **Yes** | Partial | Rolling summaries for prompts | `03-memory-routing.md`, spec 40 |
| **Personality promotion review** | Brain maintenance | **Cross** | No | 30+ day sustained patterns only | `03`, spec 40 |
| **`glucose_meal_window` table** | Brain SQLite private | **Yes** | No | CGM correlation rows | `04-cgm-food-response.md`, spec 40 |
| **Open meal window on scan** | Brain handler | **Yes** | No | Scan event + CGM connected | `04`, **24** scan hook |
| **CGM window reading ingest** | Mobile → Brain | **Yes** | No | 15-min intervals during 2h window | `04` |
| **Derive window metrics helper** | Brain pure fn | **Yes** | No | Peak, AUC, confidence | `04` |
| **`spike_trigger` memory write** | Brain helper | **Yes** | No | 3+ windows same product | `04` |
| **Scan verdict glucose overlay** | Scanner consumer | **Partial** | No | Personal response line | `05-feature-integration.md`, **24** |
| **Meal plan readiness rank** | **34** consumer | **No** | No | **36** supplies memory facts | `05`, spec 40 |
| **Ambient wearable corroboration** | **35** consumer | **No** | No | HRV/sleep vs voice signal | `05`, spec 17 `wearable_corroboration` |
| **Illness detective supporting context** | **32** consumer | **No** | No | Temp/RHR — not proof | `05`, spec 40 |
| **Tonight readiness bias** | **54** consumer | **No** | No | Low recovery → simple meals | spec 51, spec 40 |
| **Cooking session tone adaptation** | **29**/**20** consumer | **No** | No | Low-effort suggestions | `05` |
| **Craving decoder evidence** | **37** consumer | **No** | No | Sleep/HRV/glucose dynamics | spec 52 |
| **Kin contribution trigger** | **50** consumer | **No** | No | Derived window values only | spec 47, `34-kin/03` |
| **Disconnect + optional delete** | Mobile + Brain | **Yes** | No | Per-connection purge | `06-privacy-disconnect.md` |
| **Health data export opt-in** | Passport / settings | **Cross** | No | Summaries + derived only | `06`, spec 43 |
| **Wearable audit events** | Brain private log | **Yes** | No | Connect/ingest/delete — no raw values | `06` |
| **Push for sleep/recovery** | **21** policy | **Blocked** | — | In-app / weekly summary only | **21** G10 |

### Shipped in repo today (wearables-related)

- `build-guide/20-wearables/` — **7 files complete** (docs only).
- `brioela-specs/40-wearables-integration.md` — marked complete in inventory.
- `_records/connections/16-wearables-connections.md`, `_records/build-order/18-layer-wearables.md`, `_records/session-log/022-wearables-complete.md`.
- `mobile/biomarker/` — **placeholder types only** (`biomarker-data.types.ts` comments say "implementation deferred"); not wearables integration.
- `backend/src/core/ai/prompts/standardize-units.prompt.ts` — glucose unit conversion example only.
- **`rg wearable|HealthKit|glucose_meal|daily-summary backend/src shared/ mobile/`** — zero product wearables code.
- **No** Brain `wearable_connection` / `glucose_meal_window` schemas, handlers, routes, tests, or Connected Devices UI.

---

## Architecture

```text
Wearable device (Watch, Oura, CGM, Health Connect sources)
        │
        ▼ native SDK / OAuth — SERVER NEVER CALLS HealthKit
Mobile WearableConnector.buildDailySummary(localDate)
        │  ~500 bytes JSON per device per day
        ▼
POST /api/wearables/daily-summary  [Worker validates connection + ranges]
        │
        ▼ Brain RPC ingestWearableDailySummaries
BrioelaBrain DO
        │
        ├── INSERT health_captures (capture_type: wearable_daily_summary)
        │     source_connection_id, domain, metric_key, value_json
        │
        └── MERGE user_memory (health.biometrics | health.sleep | health.activity | health.glucose)
              source: wearable, sourceConnectionId, observedAt

Scan event [24] + CGM connected
        │
        ▼ openGlucoseMealWindow(scanEventId, productId)
        ├── status: open → derived | expired
        ├── Mobile sends GlucoseWindowReading[] at ~15 min intervals (2h only)
        ├── deriveGlucoseWindowMetrics → glucose_meal_window row (derived_json; raw deleted)
        └── 3+ high-confidence same product → health.glucose:spike_triggers user_memory

Session open [20]
        └── loadMemoryForPrompt() includes compact health.* summaries

Consumers (read only — not 36)
        ├── Scanner overlay [24]
        ├── Meal plan rank [34]
        ├── Ambient corroboration [35] — wellbeing_signal.wearable_corroboration
        ├── Sift supporting copy [32]
        ├── Tonight card [54]
        ├── Kin contribution [50] — derived window values, opt-in
        └── Craving decoder [37]
```

**Core rule:** Raw readings never reach Cloudflare except short CGM window batches during meal-adjacent 2-hour windows — deleted after derived metrics computed.

---

## Device phases

### Phase 1 (launch)

| Provider | Integration | Data types |
|---|---|---|
| **Apple HealthKit** | Native iOS permission | sleep, HRV, resting HR, activity, SpO₂, weight |
| **Oura Ring** | OAuth API V2 | sleep, readiness, HRV, temperature deviation |

### Phase 2 (prioritized)

| Provider | Integration | Notes |
|---|---|---|
| **Dexcom (G7/Stelo)** | User-authorized API | CGM meal windows — killer feature |
| **Abbott Libre** | User-authorized API | CGM |
| **Google Health Connect** | Android native | Aggregates Fitbit, Garmin, Samsung, … |
| **Whoop** | OAuth | strain, recovery, sleep |
| **Withings** | OAuth | weight, body composition trends |

Third-party wearable aggregation SDK is **not** default architecture (`00-overview.md`). Add only after separate vendor privacy/coverage review.

---

## Connection model

### Permission flow

1. User opens **Connected Devices** in settings.
2. User chooses provider (e.g. "Connect Apple Health").
3. Platform permission dialog or OAuth — Brioela does not fake consent.
4. User grants **specific** data types (sleep without glucose allowed).
5. Client records `WearableConnection`; first summary sync when data available.
6. Ongoing: sync on app open, foreground, successful BG task, or manual "Sync now".

### `WearableConnection` record (Brain SQLite)

```typescript
type WearableConnection = {
  connectionId: string
  userId: string
  provider: 'apple_health' | 'oura' | 'health_connect' | 'dexcom' | 'abbott' | 'whoop' | 'withings'
  connectionKind: 'native_permission' | 'oauth' | 'manual_import'
  grantedDataTypes: WearableDataType[]
  status: 'connected' | 'disconnected' | 'needs_reauth' | 'error'
  connectedAt: number
  lastSyncAt: number | null
  errorCode: string | null
}
```

OAuth tokens stored per provider policy on device or encrypted Brain-side — **never** Supabase. HealthKit/Health Connect permissions are OS-managed; no server token.

### Reauthorization

`needs_reauth` → stop sync for that provider; keep ingested data unless user disconnects/deletes; surface reauth in settings only — no nag loops.

---

## Client aggregation

### `WearableDailySummary` shape

Per `02-client-aggregation.md` — provider, connectionId, localDate, timezone, optional sections: sleep, recovery (readiness, HRV, temp deviation), activity, glucose daily aggregates. Target ~500 bytes.

### Sync timing

First robust path: **app-open sync**. Do not assume reliable background tasks on all platforms.

### Validation at Worker boundary

- Provider connected and owned by user
- Submitted fields ⊆ `grantedDataTypes`
- Date not far future; plausible value ranges
- Idempotent per `(connectionId, localDate)` — update not duplicate

Invalid field rejected individually — invalid SpO₂ must not discard valid sleep duration.

### No analytics copy

Wearable summaries are **not** product analytics. Brain DO only.

---

## Memory routing (dual write)

**Authoritative resolution (reconciles spec 40 vs `06-brain-memory/01` vs **22** G16/G17):**

| Data | Primary store | Mirror / derived |
|---|---|---|
| Daily summary raw payload | `health_captures` (`capture_type: wearable_daily_summary`, `source_connection_id`) | Rolling facts in `user_memory.health.*` |
| Recovery/sleep/activity rolling state | `user_memory` keys: `recovery_today`, `sleep_quality_trend`, `weekly_activity_level` | HealthInsightAgent reads `health_captures` history |
| CGM meal window derived metrics | `glucose_meal_window` table | Optional `health_captures` row per window for agent uniformity |
| Spike triggers | `user_memory` `health.glucose:spike_triggers` | Evidence: `glucose_meal_window` IDs in value JSON |
| Personality traits | `user_personality` via Brain maintenance only | 30+ day sustained patterns — never single-day |

### Namespace map (spec 40 + `03-memory-routing.md`)

| namespace | key | value holds |
|---|---|---|
| `health.biometrics` | `recovery_today` | readiness, HRV delta, resting HR |
| `health.biometrics` | `resting_hr_trend` | 30-day trend |
| `health.sleep` | `sleep_quality_trend` | 7-day rolling + last night |
| `health.activity` | `weekly_activity_level` | steps, active energy, workout min |
| `health.glucose` | `baseline_fasting` | personal fasting range |
| `health.glucose` | `spike_triggers` | product/ingredient spike patterns |

### Write shape

```typescript
type WearableMemoryWrite = {
  namespace: 'health.biometrics' | 'health.sleep' | 'health.activity' | 'health.glucose'
  key: string
  value: Record<string, unknown>
  confidence: number
  source: 'wearable'
  sourceConnectionId: string
  sourceProvider: string
  observedAt: number
}
```

Use Brain validated memory-write path — ingestion handler must not bypass tool/repository boundaries.

### Conflict resolution (Apple Health vs Oura overlap)

Keep provider-specific captures; compute resolved summary with confidence; prefer domain strengths (Oura readiness/sleep, HealthKit broad aggregator); disclose mixed signals in copy when recommendations would differ.

### Personality promotion (blocked from ingest path)

Examples after 30+ days: `physically-active`, `sleep-deprived`, `metabolically-sensitive`. Handled by Brain maintenance or ambient review — **not** daily summary ingestion.

---

## CGM food response

### Observation window

On product **scan** with CGM connected → open 2-hour window linked to `scan_event_id` + `product_id`.

```typescript
type GlucoseMealWindow = {
  windowId: string
  userId: string
  scanEventId: string
  productId: string | null
  openedAt: number
  closesAt: number
  status: 'open' | 'derived' | 'expired' | 'cancelled'
}
```

Do not open windows for non-food scans without eating intent when confidence is low.

### Reading collection

15-minute interval readings during window only — not continuous CGM stream.

```typescript
type GlucoseWindowReading = {
  relativeMinute: number
  glucoseMgdl: number
}
```

Raw readings deleted after `deriveGlucoseWindowMetrics` — long-term storage is derived JSON + scalar columns only.

### Derived metrics

peak_mgdl, peak_time_min, auc, baseline_mgdl, return_to_baseline_min, readingCount, confidence.

Low confidence when: multiple foods same window, scan-but-didn't-eat, workout during window, sparse readings, illness/stress markers elevated.

### Spike trigger rule

After **3+** high-confidence windows for same product/ingredient pattern → write `GlucoseSpikeTrigger` to `health.glucose:spike_triggers`. Copy stays observational.

### Scan verdict overlay (consumer **24**)

Allowed: *"Your past glucose response to this product has been high."*

Blocked: diagnosis, insulin dosing, emergency alerts, sharing glucose with community by default.

User can hide glucose overlays.

---

## Feature integrations (consumers — **36** supplies data only)

| Feature | Use | **36** provides |
|---|---|---|
| **24** Scanner | Verdict overlay after allergy/safety | `spike_triggers`, window history |
| **34** Pantry/meal plan | Rank complexity/energy | `recovery_today`, sleep trend, spike triggers |
| **35** Ambient | `wellbeing_signal.wearable_corroboration` | HRV/sleep vs conversational signal |
| **32** Illness detective | Supporting temp/RHR copy | `health_captures` summaries — never proves cause |
| **54** Tonight | Low readiness → simple nourishing dinner | Same memory keys as meal plan |
| **29**/**20** Cooking | Sparingly mention low recovery | `recovery_today`, spike triggers for substitutions |
| **37** Craving decoder | Physiological evidence tier | sleep/HRV/glucose dynamics |
| **50** Kin | Cluster fingerprint input | `glucose_meal_window` derived values — opt-in |
| **45** In-store copilot | Aisle swap with personal glucose evidence | `spike_triggers` |
| **23** Medical conditions | T2 + CGM evidence-based guidance | condition context + **36** feedback loop |

Wearable data **never** downgrades hard allergy blocks. Additive context only.

---

## Notifications (**21** boundary)

Per `05-feature-integration.md` vs `brioela-specs/23-ambient-notification-strategy.md` (**21** G10):

| Allowed | Blocked |
|---|---|
| In-app scan overlay | Push for normal sleep/recovery changes |
| Cooking-session conversational line | Emergency glucose alerts |
| Weekly summary observation (medium, if earned) | Fear-based glucose push |
| | Repeated wearable nagging |

**Default: in-app / conversational only.** Weekly summary may mention wearable trends if **34**/**21** caps allow — not dedicated wearable push.

Health insight weekly pass (**22**) is separate from wearable surfacing — no wearable-derived push by default.

---

## Privacy and disconnect

### Non-negotiables (spec 40 + `06-privacy-disconnect.md`)

- Brain DO SQLite only — never Supabase, Ground, shared map/menu/community tables.
- No ad targeting, insurer/employer sharing, generic analytics pipelines.
- Raw readings not stored long-term (CGM window raw deleted after derivation).
- "What Brioela knows about me" (**47** passport) lists health biometric memories with per-entry delete.
- Default export **excludes** health data — explicit opt-in required.
- Observational language only — no diagnose, treat, prescribe, dose insulin, emergency monitoring.

### Disconnect flow

1. Stop future sync immediately.
2. Mark connection `disconnected`.
3. Ask: disconnect only vs disconnect and delete stored data.
4. If delete: remove `health.*` memories with `sourceConnectionId`, `health_captures` for connection, `glucose_meal_window` rows from that provider, OAuth tokens, sync metadata.
5. Flag `user_personality` traits citing wearable evidence for Brain maintenance review (do not auto-delete mixed-evidence traits).

### Audit trail (private)

Events: connected, permissions granted, summary ingested, memory written, window derived, disconnected, data deleted. **No raw health values** in audit payloads.

---

## What this does not do

- Diagnose, treat, or prescribe; glucose correlations are observations.
- Replace Dexcom/Libre official apps — read authorized data only.
- Real-time health monitoring or emergency alerts.
- Access health data without per-data-type permission.
- Share health data with third parties.

---

## Success metrics (spec 40)

- Wearable connection rate among active users.
- Sleep data influence rate on session recommendations.
- CGM correlation count per CGM user per month.
- Scan verdict engagement uplift for CGM vs non-CGM users.
- Illness detection lead time (Oura temperature deviation vs user-reported illness).

---

## Feature boundaries

| In **36** | In neighbor feature |
|---|---|
| Connectors, client aggregation, upload API | `health_captures` DDL, HealthInsightAgent (**22**) |
| `wearable_connection`, `glucose_meal_window` tables | `medications`, `health_events` (**22**) |
| Ingest + memory routing + CGM correlation | Scan constraint orchestration (**24**) |
| Disconnect/delete/audit | Push send rules (**21**) |
| Spike trigger writes | Kin Supabase aggregates (**50**) |
| SDK + daily summary pipeline | Sift ranking (**32**) |
| | Meal plan generator (**34**) |
| | Ambient wellbeing tables (**35**) |
| | Medical condition rules (**23**) |

---

## Conflicts and resolutions

| Conflict | Resolution |
|---|---|
| Spec 40 routes daily summaries to `user_memory` only; `06-brain-memory/01` + **22** route measurements to `health_captures` | **Dual write:** captures = operational append log; `user_memory` = rolling prompt summaries |
| `glucose_meal_window` private table vs generic `health_captures` (**22** G17) | **Keep dedicated `glucose_meal_window`** for scan-linked derived metrics + Kin; optional mirror row in `health_captures` for HealthInsight pass |
| `brioela-specs/34-universal-visual-intake` `health_signals` / `health_signal_event` vs Brain tables | **Superseded by `health_captures` + `health_events`** per session 037 — manual glucose photo → `health_captures`, not legacy Supabase table |
| `20-wearables/05` weekly summary push vs spec 23 low/in-app (**21** G10) | **In-app default; no routine wearable push** |
| Spec 40 `readings_json` in `glucose_meal_window` vs build-guide derived-only | **Prefer build-guide:** raw readings ephemeral; `derived_json` + scalars persisted |
| `mobile/biomarker/` placeholder vs wearables | **Separate concern** — lab biomarker UI deferred; wearables use Connected Devices + connectors |

---

## Sources (read for this migration)

### Build guides — wearables (all files)
- `build-guide/20-wearables/00-overview.md`
- `build-guide/20-wearables/01-connection-model.md`
- `build-guide/20-wearables/02-client-aggregation.md`
- `build-guide/20-wearables/03-memory-routing.md`
- `build-guide/20-wearables/04-cgm-food-response.md`
- `build-guide/20-wearables/05-feature-integration.md`
- `build-guide/20-wearables/06-privacy-disconnect.md`

### Build guides — cross-refs
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/06-brain-memory/04-visual-intake.md`
- `build-guide/05-brain/00-overview.md`
- `build-guide/07-scanner/03-constraint-check.md`
- `build-guide/07-scanner/07-community-product-intelligence.md`
- `build-guide/12-notifications/01-priority-model.md`
- `build-guide/16-illness-detective/00-overview.md`
- `build-guide/16-illness-detective/05-output-privacy-and-followup.md`
- `build-guide/18-ambient-intelligence/02-behavioral-patterns.md`
- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/34-kin/01-fingerprint-and-clustering.md`
- `build-guide/34-kin/03-contribution-pipeline.md`
- `build-guide/34-kin/05-opt-in-opt-out.md`
- `build-guide/38-tonight/00-overview.md`
- `build-guide/39-craving-decoder/00-overview.md`

### Brioela specs
- `brioela-specs/40-wearables-integration.md`
- `brioela-specs/09-per-user-brain.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md` (wearable_corroboration)
- `brioela-specs/23-ambient-notification-strategy.md`
- `brioela-specs/28-medical-condition-food-profile.md`
- `brioela-specs/34-universal-visual-intake.md`
- `brioela-specs/45-in-store-copilot.md`
- `brioela-specs/47-kin.md`
- `brioela-specs/51-tonight-dinner-answer.md`
- `brioela-specs/52-craving-decoder.md`

### Ledgers & records
- `_records/connections/16-wearables-connections.md`
- `_records/build-order/18-layer-wearables.md`
- `_records/session-log/022-wearables-complete.md`
- `_records/session-log/037-health-intelligence-and-doc-cleanup.md`
- `_records/inventory/inventory.md`

### Neighbor feature migrations
- `_features/22-health-intelligence/spec.md`
- `_features/32-illness-detective/spec.md`
- `_features/34-pantry-meal-plan/spec.md`
- `_features/35-ambient-intelligence/spec.md`
- `_features/21-platform-notifications/spec.md`
