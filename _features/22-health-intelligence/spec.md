# Health Intelligence — Spec

Feature **22**. Private health data in Brain DO SQLite (medications, health events, health captures), medication reminder delivery (Vapi voice call primary, OneSignal push fallback via **21**), weekly **HealthInsightAgent** correlation pass (`health_insight_run` alarm), and k-anonymous community Postgres contribution (8 tables). Makes Brioela a health intelligence platform — not just a food scanner.

**Not in this feature:** Brain sub-agent spawn infrastructure pattern (**12** — catalog only for HealthInsightAgent); alarm dispatch router case wiring (**14** — owns `medication_reminder` / `health_insight_run` switch); push delivery rules and token registration (**21**); medical condition profiles and Supabase `condition_rule` config (**23**); illness detective suspect ranking (**32** — cross-refs `health_events`); wearables connection SDK and client aggregation (**36** — ingests into `health_captures`); scanner constraint-check orchestration (**24** — reads `medications` via Brain RPC).

**Living catalog note:** Health agents, alarm types, capture domains, and community table consumers will grow. Feature **12** agent inventory lists HealthInsightAgent as cross-ref; this folder owns health-specific behavior. When adding health surfaces (new capture types, new reminder channels, new community signals), update this spec inventory **and** neighbor features (**14**, **21**, **24**, **36**).

---

## Purpose

Users track medications, symptoms, labs, and biometrics privately. Brioela:

1. Stores operational health truth in Brain DO SQLite — never identifiable Supabase rows.
2. Schedules medication reminders as `scheduled_alarms` rows (`medication_reminder`) with outcomes on `action_outcome_*`.
3. Runs a weekly background **HealthInsightAgent** to detect food–health correlations and medication adherence patterns.
4. Contributes anonymized aggregate signals to community Postgres when user opts in **and** k-anonymity ≥ 100.
5. Feeds scanner medication-food interaction checks and community health association overlays (**24**).

Without **22**, medication reminders, health correlation, and community health flywheel do not exist.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/29-health-intelligence/`, `06-brain-memory/01-sqlite-schema.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/12`, `14`, `21`.

| Component | Type | In **22**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **`medications` table** | Brain SQLite | **Yes** | No | CRUD via Brain tools/RPC; scan reads active rows | `01-medication-tracking.md`, `06-brain-memory/01-sqlite-schema.md` |
| **`health_events` table** | Brain SQLite | **Yes** | No | Symptom/outcome log; correlation input | Same |
| **`health_captures` table** | Brain SQLite | **Yes** | No | Measurements, labs, prescriptions, documents, wearables | Same; **36** ingests here |
| **`user_memory.health.*` mirror** | Brain SQLite | Partial | Partial | Prompt summary only — not operational source | `02-user-memory.md`, `01-medication-tracking.md` |
| **Medication CRUD / ingestion** | Brain handlers + vision | **Yes** | Partial | Photo, voice, manual, prescription PDF | `01-medication-tracking.md`, `04-visual-intake.md` |
| **`scheduleMedicationReminders`** | Brain helper | **Yes** | No | On medication create → `scheduled_alarms` rows | `01-medication-tracking.md` |
| **`medication_reminder` alarm** | Inline dispatch handler | **22** body, **14** case | No | Daily fire → Vapi or push | `02-medication-reminders.md`, **14** spec |
| **Vapi voice call** | Worker HTTP + webhook | **Yes** | No | High-stakes meds only | `02-medication-reminders.md` |
| **Medication push fallback** | Calls **21** send helper | **22** trigger, **21** send | No | Low-stakes / no-answer / Vapi fail | `02-medication-reminders.md`, **21** G8 |
| **`action_outcome_*` on alarm row** | `scheduled_alarms` columns | Shared schema | **Yes** | Call/push adherence outcome | `scheduled.alarm.schema.ts`, `06-brain-memory/01-sqlite-schema.md` |
| **HealthInsightAgent** | Brain child sub-agent DO | **Yes** | No | `health_insight_run` weekly | `03-health-insight-agent.md`, **12** catalog |
| **`health_insight_run` alarm** | Scheduled + self-reschedule | **Yes** | No | First-boot seed +7d; agent reschedules | `03-health-insight-agent.md` |
| **Community health 8 tables** | Supabase Postgres | **Yes** | No | Health Insight Pass 3 + scanner reads | `04-community-health-tables.md`, `07-community-product-intelligence.md` |
| **Medication-food interaction at scan** | Scanner constraint check | **22** data, **24** check | No | Brain RPC `readActiveMedications` | `07-scanner/03-constraint-check.md` |
| **AI extraction (prescription)** | Worker function | Partial | Partial | `extractMedications` — not wired to Brain | `extract-medications.ts` |
| **Legacy medications REST API** | Supabase-era routes | Out of scope | No routes mounted | `medications.routes.ts` — superseded by Brain DO | `shared/api/medications.routes.ts` |
| **Mobile medications UI** | React Native | **Yes** | No | List, confirm reminder, add med | `mobile/network/medications/` stubs only |

### Shipped in backend today (health-related)

- `scheduled_alarms.action_outcome_status` / `action_outcome_json` columns (**04** schema) — ready for medication outcomes.
- AI extraction: `extractMedications`, `MedicationSchema`, `PrescriptionDocumentSchema`, prompts.
- Stub queue job: `medications.job.ts` + `extract-data.job.ts` (TODOs, wrong storage target).
- Mobile API client stubs: `medications.api.ts`, `use-medications.ts`.
- `write.user.memory.schema.ts` documents `health.medications` namespace.

**Not shipped:** Brain health tables, HealthInsightAgent DO, Vapi integration, medication reminder handler, community-health Drizzle schema, spawn/seed handlers.

---

## Architecture

```text
User input (photo / voice / wearable / manual)
        │
        ▼
Brain DO — permanent SQLite truth
  ├── medications
  ├── health_events
  ├── health_captures
  └── user_memory.health.* (mirror summaries only)
        │
        ├── scan time ──► Brain RPC ──► constraint check [24]
        │                      └── medication-food rules + community associations
        │
        ├── medication create ──► scheduleMedicationReminders
        │                      └── scheduled_alarms (medication_reminder)
        │
        └── weekly ──► health_insight_run alarm [14 dispatches]
                           └── subAgent(HealthInsightAgent) [22]
                                 ├── Pass 1: food–health correlations → user_memory patterns.*
                                 ├── Pass 2: adherence + med–food exposure summary
                                 └── Pass 3: k-anonymity check → community Postgres [if opted in]
```

**Brain-owned rule:** HealthInsightAgent never imports Brain `_schemas/` or opens Brain SQLite directly. Typed parent RPC only — same contract as **12** trio (`build-guide/05-brain/04-sub-agents.md`).

---

## Private Brain SQLite tables

Authoritative column names: `build-guide/06-brain-memory/01-sqlite-schema.md` (prefer over `29-health-intelligence/01` Drizzle snippet where they differ).

| Table | Role | Key columns |
|---|---|---|
| `medications` | Active prescriptions; reminder schedule source | `medication_name`, `medication_category`, `dose_mg`, `frequency`, `reminder_times` (JSON), `with_food`, `active`, `source` |
| `health_events` | Symptomatic outcomes (headache, GI, glucose spike, …) | `event_type`, `severity`, `onset_at`, `payload_json`, `possible_associations` |
| `health_captures` | Append-only measurements/docs/labs/wearable summaries | `capture_type`, `domain`, `metric_key`, `value_json`, `source_type`, `source_connection_id` |

**No `medication_reminders` table.** Reminder = `scheduled_alarms` row; outcome = `action_outcome_status` + `action_outcome_json`.

**No `biometric_readings` / `medical_documents`.** Folded into `health_captures`.

### Routing rules (`06-brain-memory/01-sqlite-schema.md`)

- Prescription photo → `health_captures` (evidence) + normalized `medications` row.
- Symptoms / stool / rash → `health_events`.
- Wearable daily summary / lab PDF / BP reading → `health_captures`.
- Stable summaries may mirror to `user_memory` — **not** operational for scan safety or agent passes.

### Column naming drift (resolve at implementation)

| Field | `29-health-intelligence/01` | `06-brain-memory/01` (prefer) |
|---|---|---|
| Drug name | `drugName` | `medication_name` |
| Active flag | `isActive` | `active` (integer) |
| Category | `medicationCategory` | `medication_category` |

---

## Medication tracking

### Ingestion paths

| Path | Pipeline | Writes |
|---|---|---|
| **Photo (label/bottle)** | GPT-4o mini vision → Zod → Brain handler | `medications` + optional `health_captures` |
| **Voice** | Gemini session → `create_medication` internal tool | `medications` |
| **Prescription / lab PDF** | Document extraction → `health_captures`; meds mirrored | `health_captures` + `medications` |
| **Manual** | Mobile or chat form | `medications` |

Extraction prompt and category normalization: `01-medication-tracking.md`. Vision intake boundary: `06-brain-memory/04-visual-intake.md`.

### On create — reminder scheduling

For each time in `reminder_times` JSON, insert one `scheduled_alarms` row:

- `alarm_type: 'medication_reminder'`
- `payload: { medicationId, drugName, doseInfo }`
- `status: 'pending'`
- `action_outcome_*`: null until fire

See `scheduleMedicationReminders` in `01-medication-tracking.md`.

### Medication-food interaction at scan time

Constraint check reads **private** `medications` table via Brain RPC. `user_memory.health.medications` is prompt mirror only.

Two interaction sources (`07-scanner/03-constraint-check.md`):

1. **Reviewed rules** — Supabase `medication_food_interaction_rule` (**23** config) → can hard-block contraindicated/major.
2. **Community associations** — `anonymous_medication_food_event_associations` → caution context only; never hard block alone.

---

## Medication reminders

### Delivery policy

| Condition | Channel |
|---|---|
| High-stakes `medication_category` + user phone | **Vapi** AI voice call (primary) |
| Routine / supplement / no phone | **OneSignal push** via **21** `sendPlatformPush` |
| Vapi fail / no-answer / voicemail | Push fallback |

High-stakes categories (`02-medication-reminders.md`): `anticoagulant`, `insulin`, `immunosuppressant`, `antiepileptic`, `antipsychotic`, `cardiac`.

### Outcome on alarm row

| `action_outcome_status` | Meaning |
|---|---|
| `calling` | Vapi call initiated |
| `answered` | Call completed; `action_outcome_json.took` from structured analysis |
| `missed` | No answer; push fallback may follow |
| `notified` | Push sent (no call or call skipped) |
| `failed` | Provider error |
| `confirmed` | User tapped push confirmation screen |

**Prefer provider structured analysis** for `took` — not transcript substring parsing (`02-medication-reminders.md`).

### Call frequency rules

- Max one call per user per 4 hours (any reason).
- No calls 22:00–07:00 local (geohash timezone).
- 3+ missed reminders same medication → escalation copy (adjust timing prompt).
- User says "stop calling" → clear `reminder_times`; push-only thereafter.

### Provider adapter

`env.CALL_PROVIDER`: `'vapi' | 'bland'` — same adapter contract; Bland is fallback vendor (`02-medication-reminders.md`).

### Webhook

`POST /api/health/reminder-webhook` — Vapi end-of-call-report → Brain internal `update-alarm-result` RPC.

### Push payload (via **21**)

- `type: 'medication_reminder'`, `priority: 'high'`
- `idempotency_key` / `collapse_id` = alarm row id
- `ttl: 3600` (1 hour)
- Deep link: confirm screen with `alarm_id`

**Do not** raw-fetch OneSignal from **22** handler — route through **21** (`status.md` G15, **21** G8).

---

## HealthInsightAgent

### Identity

- **Type:** Brain child sub-agent DO (same spawn pattern as **12** trio).
- **Key:** `health_{userId}_{runId}`
- **Alarm:** `health_insight_run`
- **Session row:** `session_type: 'background'`, `alarm_type: 'health_insight_run'`
- **Model:** LLM sub-calls per pass (build-guide implies Sonnet/Haiku — pick at implementation; document in `build.md`).

**Feature 12 vs 22 boundary:** **12** catalogs HealthInsightAgent and documents spawn pattern. **22** owns DO class, passes, health-specific tools, community writes, and `health_insight_run` first-boot seed. **14** owns dispatch switch case calling `spawnHealthInsight`.

### Active session guard

Same as maintenance agents (**12**): if `sessions.status = 'active'` → defer alarm 1 hour; do not mutate health data (`03-health-insight-agent.md`, **15-maintenance** pattern).

### Bounded snapshot (14-day window)

- Active medications
- `health_events` since 14 days
- `health_captures` since 14 days
- `memory_event` (scan/food) since 14 days

### Authorized capabilities

```text
Read:  get_medications_for_health_insight
       get_health_events_since
       get_health_captures_since
       get_memory_events_since
Write: write_user_memory (patterns.*, health.medication_adherence, health.medication_food_exposure_summary)
       schedule_user_alarm (next health_insight_run)
       write_community_health_signal (Supabase RPC — not Brain SQLite)
```

### Pass 1 — Food–health correlation

LLM finds temporal correlations (0–72h lag). Thresholds:

- ≥2 occurrences in 14 days (or 1 if severity ≥ 7)
- Confidence rated 0.0–1.0
- Never fabricate

Writes:

- Private: `user_memory` `patterns.*`
- Community (if opted in + k ≥ 100 + confidence ≥ 0.60): `anonymous_exposure_event_associations` + indexes

### Pass 2 — Medication adherence + food exposure

- Last 7 days `medication_reminder` alarms → adherence = fraction with `action_outcome_json.took = 1`
- Adherence < 70% → `user_memory` `health.medication_adherence` + optional voice check-in schedule
- Cross-ref active meds vs scans (e.g. Vitamin K on Warfarin) → `health.medication_food_exposure_summary`

### Pass 3 — k-anonymous community contribution

Requires:

1. `health_insight.community_contribution_opt_in` in `agent_state` (explicit opt-in)
2. Anonymous health group `k_anonymity_group_size >= 100`
3. Publishable signal thresholds (`04-community-health-tables.md`) — exposure/event minimums, `supporting_health_group_count >= 3` for scanner-facing indexes
4. Cohort ladder when specific group too small — climb broader fingerprint levels

If k too small: store pending in `agent_state` `health_insight.pending_contribution.*`; retry next week.

### Scheduling

- First boot: insert `health_insight_run` at `now + 7 days` (**22** seed — not in **12** `initializeBrainSubAgentAlarms`)
- After each run: reschedule next week at user-asleep time (derived from scan pattern)
- Never run during active cooking/voice session (`active_session_id` check)

### Hard boundaries — agent never

- Modifies `constraints`
- Deletes `health_events` or `medications`
- Writes community data without opt-in
- Creates clinical conclusions (patterns only)

---

## Community health tables (Postgres)

Canonical schema: `04-community-health-tables.md` → `shared/drizzle/schema/community-health.schema.ts`.

| # | Table | Purpose |
|---|---|---|
| 1 | `anonymous_health_groups` | k-anonymity cohort fingerprints |
| 2 | `anonymous_exposure_event_associations` | Exposure → post-exposure event stats |
| 3 | `anonymous_ingredient_event_association_index` | Scanner-facing ingredient signals |
| 4 | `product_community_health_summary` | Per-product community health scores |
| 5 | `anonymous_medication_food_event_associations` | Med category × ingredient signals |
| 6 | `anonymous_time_of_day_event_patterns` | Temporal patterns |
| 7 | `anonymous_region_event_patterns` | Geo-period aggregates |
| 8 | `anonymous_research_association_candidates` | Research export surface |

Postgres RPCs: `upsert_exposure_event_association`, `decay_exposure_event_recency_weights`, etc.

Materialized views: `mv_top_ingredient_event_associations`, `mv_flagged_products` — weekly refresh.

**Scanner consumer:** `07-scanner/07-community-product-intelligence.md` — caution overlays, not diagnosis.

---

## Privacy guarantees

1. **Private forever** — medications, health_events, health_captures never leave Brain DO in identifiable form.
2. **Explicit opt-in** — community contribution requires `health_insight.community_contribution_opt_in`.
3. **k-anonymity ≥ 100** — no community row without cohort size.
4. **Category-level only** — drug names → medication categories; geo → region buckets.
5. **No temporal precision** — community timestamps rounded to week.
6. **No cross-week linking** — anonymous health group hash only.
7. **Stop sharing** — opt-out sets `agent_state` flag; Pass 3 skipped until re-opt-in.
8. **Not a medical device** — correlations surfaced as patterns; no diagnose/treat/prescribe copy.

Sources: `03-health-insight-agent.md`, `00-overview.md`, `brioela-specs/01-product-health-scanning.md`.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **22** (this) | Health tables, medication CRUD/ingestion, reminder schedule + Vapi/webhook, HealthInsightAgent DO + passes, community health schema + writes, medication push **trigger** |
| **12** | Sub-agent spawn/RPC infrastructure; **catalog** HealthInsightAgent — not implementation |
| **14** | `dispatchAlarm` cases: `medication_reminder`, `health_insight_run` |
| **21** | `sendPlatformPush`, token registration, delivery rules — medication push **delivery** |
| **23** | Medical conditions, `condition_rule`, `medication_food_interaction_rule` Supabase config |
| **24** | Scanner constraint check orchestration; reads meds via Brain RPC |
| **32** | Illness detective — food history + `sickness_followup` alarm; may cross-ref `health_events` later |
| **36** | Wearable SDK, client aggregation, `source_connection_id` on `health_captures` |
| **04** / **05** | Brain foundation, `user_memory`, `memory_event`, `scheduled_alarms` schema |

### HealthInsightAgent vs feature 12

| | **12** | **22** |
|---|---|---|
| Sub-agents shipped | BrainMaintenanceAgent, BehaviorPatternAgent, SessionContextCompressor | HealthInsightAgent |
| Alarms seeded in init | `brain_maintenance_run`, `behavior_pattern_detection` | `health_insight_run` (**22** owns seed) |
| Community writes | None | Supabase 8 tables |
| Health table reads | None | medications, health_events, health_captures |

Shared: `subAgent()` pattern, `check_active_session`, `schedule_user_alarm`, background session rows, typed Brain RPC.

---

## Conflicts and naming drift

| Conflict | Resolution |
|---|---|
| `29/01` Drizzle field names vs `06-brain-memory/01` SQL | **Prefer `06-brain-memory/01`** at migration |
| Wearables: `brioela-specs/40` routes to `user_memory` daily summaries; `29` + `06` route measurements to `health_captures` | **Operational captures → `health_captures`; rolling summaries → `user_memory.health.*`**; Health Insight reads both |
| Legacy `medications` REST + queue jobs target Supabase `user_medications` | **Superseded by Brain DO** — do not extend legacy path (G2) |
| Build guide raw OneSignal in `triggerMedicationPush` | **Route through 21** `sendPlatformPush` |
| Illness detective uses `memory_event` not `health_events` today | **32** may add `health_events` cross-ref later — not **22** scope until spec says so |
| `write-user-memory` examples use `health:medications` id vs `health.medications:metformin` | **Prefer implementable `02-user-memory` composite id** |
| High-stakes call vs push priority | Call path bypasses quiet hours; push respects **21** rules except safety elevation TBD |
| CGM spike data: wearables `04-cgm` private table vs `health_captures` | **Reconcile in 36+22** — prefer `health_captures` for agent pass uniformity (G18) |

---

## Sources (read for this migration)

### Build guides — health intelligence (all files)
- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/01-medication-tracking.md`
- `build-guide/29-health-intelligence/02-medication-reminders.md`
- `build-guide/29-health-intelligence/03-health-insight-agent.md`
- `build-guide/29-health-intelligence/04-community-health-tables.md`

### Build guides — cross-refs
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/06-brain-memory/04-visual-intake.md`
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/07-scanner/03-constraint-check.md`
- `build-guide/07-scanner/07-community-product-intelligence.md`
- `build-guide/20-wearables/00-overview.md`
- `build-guide/20-wearables/03-memory-routing.md`
- `build-guide/20-wearables/04-cgm-food-response.md`
- `build-guide/20-wearables/05-feature-integration.md`
- `build-guide/20-wearables/06-privacy-disconnect.md`
- `build-guide/22-medical-conditions/00-overview.md`
- `build-guide/16-illness-detective/00-overview.md`
- `build-guide/16-illness-detective/05-output-privacy-and-followup.md`
- `build-guide/12-notifications/01-priority-model.md`

### Brioela specs
- `brioela-specs/01-product-health-scanning.md`
- `brioela-specs/08-personal-food-brain-memory.md`
- `brioela-specs/28-medical-condition-food-profile.md`
- `brioela-specs/40-wearables-integration.md`
- `brioela-specs/34-universal-visual-intake.md`
- `brioela-specs/09-per-user-brain.md`

### Implementable specs
- `implementable-specs/02-user-memory.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/brioela-tools/02-write-user-memory.md`
- `implementable-specs/brioela-tools/03-read-user-memory.md`

### Ledgers & records
- `_records/session-log/037-health-intelligence-and-doc-cleanup.md`
- `_records/connections/26-health-intelligence-connections.md`
- `_records/build-order/27-layer-health-intelligence.md`

### Neighbor feature migrations
- `_features/12-brain-sub-agents/spec.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/21-platform-notifications/spec.md`

### Production code audited
- `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts`
- `backend/src/core/ai/functions/extract-medications.ts`
- `backend/src/core/ai/schemas/medical/medication.schema.ts`
- `backend/src/api/medications/jobs/*.ts`
- `shared/api/medications.routes.ts`
- `mobile/network/medications/*`
