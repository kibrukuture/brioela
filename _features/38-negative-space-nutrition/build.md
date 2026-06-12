# Negative Space Nutrition — Build

Feature **38**. Production paths under `backend/src/agents/brain/_schemas/negative-space.*.ts`, `backend/src/agents/brain/_handlers/negative-space/`, `backend/src/agents/brain/_helpers/negative-space/`, `shared/validator/negative-space/`, and consumer hooks in **34** meal-plan generation, **24** scan verdict assembly, **35** ambient queue. No mobile feature folder — no dedicated screen.

**Scope:** coverage gate, presence map, structural/displacement detection, `nutrient_presence_window` + `nutrition_gap` DDL, weekly pass on `behavior_pattern_detection` chain, `diet.gaps` memory mirror, intervention candidate enqueue (**35**), conversational surfacing helpers, condition suppression, tier gate, metrics. **Not in 38 build:** pantry/meal-plan DDL (**34**), ambient queue table DDL (**35**), scanner corpus ingest (**24**), receipt ingest (**33**), `BehaviorPatternAgent` body (**12**), craving decoder (**37**), push send (**21**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/37-negative-space-nutrition/` (4 files) | ✓ docs only |
| `brioela-specs/50-negative-space-nutrition.md` | ✓ spec |
| `_records/connections/33-negative-space-nutrition-connections.md` | ✓ ledger |
| `_records/build-order/34-layer-negative-space-nutrition.md` | ✓ ledger |
| `memory_event` + `write_user_memory` (**05**) | ✓ — no `diet.gaps` writer |
| `scheduled_alarms` + `behavior_pattern_detection` (**09**/**12**) | ✓ shell — no detection pass |
| Supabase product `nutrients` (**24**) | Partial — corpus exists; no gap classifier |
| **No** `nutrition_gap` / `nutrient_presence_window` schemas | ✗ |
| Negative-space handlers/helpers | ✗ |
| Meal plan standing-concern bias (**34**) | ✗ |
| Scan verdict carrier note (**24**) | ✗ |
| Negative-space tests | ✗ |

**Zero negative-space production code.** `rg 'nutrition_gap|nutrient_presence|diet\.gaps|negative_space' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared validator (**38**)

| File | Role |
|---|---|
| `shared/validator/negative-space/nutrient.category.schema.ts` | v1 category keys + carrier hints |
| `shared/validator/negative-space/presence.map.schema.ts` | Presence map JSON shape |
| `shared/validator/negative-space/nutrition.gap.schema.ts` | Gap row + evidence Zod |
| `shared/validator/negative-space/diet.gaps.memory.schema.ts` | `diet.gaps` value shape |
| `shared/validator/negative-space/coverage.score.schema.ts` | Coverage inputs + result |
| `shared/validator/negative-space/index.ts` | Barrel |

### Brain SQLite schemas (**38**)

| File | Role |
|---|---|
| `_schemas/nutrient.presence.window.schema.ts` | `nutrient_presence_window` |
| `_schemas/nutrition.gap.schema.ts` | `nutrition_gap` |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add negative-space tables to Brain chain |

### Brain helpers — coverage + detection (**38**)

| File | Role |
|---|---|
| `_helpers/negative-space/compute.coverage.score.helper.ts` | Receipt cadence, meal-log density, scan freq, unclassifiable share |
| `_helpers/negative-space/check.coverage.floor.helper.ts` | Floor + 6-week qualifying window |
| `_helpers/negative-space/load.observed.food.stream.helper.ts` | Scans, receipts, cooks, meal logs for window |
| `_helpers/negative-space/classify.nutrient.presence.helper.ts` | Corpus nutrients → category carriers |
| `_helpers/negative-space/build.presence.map.helper.ts` | Category → count + recency |
| `_helpers/negative-space/detect.structural.absences.helper.ts` | Near-zero categories |
| `_helpers/negative-space/detect.displacement.gaps.helper.ts` | `diet.*` diff + optional LLM |
| `_helpers/negative-space/dedupe.gap.candidates.helper.ts` | Closed memory, contradictions, thresholds |
| `_helpers/negative-space/check.condition.gap.suppression.helper.ts` | **23**/**28** watchlist suppress |
| `_helpers/negative-space/enqueue.gap.intervention.candidate.helper.ts` | **35** `ambient_candidate` + weekly budget |
| `_helpers/negative-space/check.negative.space.tier.gate.helper.ts` | Core+ entitlement |
| `_helpers/negative-space/index.ts` | Barrel |

### Brain handlers (**38**)

| File | Role |
|---|---|
| `_handlers/negative-space/run.negative.space.detection.pass.handler.ts` | Six-step weekly pass orchestrator |
| `_handlers/negative-space/persist.nutrient.presence.window.handler.ts` | Window row write |
| `_handlers/negative-space/write.diet.gaps.memory.handler.ts` | Mirror gap state → `diet.gaps` |
| `_handlers/negative-space/close.nutrition.gap.handler.ts` | User answer → gap + memory |
| `_handlers/negative-space/promote.gap.to.watching.handler.ts` | User yes → standing concern |
| `_handlers/negative-space/surface.gap.insight.conversational.helper.ts` | Copy + evidence bundle for agent |
| `_handlers/negative-space/mark.gap.resolved.handler.ts` | Observed stream shows fill → `resolved` |
| `_handlers/negative-space/index.ts` | Barrel |

### Alarm chain wiring (**38** + **14** + **12**)

| File | Role |
|---|---|
| `_handlers/sub-agents/run.behavior.pattern.pass.handler.ts` | **12** — append call to `runNegativeSpaceDetectionPass` after spawn |
| `_handlers/dispatch.alarm.handler.ts` | **14** — ensure `behavior_pattern_detection` chain includes **38** step |

### Consumer hooks (owners implement read path; **38** documents contract)

| File | Feature | Role |
|---|---|---|
| `_handlers/pantry/apply.standing.concern.plan.bias.helper.ts` | **34** | Read `diet.gaps` watching → rank carrier recipes |
| `_handlers/pantry/include.gap.progress.in.summary.helper.ts` | **34** | Weekly summary line for watching/resolved gaps |
| `tools/product-scan/attach.gap.carrier.verdict.note.helper.ts` | **24** | Optional quiet scan note when product matches concern |
| `_handlers/ambient/dispatch.negative.space.gap.candidate.handler.ts` | **35** | Dequeue `negative_space_gap` at valid surface moment |

### Config (**38**)

| File | Role |
|---|---|
| `_helpers/negative-space/nutrient.category.catalog.ts` | v1 six categories + carrier product tags |
| `_helpers/negative-space/coverage.floor.constants.ts` | Floor threshold + calibration hooks |

### Metrics (**38**)

| File | Role |
|---|---|
| `_helpers/negative-space/emit.negative.space.metrics.helper.ts` | Confirmation, close, floor calibration events |

### Tests (**38**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/negative-space/compute.coverage.score.helper.test.ts` | Floor abort, unclassifiable lowering |
| `backend/src/agents/brain/_helpers/negative-space/detect.structural.absences.helper.test.ts` | Near-zero detection |
| `backend/src/agents/brain/_handlers/negative-space/run.negative.space.detection.pass.handler.test.ts` | Six-step integration |
| `backend/src/agents/brain/_handlers/negative-space/close.nutrition.gap.handler.test.ts` | Permanent closure |

---

## Acceptance criteria

### Coverage gate
- [ ] Below floor → pass returns without gap candidates or user-visible artifacts.
- [ ] Fewer than 6 qualifying weeks → no gap candidates.
- [ ] Unclassifiable corpus items lower coverage score; never counted as category presence.

### Detection pass
- [ ] Runs on `behavior_pattern_detection` alarm wake — no new `alarm_type`.
- [ ] At most one structured LLM call per pass (displacement only).
- [ ] Persists `nutrient_presence_window` with `presence_map_json` every run that clears floor.
- [ ] Structural + displacement candidates written to `nutrition_gap` with evidence JSON.
- [ ] Condition watchlist candidates suppressed with `condition_handoff` — never surfaced.

### Queue + budget
- [ ] At most one new gap candidate enqueued per pass.
- [ ] Shared weekly insight budget with **35** pattern + **40** growth mirror — never two insight types same week.
- [ ] `ambient_candidate.kind = negative_space_gap` (or agreed product string) documented in **35**.

### Surfacing + closure
- [ ] Gap insight is conversational/in-app only — no standalone push.
- [ ] Copy uses observation framing — never deficiency diagnosis.
- [ ] One question per gap; closed gaps never resurface.
- [ ] Yes → `watching` + `diet.gaps` memory; no/supplement/elsewhere → `closed` + memory.
- [ ] Supplement mention recorded as closure reason — never supplement recommendation.

### Downstream consumers
- [ ] **34** meal plan reads `diet.gaps` watching entries and biases carrier recipes without announcing "gap filling."
- [ ] **24** scan verdict may add quiet carrier note when product helps active concern.
- [ ] **34** weekly summary may include gap progress line.
- [ ] Downstream reads `diet.gaps` via memory injection — not `nutrition_gap` table directly.

### Boundaries
- [ ] **37** craving decode does not run coverage gate or negative-space detection.
- [ ] **37** does not cite `diet.gaps` unless user explicitly asks about long-term gaps.
- [ ] **12** `BehaviorPatternAgent` does not write `nutrition_gap` or `diet.gaps`.

### Tier + privacy
- [ ] Free tier: feature silent (Core+ only).
- [ ] `diet.gaps` entries appear in passport delete path; delete does not reopen.

---

## Build order (within feature)

1. Shared Zod schemas + category catalog
2. Brain SQLite migrations (`nutrient_presence_window`, `nutrition_gap`)
3. Coverage helpers + observed stream loader
4. Presence classification (depends **24** corpus read)
5. Structural + displacement detectors + dedup
6. Weekly pass handler + alarm chain wire (**12**/**14**)
7. `diet.gaps` memory writers + closure handlers
8. Intervention enqueue (**35** queue must exist or stub interface)
9. Consumer hooks (**34** plan bias, **24** verdict note, **34** summary line)
10. Tier gate + metrics + tests

---

## Cross-feature dependencies

| Dependency | Why |
|---|---|
| **04** brain-foundation | Migrations, DO SQLite |
| **05** brain-memory-tools | `write_user_memory` `diet.gaps` |
| **09** brain-alarm-tools | `behavior_pattern_detection` schedule |
| **12** brain-sub-agents | Same alarm wake — ordering after BehaviorPatternAgent |
| **14** brain-alarm-dispatch | Alarm handler chain |
| **24** scanner | Corpus `nutrients` for classification |
| **33** receipt-intelligence | Receipt stream for coverage + presence |
| **34** pantry-meal-plan | Purchase patterns, meal plan bias, weekly summary |
| **35** ambient-intelligence | `ambient_candidate` queue + weekly budget |
| **23** medical-conditions | Condition watchlist for suppression |
