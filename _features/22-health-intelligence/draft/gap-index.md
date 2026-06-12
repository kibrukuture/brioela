# Draft index — 22-health-intelligence

## Production snapshots (shipped or partial)

| File | Target path | Notes |
|---|---|---|
| `scheduled.alarm.schema.production.md` | `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts` | `action_outcome_*` ready for meds |
| `extract-medications.production.md` | `backend/src/core/ai/functions/extract-medications.ts` | Not Brain-wired |
| `medication.ai.schema.production.md` | `backend/src/core/ai/schemas/medical/medication.schema.ts` | AI extract schema |
| `extract-data.job.production.md` | `backend/src/api/medications/jobs/extract-data.job.ts` | Obsolete Supabase TODOs |
| `medications.job.production.md` | `backend/src/api/medications/jobs/medications.job.ts` | Queue stub |
| `medications.routes.production.md` | `shared/api/medications.routes.ts` | Not mounted |

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `medications.schema.gap.md` | `_schemas/medications.schema.ts` | **04** migration |
| `health.events.schema.gap.md` | `_schemas/health.events.schema.ts` | **04** |
| `health.captures.schema.gap.md` | `_schemas/health.captures.schema.ts` | **04**, **36** ingest |
| `community-health.schema.gap.md` | `shared/drizzle/schema/community-health.schema.ts` | Supabase migration |
| `create.medication.handler.gap.md` | `_handlers/create.medication.handler.ts` | schemas |
| `schedule.medication.reminders.helper.gap.md` | `_helpers/schedule.medication.reminders.helper.ts` | schemas, **09** |
| `read.active.medications.repository.gap.md` | `_repositories/read.active.medications.repository.ts` | schemas, **24** |
| `handle.medication.reminder.handler.gap.md` | `_handlers/handle.medication.reminder.handler.ts` | **14**, **21** |
| `medication-call.helper.gap.md` | `backend/src/api/health/medication-call.helper.ts` | Vapi secrets |
| `reminder-webhook.handler.gap.md` | `backend/src/api/health/reminder-webhook.handler.ts` | Vapi |
| `trigger-medication-push.helper.gap.md` | `backend/src/core/notifications/trigger-medication-push.helper.ts` | **21** |
| `health.insight.agent.gap.md` | `_subagents/health-insight/` | **12** spawn infra |
| `spawn.health.insight.handler.gap.md` | `_handlers/spawn.health.insight.handler.ts` | **12**, **14** |
| `initialize.health.insight.alarms.handler.gap.md` | `_handlers/initialize.health.insight.alarms.handler.ts` | **04** init |
| `health.insight.tools.gap.md` | `_tools/_executables/*health*` | sub-agent |
| `mobile.medications.gap.md` | `mobile/app/health/*` | Brain API |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **12** | `_features/12-brain-sub-agents/draft/health.insight.agent.gap.md` (catalog boundary) |
| **14** | `_features/14-brain-alarm-dispatch/draft/handle.medication.reminder.handler.gap.md` |
| **21** | `_features/21-platform-notifications/draft/trigger-medication-push.helper.gap.md` |

**Total in this folder:** 23 files (6 production + 16 gap + this index).
