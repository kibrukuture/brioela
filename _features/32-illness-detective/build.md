# Illness Detective (Sift) — Build

Feature **32**. Production paths under `backend/src/agents/brain/_tools/sift/`, `backend/src/agents/brain/_handlers/sift/`, `backend/src/agents/brain/_schemas/illness.*.ts`, `shared/drizzle/schema/community.illness.schema.ts`, `shared/validator/sift/`, and `mobile/features/illness.detective/`.

**Scope:** Sift investigation pipeline (`run_sift`), lookback + context builders, structured ranking LLM, `illness_report`/`illness_suspect` Brain tables, `community_illness_signal` Supabase schema + anonymized writer, `handle.sickness.followup` handler body, mobile Sift result screen, system `illness-detective` skill seed. **Not in 32 build:** `recall_entry` poll/ingest (**31**), `dispatchAlarm` router (**14**), `runInlineAlarmSession` shell (**14**), push send (**21**), `health_events` CRUD (**22**), wearables SDK (**36**), Ground map rendering (**27**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/16-illness-detective/` (6 files) | ✓ docs only |
| `brioela-specs/30-food-illness-detective.md` | ✓ spec |
| `schedule.user.alarm.schema.ts` mentions `sickness_followup` | ✓ schema text only |
| `alarm.tool.test.ts` schedules `sickness_followup` | ✓ test only |
| `run_sift` tool + executable | ✗ |
| Brain `illness_report` / `illness_suspect` schemas | ✗ |
| `community_illness_signal` Drizzle schema | ✗ |
| Ranking LLM handler | ✗ |
| `handle.sickness.followup.handler.ts` | ✗ |
| `mobile/features/illness.detective/` | ✗ |
| `illness-detective` system skill seed | ✗ |
| Tests | ✗ |

**Zero Sift production code.** `rg 'run_sift|illness_report|community_illness' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Brain SQLite schemas (**32**)

| File | Role |
|---|---|
| `_schemas/illness.report.schema.ts` | `illness_report` table |
| `_schemas/illness.suspect.schema.ts` | `illness_suspect` table |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add illness tables to Brain chain |

### Shared — Supabase Drizzle (**32**)

| File | Role |
|---|---|
| `shared/drizzle/schema/community.illness.schema.ts` | `community_illness_signal` |
| `shared/drizzle/migrations/*` | Postgres migration + indexes on `product_id`/`restaurant_id` |
| `shared/validator/sift/sift.result.schema.ts` | Zod: ranked suspects output from LLM |
| `shared/validator/sift/sift.context.schema.ts` | Window + food-history bundle shape |
| `shared/validator/sift/community.illness.signal.schema.ts` | Anonymized write payload |

### Brain — Sift tool + pipeline (**32**)

| File | Role |
|---|---|
| `_tools/sift/run.sift.tool.ts` | Tool registration + `run_sift` descriptor |
| `_tools/sift/run.sift.executable.ts` | Orchestrates full investigation |
| `_tools/_schemas/run.sift.schema.ts` | `symptom_onset_hours`, optional `report_id` |
| `_handlers/sift/compute.lookback.window.helper.ts` | Onset → `window_start`/`window_end` |
| `_handlers/sift/build.sift.context.helper.ts` | memory_event + recall + community reads |
| `_handlers/sift/rank.sift.suspects.handler.ts` | Structured LLM call (`generateObject`) |
| `_handlers/sift/write.illness.report.handler.ts` | Insert report + suspects |
| `_handlers/sift/apply.sift.followup.answers.helper.ts` | Re-rank after optional Q&A |
| `_handlers/sift/schedule.sift.followup.helper.ts` | `schedule_user_alarm(sickness_followup)` |
| `_handlers/sift/index.ts` | Barrel |

### Brain — sickness follow-up (**32** body; **14** dispatches)

| File | Role | Owner |
|---|---|---|
| `_handlers/sift/handle.sickness.followup.handler.ts` | Build prompt; call `runInlineAlarmSession` | **32** body; **14** shell |
| `_helpers/build.sickness.followup.prompt.helper.ts` | Check-in copy + optional re-sift | **32** |

Wire case in **14** `dispatch.alarm.handler.ts` — not **32** file ownership.

### Community signal (**32**)

| File | Role |
|---|---|
| `_handlers/sift/write.community.illness.signal.helper.ts` | Anonymized upsert — strip user_id before write |
| `_handlers/sift/elevate.community.illness.signal.helper.ts` | 3+ / 72h rule → `elevated=true` |
| `_handlers/sift/check.authority.export.optin.helper.ts` | Gate external authority submission |

### Repositories (**32**)

| File | Role |
|---|---|
| `_repositories/read.memory.events.in.window.repository.ts` | Indexed `(kind, captured_at)` query |
| `_repositories/read.health.events.in.window.repository.ts` | Optional **22** cross-ref |
| `_repositories/read.illness.report.repository.ts` | Open reports for user |
| `_repositories/write.illness.report.repository.ts` | Report + suspect inserts |
| `_repositories/read.community.illness.signals.repository.ts` | Supabase read for ranking |
| `_repositories/upsert.community.illness.signal.repository.ts` | Supabase write |

### Recall read adapter (**32** consumer of **31**)

| File | Role |
|---|---|
| `_handlers/sift/read.active.recalls.for.products.helper.ts` | SQL against `recall_entry` — no ingest |

Depends on **31** `recall_entry` schema shipping first.

### System skill seed (**32**)

| File | Role |
|---|---|
| `_seeds/illness.detective.skill.seed.ts` | Bundled `illness-detective` skill markdown |
| Brain init | Insert skill if missing (`04-skills.md`) |

### Mobile (**32**)

| File | Role |
|---|---|
| `mobile/features/illness.detective/sift.feature.tsx` | Result screen root |
| `mobile/features/illness.detective/_components/sift-suspect-card.tsx` | Ranked suspect row + recall badge |
| `mobile/features/illness.detective/_components/sift-safety-banner.tsx` | Severe symptom guidance (static — not generative) |
| `mobile/features/illness.detective/_components/sift-followup-questions.tsx` | Optional Q&A |
| `mobile/features/illness.detective/_components/sift-community-optin.tsx` | Authority export opt-in |
| `mobile/network/sift/sift.api.ts` | Brain RPC or REST if exposed |
| `mobile/app/sift/[reportId].tsx` | Deep link to result |

Entry may also live in chat (**20**) — mobile feature folder is for dedicated result + deep links.

### Integration hooks (callers / callees)

| Feature | Hook |
|---|---|
| **05** | `log_memory_event` with `sickness_logged` on report |
| **09** | `schedule_user_alarm` for `sickness_followup` |
| **14** | `dispatchAlarm` case → `handle.sickness.followup` |
| **20** | Chat invokes `run_sift` tool |
| **31** | `recall_entry` active rows — read only |
| **27** | Poll/read `community_illness_signal` WHERE `elevated` for Ground styling |
| **24**/**33**/**29**/**26** | Produce `memory_event` rows Sift queries |

---

## Dependency order

```text
04-brain-foundation (Brain DO, migrations)
  → 05-brain-memory-tools (memory_event writes)
  → 09-brain-alarm-tools (schedule_user_alarm — partial shipped)
  → 14-brain-alarm-dispatch (dispatch shell — unshipped)
  → 20-brain-chat-runtime (tool invocation surface)
  → 24-scanner + 25-recipe + 33-receipt (food history producers — unshipped)
  → 31-recall-alerts (recall_entry read — unshipped)
  → 32-illness-detective (this feature)
      → 27-ground (elevated alert display — optional parallel)
```

**22** `health_events` and **36** wearables are optional ranking inputs — not blocking MVP.

---

## Acceptance criteria

### Report flow

- [ ] User can start Sift via voice/tap "I feel sick" without multi-page medical questionnaire
- [ ] Exactly one required question: symptom onset time
- [ ] `illness_report` created with `status=open`, `window_start`/`window_end` computed
- [ ] Status transitions: `open` → `resolved` | `dismissed`

### Lookback window

- [ ] 1–6h onset → last meal only
- [ ] 6–24h → last 2–3 meals
- [ ] 24–72h → full 72h window
- [ ] Query uses Brain SQLite `memory_event` indexed on `(kind, captured_at)`
- [ ] Per-user only — no cross-user batch investigation

### Ranking

- [ ] Structured LLM pass (non-streaming); p95 latency under 2s (spec target)
- [ ] Top 3 suspects with confidence, `reason_code`, plain-language reason
- [ ] Active recall match ranked highest with `RECALL ACTIVE` tag when **31** data present
- [ ] Community cluster increases rank when `community_illness_signal` shows elevated counts
- [ ] Copy never claims diagnosis — "likely suspect" language only
- [ ] Wearable context, if present, uses supporting-evidence phrasing only

### Follow-up questions

- [ ] Optional "others sick?" and doneness questions skippable
- [ ] Answers adjust suspect ordering without new report row

### Community signal

- [ ] Write path strips `user_id` before Supabase insert
- [ ] No timestamp precision finer than 24h on community rows
- [ ] 3+ reports / 72h / same product or restaurant → `elevated=true`
- [ ] Authority export blocked without explicit user opt-in

### `sickness_followup` alarm

- [ ] On report completion, `schedule_user_alarm({ alarm_type: 'sickness_followup', … })` fires
- [ ] Payload includes `memory_event_ids` and/or `report_id` + symptom summary
- [ ] **14** dispatches to **32** `handle.sickness.followup` — not inline in **14** beyond case branch
- [ ] Opens `alarm` session per `07-sessions.md`; closes on completion
- [ ] Uses `sickness_followup` string — not `illness-followup` (obsolete coding-standards example)

### Privacy

- [ ] Individual illness reports private in Brain DO
- [ ] User data deletion request removes `illness_report`/`illness_suspect` for user
- [ ] Severe-symptom safety banner is static — not generative (spec 39)
- [ ] Illness events excluded from Harvest/share surfaces (**49**)

### Mobile / UX

- [ ] Sift result shows top 3 suspects + safety next steps
- [ ] Recall badge links to **31** recall detail when match exists
- [ ] Generative tone layer optional; static fallback fully functional under 400ms rule

### Tests

- [ ] `compute.lookback.window` unit tests for three onset bands
- [ ] `rank.sift.suspects` mocked LLM — recall boost ordering
- [ ] Community write test — assert no `user_id` in Supabase payload
- [ ] `schedule.sift.followup` integration with **09** executable
- [ ] Privacy copy lint — no diagnostic language in templates

---

## Obsolete sources (do not implement)

| Source | Why obsolete |
|---|---|
| `06-backend-do-agent-patterns.md` `illness-followup` alarm type | Use `sickness_followup` |
| `06-brain-memory/01-sqlite-schema.md` `illness_detective` action_outcome key alone | Align to `sickness_followup` handler |
| Diagnosis language in any template | Spec 30 + privacy rules forbid |
| Contributing identifiable illness rows to **22** community health tables | Wrong table + wrong opt-in |

---

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **14** | `_features/14-brain-alarm-dispatch/draft/run.inline.alarm.session.handler.gap.md` |
| **14** | `_features/14-brain-alarm-dispatch/draft/dispatch.alarm.handler.gap.md` |
| **31** | `_features/31-recall-alerts/draft/recall.schema.gap.md` — `recall_entry` read target |
| **09** | `_features/09-brain-alarm-tools/draft/schedule.user.alarm.schema.md` |
