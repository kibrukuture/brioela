# Tonight — Build

Feature **54**. Production paths under `backend/src/agents/brain/_schemas/tonight.*.ts`, `backend/src/agents/brain/_handlers/tonight/`, `backend/src/agents/brain/_helpers/tonight/`, `backend/src/agents/brain/_policies/tonight/`, `backend/src/agents/brain/tools/tonight/`, `shared/constants/tonight/`, `shared/validator/tonight/`, `shared/routes/tonight.routes.ts`, `shared/contracts/tonight.contract.ts`, `backend/src/api/tonight/`, `mobile/features/tonight/`, `mobile/network/tonight/`, and Tonight tests.

**Scope:** Learned delivery timing; six-input answer generation; strict meal-plan convergence; ≤1 structured LLM call; `tonight_answer` + `tonight_delivery_preference` Brain tables; `ambient_surface` grammar document compose (**52**); in-app card + earned `tonight_dinner` push trigger (**21**); Cook/Swap/Dismiss responses; `memory_event` learning loop; craving `tonight_adjust` execution (**37**); Luma+ tier gate (**43**). **Not in 54 build:** Pantry/meal-plan DDL and generators (**34**); wearables pipeline (**36**); craving decode skill (**37**); push send path (**21**); Mesa DDL (**41**); grammar renderer core (**52**); pattern tables (**35**); guard/lexicon tooling.

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/38-tonight/` (`00`–`03`) | ✓ docs only |
| `brioela-specs/51-tonight-dinner-answer.md` | ✓ spec |
| `_records/connections/34-tonight-connections.md` | ✓ ledger |
| `_records/build-order/35-layer-tonight.md` | ✓ ledger |
| Cross-feature refs (**34**, **37**, **41**, **43**, **21**) | ✓ docs only |
| `tonight_answer` table | ✗ |
| Generation/delivery alarm handlers | ✗ |
| Mobile Tonight card UI | ✗ |
| Tonight tests | ✗ |

**Zero Tonight production code.** `rg 'tonight_answer|tonight_dinner|TonightReasoning|composeTonight' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared constants (**54**)

| File | Role |
|---|---|
| `shared/constants/tonight/tonight.reasoning.tag.constant.ts` | `inventory_covered` \| `expiring_item` \| … |
| `shared/constants/tonight/tonight.response.constant.ts` | `cooked` \| `swapped` \| `opened` \| `dismissed` \| `ignored` |
| `shared/constants/tonight/tonight.delivery.channel.constant.ts` | `in_app` \| `push` |
| `shared/constants/tonight/tonight.cooking.meal.constant.ts` | `breakfast` \| `lunch` \| `dinner` |
| `shared/constants/tonight/index.ts` | Barrel |

### Shared validators (**54**)

| File | Role |
|---|---|
| `shared/validator/tonight/tonight.answer.schema.ts` | Stored answer + card payload |
| `shared/validator/tonight/tonight.card.document.schema.ts` | Grammar document wrapper |
| `shared/validator/tonight/tonight.generation.output.schema.ts` | LLM structured output |
| `shared/validator/tonight/tonight.response.body.schema.ts` | POST response body |
| `shared/validator/tonight/index.ts` | Barrel |
| `shared/routes/tonight.routes.ts` | `TONIGHT_ROUTES` |
| `shared/contracts/tonight.contract.ts` | ts-rest get + record response |

### Brain SQLite schemas (**54**)

| File | Role |
|---|---|
| `_schemas/tonight.answer.schema.ts` | `tonight_answer` |
| `_schemas/tonight.delivery.preference.schema.ts` | `tonight_delivery_preference` |
| `_schemas/index.ts` | Export + migration registration (**04**) |

### Brain policies (**54**)

| File | Role |
|---|---|
| `_policies/tonight/tonight.audience.inference.policy.ts` | Conservative Mesa inference |
| `_policies/tonight/tonight.silence.policy.ts` | No card when bar not cleared |
| `_policies/tonight/tonight.subline.policy.ts` | Plain-language sub-lines; no metrics |

### Brain helpers (**54**)

| File | Role |
|---|---|
| `_helpers/tonight/assemble.tonight.context.helper.ts` | Orchestrate 6 inputs |
| `_helpers/tonight/load.active.plan.slot.helper.ts` | **34** today's slot |
| `_helpers/tonight/converge.with.meal.plan.helper.ts` | Strict convergence + slot patch |
| `_helpers/tonight/rank.tonight.recipe.pool.helper.ts` | Pool order + variety guard |
| `_helpers/tonight/generate.tonight.swaps.helper.ts` | Exactly 2 swaps |
| `_helpers/tonight/evaluate.single.item.pickup.helper.ts` | Honesty fallback |
| `_helpers/tonight/resolve.time.budget.helper.ts` | Patterns + calendar signal |
| `_helpers/tonight/resolve.mesa.audience.helper.ts` | **41** read |
| `_helpers/tonight/read.readiness.bias.helper.ts` | **36** memory read |
| `_helpers/tonight/learn.tonight.delivery.time.helper.ts` | Delivery minute learning |
| `_helpers/tonight/build.tonight.generation.prompt.helper.ts` | LLM prompt assembly |
| `_helpers/tonight/build.tonight.card.grammar.prompt.helper.ts` | **52** compose prompt |
| `_helpers/tonight/check.tonight.tier.gate.helper.ts` | **43** `tonight_card` |
| `_helpers/tonight/schedule.tonight.alarms.helper.ts` | Generation + delivery alarms (**09**) |

### Brain handlers (**54**)

| File | Role |
|---|---|
| `_handlers/tonight/generate.tonight.answer.handler.ts` | ≤1 LLM structured call |
| `_handlers/tonight/compose.tonight.card.document.handler.ts` | **52** `ambient_surface` |
| `_handlers/tonight/store.tonight.answer.handler.ts` | Persist answer row |
| `_handlers/tonight/run.tonight.generation.handler.ts` | Full generation pipeline |
| `_handlers/tonight/deliver.tonight.card.handler.ts` | In-app delivery + push decision |
| `_handlers/tonight/trigger.tonight.dinner.notification.handler.ts` | **21** medium payload |
| `_handlers/tonight/record.tonight.response.handler.ts` | Response + swap choice |
| `_handlers/tonight/write.tonight.learning.event.handler.ts` | `memory_event` append |
| `_handlers/tonight/apply.craving.tonight.adjustment.handler.ts` | **37** handoff execution |
| `_handlers/tonight/load.tonight.answer.handler.ts` | Read today for API/mobile |

### Brain tools (**54**)

| File | Role |
|---|---|
| `tools/tonight/preview_tonight_answer.tool.ts` | Dev/Mira preview (admin) |
| `tools/tonight/record_tonight_response.tool.ts` | Voice "not tonight" path |

### Alarm registration (**54** + **09**/**14**)

| File | Role |
|---|---|
| `_handlers/alarms/handle.tonight.generation.alarm.handler.ts` | `tonight_generation` kind → `runTonightGeneration` |
| `_handlers/alarms/handle.tonight.delivery.alarm.handler.ts` | `tonight_delivery` kind → `deliverTonightCard` |

### API (**54**)

| File | Role |
|---|---|
| `backend/src/api/tonight/_handlers/get.tonight.answer.handler.ts` | GET today's card |
| `backend/src/api/tonight/_handlers/record.tonight.response.handler.ts` | POST cook/swap/dismiss |
| `backend/src/api/tonight/_handlers/apply.tonight.adjustment.handler.ts` | POST **37** craving accept |
| `backend/src/api/tonight/router.ts` | ts-rest mount |

### Mobile (**54**)

| File | Role |
|---|---|
| `mobile/features/tonight/screens/tonight.ambient.card.screen.tsx` | Daily card surface |
| `mobile/features/tonight/components/tonight.card.actions.tsx` | Cook / Swap / Not tonight |
| `mobile/features/tonight/components/tonight.swap.sheet.tsx` | 2-option swap picker |
| `mobile/features/tonight/hooks/use.tonight.answer.ts` | Poll/fetch today |
| `mobile/features/tonight/hooks/use.tonight.response.ts` | Record gestures |
| `mobile/network/tonight/tonight.api.ts` | Contract client |

### Tests (**54**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_handlers/tonight/run.tonight.generation.handler.test.ts` | Generation + convergence |
| `backend/src/agents/brain/_helpers/tonight/converge.with.meal.plan.helper.test.ts` | Plan slot rules |
| `backend/src/agents/brain/_helpers/tonight/learn.tonight.delivery.time.helper.test.ts` | Timing learn |
| `mobile/features/tonight/tonight.card.actions.test.tsx` | Gesture wiring |

---

## Acceptance criteria

### Generation

- [ ] At most one `tonight_answer` row per `user_id` + `date_local`.
- [ ] Six inputs applied in spec order; constraint clearance is hard filter.
- [ ] Active **34** plan → answer is today's slot after re-validation; never competing dish.
- [ ] Re-validation failure updates **34** slot and serves adjusted answer.
- [ ] Exactly two swap recipe ids stored; swap UI never shows more than two.
- [ ] Single-item pickup honesty path when inventory thin; no multi-item shopping list.
- [ ] Empty kitchen / no history / thin coverage → no row, no card (silence).
- [ ] ≤1 structured LLM call per generation; card opens from stored `document_json`.
- [ ] `reasoning_tags_json` reflects real signals only — no invented tags.

### Timing and delivery

- [ ] Cold start: in-app only, no push, for first two weeks per user.
- [ ] Learned delivery converges from session starts / recipe opens / scan moments.
- [ ] Push `tonight_dinner` only when medium daily slot available (**21**).
- [ ] Quiet hours and active-session suppression inherited from **21**/**23**.
- [ ] One card per day — no re-prompt after dismiss.

### Responses and learning

- [ ] Cook it: Culina+ → Mira session; Luma → recipe view (**43**/**29**).
- [ ] Swap records choice; chosen attributes write `memory_event`.
- [ ] Not tonight dismisses silently; no follow-up UI.
- [ ] Session normal end with matching recipe → `cooked` response.
- [ ] Card ignored twice → **21** suppression 14 days; three → permanent.

### Cross-feature

- [ ] **37** `tonight_adjust` accept sets `craving_adjust_until_local` and biases generation.
- [ ] **36** low readiness → `low_readiness` tag + nourishing/simple bias.
- [ ] **41** active audience → `mesa_audience` tag + clearance filter.
- [ ] **52** validates `tonight_daily_card_brioela_generative_ui`; Tier-0 fallback on fail.
- [ ] **43** Sapor user never sees card; `checkTonightTierGate` enforced server-side.

### API / mobile

- [ ] `GET /api/tonight/today` returns null when no answer (not error).
- [ ] `POST /api/tonight/response` idempotent per day per response type where applicable.
- [ ] Mobile ambient card renders grammar document via **52** renderer hook.

---

## Dependency graph

```text
04 brain-foundation (migrations)
  └── 09 brain-alarm-tools + 14 brain-alarm-dispatch
        └── 54 tonight alarms
05 brain-memory-tools (memory_event)
34 pantry-meal-plan (inventory + plan slot) ──┐
36 wearables (readiness read) ────────────────┼──► 54 generation
41 mesa (audience read) ──────────────────────┤
35 ambient-intelligence (time patterns) ────┘
52 generative-grammar (ambient_surface render)
43 pricing-tiers (tonight_card gate)
21 platform-notifications (tonight_dinner send)
37 craving-decoder (tonight_adjust phrase → 54 execute)
29 cooking-session (Cook-it handoff)
20 brain-chat-runtime (Mira session preload)
```

**Blocks:** none — terminal daily surface (outcome signals feed shared spine).

**Blocked by:** **04**, **09**/**14**, **34** (inventory + plan), **36** (readiness), **41** (audience), **52** (card render), **43** (tier), **21** (push), **05** (learning events).

---

## Sources

- `brioela-specs/51-tonight-dinner-answer.md`
- `build-guide/38-tonight/`
- `_records/build-order/35-layer-tonight.md`
- `_records/connections/34-tonight-connections.md`
- `_features/34-pantry-meal-plan/build.md` — shared pool/swap/convergence
- `_features/37-craving-decoder/draft/match.craving.offer.helper.gap.md`
- `_features/43-pricing-tiers/draft/tier.entitlement.matrix.constant.gap.md`
- `_features/21-platform-notifications/build.md` — `tonight_dinner` row
