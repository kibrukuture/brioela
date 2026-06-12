# Health Intelligence — Build

Feature **22**. Production paths under `backend/src/agents/brain/` (health schemas, handlers, sub-agent), `backend/src/api/health/` (Vapi webhook), `shared/drizzle/schema/community-health.schema.ts`, `backend/src/core/ai/` (extraction — partial), and `mobile/` health screens.

**Scope:** Brain SQLite health tables, medication lifecycle, reminder scheduling + Vapi/webhook, HealthInsightAgent DO + spawn/seed, community Postgres schema + RPC migrations, health-specific Brain tools/RPC, mobile medication UX. **Not in 22 build:** dispatch router switch cases (**14**), push send service (**21**), wearables SDK (**36**), scanner constraint-check file (**24**), medical condition rules (**23**).

---

## Shipped today

| Area | Status |
|---|---|
| `scheduled_alarms.action_outcome_*` columns | ✓ (**04** — ready for medication outcomes) |
| AI `extractMedications` + `MedicationSchema` + prescription schemas | ✓ (not wired to Brain) |
| `medications.job.ts` / `extract-data.job.ts` stubs | ✓ partial (wrong storage target) |
| `shared/api/medications.routes.ts` route constants | ✓ (no HTTP handlers mounted) |
| Mobile `medications.api.ts` + `useMedications` | ✓ stubs (no screens) |
| Brain `medications` / `health_events` / `health_captures` schemas | ✗ |
| Community health Postgres schema | ✗ |
| HealthInsightAgent DO + spawn handler | ✗ |
| Medication reminder handler + Vapi | ✗ |
| `scheduleMedicationReminders` helper | ✗ |
| `health_insight_run` first-boot seed | ✗ |
| Health insight Brain tools/RPC | ✗ |
| Mobile medication list / reminder confirm UI | ✗ |
| Health intelligence tests | ✗ |

---

## File manifest

### Brain SQLite schemas (22)

| File | Role |
|---|---|
| `_schemas/medications.schema.ts` | `medications` table — per `06-brain-memory/01-sqlite-schema.md` |
| `_schemas/health.events.schema.ts` | `health_events` table |
| `_schemas/health.captures.schema.ts` | `health_captures` table |
| `_schemas/index.ts` | Export + migration registration |
| `_migrations/*` | Add three tables to Brain migration chain (**04**) |

### Repositories (22)

| File | Role |
|---|---|
| `_repositories/read.active.medications.repository.ts` | Scanner constraint check RPC |
| `_repositories/read.medications.for.health.insight.repository.ts` | Health agent Pass 2 |
| `_repositories/read.health.events.since.repository.ts` | Bounded event read |
| `_repositories/read.health.captures.since.repository.ts` | Bounded capture read |
| `_repositories/write.medication.repository.ts` | Insert/update/deactivate |
| `_repositories/write.health.event.repository.ts` | Append health events |
| `_repositories/write.health.capture.repository.ts` | Append captures |

### Medication lifecycle handlers (22)

| File | Role |
|---|---|
| `_handlers/create.medication.handler.ts` | Voice/photo/manual create + `scheduleMedicationReminders` |
| `_handlers/update.medication.handler.ts` | Dose/frequency/reminder_times changes → reschedule alarms |
| `_handlers/deactivate.medication.handler.ts` | End med; cancel pending reminders |
| `_helpers/schedule.medication.reminders.helper.ts` | Insert `medication_reminder` alarm rows |
| `_helpers/schedule.next.medication.reminder.helper.ts` | After fire → next day same time |
| `_helpers/normalize.medication.category.helper.ts` | Drug name → category for anonymization |
| `_handlers/visual-intake.medication.handler.ts` | Vision extraction → medications + health_captures |

### Medication reminder delivery (22 body; 14 dispatches)

| File | Role | Owner |
|---|---|---|
| `_handlers/handle.medication.reminder.handler.ts` | Fire path: high-stakes call vs push | **22** body; **14** calls |
| `backend/src/api/health/medication-call.helper.ts` | Vapi/Bland `triggerMedicationCall` | **22** |
| `backend/src/api/health/reminder-webhook.handler.ts` | Vapi end-of-call → Brain RPC | **22** |
| `backend/src/api/health/health.routes.ts` | Mount webhook + internal health routes | **22** |
| `backend/src/core/notifications/trigger-medication-push.helper.ts` | Calls **21** `sendPlatformPush` | **21** owns send; **22** invokes |

### HealthInsightAgent sub-agent (22)

| File | Role |
|---|---|
| `_subagents/health-insight/health.insight.agent.ts` | `@callable() runHealthInsightPass` |
| `_subagents/health-insight/run.health.insight.pass.handler.ts` | Three-pass orchestration |
| `_subagents/health-insight/health.insight.system.prompt.ts` | Correlation + adherence prompts |
| `_subagents/health-insight/build.anonymous.health.group.fingerprint.helper.ts` | k-anonymity fingerprint |
| `_subagents/health-insight/index.ts` | Barrel |
| `_handlers/spawn.health.insight.handler.ts` | Active-session guard, background session, `subAgent()`, reschedule |
| `_handlers/initialize.health.insight.alarms.handler.ts` | First-boot `health_insight_run` seed |
| `_subagents/health-insight/_helpers/build.health.insight.tools.helper.ts` | AI SDK → Brain RPC wrappers |

### Health insight tools / RPC (22 — not public 17-tool set)

| File | Role |
|---|---|
| `_tools/_executables/get.medications.for.health.insight.executable.ts` | Read active meds |
| `_tools/_executables/get.health.events.since.executable.ts` | Bounded health_events |
| `_tools/_executables/get.health.captures.since.executable.ts` | Bounded health_captures |
| `_tools/_executables/write.community.health.signal.executable.ts` | Supabase RPC wrapper |
| `_policies/health.insight.tool.policy.ts` | Caller enforcement |

### Community Postgres (22)

| File | Role |
|---|---|
| `shared/drizzle/schema/community-health.schema.ts` | 8 tables — `04-community-health-tables.md` |
| `supabase/migrations/*_community_health.sql` | Tables, indexes, RPC functions, materialized views |
| `backend/src/core/community-health/upsert.exposure.event.association.ts` | Typed RPC client |

### Shared API (legacy — reconcile)

| File | Role | Status |
|---|---|---|
| `shared/api/medications.routes.ts` | REST constants | ✓ constants only |
| `shared/validators/medication.validator.ts` | Minimal Zod — **replace** with Brain-aligned schema | ✓ drift |

### Mobile (22)

| File | Role |
|---|---|
| `mobile/app/health/medications/index.tsx` | Medication list |
| `mobile/app/health/medications/[id].tsx` | Detail + reminder times |
| `mobile/app/health/medications/add.tsx` | Photo/voice/manual add |
| `mobile/app/health/reminder-confirm.tsx` | Push deep link confirm (`alarm_id`) |
| `mobile/network/medications/medications.api.ts` | Brain-backed API (replace axios stubs) |
| `mobile/network/medications/use-medications.ts` | React Query hooks |

### Wrangler / secrets (22)

| Secret / var | Purpose |
|---|---|
| `VAPI_API_KEY` | Voice call provider |
| `VAPI_PHONE_NUMBER_ID` | Outbound caller ID |
| `ELEVENLABS_VOICE_ID` | TTS voice |
| `CALL_PROVIDER` | `vapi` \| `bland` |
| `WORKER_BASE_URL` | Webhook URL base |

### Tests

| File | Role |
|---|---|
| `_schemas/health.tables.test.ts` | Migration smoke for three tables |
| `_helpers/schedule.medication.reminders.helper.test.ts` | Alarm row shape |
| `_handlers/handle.medication.reminder.handler.test.ts` | High-stakes vs push branch |
| `_subagents/health-insight/run.health.insight.pass.handler.test.ts` | k-anonymity gate mock |
| `backend/src/api/health/reminder-webhook.handler.test.ts` | Webhook → outcome JSON |

---

## Integration points (neighbor features)

| Integration | Caller | Callee | Contract |
|---|---|---|---|
| Alarm dispatch | **14** `dispatchAlarm` | **22** `handleMedicationReminder`, `spawnHealthInsight` | Switch cases only in **14** |
| Push fallback | **22** `triggerMedicationPush` | **21** `sendPlatformPush` | No raw OneSignal in **22** |
| Scanner meds read | **24** constraint check | **22** Brain RPC `readActiveMedicationsForConstraintCheck` | Returns categories + active rows |
| Wearable ingest | **36** client summary POST | **22** `write.health.capture` handler | `source_connection_id` required |
| Community scanner read | **24** product resolution | Postgres `product_community_health_summary` | Read-only cache |
| Sub-agent spawn infra | **22** spawn handlers | **12** pattern + **04** Brain RPC | Same as maintenance agents |

---

## Acceptance criteria

### Private health tables

- [ ] Brain migration adds `medications`, `health_events`, `health_captures` with indexes per `06-brain-memory/01-sqlite-schema.md`
- [ ] No health PII in Supabase Postgres
- [ ] `user_memory.health.*` writes are mirror-only; scan safety reads `medications` table

### Medication tracking

- [ ] Photo label → vision extract → Zod → `medications` row with `medication_category`
- [ ] Prescription PDF → `health_captures` + mirrored `medications`
- [ ] Voice "I take Warfarin 5mg" → `create_medication` → row + reminder alarms
- [ ] Deactivate medication cancels pending `medication_reminder` rows for that `medicationId`

### Medication reminders

- [ ] `scheduleMedicationReminders` creates one `scheduled_alarms` row per reminder time
- [ ] **14** dispatches `medication_reminder` → **22** handler runs
- [ ] High-stakes category + phone → Vapi call; `action_outcome_status: calling` then `answered`
- [ ] Routine med → **21** push; `action_outcome_status: notified`
- [ ] Vapi no-answer → push fallback; `missed` + `fallback_push_sent` in JSON
- [ ] Webhook writes `took` from structured analysis (not transcript parse)
- [ ] Call frequency rules enforced (4h cap, quiet hours 22:00–07:00)
- [ ] Push confirm screen updates same alarm row `confirmed`
- [ ] Next-day reminder row scheduled after each fire

### HealthInsightAgent

- [ ] `health_insight_run` seeded on Brain first-boot if no pending row
- [ ] **14** case → `spawnHealthInsight` → background session + `subAgent(HealthInsightAgent)`
- [ ] Active session → defer 1h (same as **12** maintenance)
- [ ] Pass 1 writes `patterns.*` to `user_memory` for correlations ≥ threshold
- [ ] Pass 2 computes 7-day adherence from `medication_reminder` outcomes
- [ ] Pass 3 skips without opt-in; skips when k < 100; pending stored in `agent_state`
- [ ] Pass 3 writes only when publishable thresholds met (`04-community-health-tables.md`)
- [ ] Agent reschedules next `health_insight_run` at week cadence
- [ ] Agent never modifies `constraints` or deletes health rows

### Community health

- [ ] `community-health.schema.ts` deployed with 8 tables + indexes
- [ ] Postgres RPCs `upsert_exposure_event_association`, `decay_exposure_event_recency_weights` exist
- [ ] Materialized views refresh weekly job
- [ ] **24** scanner can read `anonymous_ingredient_event_association_index` above threshold

### Cross-feature

- [ ] **24** constraint check receives medication-food interactions from Brain meds + **23** rules
- [ ] **21** receives medication push via `triggerMedicationPush` — not duplicate OneSignal client
- [ ] **12** catalog unchanged — HealthInsightAgent implementation only in **22**

### Mobile

- [ ] User can list medications from Brain-backed API
- [ ] Push tap opens reminder confirm with `alarm_id`
- [ ] Photo capture flow creates medication via Brain RPC

---

## Build order (within monorepo)

1. Brain schemas + migrations (**04** prerequisite)
2. Medication CRUD handlers + repositories
3. `scheduleMedicationReminders` + **14** handler wire-up
4. Vapi helper + webhook + **21** push fallback
5. Community Postgres schema + RPCs
6. HealthInsightAgent DO + tools + spawn/seed
7. Mobile screens + API wire-up
8. **24** Brain RPC for scanner (can ship in **24** once **22** tables exist)

Per `_records/build-order/27-layer-health-intelligence.md`: depends on brain, brain-memory, scanner, wearables, medical-conditions layers.
