# Status

open

**Negative-space build-guide complete; production is entirely unshipped.** Four `build-guide/37-negative-space-nutrition/` files and spec **50** are done. Zero `nutrition_gap` / `nutrient_presence_window` tables, zero coverage helpers, zero weekly detection pass, zero `diet.gaps` writers, zero meal-plan bias hook, zero tests.

# Shipped (partial / docs only)

## Docs & ledgers
- [x] `build-guide/37-negative-space-nutrition/00-overview.md` through `03-surfacing-and-memory.md`
- [x] `brioela-specs/50-negative-space-nutrition.md`
- [x] `_records/connections/33-negative-space-nutrition-connections.md`
- [x] `_records/build-order/34-layer-negative-space-nutrition.md`
- [x] `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- [x] `_features/38-negative-space-nutrition/spec.md`, `build.md`, `status.md`, `draft/` (this migration)

## Infrastructure partial (not negative-space-specific)
- [x] `memory_event` + `write_user_memory` (**05**) — no `diet.gaps` namespace writer
- [x] `scheduled_alarms` + `behavior_pattern_detection` dedup (**09**) — no detection pass body
- [x] Supabase product nutrients (**24**) — corpus field exists; no gap classifier

## Not shipped
- [ ] `nutrient_presence_window` + `nutrition_gap` Brain SQLite tables
- [ ] Coverage score + floor helpers
- [ ] Observed food stream loader (scans, receipts, cooks, meal logs)
- [ ] Nutrient presence classification against corpus
- [ ] Structural absence + displacement gap detectors
- [ ] Weekly `runNegativeSpaceDetectionPass` on `behavior_pattern_detection` chain
- [ ] `diet.gaps` memory mirror + closure handlers
- [ ] `ambient_candidate` enqueue for gap insights (**35**)
- [ ] Conversational surfacing helper
- [ ] Meal plan standing-concern bias (**34** consumer)
- [ ] Scan verdict carrier note (**24** consumer)
- [ ] Weekly summary gap progress line (**34** consumer)
- [ ] Condition watchlist suppression (**23**/**28**)
- [ ] Core+ tier gate
- [ ] Negative-space metrics
- [ ] Negative-space tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No Brain SQLite tables** | `rg nutrition_gap nutrient_presence backend/src` — zero |
| G2 | **No coverage score helper** | No `compute.coverage` in repo |
| G3 | **No observed stream loader** | No unified scan+receipt+cook+meal-log query for gap window |
| G4 | **No nutrient category classifier** | Corpus nutrients exist (**24**) — no category mapping helper |
| G5 | **No structural absence detector** | No `detect.structural` in repo |
| G6 | **No displacement gap detector** | No `diet.*` diff helper for nutrient load |
| G7 | **No weekly detection pass handler** | `_handlers/negative-space/` absent |
| G8 | **Alarm chain unwired** | **12** `run.behavior.pattern.pass` has no negative-space step |
| G9 | **No `diet.gaps` writer** | `implementable-specs/02-user-memory.md` lists `diet.restrictions` — not `diet.gaps` |
| G10 | **No intervention queue integration** | **35** `ambient_candidate` table absent — cannot enqueue |
| G11 | **Weekly insight budget unwired** | Spec **17** shared budget — no enforce helper |
| G12 | **Meal plan bias absent** | **34** `generate.meal.plan` draft omits `diet.gaps` read |
| G13 | **Scan verdict note absent** | **24** no gap carrier note helper |
| G14 | **Weekly summary gap line absent** | **34** summary generator has no gap progress |
| G15 | **Condition suppression absent** | No watchlist check against **23**/**28** active conditions |
| G16 | **No tier gate (Core+)** | **43** pricing not wired to negative-space |
| G17 | **No metrics emitters** | Spec **50** success metrics — no instrumentation |
| G18 | **`ambient_candidate.kind` undefined** | **35** draft enum lacks `negative_space_gap` |
| G19 | **Receipt backbone unshipped** | **33** blocks coverage cadence signal |
| G20 | **Meal logs unshipped** | Visual intake (**34** spec) — coverage denominator thin until shipped |
| G21 | **No negative-space tests** | Zero test files |
| G22 | **Ledger layer vs feature number** | `_records/build-order/34-layer-*` ≠ feature folder **38** — document only |

# 38 vs neighbor boundaries

| In **38** (this feature) | In separate feature |
|---|---|
| Multi-week nutrient absence detection | Momentary craving decode (**37**) |
| Coverage gate + 6-week minimum | Eating gap hours-since-log (**37**) |
| `nutrition_gap` + `nutrient_presence_window` DDL | `craving_decoded` events (**37**) |
| `diet.gaps` standing concerns | `personality.cravings` (**37**) |
| Weekly batch pass (same alarm wake) | User-initiated decode (**37**) |
| Gap intervention candidate enqueue | Pattern intervention candidates (**35**) |
| Observation framing for absence | Stress-eating proactive mention (**35**) |
| Meal plan bias **contract** | Meal plan generation body (**34**) |
| Scan carrier note **contract** | Scanner resolution + verdict body (**24**) |
| Condition gap **suppression** | Condition rule bodies (**23**/**28**) |
| `pattern.*` absence complement | `pattern.*` presence writes (**12**) |

### 38 vs 37 (authoritative)

- **37** = user asks why they crave **now**; recency + context; no coverage gate.
- **38** = system detects what nutrient category hasn't entered the kitchen over **6+ weeks**; coverage gate mandatory.
- **37 must not** run negative-space detection or cite `diet.gaps` unless user explicitly asks about long-term gaps.

# Blocked by

- **04-brain-foundation** — migrations spine
- **05-brain-memory-tools** — `diet.gaps` writes (partial: tools exist)
- **09-brain-alarm-tools** — `behavior_pattern_detection` schedule (partial)
- **12-brain-sub-agents** — alarm wake ordering (partial: agent shell only)
- **14-brain-alarm-dispatch** — handler chain
- **24-scanner** — corpus nutrient read (partial)
- **33-receipt-intelligence** — receipt stream for coverage (open)
- **34-pantry-meal-plan** — purchase patterns + plan bias consumer (open)
- **35-ambient-intelligence** — intervention queue + weekly budget (open)
- **23-medical-conditions** — watchlist for suppression (soft until conditions ship)

# Blocks

- **34** standing-concern meal plan bias (soft — plan can ship without gap bias)
- **24** gap carrier scan notes (soft — optional verdict line)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `_records/build-order/34-layer-negative-space-nutrition.md` | "Layer 34" in build-order ≠ feature **38** folder |
| `build-guide/37-negative-space-nutrition/00-overview.md` Depends On `18-ambient-intelligence` | Maps to **35** in `_features/` |
| `build-guide/37-negative-space-nutrition/00-overview.md` Depends On `14-pantry-meal-plan` | Maps to **34** |
| `_features/33-receipt-intelligence/status.md` blocked-by `37-negative-space-nutrition` | Should reference feature **38**; build-guide folder stays `37-negative-space-nutrition/` |
| `_features/38-negative-space-nutrition/status.md` (pre-migration) | Stub only — no gaps list |

# Ambiguous / conflicting sources

1. **Detection pass owner alarm:** Spec **50** says "weekly Brain DO alarm cycle alongside behavior pattern detection." **12** runs `behavior_pattern_detection` every **3 days**. **Resolution: run negative-space pass on each `behavior_pattern_detection` wake (rolling window still uses 6-week minimum); do not add new alarm_type (G7/G8).**
2. **Intervention queue table:** Spec **50** step 6 "shared intervention queue (spec 17 budget)" — **35** `ambient_candidate` is the intended store. **Resolution: enqueue `negative_space_gap` kind when **35** ships; until then stub interface in **38** handler (G10/G18).**
3. **`diet.gaps` namespace:** Not listed in `implementable-specs/02-user-memory.md` examples (`diet.restrictions`, `diet.preferences` only). **Resolution: valid third-level namespace per regex; add to memory docs at implementation (G9).**
4. **Weekly summary owner:** Spec **50** progress via spec **16**; **34** owns generation body. **Resolution: **34** `include.gap.progress` reads `diet.gaps` + `nutrition_gap` resolved state (G14).**
5. **Disordered eating:** Spec **50** silent; **37** has sacred block. **Resolution: gap surfacing uses observation framing only; no weight/shame copy; defer clinical guard to **37**/**13** on shared chat threads — **38** does not add separate sacred block unless product expands scope.**
6. **Push vs in-app:** Spec **50** "never standalone push." **35** surface hierarchy allows push for travel only. **Resolution: gap insights never use **21** push (conversational/in-app only).**

# Draft count

**15** files in `draft/` (14 production snapshots + `gap-index.md`).

# Sources

- `build-guide/37-negative-space-nutrition/` (all 4 files)
- `brioela-specs/50-negative-space-nutrition.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `brioela-specs/16-weekly-food-summary.md`
- `brioela-specs/28-medical-condition-food-profile.md`
- `brioela-specs/34-universal-visual-intake.md`
- `_records/connections/33-negative-space-nutrition-connections.md`
- `_records/build-order/34-layer-negative-space-nutrition.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_features/05-brain-memory-tools/spec.md`, `status.md`
- `_features/09-brain-alarm-tools/spec.md`
- `_features/12-brain-sub-agents/spec.md`, `status.md`
- `_features/24-scanner/spec.md`
- `_features/33-receipt-intelligence/status.md`
- `_features/34-pantry-meal-plan/spec.md`, `build.md`, `status.md`
- `_features/35-ambient-intelligence/spec.md`, `status.md`
- `_features/37-craving-decoder/spec.md`, `status.md`
- `implementable-specs/02-user-memory.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`, `02-behavioral-patterns.md`, `06-surfacing-and-privacy.md`
