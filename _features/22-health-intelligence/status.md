# Status

open

**Health intelligence is docs-complete; production is largely unshipped.** `scheduled_alarms.action_outcome_*` columns exist. AI medication extraction schemas/functions exist but are not wired to Brain DO. Legacy medications queue/API stubs target wrong storage. No Brain health tables, no HealthInsightAgent, no Vapi, no community-health Postgres schema, no mobile health UI.

**Living catalog:** Component inventory in `spec.md` is a snapshot — new health capture types, reminder channels, and community consumers extend the list without schema migration on `alarm_type` or `capture_type`.

# Shipped (partial)

## Brain / schema
- [x] `scheduled_alarms.action_outcome_status` / `action_outcome_json` — `scheduled.alarm.schema.ts`
- [x] `write.user.memory.schema.ts` documents `health.medications` namespace
- [ ] `medications` Brain SQLite table
- [ ] `health_events` Brain SQLite table
- [ ] `health_captures` Brain SQLite table
- [ ] Health table migrations in Brain migration chain

## AI extraction (Worker — not Brain-connected)
- [x] `backend/src/core/ai/functions/extract-medications.ts`
- [x] `backend/src/core/ai/schemas/medical/medication.schema.ts`
- [x] `backend/src/core/ai/schemas/documents/prescription.schema.ts`
- [x] `backend/src/core/ai/prompts/extract-medications.prompt.ts`
- [ ] Vision intake → Brain `medications` write path
- [ ] `create_medication` Brain tool/handler

## Legacy stubs (wrong architecture)
- [x] `backend/src/api/medications/jobs/medications.job.ts` — orchestrator only
- [x] `backend/src/api/medications/jobs/extract-data.job.ts` — TODOs reference Supabase `user_medications`
- [x] `shared/api/medications.routes.ts` — route constants; **not mounted**
- [x] `shared/api/queue.routes.ts` — `medications` queue path; **no handler**
- [ ] Delete or redirect legacy path to Brain DO

## Mobile
- [x] `mobile/network/medications/medications.api.ts` — axios stubs
- [x] `mobile/network/medications/use-medications.ts`
- [x] `mobile/features/search/components/search-medication-card.tsx` — Schnl search card (unrelated)
- [ ] Medication list / add / reminder confirm screens
- [ ] Brain-backed API wire-up

## HealthInsightAgent
- [ ] `HealthInsightAgent` DO class
- [ ] `spawn.health.insight.handler.ts`
- [ ] `initialize.health.insight.alarms.handler.ts`
- [ ] Health insight tools/RPC
- [ ] **14** dispatch case wired

## Medication reminders
- [ ] `handle.medication.reminder.handler.ts`
- [ ] Vapi `triggerMedicationCall`
- [ ] `reminder-webhook.handler.ts`
- [ ] `schedule.medication.reminders.helper.ts`
- [ ] **21** `triggerMedicationPush` integration

## Community health
- [ ] `shared/drizzle/schema/community-health.schema.ts`
- [ ] Supabase migrations + RPCs
- [ ] `write.community.health.signal` executable

## Tests
- [ ] Health table migration smoke
- [ ] Reminder handler branch tests
- [ ] Health insight k-anonymity gate tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No Brain health SQLite tables** | `rg medications.schema backend/src/agents/brain/_schemas` — zero; only 18 core schemas |
| G2 | **Legacy medications jobs target Supabase `user_medications`** | `extract-data.job.ts` line 32 TODO — contradicts Brain DO architecture |
| G3 | **Medications REST routes not mounted** | `mount.routes.handler.ts` — no medications import; only health-check middleware |
| G4 | **No HealthInsightAgent DO or spawn handler** | `rg HealthInsight backend` — zero |
| G5 | **No `health_insight_run` first-boot seed** | Not in `12-schema-version` init list; **22** seed handler absent |
| G6 | **No medication reminder dispatch handler** | `rg handleMedicationReminder backend` — zero; gap draft in **14** `draft/` |
| G7 | **No Vapi integration** | `rg vapi backend` — zero |
| G8 | **No medication webhook route** | `rg reminder-webhook backend` — zero |
| G9 | **No `scheduleMedicationReminders` helper** | Spec in `01-medication-tracking.md` only |
| G10 | **No community-health Drizzle schema** | `rg community-health shared/drizzle` — zero |
| G11 | **No health insight Brain tools** | `get_medications_for_health_insight` etc. — spec only |
| G12 | **Scanner cannot read medications** | **24** constraint check expects Brain RPC — tables missing |
| G13 | **Mobile medications API hits unmounted REST** | `medications.api.ts` → `/v1/medications` — no backend handler |
| G14 | **Column naming drift** `drugName` vs `medication_name` | `29/01` vs `06-brain-memory/01` — pick before migration |
| G15 | **Push path not via 21** | Build guide shows raw OneSignal fetch — **21** G8 applies |
| G16 | **Wearables routing split** | Spec 40 → `user_memory`; `06` → `health_captures` — reconcile (spec.md) |
| G17 | **CGM private table vs health_captures** | `20-wearables/04-cgm-food-response.md` separate window table vs generic captures |
| G18 | **No implementation ledger entries for health** | `_records/implementation-ledger/` grep health — only tangential memory-tools ref |
| G19 | **Sub-agent spawn blocked on 12 infrastructure** | No `_subagents/` folder at all (**12** G1) |
| G20 | **Alarm dispatch router not shipped** | **14** open — blocks reminder + health insight fire |
| G21 | **`shared/validators/medication.validator.ts` minimal** | `{ name, dosage }` — not Brain schema aligned |
| G22 | **Illness detective does not use health_events yet** | `16-illness-detective/` grep — zero; cross-ref future **32** |
| G23 | **Medical conditions separate feature** | **23** owns `condition_rule`; **22** owns meds table only — boundary documented |
| G24 | **Community contribution opt-in UI** | `agent_state` key spec only — no settings surface |
| G25 | **Medication confirm push deep link screen** | Spec in `02-medication-reminders.md` — no mobile route |

# 22 vs neighbor boundaries

| In **22** (this feature) | In separate feature |
|---|---|
| `medications`, `health_events`, `health_captures` tables | `constraints`, medical condition profile — **23** |
| HealthInsightAgent DO + passes | Sub-agent spawn pattern infra — **12** |
| `health_insight_run` seed + self-reschedule | `dispatchAlarm` switch case — **14** |
| Vapi call + webhook + reminder schedule | Push send + delivery rules — **21** |
| Community health 8 tables + writes | Scanner constraint orchestration — **24** |
| Medication push **trigger** | Medication push **delivery** — **21** |
| Wearable data **ingestion target** (`health_captures`) | Wearable SDK + client aggregation — **36** |
| Medication-food **private data** | `medication_food_interaction_rule` config — **23** |
| Health agent **catalog** cross-ref | Health agent **implementation** — **22** only |

# HealthInsightAgent vs 12 boundary

- **12** ships: BrainMaintenanceAgent, BehaviorPatternAgent, SessionContextCompressor + spawn/RPC infrastructure they need.
- **12** catalogs HealthInsightAgent in agent inventory — **does not implement it**.
- **22** ships: HealthInsightAgent DO, health-specific read/write tools, `health_insight_run` alarm seed, community Postgres writes, medication-adjacent passes.
- **Shared dependency:** **12**/**04** sub-agent spawn pattern must exist before **22** agent can run; **14** must dispatch both maintenance and health alarms.

# Blocked by

- **04-brain-foundation** — Brain DO + migrations (shipped shell; health tables not added)
- **12-brain-sub-agents** — spawn/RPC infrastructure (open)
- **14-brain-alarm-dispatch** — `medication_reminder` + `health_insight_run` cases (open)
- **21-platform-notifications** — `sendPlatformPush` for medication fallback (open)
- **09-brain-alarm-tools** — `schedule_user_alarm` for reminders (partial)

# Blocks

- **24-scanner** — medication-food interaction check needs Brain meds table + RPC
- **32-illness-detective** — optional `health_events` cross-ref (future)
- **36-wearables** — `health_captures` ingestion contract
- **07-scanner community intelligence** — needs community tables + Health Insight writes

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| *(none for health)* | No `_records/implementation-ledger/` entries for feature 22 |
| `extract-data.job.ts` TODOs | Reference `user_medications` / Supabase — obsolete per session 037 Brain DO decision |
| `shared/api/medications.routes.ts` | Supabase-era REST — superseded by Brain RPC; keep constants until mobile rewired |

# Ambiguous / conflicting sources

1. **Private table column names:** `29-health-intelligence/01` TypeScript uses `drugName`/`isActive`; `06-brain-memory/01` SQL uses `medication_name`/`active`. **Prefer `06-brain-memory/01` for Drizzle migration (G14).**
2. **Wearables storage:** `brioela-specs/40` emphasizes `user_memory.health.*` daily summaries; `06-brain-memory/01` + `29` route measurements to `health_captures`. **Use `health_captures` for agent-pass uniformity; `user_memory` for rolling summaries (G16).**
3. **Vapi vs push quiet hours:** Voice calls for high-stakes meds may need quiet-hours bypass; push respects **21** rules. **Product: call bypasses quiet hours; push does not unless escalated (G15).**
4. **Alarm cadence vs user asleep scheduling:** First seed is `now + 7d`; subsequent runs use scan-pattern-derived asleep time. **Both valid — seed fixed, reschedule adaptive.**
5. **Legacy queue medications path:** `QUEUE_ROUTES.medications` exists with no handler — do not wire to Supabase; **Brain DO only (G2).**
6. **Community signals vs clinical rules:** Community associations are caution-only at scan; **23** reviewed rules create hard blocks. **Session 037 decision — do not conflate.**

# Draft count

**23** files in `draft/` (6 production snapshots + 16 gap/intended snapshots + `gap-index.md`).

# Sources

- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/01-medication-tracking.md`
- `build-guide/29-health-intelligence/02-medication-reminders.md`
- `build-guide/29-health-intelligence/03-health-insight-agent.md`
- `build-guide/29-health-intelligence/04-community-health-tables.md`
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
- `brioela-specs/01-product-health-scanning.md`
- `brioela-specs/08-personal-food-brain-memory.md`
- `brioela-specs/28-medical-condition-food-profile.md`
- `brioela-specs/40-wearables-integration.md`
- `brioela-specs/34-universal-visual-intake.md`
- `brioela-specs/09-per-user-brain.md`
- `implementable-specs/02-user-memory.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/brioela-tools/02-write-user-memory.md`
- `implementable-specs/brioela-tools/03-read-user-memory.md`
- `_records/session-log/037-health-intelligence-and-doc-cleanup.md`
- `_records/connections/26-health-intelligence-connections.md`
- `_records/build-order/27-layer-health-intelligence.md`
- `_features/12-brain-sub-agents/spec.md`
- `_features/12-brain-sub-agents/draft/health.insight.agent.gap.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/14-brain-alarm-dispatch/draft/handle.medication.reminder.handler.gap.md`
- `_features/21-platform-notifications/spec.md`
- `_features/21-platform-notifications/draft/trigger-medication-push.helper.gap.md`
- `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts`
- `backend/src/core/ai/functions/extract-medications.ts`
- `backend/src/api/medications/jobs/extract-data.job.ts`
