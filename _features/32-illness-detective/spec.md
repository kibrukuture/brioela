# Illness Detective (Sift) — Spec

Feature **32**. When the user reports feeling sick after eating, Brioela runs **Sift** — a bounded food-history investigation that ranks probable culprits from the last 24–72 hours, cross-references active recalls (**31**), anonymized community illness clusters, and known high-risk patterns; surfaces empathetic actionable output; schedules `sickness_followup` (**14** inline alarm session); and optionally contributes anonymized community signals (**27** styling handoff).

**Not in this feature:** Government recall feed poll, `recall_entry` ingest, or recall push (**31** — **32** reads active recalls only); `dispatchAlarm` router shell and `runInlineAlarmSession` (**14** — **32** owns `handle.sickness.followup` prompt/body); push provider delivery rules (**21** — optional push for follow-up); chronic medical condition profiles (**23**); HealthInsightAgent weekly correlation passes and k-anonymous community health 8-table writes (**22** — separate tables and opt-in); wearables SDK and `health_captures` ingest (**36** — **32** may read summaries as supporting evidence only); Ground Find submission gate and map rendering (**27** — may display elevated illness alerts); generative UI component library (**52** — tone layer only); behavioral `post_sickness_association` personality traits (**17** / **12** — reads illness outcomes, does not own Sift).

**Living catalog note:** Exposure sources (receipt, pantry, menu, Bela) extend food-history inputs as sibling features ship. Ranking weight constants and high-risk category lists may grow — update this inventory when adding sources or reason codes.

**Product naming:** User-facing = **Sift** ("Brioela sifted through your last 72 hours"). Code namespace = `sift`, Brain tool = `run_sift`. Stable legacy names: spec file `30-food-illness-detective.md`, folder `build-guide/16-illness-detective/`, tables `illness_report`, `illness_suspect`, `community_illness_signal`.

---

## Purpose

Foodborne illness is common; identifying the source is hard. Brioela already holds scan, receipt, recipe, and restaurant history in Brain DO SQLite. Combined with active recalls and anonymized community reports, it can narrow suspects faster than memory alone — without claiming diagnosis.

1. **Capture** — user says or taps "I feel sick"; one required question: symptom onset time.
2. **Window** — map onset to lookback (last meal → 72h full window).
3. **Gather** — query `memory_event` (+ optional `health_events`, wearable summaries).
4. **Rank** — structured LLM pass with recall + community + risk heuristics; top 3 suspects.
5. **Advise** — severe-symptom guidance, discard/recall links, optional follow-up questions.
6. **Follow up** — `sickness_followup` alarm ~24h later via **14** inline session.
7. **Community** — on user confirmation ("others got sick too"), write anonymized `community_illness_signal`; elevate at 3+ reports / 72h.

Without **32**, sickness events in `memory_event` have no investigation product surface and recall matches lack illness-context ranking.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/16-illness-detective/`, `brioela-specs/30-food-illness-detective.md`, `implementable-specs/01-memory-event.md`, `10-scheduled-alarms.md`, `backend/src`, `shared/`, `mobile/`.

| # | Component | Type | In **32**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Sift entry (voice/tap)** | Chat / mobile surface | **Yes** | No | User "I feel sick" | spec 30, `01-illness-report-flow.md` |
| 2 | **Symptom onset question** | Single UX step | **Yes** | No | Before lookback | spec 30 |
| 3 | **`illness_report` row** | Brain SQLite | **Yes** | No | On investigation start | spec 30, `01-illness-report-flow.md` |
| 4 | **Lookback window calculator** | Pure helper | **Yes** | No | From onset hours | `02-lookback-window.md` |
| 5 | **`memory_event` food history query** | Brain SQLite read | **Yes** | Partial | Last 72h / window | `01-memory-event.md`, **05** |
| 6 | **Receipt / recipe / meal events** | Same query | **Yes** | No | Kinds in window | `02-lookback-window.md`, **25**/**29**/**33** |
| 7 | **`health_events` cross-ref** | Brain SQLite read | **Optional** | No | GI/sickness rows in window | `29-health-intelligence/00-overview.md` |
| 8 | **Wearable supporting context** | Read `health_captures` / summaries | **Optional** | No | **36** ingests; **32** reads | `20-wearables/05-feature-integration.md`, spec 40 |
| 9 | **`recall_entry` active recall read** | Supabase SQL | **Yes** (consumer) | No | During rank | **31**, `03-suspect-ranking.md` |
| 10 | **`community_illness_signal` read** | Supabase SQL | **Yes** | No | Product/restaurant cluster | `04-community-signal.md` |
| 11 | **High-risk category heuristics** | Rank input | **Yes** | No | Shellfish, deli, rice, … | spec 30 |
| 12 | **Structured LLM rank pass** | Non-streaming call | **Yes** | No | `<2s` target | spec 30, `03-suspect-ranking.md` |
| 13 | **`illness_suspect` rows** | Brain SQLite | **Yes** | No | After rank | spec 30 |
| 14 | **Optional follow-up questions** | Chat turn | **Yes** | No | "Others sick?" / doneness | spec 30 |
| 15 | **Sift result screen** | Mobile + generative tone | **Yes** | No | After rank | `05-output-privacy-and-followup.md`, spec 39 |
| 16 | **`sickness_logged` memory_event** | Brain append | **Yes** | No | On report / agent log | `01-memory-event.md` |
| 17 | **`schedule_user_alarm` sickness_followup** | Brain SQLite write | **Yes** (schedule) | Partial | ~24h after report | **09**, `10-scheduled-alarms.md` |
| 18 | **`sickness_followup` dispatch** | **14** router case | **No** — **14** | No | DO alarm wake | **14** spec |
| 19 | **`handle.sickness.followup` body** | Inline alarm prompt | **Yes** | No | **14** calls | `05-output-privacy-and-followup.md` |
| 20 | **`run_sift` Brain tool** | Tool executable | **Yes** | No | Agent or API | spec 09, `brioela-specs/09-per-user-brain.md` |
| 21 | **`illness-detective` system skill** | Brain SQLite seed | **Yes** | No | Procedure markdown | `implementable-specs/04-skills.md` |
| 22 | **Community signal write** | Supabase upsert | **Yes** | No | User confirms cluster | `04-community-signal.md` |
| 23 | **Ground alert elevation** | **27** consumer | **No** — handoff | No | `elevated=true` | **27** spec G29 |
| 24 | **Authority export opt-in** | User consent gate | **Yes** | No | Large cluster + opt-in | spec 30 |
| 25 | **Illness history deletion** | Privacy RPC | **Yes** | No | User data request | spec 30 privacy |
| 26 | **Early wearable onset hint** | Proactive nudge | **Optional** | No | Temp/HR + discomfort | spec 40 — not full Sift |
| 27 | **Stool/symptom photo intake** | Visual intake → Sift input | **Cross-ref** | No | **22**/`34-universal-visual-intake` | spec 34 — feeds investigation |

### Shipped in repo today (illness/Sift-related)

- **`sickness_followup` in alarm schema + test only:** `schedule.user.alarm.schema.ts`, `alarm.tool.test.ts` — schedules row; no handler, no `run_sift`.
- **`rg illness|sift|sickness_logged backend/src shared/ mobile/`** — zero product illness code beyond alarm examples.
- **No** `illness_report` / `illness_suspect` Brain schemas; **no** `community_illness_signal` Drizzle schema.
- **No** `mobile/features/illness.detective/`.
- **No** `run_sift` tool registration in **19** registry.
- Session log `016-illness-detective-complete.md` = **build-guide docs** complete only.

---

## User outcome (surface moments)

1. User: "I feel sick, I think it was something I ate."
2. Brioela: "When did symptoms start?" (one question).
3. Results: top 3 suspects — confidence, plain-language reason, RECALL ACTIVE badge when applicable.
4. Safety copy: severe symptoms → see a doctor; mild → rest/fluids; discard suspect product.
5. Optional: "Did anyone else who ate [meal] get sick?" → adjusts rank; may log community signal.
6. ~24h later (no user action): "How are you feeling?" — inline alarm session; may re-run Sift or resolve report.

Example follow-up (from spec 08): *"You weren't feeling well last night. The shawarma from that place on Bole Road shows up in 3 other illness reports this week."*

---

## Symptom onset → lookback window

| Symptom onset (hours ago) | Food history window | Pathogen class (spec rationale) |
|---|---|---|
| 1–6 | Last meal | Staph, Bacillus — short incubation |
| 6–24 | Last 2–3 meals | Salmonella range |
| 24–72 | Full 72-hour window | Listeria, norovirus — longer incubation |

**Rule:** Per-user investigation only after user report — never batch-query all users.

**Storage boundary:** Food history from Brain DO SQLite (`memory_event` primary; `health_events` supplementary per `29-health-intelligence/00-overview.md`). Recall and community joins from Supabase after candidate window is built (`02-lookback-window.md`).

---

## Suspect ranking logic

Each food-history item in the window receives a composite score. Spec weights (descending):

1. **Active recall match** — highest; `RECALL ACTIVE` tag; read `recall_entry` WHERE active (**31**).
2. **Community illness reports** — same restaurant or product; read `community_illness_signal`.
3. **Known high-risk category** — raw shellfish, undercooked eggs, deli meats (pregnancy context), unpasteurized, rice left at room temperature (Bacillus).
4. **New product / first consumption** — no prior baseline in user history.
5. **Outside food** — restaurant/takeout vs home-cooked known ingredients.

**Output:** Top 3 suspects — confidence, `reason_code`, short plain-language reason, action suggestion.

**Model:** One **structured** LLM call (not streaming chat). Food history + recall + community context in prompt. Target latency **under 2 seconds** (spec 30).

**Language rule:** "Likely suspect" — never "confirmed cause" or diagnosis.

**Wearables (**36**, optional):** Elevated temp/RHR/recovery may appear as *supporting* copy only (`20-wearables/05-feature-integration.md`). Blocked: "your wearable proves food poisoning."

---

## Follow-up questions (optional)

- "Did anyone else who ate [the same meal/same product] also feel sick?"
- "Was the [flagged product] fully cooked?"

Skippable. Answers adjust ranking and may trigger community signal write.

---

## Community signal ("others ate this too")

**Trigger:** User confirms others sick from same product or place.

**Write:** Anonymized increment on `community_illness_signal` — **no `user_id`**, no sub-24h timestamp precision (`04-community-signal.md`).

**Elevation:** 3+ independent reports within 72h at same `product_id` or `restaurant_id` → `elevated=true` → **27** Ground/community alert styling (handoff — **32** owns table write).

**Authority sharing:** User **explicit opt-in** before any illness data shared with food safety authorities. Not automatic (spec 30).

**Boundary vs **22** community health tables:** `community_illness_signal` is acute food-illness clustering (spec 30). **22**'s 8 tables are medication/health correlation aggregates with k-anonymity ≥ 100 — **different schema, different opt-in, no shared rows.**

---

## `sickness_followup` alarm

**Schedules via:** `schedule_user_alarm` (**09**) after illness report or `sickness_logged` memory_event.

| Source | Timing |
|---|---|
| `build-guide/16-illness-detective/05-output-privacy-and-followup.md` | 24h after illness report |
| `build-guide/05-brain/05-alarm-system.md` | 24h after `sickness_logged` event |
| `implementable-specs/10-scheduled-alarms.md` | 4–24h later — agent check-in |

**Resolution at implementation:** Default **24h** from report; allow agent judgment within **4–24h** band per implementable spec. Payload examples: `{ memory_event_ids, symptoms_reported }` (`10-scheduled-alarms.md`).

**Dispatch:** **14** `dispatchAlarm` → `runInlineAlarmSession` shell → **32** `handle.sickness.followup.handler.ts` builds system prompt.

**Session:** `sessions.session_type = 'alarm'`, `alarm_type = 'sickness_followup'` (`07-sessions.md`).

**Delivery:** Primarily inline alarm session (**21** spec: push optional, not default critical push).

**Outcome columns:** `action_outcome_json` may record top culprit after follow-up pass (`06-brain-memory/01-sqlite-schema.md` example uses `illness_detective` key — align to `sickness_followup` alarm_type at implementation).

---

## Privacy and clinical boundaries

| Data | Location | Visibility |
|---|---|---|
| `illness_report`, `illness_suspect` | Brain DO SQLite | Private to user |
| `memory_event` sickness rows | Brain DO SQLite | Private; append-only |
| `health_events` (GI, sickness) | Brain DO SQLite (**22**) | Private; Sift may read, does not export |
| `community_illness_signal` | Supabase | Anonymized aggregate; no user_id |
| Authority export | External | Opt-in only |

- Illness history deletable on user request (same as personal data).
- **Never diagnose** — narrow and advise; diagnosis is medical.
- Allergen/medical **warning cards** are never generative (spec 39 hard constraint).
- **23** chronic conditions ≠ acute Sift episode — do not conflate condition rules with suspect ranking.
- Harvest / share surfaces (**49**) hard-exclude illness events.

---

## Data model

### Brain DO SQLite (private — **32** owns)

| Table | Role | Key fields |
|---|---|---|
| `illness_report` | Investigation session | `report_id`, `user_id`, `symptom_onset_time`, `reported_at`, `window_start`, `window_end`, `status` (`open`/`resolved`/`dismissed`) |
| `illness_suspect` | Rank output | `report_id`, `suspect_type` (`product`/`restaurant`/`meal`), `suspect_id`, `confidence_score`, `reason_code`, `rank` |

**Not in `06-brain-memory/01-sqlite-schema.md` today** — add via Brain migration (**04**).

### Supabase (shared — **32** owns write for illness cluster)

| Table | Role | Key fields |
|---|---|---|
| `community_illness_signal` | Anonymized cluster counter | `signal_id`, `product_id` OR `restaurant_id`, `signal_count`, `window_start`, `window_end`, `elevated`, `created_at` |

### Reads from sibling features (no write)

| Table | Owner | **32** use |
|---|---|---|
| `recall_entry` | **31** | Active recall boost in ranking |
| `memory_event` | **05** | Food history window |
| `health_events` | **22** | Optional symptom corroboration |
| `health_captures` | **22**/**36** | Optional wearable context |

---

## Architecture

```text
User: "I feel sick" (voice / tap / chat)
        │
        ▼
Brain chat session (**20**) OR dedicated Sift surface
        │
        ├── Ask: symptom onset (one question)
        ├── INSERT illness_report (open)
        ├── computeLookbackWindow(onset)
        │
        ▼
buildSiftContext()
        ├── SELECT memory_event WHERE captured_at ∈ [window_start, window_end]
        ├── optional: health_events, health_captures summaries (**22**/**36**)
        ├── SELECT recall_entry WHERE active AND matches products in window (**31**)
        └── SELECT community_illness_signal for restaurants/products in window
        │
        ▼
rankSiftSuspects() — structured LLM (non-streaming)
        │
        ├── INSERT illness_suspect rows (rank 1–3)
        ├── log_memory_event kind: sickness_logged
        ├── schedule_user_alarm(sickness_followup, +24h, payload)  [**09**]
        │
        ▼
Sift result UI (static layer + optional generative tone **52**)
        │
        ├── optional follow-up Q&A → re-rank
        └── user confirms "others sick" → upsert community_illness_signal
                    │
                    └── elevated → **27** Ground alert consumer

~24h later
        │
        ▼
BrioelaBrain.alarm() → dispatchAlarm [**14**]
        │
        └── sickness_followup → runInlineAlarmSession [**14** shell]
                  └── handle.sickness.followup [**32** prompt]
```

**`run_sift(symptom_onset_hours)`** — domain tool on Brain (`brioela-specs/09-per-user-brain.md`). Invokes same pipeline as explicit user flow.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **32** (this) | Sift flow, lookback, ranking LLM, illness_report/suspect tables, community_illness_signal writes, sickness_followup handler body, result UX |
| **31** | `recall_entry` ingest + match + recall push — **32** read-only consumer |
| **22** | `health_events`, `health_captures`, HealthInsightAgent, community health 8 tables — private health correlation; optional Sift read |
| **23** | Chronic medical conditions — not acute food illness episode |
| **14** | `dispatchAlarm`, `runInlineAlarmSession`, `sickness_followup` case wiring |
| **09** | `schedule_user_alarm` tool — **32** calls to schedule follow-up |
| **21** | Push delivery if follow-up sends notification — optional |
| **27** | Ground Find UI; displays elevated illness alerts — does not own `community_illness_signal` |
| **36** | Wearable ingest; early onset hints — supporting evidence only |
| **05** | `memory_event` write path for scans, meals, `sickness_logged` |
| **24**/**33**/**29**/**26** | Exposure event producers feeding `memory_event` |
| **52** | Generative empathetic tone on result screen — not safety copy |

---

## Conflicts and obsolete sources

| Conflict | Resolution |
|---|---|
| `illness-followup` alarm type in `06-backend-do-agent-patterns.md` | **Obsolete** — use `sickness_followup` per implementable specs + shipped **09** schema |
| `action_outcome` example key `illness_detective` in `06-brain-memory/01-sqlite-schema.md` | Align JSON schema to `sickness_followup` handler at implementation |
| Follow-up timing: 24h vs 4–24h | Schedule default 24h; agent may use 4–24h band per `10-scheduled-alarms.md` |
| `illness_report` tables not in Brain memory schema doc | Add tables in **04** migration; spec 30 field names authoritative |
| **22** overview says Sift cross-refs `health_events` | **Optional** v2 — MVP = `memory_event` only |
| Wearables proactive illness flag (spec 40) | Ambient hint only — not a substitute for user-initiated Sift |
| `community_illness_signal` vs **22** `product_community_health_summary` | Separate purposes — illness clustering vs health association aggregates |
| Coding standards `illness.detective/` mobile folder | Target path per `02-coding-standards/01-monorepo` — not created yet |

---

## Success metrics (spec 30)

- Illness report submission rate
- Follow-up question completion rate
- Community signal elevation rate
- User-reported resolution rate ("culprit was X")
- Retention: Sift users vs non-users
- Wearables: hours before user-reported illness that temp deviation appeared (spec 40 — **36**/**32** joint metric)

---

## Sources (read for this migration)

### Primary
- `brioela-specs/30-food-illness-detective.md`

### Build guides — illness detective (all files)
- `build-guide/16-illness-detective/00-overview.md`
- `build-guide/16-illness-detective/01-illness-report-flow.md`
- `build-guide/16-illness-detective/02-lookback-window.md`
- `build-guide/16-illness-detective/03-suspect-ranking.md`
- `build-guide/16-illness-detective/04-community-signal.md`
- `build-guide/16-illness-detective/05-output-privacy-and-followup.md`

### Implementable specs
- `implementable-specs/01-memory-event.md`
- `implementable-specs/04-skills.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/brioela-tools/11-schedule-user-alarm.md`

### Cross-feature specs
- `brioela-specs/08-personal-food-brain-memory.md`
- `brioela-specs/09-per-user-brain.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `brioela-specs/34-universal-visual-intake.md`
- `brioela-specs/39-generative-ui.md`
- `brioela-specs/40-wearables-integration.md`

### Neighbor feature migrations
- `_features/31-recall-alerts/spec.md`
- `_features/22-health-intelligence/spec.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/21-platform-notifications/spec.md`
- `_features/27-ground/spec.md`

### Records
- `_records/connections/12-illness-detective-connections.md`
- `_records/build-order/14-layer-illness-detective.md`
- `_records/session-log/016-illness-detective-complete.md`
