# Negative Space Nutrition — Spec

Feature **38**. Multi-week nutrient-category absence detection over the user's observed food stream (scans-with-purchase, receipt line items, cooked recipes, visual-intake meal logs): coverage-gated structural absences and displacement gaps after dietary changes, conversational surfacing under the spec **17** weekly insight budget, standing concerns mirrored to `user_memory` `diet.gaps`, and quiet downstream influence on meal plan composition (**34**), scan verdict notes (**24**), and weekly summary progress lines (**34**/**16**).

**Not in this feature:** momentary craving decode or eating-gap recency (**37**); proactive stress-eating or wellbeing pattern surfacing (**35** ambient product layer — spec **17** owns unsolicited pattern mentions); `BehaviorPatternAgent` presence-based `pattern.*` writes (**12**); pantry inventory model DDL or meal-plan generation body (**34** — consumer only for standing-concern bias); scanner product resolution and corpus ingest (**24** — consumer only for nutrient maps); receipt capture and vision (**33** — signal source for coverage); push notification transport (**21** — gap insights are conversational/in-app only per spec **50**); deficiency diagnosis or supplement recommendations; daily nutrient scoring dashboards; medical condition rule bodies (**23**/**28** — suppression handoff only).

**Living catalog note:** Tracked nutrient categories (omega-3, calcium carriers, fiber density, etc.) are product strings in detection config and `diet.gaps` keys — not SQL enums. Category expansion is deliberate config/skill updates, not silent schema drift.

---

## Purpose

Every intelligence layer analyzes what the user **does**. **38** watches what **does not** enter the observed stream — nutrient categories with near-zero presence, or nutrients lost when a dietary change removed their carrier without replacement.

1. **Gate** — compute coverage score per window; stay silent below floor and before 6 weeks of qualifying coverage.
2. **Detect** — weekly pass builds presence map from corpus-classified items; flag structural absences and displacement gaps.
3. **Queue** — at most one gap candidate per pass enters the shared intervention queue (spec **17** budget with **35**/**40**).
4. **Surface** — conversational only, mid-interaction, evidence attached, observation framing mandatory.
5. **Close** — one question, one answer, permanent `diet.gaps` memory; confirmed gaps become standing concerns influencing existing surfaces.

Without **38**, chronic blind spots in the kitchen never surface; meal plans cannot bias toward confirmed nutrient carriers; scan verdicts cannot note helpful gap-fill products.

---

## Product definition

| Term | Meaning |
|---|---|
| **Negative space** | Consistent absence of a nutrient category in the **observed** food stream — not clinical deficiency |
| **Coverage score** | Per-user, per-window plausibility that observed data represents substantial food-life visibility |
| **Coverage floor** | Minimum score before any gap candidate may exist — below floor: silent abort |
| **Qualifying coverage** | Consecutive weeks where coverage clears floor — **6-week minimum** before first gap |
| **Presence map** | Category → observed carrier count + recency over the window |
| **Structural absence** | Near-zero category presence across the full observation window |
| **Displacement gap** | `diet.*` change or spec **17** drift removed a carrier category whose nutrients nothing else covers |
| **Gap candidate** | Row in `nutrition_gap` with `status = candidate` awaiting surfacing |
| **Standing concern** | User-confirmed gap (`status = watching`) mirrored in `diet.gaps` memory |
| **Observation framing** | Copy claims only what was observed: "*has come through your kitchen*" — never "*you are deficient*" |
| **Shared intervention budget** | Max one new conversational insight per week across pattern + gap + growth mirror family (spec **17**) |

**Design principle (non-negotiable):** No insight is better than a wrong one. When coverage is thin, silence. Cold start is structurally silent for at least 6 weeks of qualifying coverage — not a bug.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/37-negative-space-nutrition/`, `brioela-specs/50-negative-space-nutrition.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/05`, `09`, `12`, `14`, `24`, `33`, `34`, `35`, `37`.

| Component | Type | In **38**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Coverage score compute** | Brain pure helper | **Yes** | No | Receipt cadence, meal-log density, scan frequency, observation share | `01-coverage-gate.md` |
| **Coverage floor gate** | Brain helper | **Yes** | No | Abort detection pass silently | spec **50** |
| **6-week minimum window** | Pass rule | **Yes** | No | No gap before qualifying weeks | spec **50** |
| **Presence map builder** | Brain helper | **Yes** | No | Classify observed items → categories | `02-detection-pass.md` |
| **Nutrient category taxonomy (v1)** | Config/constants | **Yes** | No | 6 food-pattern-visible categories | spec **50** table |
| **Corpus nutrient classification** | **24** consumer | **Cross** | Partial | Supabase product `nutrients` map | spec **50**, scanner corpus |
| **Unclassifiable item honesty** | Coverage input | **Yes** | No | Lowers coverage; never silent distort | spec **50** |
| **Structural absence detector** | Brain helper | **Yes** | No | Near-zero categories | `02-detection-pass.md` |
| **Displacement gap detector** | Brain helper + optional LLM | **Yes** | No | `diet.*` timeline vs replacements | spec **50**, spec **17** drift |
| **Confidence + dedup** | Brain helper | **Yes** | No | Drop closed, contradicted, below threshold | `02-detection-pass.md` |
| **Condition watchlist suppression** | Brain helper | **Yes** | No | **23**/**28** owns sensitive nutrients | `02-detection-pass.md` |
| **`nutrient_presence_window` table** | Brain SQLite | **Yes** | No | Window audit + presence_map_json | spec **50** |
| **`nutrition_gap` table** | Brain SQLite | **Yes** | No | Gap lifecycle + evidence | spec **50** |
| **`diet.gaps` memory mirror** | `write_user_memory` | **Yes** | No | Standing concerns + closures | `03-surfacing-and-memory.md` |
| **Weekly detection pass** | Alarm handler step | **Yes** | No | `behavior_pattern_detection` chain | `02-detection-pass.md` |
| **Intervention queue enqueue** | **35** consumer | **Cross** | No | `ambient_candidate` kind `negative_space_gap` | spec **17**, **35** |
| **Weekly insight budget enforce** | **35** helper | **Cross** | No | Max 1/week across insight family | spec **17** |
| **Conversational surfacing** | Chat / scan / plan moment | **Yes** | No | Mid-interaction only | `03-surfacing-and-memory.md` |
| **One-question-one-answer closure** | Agent + memory write | **Yes** | No | Permanent close reasons | spec **50** |
| **Dismissal suppression ladder** | **35** shared | **Cross** | No | 2× dismiss → 14d quiet; 3× → permanent | `03-surfacing-and-memory.md` |
| **Meal plan carrier bias** | **34** consumer | **Cross** | No | Reads `diet.gaps` watching | spec **50**, **34** |
| **Scan verdict carrier note** | **24** consumer | **Cross** | No | Quiet line on helpful products | spec **50** |
| **Weekly summary progress line** | **34** consumer | **Cross** | No | Tracks gap close | spec **16** |
| **Predictive pantry cadence input** | **34** signal | **Cross** | No | Receipt regularity for coverage | `01-coverage-gate.md` |
| **Tier gate (Core+)** | Entitlement helper | **Yes** | No | Same placement as behavioral patterns | spec **50**, **19** |
| **Passport / privacy surfacing** | **47** consumer | **Cross** | No | Deletable `diet.gaps` entries | spec **50** |
| **Metrics instrumentation** | Observability | **Yes** | No | Confirmation rate, close rate, floor calibration | spec **50** |
| **Standalone gap push** | — | **No — 21** | — | Conversational only | spec **50** out of scope |
| **Craving decode / eating gap** | — | **No — 37** | — | Momentary recency | spec **52** |
| **Proactive pattern insight** | — | **No — 35** | — | Presence patterns | spec **17** |

### Shipped in repo today (negative-space-related)

- `build-guide/37-negative-space-nutrition/` — **4 files complete** (docs only).
- `brioela-specs/50-negative-space-nutrition.md` — primary spec.
- `_records/connections/33-negative-space-nutrition-connections.md`, `_records/build-order/34-layer-negative-space-nutrition.md`.
- `_records/session-log/038-breakthrough-wave-ten-new-features.md` — feature listed in breakthrough wave.
- `memory_event` + `write_user_memory` (**05**) — shipped; no `diet.gaps` writer or gap-specific kinds.
- `scheduled_alarms` + `behavior_pattern_detection` (**09**/**12**) — alarm shell; no negative-space pass body.
- **`rg 'nutrition_gap|nutrient_presence|diet\.gaps|negative_space|negativeSpace' backend/src shared/ mobile/`** — zero product matches.

---

## Architecture — weekly detection pass

```text
Signal sources (not owned by 38)
  ├── Product scans with purchase link (**24**)
  ├── Receipt line items (**33**)
  ├── Cooked recipes / cooking sessions (**29**)
  ├── Visual intake meal logs (spec **34**)
  └── diet.* user_memory + spec **17** drift patterns

scheduled_alarms: behavior_pattern_detection [14 processDueAlarms]
        │
        ├── **12** BehaviorPatternAgent spawn (pattern.* presence patterns)
        │
        └── **38** runNegativeSpaceDetectionPass (same wake — no new alarm_type)
              │
              step 1: computeCoverageScore(window) → abort if below floor
              step 2: buildPresenceMap(observed items, corpus nutrients)
              step 3: detectStructuralAbsences(presence map, 6-week min)
              step 4: detectDisplacementGaps(diet.* timeline, drift, map) [≤1 LLM call]
              step 5: dedupeGapCandidates(closed memory, contradictions, thresholds)
              step 6: enqueueGapInterventionCandidate → **35** ambient_candidate queue
                        (respect weekly insight budget — spec **17**)

Surface moments (38 owns copy + closure; **35** owns queue dispatch timing):
  Relevant scan │ meal plan generation │ cooking conversation │ weekly summary line (progress only)
  Never: standalone push, dashboard, nutrient report card

User answers once:
  yes → nutrition_gap.status = watching + diet.gaps memory
  no / covers elsewhere / supplement mention → closed + diet.gaps memory (never re-ask)

Downstream (read diet.gaps via normal memory injection — spec **09**):
  **34** meal plan ranks carrier recipes
  **24** scan verdict optional quiet carrier note
  **34** weekly summary tracks close
```

**Cadence rule:** Detection runs inside the existing weekly Brain DO alarm cycle alongside behavior pattern detection — **not** a new scheduler or separate alarm type. Hook after **12** `BehaviorPatternAgent` completes on `behavior_pattern_detection` wake; coordinate queue writes with **35** so pattern and gap candidates share one weekly budget.

**Compute bound:** Counting queries against Brain SQLite + at most **one** structured LLM call per pass (displacement reasoning only).

---

## Coverage gate

### Inputs (per user per window)

| Signal | Source feature | Role |
|---|---|---|
| Receipt regularity | **33** purchase events + **34** `purchase_pattern` median intervals | Grocery cadence plausibility |
| Meal-log density | Visual intake / meal logs (spec **34**) | Eating-event visibility |
| Scan frequency | **24** scan history | Product observation density |
| Observation share | Ratio of plausible eating events with any observation | Honesty denominator |
| Unclassifiable share | Corpus items lacking nutrient data | Lowers score — never silent pass-through |

### Rules

- Below floor → detection pass **aborts silently**. No partial results, no hedged insights.
- Minimum **6 weeks** of qualifying coverage before any gap candidate may exist.
- User correction ("I eat fish at lunch every day") → coverage answer; gap closed `user_covers_elsewhere`; never re-asked.
- Floor calibration is a tracked metric (spec **50** success metrics).

---

## Tracked categories (v1)

Deliberately short — food-pattern-visible, well-evidenced:

| Category key | Observable carriers |
|---|---|
| `omega_3` | fatty fish, walnuts, flax/chia, fortified products |
| `calcium` | dairy, fortified alternatives, canned fish with bones, leafy greens at volume |
| `fiber_density` | whole grains, legumes, produce volume |
| `fresh_produce` | fruit and vegetable presence (vitamin C proxy) |
| `iron` | meat, legumes, fortified grains |
| `protein_variety` | single-source dominance vs variety |

**Condition handoff:** Candidates touching an active medical condition watchlist (e.g., potassium with kidney disease — spec **28**) are **suppressed entirely** here; **23**/**28** own condition-sensitive nutrient territory.

---

## Data model (Brain DO SQLite — private)

### `nutrient_presence_window`

| Column | Type | Notes |
|---|---|---|
| `window_id` | text PK | |
| `user_id` | text | |
| `period_start` | integer | ms |
| `period_end` | integer | ms |
| `coverage_score` | real | 0–1 |
| `presence_map_json` | text | category → `{ carrierCount, lastSeenAt, carriers[] }` |
| `computed_at` | integer | |

### `nutrition_gap`

| Column | Type | Notes |
|---|---|---|
| `gap_id` | text PK | |
| `user_id` | text | |
| `category` | text | v1 category key |
| `gap_class` | text | `structural` \| `displacement` |
| `evidence_json` | text | carrier counts, window refs, displaced-source ref |
| `confidence` | real | |
| `status` | text | `candidate` \| `surfaced` \| `watching` \| `closed` |
| `closed_reason` | text nullable | `user_covers_elsewhere` \| `user_declined` \| `resolved` \| `condition_handoff` |
| `surfaced_in` | text nullable | session ref |
| `created_at` | integer | |
| `updated_at` | integer | |

### `user_memory` mirror — `diet.gaps` namespace

```typescript
// key = category key (e.g. omega_3)
type DietGapMemoryValue = {
  status: 'watching' | 'closed'
  reason: string | null       // user text or system reason
  closed_at: number | null
  gap_class?: 'structural' | 'displacement'
  confirmed_at?: number
}
```

**Integration rule:** Downstream surfaces (**34**, **24**, Mira context) read `diet.gaps` via normal memory injection — **no** direct `nutrition_gap` table reads outside **38** handlers.

---

## Surfacing and closure

### Delivery

- Conversational only, mid-interaction — relevant scan, plan generation, cooking conversation.
- **Never** standalone push (spec **50**); in-app / conversational surfaces only.
- Evidence attached, window named, observation framing mandatory.
- Shares spec **17** weekly budget — never a pattern insight and a gap insight in the same week.

### Example user-facing moment

> "Looking at the last two months, almost nothing with omega-3 has come through your kitchen. Want me to keep an eye on that?"

### Closure table

| User answer | `nutrition_gap.status` | `closed_reason` / memory |
|---|---|---|
| Yes | `watching` | `diet.gaps` `{ status: watching, confirmed_at }` |
| No | `closed` | `user_declined` |
| "I get that elsewhere" | `closed` | `user_covers_elsewhere` |
| Mentions supplement | `closed` | reason recorded; **never** recommend supplements |

**Closed is closed:** A gap the user answered is never re-litigated, even if data still shows absence.

### Standing concern downstream (quiet — no new UI)

| Surface | Owner | Behavior |
|---|---|---|
| Meal plan composition | **34** | Favors recipes with carrier ingredients for `watching` categories |
| Scan verdict | **24** | Optional quiet note: "good source of what you've been missing" |
| Weekly summary | **34** | Progress line when gap shows filled in observed stream |
| Predictive pantry | **34** | No direct gap queue — receipt cadence feeds coverage only |

---

## Feature boundaries

### 38 vs 37 (critical split)

| Dimension | **37** Craving Decoder | **38** Negative Space |
|---|---|---|
| Trigger | User asks "why am I craving this?" | System weekly pass + valid surface moment |
| Horizon | Hours since last **observed** eat | **6+ weeks** nutrient-category absence |
| Question | "Why now?" | "What's consistently missing?" |
| Memory | `craving_decoded` events, `personality.cravings` | `nutrition_gap` rows, `diet.gaps` |
| Detection | On-demand evidence assembly | Coverage-gated batch pass |
| Copy | Eating gap recency | Observation framing for category absence |
| Offers | Pantry bridge, Tonight, flatter sweet | Standing concern → plan/scan/summary bias |

**37 must not** run negative-space detection, coverage gates, or cite standing `diet.gaps` concerns unless the user explicitly asks about long-term gaps.

### 38 vs 34

| **38** owns | **34** owns |
|---|---|
| Gap detection, coverage, `nutrition_gap` DDL | Inventory model, meal plan generation body |
| `diet.gaps` writes | Reads `diet.gaps` for plan ranking bias |
| Weekly detection pass step | Weekly summary **generation** body |
| Intervention candidate creation | Summary **delivery** + push (**21**) |

### 38 vs 35

| **38** owns | **35** owns |
|---|---|
| Nutrient absence inference + gap evidence | `ambient_candidate` queue mechanics + dispatch timing |
| `negative_space_gap` candidate payload | Pattern/time-machine/travel/guest candidates |
| Gap-specific copy + closure | Shared weekly insight budget enforcement |
| `diet.gaps` memory | `wellbeing_signal`, travel, guest surfaces |

Gap insights are **not** proactive mood/pattern surfacing — they share the **queue and budget** with **35**/**17**, not the wellbeing capture path.

### 38 vs 12

| **12** BehaviorPatternAgent | **38** detection pass |
|---|---|
| `pattern.*` presence correlations from events | `nutrition_gap` absence over classified categories |
| Every 3 days on `behavior_pattern_detection` | Same alarm wake — sequential step, not duplicate agent |
| 3+ events, conf ≥ 0.6 | Coverage floor + 6-week window + category thresholds |
| Does **not** write `diet.gaps` | Does **not** write `pattern.*` |

**12** `BrainMaintenanceAgent` may read `diet.*` clusters for trait inference — no nutrient absence logic.

---

## Tier, privacy, metrics

- **Tier:** Core+ (spec **19**) — same as behavioral pattern detection. Safety constraints (**07**) never gated.
- **Privacy:** Entirely private Brain DO computation. Gap records in "what Brioela knows about me" (spec **34** passport); individually deletable; deletion does not reopen closed gaps.
- **Metrics:** Gap confirmation rate; standing-concern close rate; meal plan carrier inclusion rate; dismissal signals (spec **17**); coverage floor calibration.

---

## Obsolete / conflicting sources

| Source | Issue | Resolution |
|---|---|---|
| `build-guide/37-negative-space-nutrition/00-overview.md` Depends On `18-ambient-intelligence` | Layer renumbering | Maps to **35** in `_features/` index |
| `build-guide/37-negative-space-nutrition/00-overview.md` Depends On `14-pantry-meal-plan` | Layer renumbering | Maps to **34** |
| `_records/build-order/34-layer-negative-space-nutrition.md` title "Layer 34" | Build-order layer ≠ feature **38** | Layer 34 in build-order; feature folder **38** |
| `_features/33-receipt-intelligence/status.md` cites `37-negative-space-nutrition` | Wrong feature number in blocked-by | Receipt backbone is **38**; build-guide folder stays `37-negative-space-nutrition/` |
| Spec **50** references "meal plan (spec 33)" | Spec renumbering | Meal plan is **34** feature / spec **33** prose |
| `ambient_candidate.kind` enum in **35** draft | No `negative_space_gap` yet | Add at **35**/**38** implementation — product string |
