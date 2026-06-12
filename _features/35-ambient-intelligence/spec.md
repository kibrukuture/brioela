# Ambient Intelligence — Spec

Feature **35**. Background intelligence that makes Brioela feel alive without explicit user logging: private behavioral food patterns and wellbeing correlations, pre-trip destination food intel (`travel_preload` alarm), food time machine inline moments, guest-mode constraint layering with archive-to-memory promotion, ambient candidate queues, surfacing/privacy caps, and (second release) Ground find-to-cooking ambient cards. All work runs on the per-user Brain DO alarm cycle — no separate cron service.

**Not in this feature:** `BehaviorPatternAgent` DO class and `pattern.*` memory writes on schedule (**12**); alarm dispatch router and inline alarm session shell (**14**); push delivery, suppression tables, and `travel_preload_ready` send path (**21**); healthy map place APIs and destination cache **display** on Mapbox (**28** writes consumer only); Ground Find pipeline and authenticity gate (**27** — find-to-cooking is second-release bridge into **35** surfaces); weekly food summary **content generation** body (**34** — **35** may surface one Time Machine line inside summary); illness followup alarms (**32**); wearables corroboration (**36**); negative-space nutrition gap insights (**38**); craving decoder (**37**); growth mirror (**40**); Harvest annual composition (**53**).

**Living catalog note:** Ambient surface kinds (`behavior_pattern_intervention`, `time_machine_moment`, `travel_preload`, `guest_memory_promotion`, `find_to_cooking`) are product strings — not `scheduled_alarms.alarm_type` values unless product adds them later. Alarm types used by **35**: `behavior_pattern_detection`, `travel_preload`, `brain_maintenance_run` (guest promotion support), `weekly_food_summary` (optional Time Machine surface).

---

## Purpose

The user lives their food life — scans, cooks, talks, travels — and Brioela quietly prepares: notices correlations, pre-loads destination context, surfaces small true memories at the right moment, layers guest constraints during group cooking, and respects privacy caps. No mood tracker, no dashboard, no surveillance tone.

1. **Capture** passive signals from existing interactions (voice/cooking transcripts, scans, receipts, illness events).
2. **Compute** intervention and moment **candidates** in background passes before anything is user-facing.
3. **Surface** conversation-first, inline scan/recipe, weekly summary, or one quiet travel-ready push — per **21** rules.
4. **Expire** stale candidates; fail quietly; never notify on backend errors.

Without **35**, travel mentions do not pre-load map/scan context, food history never becomes emotional inline moments, guest cooking stays single-profile only, and behavioral insights lack a product surfacing layer distinct from raw `pattern.*` facts.

---

## Product definition

| Term | Meaning |
|---|---|
| **Ambient Intelligence** | Umbrella for background, private, conversational surfacing — not a user-facing feature name or settings screen. |
| **Ambient alarm loop** | Shared Brain DO execution: idle checks, candidate queues, dispatch via `scheduled_alarms` (**14**). |
| **Wellbeing signal** | Organic transcript phrase (`energy_low`, `stomach_discomfort`, etc.) linked to recent food context — never solicited. |
| **Behavior pattern (ambient)** | Product-facing hypothesis with evidence thresholds and intervention copy — may use dedicated tables or promoted from `pattern.*` (**12**). |
| **Ambient candidate** | Queued item awaiting a valid surface moment — prevents immediate push of raw inference. |
| **Travel intent** | Detected trip with destination, dates, confidence, status lifecycle. |
| **Travel preload** | Background job + `travel_preload` alarm that fills user-scoped destination cache before departure. |
| **Time Machine moment** | Private, warm, factual history line at scan/recipe/open/summary — not gamification. |
| **Guest session** | Temporary constraint layer on top of user profile — never mutates permanent constraints. |
| **Guest memory promotion** | Recurring guest constraint patterns → `social.cooking_patterns` `user_memory` after weekly review. |

**Design principle (non-negotiable):** Preparation, not surveillance. Tentative copy. Easy to ignore. Maximum one new pattern insight per week across the conversational-insight family (shared budget with **38** negative-space and **40** growth mirror per spec **17**).

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/18-ambient-intelligence/`, `brioela-specs/17`, `22`, `37`, `38`, `23`, `implementable-specs/15`, `backend/src/agents/brain/`, neighbor `_features/12`, `14`, `21`, `27`, `28`, `34`.

| Component | Type | In **35**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Ambient alarm loop orchestration** | Brain handler | **Yes** | No | Idle check + pass dispatch | `01-ambient-alarm-loop.md` |
| **`checkAmbientIdle` helper** | Brain helper | **Yes** | No | 2h active-session window | `01-ambient-alarm-loop.md` |
| **`ambient_candidate` queue** | Brain SQLite / `agent_state` | **Yes** | No | Pre-surface buffer | `01-ambient-alarm-loop.md` |
| **Wellbeing signal capture** | Transcript processor | **Yes** | No | Cooking/voice session events | `02-behavioral-patterns.md`, spec **17** |
| **`wellbeing_signal` table** | Brain SQLite | **Yes** | No | Passive capture store | spec **17** |
| **`behavior_pattern` table** | Brain SQLite | **Yes** (product) | No | Active patterns + evidence | spec **17**; reconcile vs **12** `pattern.*` |
| **Pattern intervention candidates** | Brain rows / queue | **Yes** | No | Max 1/week surfacing | `02-behavioral-patterns.md` |
| **Ambient behavior pattern pass** | Alarm-driven handler | **Yes** | No | `behavior_pattern_detection` | `01`, `02` |
| **Travel intent detection** | Event + LLM helper | **Yes** | No | Voice, calendar, map search | `03-pre-trip-food-intelligence.md`, spec **22** |
| **`travel_intent` table** | Brain SQLite | **Yes** | No | Intent lifecycle | spec **22** |
| **`travel_preload` alarm handler** | Inline alarm session | **Yes** | No | **14** dispatches; **35** owns body | spec **22**, `03` |
| **QStash destination worker** | Worker HTTP | **Yes** | No | Shared map/product/community fetch | spec **22** |
| **`travel_local_cache` / Redis geo cache** | Brain + Upstash Redis | **Yes** write | No | User-scoped, 30d expiry | `03`, spec **22** |
| **Arrival activation** | App-open + Brain RPC | **Yes** | No | Switch scan DB priority, map context | `03` |
| **`travel_preload_ready` notification** | Push kind | Consumer | No | **21** delivers; **35** triggers | `06-surfacing-and-privacy.md`, spec **23** |
| **Time Machine candidate builder** | Weekly ambient pass | **Yes** | No | 5–10 ranked moments | `04-food-time-machine.md`, spec **38** |
| **`time_machine_moment` queue** | Brain SQLite | **Yes** | No | 14d expiry | `04` |
| **Time Machine inline surfaces** | Mobile UI | **Yes** | No | Scan, recipe open, app open, summary | `04` |
| **Guest session activation** | Chat/cooking detector | **Yes** | No | Conversational only | `05-guest-mode.md`, spec **37** |
| **`guest_session` table** | Brain SQLite | **Yes** | No | Active + archived rows | spec **37** |
| **Guest constraint layering** | Constraint merge helper | **Yes** | No | User + guest intersection | `05` |
| **Guest archive weekly review** | Ambient pass `guest_review` | **Yes** | No | 4+ overlapping sessions → memory | `05`, `01` |
| **`social.cooking_patterns` memory** | `user_memory` namespace | **Yes** | No | Promoted patterns only | spec **37** |
| **Ambient suppression state** | Brain SQLite | **Yes** | No | Per-family dismiss caps | `06-surfacing-and-privacy.md` |
| **Surfacing audit trail** | Brain log | **Yes** | No | candidate id, surface, action | `06` |
| **Find-to-cooking ambient card** | Second release | **Yes** | No | **27** Find → **35** surface | `09-ground/06-find-to-cooking-trigger.md` |
| **`BehaviorPatternAgent` sub-agent** | Brain child DO | **No — 12** | No | `pattern.*` writes every 3d | `implementable-specs/15` |
| **`dispatchAlarm` `travel_preload` case** | Router | **No — 14** | No | Calls inline session | `_features/14-brain-alarm-dispatch/spec.md` |
| **Map destination display** | Mobile map layer | Consumer | No | **28** reads cache **35** wrote | `_features/28-map/spec.md` |
| **Push platform** | OneSignal / Brain tools | Consumer | Partial | **21** | `_features/21-platform-notifications/spec.md` |

### Shipped in repo today (ambient-related)

- `scheduled_alarms` table + `schedule_user_alarm` / `cancel_user_alarm` (**09**) — `travel_preload` appears in tests only.
- `sessionKindSchema` includes `behavior_pattern_detection` in `get.brain.tools.ts` — wrong tool permissions vs spec **15** (**12** G3).
- `DEDUP_USER_ALARM_TYPES` — `behavior_pattern_detection` deduped at schedule; `travel_preload` not deduped.
- **No** ambient Brain tables, handlers, schemas, validators, mobile surfaces, or ambient tests.
- `rg 'wellbeing_signal|travel_intent|time_machine|guest_session|ambient_candidate' backend/` — zero production matches beyond alarm test strings.

---

## Architecture — ambient alarm loop

```text
User interactions (scan, cook, voice, receipt, map search, calendar)
        │
        ├── Realtime: wellbeing_signal capture (transcript path)
        ├── Realtime: travel.intent_detected event → confirm → schedule travel_preload
        └── Realtime: guest constraint detection → guest_session active layer

scheduled_alarms wake [14 processDueAlarms]
        │
        ├── behavior_pattern_detection [12 spawns BehaviorPatternAgent OR 35 ambient pass wraps]
        │     ├── 12: memory_event → pattern.* user_memory (3+ events, conf ≥ 0.6)
        │     └── 35: wellbeing correlation, intervention candidates, stricter thresholds
        │
        ├── travel_preload [14 inline alarm session → 35 runTravelPreload]
        │     ├── QStash worker: community, products, map places, menu hints
        │     └── Write travel_local_cache (Brain SQLite + Redis geo)
        │     └── Optional: queue travel_preload_ready [21]
        │
        ├── brain_maintenance_run [12] — guest archive promotion may run in 35 guest_review pass instead
        │
        └── weekly_food_summary [34 generates body] — 35 may attach one Time Machine line

Weekly / idle ambient passes (same DO, no separate cron):
        ├── buildTimeMachineCandidates → ambient_candidate kind time_machine_moment
        └── reviewGuestSessionArchive → guest_memory_promotion candidates

Surface moments (not dashboard):
        Conversation │ scan inline │ recipe secondary │ weekly summary │ map on arrival │ find-to-cooking card [27]
        Push: travel_preload_ready only (one quiet) among ambient family defaults
```

**Idle rule (authoritative — ambient):** Before write-heavy ambient work, `checkAmbientIdle`: if active session in last **2 hours**, reschedule pass **2 hours** later. Pattern **reads** without surfacing may run while active. No push during cooking, voice, live scan, or Bela unless critical safety (**21**).

**Conflict — defer duration:** **12** sub-agents defer **1 hour** on `check_active_session` per spec **15**. Ambient build-guide uses **2 hours** for idle reschedule. **Prefer spec 15 for sub-agent spawn; prefer build-guide 18 for ambient write/surface passes** until unified — document in `status.md` G22.

---

## Sub-feature 1 — Behavioral patterns (ambient product layer)

### Core rule

No explicit mood logging. Signals from interactions user already has. Insights surface conversationally — never standalone pattern push by default.

### Wellbeing signal capture

During voice or cooking sessions, when user naturally mentions energy, stomach, mood context:

```typescript
type WellbeingSignal = {
  signalId: string
  userId: string
  signalType: 'energy_low' | 'energy_high' | 'stomach_discomfort' | 'mood_low' | 'mood_positive'
  sourceSession: string
  foodContext: {
    lookbackHours: 12 | 24 | 48
    scanEventIds: string[]
    receiptEventIds: string[]
    recipeIds: string[]
  }
  capturedAt: number
}
```

`mood_*` types are context only — no mental-health claims.

### Pattern types (ambient product)

| Pattern | Evidence |
|---|---|
| `energy_correlation` | Repeated food/category before low/high energy signals |
| `stress_eating` | Late-night scans, comfort purchases + stress language |
| `post_sickness_association` | Foods near illness reports (**32**) — soft candidate only |
| `aversion` | Repeated rejection without named aversion |
| `dietary_drift` | Scan frequency shift over 30+ days |
| `travel_food_preparation` | Pre-trip scan/purchase shifts |
| `craving_correlation` | From **37** `craving_decoded` events (spec **17** related specs) |

### Evidence thresholds (ambient — stricter than **12** generic pass)

| Pattern class | Minimum | Confidence |
|---|---|---|
| Wellbeing / health correlation | 5 consistent instances | ≥ 0.75 |
| Stress eating | 5 instances, 2+ weeks | ≥ 0.7 |
| Aversion | 4 avoid/reject signals | ≥ 0.65 |
| Dietary drift | 30 days changed behavior | ≥ 0.7 |
| Post-sickness | 3 illness-linked | soft candidate only |

**12 BehaviorPatternAgent** uses **3+** events and confidence **≥ 0.6** for `pattern.*` writes — lower bar, not user-facing.

### Intervention candidate

```typescript
type PatternInterventionCandidate = {
  patternId: string
  suggestedLine: string
  surface: 'conversation' | 'scan_inline' | 'weekly_summary'
  maxSurfaceAfter: number
  surfacedAt: number | null
}
```

Example copy: *"I've noticed you often mention feeling sluggish the day after meals with heavy cream. Want me to keep an eye on that?"*

### Surfacing limits

- Max **one** new pattern insight per week (shared budget with **38**, **40**, **53** per spec **17**).
- No push for pattern insights by default.
- Two dismissals → suppress pattern family 14 days; user rejection → `dismissed` pattern.

### Medical boundary

Allowed: tentative observation + offer to watch. Blocked: diagnosis, "you are stress eating," medical directives.

---

## Sub-feature 2 — Pre-trip food intelligence

### User outcome

User mentions travel → Brioela pre-loads quietly → on arrival scan/map already reflect local context.

### Travel intent sources

| Source | Confidence |
|---|---|
| Voice: "going to Tokyo next week" | High — auto-confirm |
| Calendar (opt-in) | High |
| Repeat distant map city search | Low — confirm once |
| Manual save | High |

```typescript
type TravelIntentCandidate = {
  userId: string
  destinationCity: string
  destinationCountry: string | null
  departureDate: number | null
  returnDate: number | null
  source: 'voice' | 'calendar' | 'map_search' | 'manual'
  confidence: number
  status: 'pending' | 'confirmed' | 'active' | 'expired' | 'dismissed'
}
```

### `travel_preload` scheduling

- Departure > 48h away: schedule **48h before** departure.
- Within 48h: schedule ASAP when idle.
- No departure date: candidate only until confirmed.

Alarm type: `travel_preload`. Dispatch: **14** inline `alarm` session → **35** `runTravelPreload`.

### Preload package (user-specific)

Community notes, local products/brands, government DB priority, healthy places, labeling norms, certification bodies, vision language hints, menu fit summaries (shared menu intel from **26** — verdicts recomputed per user).

### Cache

- `travel_local_cache` in Brain SQLite + Upstash Redis geo-region keys.
- Expires **30 days** after return or intent expiry.
- Never ad targeting; not permanent profile fact unless user says recurring.

### Arrival activation

On app open in destination region: mark intent `active`, local scan DB priority, labeling notes, load map cache (**28** displays), optional one `travel_preload_ready` push (**21**).

### Return home

Deactivate travel context, revert scan priority, expire cache, keep minimal memory only if user discussed trip as meaningful.

### API (intended)

- `POST /api/agent/events` — `travel.intent_detected`
- `POST /api/travel/preload` — internal QStash worker
- `GET /api/travel/status` — preload complete check

---

## Sub-feature 3 — Food time machine

### Product rule

Memory, not analytics. No timeline screen. No streaks. No Time Machine-only push.

### Moment types

`first_time` | `staple_count` | `long_gap` | `on_this_day` | `milestone` | `generational_recipe`

### Sources (read-only)

`memory_event`, recipes, cooking sessions, `sessions.outcome_summary`, `user_memory`, generational recipes (**25**).

### Weekly computation

Build **5–10** candidates; rank salience; expire after **14 days** if not surfaced.

### Surfacing points

| Surface | Example |
|---|---|
| Scan inline | "First time with this product." / "You've scanned this 12 times." |
| Recipe open | "You've made this 4 times. Last time was 3 months ago." |
| App open (rare) | "On this day last year you were making lentil soup." |
| Weekly summary | At most one "from your history" line (**34** generates summary shell) |

### Blocked content

Illness nostalgia, medical conditions celebratory tone, guest constraints, shame history, gamification.

### Harvest / Growth Mirror boundary

- **53 Harvest:** annual composition of year's moments — not inline Time Machine.
- **40 Growth Mirror:** who user is *becoming* as cook — different axis, same weekly insight budget.

---

## Sub-feature 4 — Guest mode

### Activation (conversational)

Creates `guest_session` with layered constraints; never edits user permanent profile.

### Effective constraints

`user constraints ∪ active guest constraints` — hard allergies from both sides block.

### Session end

Archive after cooking end, **24h** inactivity, or user clears context. No guest names stored.

### Memory promotion (weekly `guest_review` pass)

**4+** archived sessions with overlapping constraints → optional `social.cooking_patterns` `user_memory`. AI judgment — not hard rule only. Never promote names or one-time guests.

### Surfaces

Recipe suggestions, scan verdicts ("Fine for you. Contains gluten — not OK for your guest."), Mira substitutions, shopping list flags, menu scanning for group meals.

---

## Sub-feature 5 — Surfacing and privacy

### Surface hierarchy

1. Conversation line
2. Scan/recipe inline
3. Weekly summary line
4. In-app map/app-open
5. Push only when timing matters (`travel_preload_ready`)

### Ambient suppression

```typescript
type AmbientSuppression = {
  userId: string
  family: 'patterns' | 'travel' | 'time_machine' | 'guest_mode'
  dismissedCount: number
  suppressedUntil: number | null
  permanentlySuppressed: boolean
}
```

Aligns with **21** `notification_suppression` for push kinds; ambient families track in-app dismissals separately or merged per implementation decision (**status.md** G20).

### Privacy (non-negotiable)

No ad targeting from travel/behavior/guest/Time Machine data. No Ground/community writes from guest or Time Machine. No guest identities. No public timeline. No raw transcript exposure outside Brain processing path.

### Audit trail

Every surfaced ambient moment: candidate id, source event ids, surface, copy, user action, suppression result.

---

## Sub-feature 6 — Find-to-cooking (second release, **27** bridge)

When fresh Ground Find matches user's `ingredient_not_found` or cooking gap with high confidence, surface rare ambient card:

*"Fresh injera flour spotted 300m away. You mentioned wanting to make injera last week. Want to grab it today and cook tonight?"*

Actions: set reminder, start cooking session (**29**). Not generic marketing. **27** owns Find pipeline; **35** owns card copy, confidence gate, suppression.

---

## Feature boundaries — 35 vs 12 / 14 / 21 / 27 / 28

| Concern | **35** (this) | Neighbor |
|---|---|---|
| Wellbeing signal capture + food context linking | **Yes** | **29**/**20** transcript path |
| Stricter ambient patterns + intervention candidates + weekly surfacing cap | **Yes** | — |
| Raw event → `pattern.*` `user_memory` every 3d | **No** | **12** BehaviorPatternAgent |
| Trait synthesis `user_personality` | **No** | **12** BrainMaintenanceAgent Pass 3 |
| `behavior_pattern_detection` alarm schedule + spawn | Orchestration | **12** agent body; **14** dispatch case |
| `travel_preload` alarm schedule + preload job body | **Yes** | **14** inline session shell |
| `travel_preload_ready` push send | Trigger + payload | **21** delivery rules |
| Redis geo cache **write** | **Yes** | **28** map **read** on arrival |
| Menu/restaurant shared intel in preload | Consumes | **26** writes shared; **35** recomputes user verdicts |
| Ground Find data in preload/travel package | Community slice | **27** tables |
| Find-to-cooking ambient card | **Yes** (2nd release) | **27** produces Find |
| `weekly_food_summary` generation | One Time Machine line optional | **34** owns summary body |
| `notification_log` / queue / suppression tables | Consumes | **21** owns schema + send |
| Illness correlation patterns | Soft candidates only | **32** illness events |

### 35 vs 12 — behavioral patterns (critical)

Both touch "behavioral patterns." They are **not duplicate product features** if boundaries hold:

| Dimension | **12 BehaviorPatternAgent** | **35 Ambient behavioral layer** |
|---|---|---|
| Runtime | Ephemeral child DO on `behavior_pattern_detection` alarm | Pass handlers + candidate queue + surfacing helpers |
| Input | `get_memory_events_since` batch | Wellbeing signals + events + existing `pattern.*` / traits |
| Output | `user_memory` `pattern.*` only (confidence ≥ 0.6, 3+ events) | `behavior_pattern` rows (optional table), `wellbeing_signal`, `ambient_candidate` interventions |
| User-facing | **Never** | Conversational / inline (max 1/week) |
| Thresholds | Lower (discovery for maintenance chain) | Higher for health correlations (5 instances) |
| Downstream | BrainMaintenanceAgent → `user_personality` | Intervention copy, scan inline, weekly line |

**Reconciliation rule (migration):** **12** owns the sub-agent and `pattern.*` writes. **35** owns wellbeing capture, product pattern tables (if implemented), candidate queues, surfacing, and travel/time-machine/guest passes. A single `behavior_pattern_detection` alarm wake may chain: spawn **12** agent → on completion, **35** `promoteAmbientCandidates` reads new `pattern.*` + wellbeing rows — **do not run two competing LLM pattern detectors without explicit orchestration** (`status.md` G1).

**Obsolete / conflict sources:**

| Conflict | Prefer |
|---|---|
| `pattern.*` vs `patterns.*` namespace | **`pattern.*`** per spec **15** (**12** G19) |
| `behavior_pattern_detection` cadence weekly (spec **17**, `10-scheduled-alarms`) vs 3 days (**15**, **12**) | **3 days** for agent schedule; ambient correlation "weekly" in product spec means intervention budget per week, not alarm cadence |
| Dedicated `behavior_pattern` SQL table (spec **17**) vs `pattern.*` only (**15**) | Implement dedicated tables in **35** for wellbeing/interventions; keep **12** on `pattern.*` until unified migration |
| Build-guide **04-sub-agents**: pattern agent skips active-session check | **15** requires check — **prefer 15** |
| Ambient idle 2h vs sub-agent defer 1h | Document both; unify in implementation (**G22**) |

---

## Data model (intended Brain SQLite)

Product specs + build-guide types. Register in **04** migration chain.

| Table / store | Purpose |
|---|---|
| `wellbeing_signal` | Passive transcript-derived signals |
| `behavior_pattern` | Active/candidate/dismissed patterns with evidence JSON |
| `behavior_pattern_intervention` | Surfacing audit |
| `ambient_candidate` | Unified queue (or split tables per kind) |
| `travel_intent` | Trip lifecycle |
| `travel_preload_job` | Job status per intent |
| `travel_local_cache` | User-scoped destination payloads |
| `time_machine_moment` | Ranked moment queue |
| `guest_session` | Active/archived guest constraint sets |
| `ambient_suppression` | Per-family dismiss state |

Redis (Upstash): geo-keyed map preload blobs — user-scoped keys; **28** reads.

---

## Notification kinds (ambient-owned triggers)

| Kind | Priority | Push? | Owner |
|---|---|:---:|---|
| `travel_preload_ready` | high | Yes (once) | **35** trigger → **21** send |
| `time_machine_moment` | low | **No** | Inline only |
| `behavior_pattern_intervention` | low | **No** default | Conversation |
| `guest_mode` prompts | low | **No** standalone | In-session |
| `find_to_cooking` | medium? | In-app card default | **35** + **27** |

---

## Hard boundaries

### Ambient Intelligence CANNOT

- Replace **12** sub-agent authorization or write `user_personality` directly from pattern pass
- Send marketing or re-engagement push
- Surface illness/medical history as Time Machine nostalgia
- Store guest names or build contact graph
- Write Time Machine or guest data to Ground/community
- Run separate cron infrastructure outside Brain DO alarms

### Depends on (must ship first for full **35**)

- **04** Brain DO + migrations
- **05** `memory_event`, transcript events
- **09** alarm tools
- **14** dispatch including `travel_preload` case
- **12** `behavior_pattern_detection` spawn (or **35** documents standalone pass only if product drops agent — not recommended)
- **21** send-push for travel ready
- **24** scan events; **29** cooking transcripts; **33** receipts
- **28** map display; **26** menu intel optional slice
- **27** find-to-cooking (second release)

---

## Success metrics

From specs + build-guide **06**:

- Pattern intervention acceptance / dismissal rates
- Travel intent detection rate; preload completion before departure
- Destination map/scan engagement
- Time Machine impression and expand rate
- Guest-safe recipe acceptance vs solo
- Suppression rate (quality proxy)
- Qualitative: surveillance vs "knows me" sentiment

---

## Sources (read for this migration)

### Brioela specs
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `brioela-specs/22-pre-trip-food-intelligence.md`
- `brioela-specs/37-guest-and-cooking-for-others.md`
- `brioela-specs/38-food-time-machine.md`
- `brioela-specs/23-ambient-notification-strategy.md`

### Build guides
- `build-guide/18-ambient-intelligence/` (all 7 files)
- `build-guide/05-brain/04-sub-agents.md`, `05-alarm-system.md`
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md`
- `build-guide/12-notifications/01-priority-model.md`, `02-delivery-rules.md`, `03-suppression-state.md`, `04-surfaces.md`, `06-data-model-and-tools.md`
- `build-guide/09-ground/06-find-to-cooking-trigger.md`
- `build-guide/10-map/00-overview.md`

### Implementable specs
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/02-user-memory.md`
- `implementable-specs/07-sessions.md`

### Records
- `_records/connections/14-ambient-intelligence-connections.md`
- `_records/build-order/16-layer-ambient-intelligence.md`
- `_records/session-log/019-ambient-intelligence-complete.md`

### Neighbor feature migrations
- `_features/12-brain-sub-agents/spec.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/21-platform-notifications/spec.md`
- `_features/27-ground/spec.md`
- `_features/28-map/spec.md`
- `_features/34-pantry-meal-plan/spec.md` (weekly summary cross-ref)
