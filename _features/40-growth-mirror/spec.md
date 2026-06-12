# Growth Mirror — Spec

Feature **40**. Post-cooking-session skill evidence extraction, per-dimension trajectory maintenance, budgeted conversational recognition, on-demand honest skill answers, and the silent recipe-confidence touch. Observation of cooking growth — never gamification, never visible progression UI.

**Not in this feature:** procedural `skills` CRUD or skill index maintenance (**06** — archives stale markdown skills; orthogonal); `user_personality` trait synthesis (**12** Pass 3 — behavioral/lifestyle traits from `user_memory`; **40** owns cooking-skill trajectories only); grandma `cook_style_profile` extraction (**32**/**49** Heirloom — named cook style; improvisation dimension shares signal *class* only); acoustic prompt / `vision_event` writes (**39**); MiraSession transport and session-end fiber shell (**29**); push notifications for recognition (**21** — in-app/conversational only); Harvest annual composition body (**53** — consumes strongest arc as optional `craft` chapter input); generative grammar renderer (**52** — consumes demonstrated-skill summary for recipe-card variant selection); behavioral food pattern detection (**35**/**17** — shares insight budget, different axis); guard/lexicon/reading-gate tooling.

**Living catalog note:** `skill_trajectory.dimension` is agent-extensible free text beyond the seven shipped dimensions. Every trajectory claim must cite `memory_event` ids of kind `skill_evidence`.

---

## Purpose

Spec **38** (Food Time Machine) surfaces what the user *ate and did*. Nothing surfaces who the user is *becoming* as a cook. Raw evidence already accumulates every session: `vision_event` rows (**11**, **39**), transcripts, intervention frequency, completion outcomes, recipe difficulty trends, improvisation signals (spec **32** class).

**40** turns witnessed sessions into rare, specific, evidence-backed recognition — "your knife work is twice as fast as in January; you haven't burned garlic in eleven sessions." No levels, scores, badges, streaks, or progress bars. Canceling Chef tier means losing the witness to progress.

---

## Product definition

| Term | Meaning |
|---|---|
| **Skill evidence** | Append-only `memory_event` row, kind `skill_evidence`, citing a concrete session observation |
| **Skill dimension** | Observable cooking axis (knife work, heat control, …) — agent may add user-specific dimensions |
| **Skill trajectory** | Derived per-dimension direction + confidence + evidence refs in `skill_trajectory` |
| **Growth recognition** | Queued headline + evidence refs; surfaced conversationally when budget allows |
| **Recipe-confidence touch** | Silent adaptation of recipe framing / Mira pre-brief from demonstrated skill |
| **Evidence floor** | 8 sessions overall + 5 events per dimension before mirror speaks on that dimension |
| **Insight family budget** | Shared weekly cap with pattern (**17**/**35**) and gap (**38**) insights — never two in same week |
| **Recognition budget** | Max one volunteered growth recognition per two weeks (stricter than weekly family cap) |

**Design principle (non-negotiable):** Observation, never reward. Milestones observe truth; gamification incentivizes token-chasing. This feature only does the former.

**Forbidden surfaces:** Visible progression UI; volunteered regression; comparison to other users; skill assessment from scan/purchase behavior; push notifications; standalone recognition cards.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/40-growth-mirror/`, `brioela-specs/53-growth-mirror.md`, `backend/src/`, `shared/`, neighbor `_features/29`, `39`, `12`, `06`, `52`, `53`, `21`, `43`.

| Component | Type | In **40**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Post-session skill evidence extraction** | LLM structured target | **Yes** | No | Session end fiber (**29**) | `01-skill-evidence-extraction.md` |
| **`memory_event` kind `skill_evidence`** | Brain SQLite append | **Yes** | No | Extraction handler | spec **53** § Data Model |
| **`vision_event` reads** | Evidence input | **Cross — 39/11** | No | Heat control, knife work | `01-skill-evidence-extraction.md` |
| **Transcript signal mining** | Evidence input | **Yes** | No | Questions, confidence markers | spec **53** dimensions |
| **Session outcome normalization** | Evidence input | **Yes** | No | Completion, duration, interventions | `01-skill-evidence-extraction.md` |
| **Difficulty normalization** | Mandatory transform | **Yes** | No | Per-signal before write | spec **53** Technical Constraints |
| **Multi-person attribution filter** | Rule | **Yes** | No | Account owner actions only | spec **53** Privacy |
| **`skill_trajectory` table** | Brain SQLite derived | **Yes** | No | Weekly maintenance pass | `02-trajectory-model.md` |
| **Trajectory update pass (Pass 4)** | BrainMaintenanceAgent step | **Yes** | No | `brain_maintenance_run` alarm (**12**) | spec **53** § How the Trajectory Builds |
| **`growth_recognition` queue** | Brain SQLite derived | **Yes** | No | Notability threshold cross | `03-recognition-budget.md` |
| **Insight family budget gate** | Queue enforcement | **Yes** | No | Shared with **17**/**38** | spec **17** Related Specs |
| **Two-week recognition budget** | Queue enforcement | **Yes** | No | Growth-specific cap | spec **53** § Recognition Budget |
| **Candidate expiry (30 days)** | Queue hygiene | **Yes** | No | Unsurfaced → `expired` | `03-recognition-budget.md` |
| **Conversational surfacing** | Mira delivery | **Yes** | No | Session end, recipe open, rare mid-session | `03-recognition-budget.md` |
| **On-demand skill answer** | Mira reactive | **Yes** | No | "Am I getting better?" — unbudgeted | spec **53** |
| **Dismissal suppression ladder** | Category quiet | **Cross — 21** | No | 2 dismissals → 14d then permanent | `03-recognition-budget.md` |
| **Recipe-confidence touch** | Context injection | **Yes** | No | Recipe open + session pre-brief | `04-recipe-confidence-touch.md` |
| **Demonstrated-skill summary for grammar** | **52** consumer input | **Cross** | No | Recipe card variant selection | spec **39** generative UI § Recipe Cards |
| **Harvest `craft` chapter input** | **53** consumer | **Cross** | No | Strongest annual arc (optional) | `build-guide/36-harvest/02-chapter-rules.md` |
| **Chef+ tier gate** | Entitlement | **Cross — 43** | Partial | No separate flag; evidence = cooking sessions | spec **53** Tier Placement |
| **Privacy category + deletion** | Passport / Brain RPC | **Yes** | No | "Cooking progress" category | spec **53** Privacy |
| **Acoustic heat-control evidence** | **39** producer | **Cross** | No | `heat_warning`, `burning_onset` | **39** spec |
| **Transcript intervention fallback** | **39** helper reused | **Cross** | No | When live `vision_event` missed | **39** draft `extract.intervention.events` |
| **Growth mirror metrics** | Observability | **Yes** | No | Resonance, accuracy audit, retention delta | `04-recipe-confidence-touch.md` |
| **Reflective UI / progress cards** | — | **No — forbidden** | — | Spec bans visible progression UI | spec **53** Out of Scope |
| **`skills` table writes** | — | **No — 06** | Partial schema | Procedural markdown skills ≠ trajectories | **06** spec |
| **`user_personality` writes** | — | **No — 12** | Partial schema | Pass 3 behavioral traits ≠ skill growth | **12** spec Pass 3 |
| **`cook_style_profile`** | — | **No — 32** | No | Grandma style ≠ user skill mirror | spec **32** |

### Shipped in repo today (growth-mirror-related)

- `build-guide/40-growth-mirror/` — **5 files complete** (docs only).
- `brioela-specs/53-growth-mirror.md` — primary spec.
- `_records/connections/36-growth-mirror-connections.md`, `_records/build-order/37-layer-growth-mirror.md`.
- `_records/session-log/038-breakthrough-wave-ten-new-features.md` — feature listed.
- `memory_event` table (**05**/**04**) — no `skill_evidence` writer; kind not in implementable-specs event list yet.
- **`rg 'skill_trajectory|growth_recognition|skill_evidence|GrowthMirror' backend/src shared/ mobile/`** — zero product matches.

---

## Architecture

```text
During cooking session (**29** + **11** + **39**):
  vision_event rows (visual | acoustic | fused)
  session_turns transcript
  interventions, timers, outcomes
        │
        ▼
Session end fiber (**29** `runSessionEndProcessing`):
  existing: recipe decision, outcome_summary
  + NEW: extractSkillEvidenceFromSession()
        │
        ├── reads vision_event for session_id
        ├── reads transcript + outcome + recipe difficulty
        ├── difficulty-normalizes independence/timing signals
        ├── filters to account-owner attributed actions only
        └── writes memory_event rows (kind: skill_evidence)
              payload: { dimension, signal, normalized_value?, evidence_refs[] }

Weekly brain_maintenance_run (**12** BrainMaintenanceAgent):
  Pass 1 — skill table hygiene (**06**, unchanged)
  Pass 2 — user_personality decay (**12**, unchanged)
  Pass 3 — personality trait inference from user_memory (**12**, unchanged)
  Pass 4 — skill trajectory update (**40**, NEW)
        │
        ├── load skill_evidence events since last run
        ├── enforce floors (8 sessions, 5 events/dimension)
        ├── upsert skill_trajectory per dimension
        ├── detect notability thresholds → growth_recognition candidates
        └── expire stale candidates (>30 days)

Recognition delivery (Mira **29**/**20**):
  checkGrowthInsightBudget() — family weekly + 2-week growth cap
  pick candidate at natural moment (session end, recipe open)
  surfaceGrowthRecognition() — conversational line with evidence
  on dismiss → suppression ladder (**21**)

Recipe open (**52** + **29**):
  buildDemonstratedSkillSummary() from skill_trajectory
  inject into generative grammar recipe-card context
  Mira pre-brief for one-notch-up recipes

Annual (**53** Harvest):
  read strongest skill_trajectory arc → craft chapter candidate (optional)
```

**Critical boundary — no Growth Mirror Agent DO.** Trajectory math is a deterministic + small LLM step inside existing **12** BrainMaintenanceAgent Pass 4. Evidence extraction is one structured target inside existing **29** post-session call. No new scheduler, no live-session model pass.

---

## Skill dimensions (shipped seven)

| Dimension | Evidence stream |
|---|---|
| Knife work | `vision_event`: chop speed/uniformity observations (**11**) |
| Heat control | `heat_warning` + `burning_onset` per active-heat minute (**11**, **39** acoustic/fused) |
| Timing & parallelism | Timer adherence, multi-dish outcomes, step-overrun deltas |
| Technique vocabulary | Definition questions asked then never re-asked (transcripts) |
| Independence | Interventions + assistance requests per session, difficulty-adjusted |
| Repertoire | Distinct techniques and cuisines cooked to completion |
| Improvisation | Substitutions self-initiated vs. requested (spec **32** signal class) |

Agent may add user-specific dimensions (spec **34** autonomy). Every dimension claim requires concrete `skill_evidence` refs. Thin data → `insufficient_evidence`; mirror stays silent.

---

## Evidence extraction (post-session)

**Trigger:** Existing post-session summarization workflow at cooking session end (**29** `06-session-end-and-recipe.md`). One additional structured-extraction target in the same call family as recipe decision / outcome summary — **not** a new live-session pass.

**Input streams:**

1. `vision_event` rows for `session_id` (**39** must ship first for acoustic heat rows).
2. Full `session_turns` transcript.
3. `sessions.outcome_summary` + recipe difficulty from active recipe metadata (**08**).
4. Intervention counts from `vision_event` + transcript fallback (**39** `extractInterventionEventsFromTranscript`).

**Output:** `memory_event` rows:

```typescript
{
  kind: 'skill_evidence',
  session_id: string,
  captured_at: number,  // session end time
  source: 'post_session_extraction',
  payload_json: {
    dimension: string,           // e.g. 'heat_control'
    signal: string,              // human-auditable observation
    normalized_value?: number,   // difficulty-adjusted metric when applicable
    evidence_refs: string[],     // vision_event ids and/or turn ids
    recipe_difficulty?: number,  // normalization anchor
    attribution: 'account_owner',
  },
}
```

**Rules:**

- Claim without concrete session event → not written.
- Independence/timing signals without recipe difficulty normalization → not written.
- Guest/family unattributed actions → not written.
- Multi-person sessions (**12** spec): only account owner.

---

## Trajectory model (weekly Pass 4)

**Table `skill_trajectory`:**

| Column | Type | Notes |
|---|---|---|
| `dimension` | TEXT PK (per user) | Agent-extensible |
| `direction` | TEXT | `improving` \| `steady` \| `insufficient_evidence` |
| `confidence` | REAL 0–1 | |
| `evidence_refs_json` | TEXT | JSON array of `memory_event` ids |
| `baseline_note` | TEXT | Earliest observed state |
| `latest_note` | TEXT | Most recent observation |
| `sessions_observed` | INTEGER | |
| `updated_at` | INTEGER ms | |

**Floors:** 8 completed cooking sessions overall before any trajectory. 5 `skill_evidence` events per dimension before direction ≠ `insufficient_evidence`.

**Notability → `growth_recognition` candidate:**

- Sustained improvement across 5+ sessions on one dimension.
- Long-broken failure pattern reversed.
- First-time milestone ("first multi-dish meal without timing intervention").

**Table `growth_recognition`:**

| Column | Type | Notes |
|---|---|---|
| `recognition_id` | TEXT PK | |
| `dimension` | TEXT | |
| `headline` | TEXT | Specific, evidenced — generic praise banned |
| `evidence_refs_json` | TEXT | Must trace to `skill_evidence` ids |
| `status` | TEXT | `candidate` \| `surfaced` \| `expired` |
| `surfaced_in` | TEXT nullable | session ref |
| `created_at` / `surfaced_at` | INTEGER ms | |

Queue is durable SQLite state — not session context; not compressed.

---

## Recognition budget and delivery

**Hard budgets (both apply):**

1. **Family budget (spec 17):** At most one volunteered conversational insight of any kind per calendar week across pattern (**35**), gap (**38**), and growth (**40**).
2. **Growth budget (spec 53):** At most one volunteered growth recognition per two weeks.

**On-demand:** "Am I getting better?" and follow-ups — unbudgeted.

**Delivery moments:**

- Session end (primary).
- Relevant recipe open.
- Mid-session, sparingly, only when genuinely earned.

**Never:** push notification (**21** low tier = in-app only); standalone card UI.

**Copy rules:**

- Specific + evidenced. "Nice job tonight!" is banned.
- Never volunteer regression. Asked directly: honest but kind, including stagnant areas.
- No comparison to other users (**35** anti-performance law).

**Expiry:** Candidates unsurfaced 30+ days → `expired`.

**Suppression:** Two dismissals → category quiets 14 days, then permanent unless re-enabled (spec **23** ladder).

---

## Recipe-confidence touch

**Behavior (invisible to user):**

- Techniques trajectory shows mastered → drop warnings, `familiar` energy (spec **39** generative UI) applied to *skill* not scan count.
- Recipe one notch above repertoire → framed within reach; Mira pre-briefed on attention step.
- No UI announces skill level.

**Implementation:**

- `buildDemonstratedSkillSummary()` reads `skill_trajectory` + maps recipe technique metadata to dimensions.
- Injected into generative grammar recipe-card context (**52** / spec **39** § Recipe Cards).
- Mira cooking scene payload carries attention-step note for one-notch-up opens (**29**).

---

## Feature boundaries

### vs **29** (Cooking session)

**29** owns session end fiber, `finalizeCookingSession`, outcome_summary, recipe decision tree. **40** adds `extractSkillEvidenceFromSession` as an additional target in that fiber — does not change live-session behavior.

### vs **39** (Acoustic cooking)

**39** produces `vision_event` rows with `evidence_source`. **40** *reads* those rows for heat-control dimension. Knife work is **vision only** (**11**) — not acoustic. **40** blocked on **39** for full heat-control fidelity.

### vs **06** (Brain skill tools)

**06** `skills` table = procedural markdown instructions the agent loads on demand (`cooking-coach`, user-created procedures). **40** `skill_trajectory` = observed cooking competence over time. **40** does not call `create_user_skill` / `update_user_skill`. BrainMaintenanceAgent Pass 1 archives stale *procedural* skills; Pass 4 maintains *trajectories* — different tables, different semantics. **Do not conflate "skill" in table names.**

### vs **12** (Brain sub-agents) — CRITICAL

| | **12** Pass 3 | **40** Pass 4 |
|---|---|---|
| **Input** | `user_memory` (all namespaces incl. `pattern.*`) | `memory_event` kind `skill_evidence` + `vision_event` |
| **Output** | `user_personality` traits | `skill_trajectory` + `growth_recognition` |
| **Question answered** | Who is this person behaviorally? | How is this user growing as a cook? |
| **Examples** | `stress-eater`, `family-cook` | knife work improving, heat control steady |
| **LLM role** | Synthesize cross-fact behavioral traits | Summarize dimension direction from session evidence |

**Duplication risk:** Pass 3 must **not** infer cooking-skill traits (e.g. `improving-knife-work`, `confident-saucier`) — those belong exclusively to **40**. Pass 3 prompt must exclude dimensions in the shipped seven + agent-added trajectory dimensions. **12** `build-guide/05-brain/04-sub-agents.md` Pass 3 "memory consolidation flags" is **obsolete**; authoritative Pass 3 is trait inference per spec **15** (**12** spec documents this).

**40** adds **Pass 4** to BrainMaintenanceAgent — does not replace or merge with Pass 3.

### vs **32** (Grandma style flavor profile)

**32** extracts named cook's style into `cook_style_profile` from generational capture sessions. **40** tracks the *account owner's* skill growth across all cooking sessions. Improvisation *dimension* reuses spec **32** signal class (self-initiated substitution) but writes `skill_evidence`, not `cook_style_attribute`.

### vs **52** (Generative grammar)

**52** owns renderer + recipe-card variant selection. **40** supplies `demonstratedSkillSummary` as one more context block — same injection path as scan-count `familiar` mode. **40** does not render UI.

### vs **53** (Harvest)

**53** composes annual edition. `craft` chapter type draws strongest **40** arc when present — **optional**; Harvest ships without **40** per build-order exception. Numbers from queries, not model invention.

### vs **35** / **17** / **38** (Insight family)

Same weekly conversational-insight budget. Pattern = what user *does* with food. Gap = what is *absent*. Growth = who user is *becoming* as cook. Enforced in shared queue — never two types same week.

### vs **21** (Notifications)

Growth mirror = conversational / in-app only. Priority `low` — never push.

### vs **43** (Pricing tiers)

Chef tier and above (cooking sessions exist). Vision/acoustic enriches evidence on Power tier but transcript/outcome dimensions work voice-only. No teaser — cannot preview "being witnessed."

---

## Privacy

- All `skill_trajectory` + `growth_recognition` + `skill_evidence` = private Brain DO.
- Listed in "what Brioela knows about me" (spec **34**): plain language — "Brioela keeps notes on your cooking progress."
- Deletable as one category (cascade `skill_evidence` optional retention policy TBD — prefer delete derived + evidence on user request).
- Never in Ground, Mesa, Passport community, practitioner surfaces.
- Harvest `craft` chapter inherits **53** share rules only.

---

## Success metrics

- Recognition resonance (positive response / "tell me more").
- On-demand "am I getting better?" rate (trust signal).
- Recognition accuracy audit (sampled claims vs evidence refs).
- Retention delta: 2+ surfaced recognitions vs matched session-count baseline.
- One-notch-up recipe completion rate vs historical baseline.
- Dismissal rate (annoyance ceiling).

---

## Source documents read

### Primary

- `brioela-specs/53-growth-mirror.md`
- `build-guide/40-growth-mirror/00-overview.md`
- `build-guide/40-growth-mirror/01-skill-evidence-extraction.md`
- `build-guide/40-growth-mirror/02-trajectory-model.md`
- `build-guide/40-growth-mirror/03-recognition-budget.md`
- `build-guide/40-growth-mirror/04-recipe-confidence-touch.md`

### Cross-refs

- `brioela-specs/32-grandma-style-flavor-profile.md`
- `brioela-specs/38-food-time-machine.md` § Growth Distinction
- `brioela-specs/39-generative-ui.md` § Recipe Cards
- `brioela-specs/17-behavioral-food-pattern-detection.md` § Related Specs
- `brioela-specs/11-live-vision-cooking-coach.md` (vision evidence)
- `brioela-specs/46-acoustic-cooking-intelligence.md` (acoustic evidence)
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`
- `build-guide/36-harvest/01-composition-workflow.md`, `02-chapter-rules.md`
- `implementable-specs/01-memory-event.md`, `15-brain-maintenance-and-behavior-patterns.md`
- `_records/connections/36-growth-mirror-connections.md`
- `_records/build-order/37-layer-growth-mirror.md`
- `_features/29-cooking-session/`, `39-acoustic-cooking/`, `12-brain-sub-agents/`, `06-brain-skill-tools/`, `21-platform-notifications/`, `35-ambient-intelligence/`, `38-negative-space-nutrition/`, `53-harvest/` migration folders
