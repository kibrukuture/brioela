# Status

open

**Tonight not shipped.** Build-guide **38-tonight** is complete (4 files). Zero `tonight_answer` Brain table, zero generation/delivery alarm handlers, zero mobile ambient card, zero `tonight_dinner` notification trigger. Cross-feature docs reference **54** in **34**, **37**, **41**, **43**, **21**, **36**.

# Shipped in repo (docs / cross-refs only)

- [x] `build-guide/38-tonight/` (`00`–`03`) — docs complete
- [x] `brioela-specs/51-tonight-dinner-answer.md` — primary spec
- [x] `_records/connections/34-tonight-connections.md` — ledger
- [x] `_records/build-order/35-layer-tonight.md` — layer deps
- [x] `_features/37-craving-decoder/draft/match.craving.offer.helper.gap.md` — `tonight_adjust` offer stub
- [x] `_features/43-pricing-tiers/draft/tier.entitlement.matrix.constant.gap.md` — `tonight_card` gate stub
- [ ] `tonight_answer` + `tonight_delivery_preference` Brain SQLite tables
- [ ] Six-input generation pipeline + convergence
- [ ] Learned delivery timing + cold-start no-push window
- [ ] `ambient_surface` grammar card compose (**52**)
- [ ] `tonight_dinner` notification trigger (**21**)
- [ ] Mobile Cook / Swap / Not tonight UI
- [ ] Learning loop + suppression ladder wire
- [ ] Tonight tests

# Blocked by

- **04** brain-foundation — Brain DO migrations, Drizzle spine
- **09** brain-alarm-tools + **14** brain-alarm-dispatch — `tonight_generation` / `tonight_delivery` alarms
- **05** brain-memory-tools — `memory_event` learning writes
- **34** pantry-meal-plan — inventory estimate, plan slot, shared pool/swap logic (**G7**–**G10**)
- **36** wearables — `health.biometrics` readiness read (**G11**)
- **41** mesa — active audience source (**G12**)
- **35** ambient-intelligence — time-of-day patterns for delivery learn (**G13**)
- **52** generative-grammar — `ambient_surface` renderer + `tonight_daily_card` surface enum (**G14**–**G15**)
- **43** pricing-tiers — `tonight_card` Luma+ gate (**G16**)
- **21** platform-notifications — `tonight_dinner` send + suppression (**G17**–**G18**)
- **29** cooking-session — Cook-it handoff (**G19**)
- **20** brain-chat-runtime — Mira preload on Culina+ (**G20**)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `tonight_answer` table | `rg tonight_answer backend/src` — zero |
| G2 | No `tonight_delivery_preference` table | No schema file |
| G3 | No `TonightReasoningTag` constant | `shared/constants/tonight/` — missing |
| G4 | No `TonightResponse` constant | — |
| G5 | No `assembleTonightContext` helper | Six-input gather — no code |
| G6 | No `convergeWithMealPlan` helper | spec **51** strict rule — unwired |
| G7 | No inventory coverage read from **34** | `assembleInventorySnapshot` consumer missing |
| G8 | No active plan slot loader | **34** `meal_plan_slot` read missing for **54** |
| G9 | No recipe pool rank + variety guard | **34** shared order — no tonight path |
| G10 | No exactly-2 swap generator | spec **51** — unwired |
| G11 | No readiness bias reader | **36** G19 — `health.biometrics` consumer missing |
| G12 | No Mesa audience resolver | **41** G38 — conservative inference missing |
| G13 | No delivery time learner | `learnTonightDeliveryTime` — missing |
| G14 | No `tonight_daily_card_brioela_generative_ui` surface | **52** enum — not registered |
| G15 | No `composeTonightCardDocument` | **52** renderer unwired |
| G16 | No `tonight_card` tier gate | **43** matrix draft only |
| G17 | No `tonight_dinner` notification trigger | **21** inventory lists type — no sender |
| G18 | No suppression ladder wire for Tonight dismissals | **21** `notification_suppression` — unwired |
| G19 | No Cook-it handoff to **29** | Mobile + session start missing |
| G20 | No Mira preload on Cook-it (Culina+) | **20**/**29** tier branch missing |
| G21 | No `generateTonightAnswer` LLM handler | ≤1 structured call — missing |
| G22 | No single-item pickup evaluator | Honesty fallback — missing |
| G23 | No silence policy (no card) enforcer | `tonight.silence.policy` — missing |
| G24 | No `tonight_generation` alarm handler | **09**/**14** kind missing |
| G25 | No `tonight_delivery` alarm handler | — |
| G26 | No cold-start 2-week no-push rule | `02-timing-and-delivery.md` — unwired |
| G27 | No medium-slot competition with price alert | **21** arbitration — unwired |
| G28 | No `recordTonightResponse` handler | Learning spine entry missing |
| G29 | No `writeTonightLearningEvent` | **05** `memory_event` — unwired |
| G30 | No craving `tonight_adjust` execution | **37** G8 — phrase only in draft |
| G31 | No plan slot update on re-validation failure | **34** write path from **54** missing |
| G32 | No Tonight API contract/routes | `shared/contracts/tonight.contract.ts` — missing |
| G33 | No mobile ambient card screen | `mobile/features/tonight/` — missing |
| G34 | No swap 2-option sheet UI | spec **51** — unwired |
| G35 | No Tonight metrics events | Success metrics in spec **51** — not instrumented |
| G36 | No Tonight tests | `rg tonight *.test.ts` — zero |
| G37 | **Spec 51 / folder 54** numbering split | Document in spec.md **N1** |
| G38 | **Build-guide 38 vs feature 54** index drift | **N2** — historical layer numbering |
| G39 | **Core vs Luma** tier naming | **43** **C1**/**N3** — code uses Luma |
| G40 | **Chef+ vs Culina** voice tier | **N4** — map at entitlement boundary |
| G41 | Connections ledger minimal | `34-tonight-connections.md` — no session log for guide completion beyond **038** |
| G42 | `_features/56-tonight/` stale glob | Canonical folder is **54-tonight** only (**N6**) |

# 54 vs neighbor boundaries

| In **54** (this feature) | In separate feature |
|---|---|
| Daily answer generation + card | Weekly plan + pantry DDL — **34** |
| Plan slot re-validation + patch | `meal_plan_slot` ownership — **34** |
| Readiness bias in ranking | Wearables ingest — **36** |
| `tonight_adjust` execution | Craving decode — **37** |
| `tonight_dinner` trigger | Push send + suppression — **21** |
| Mesa audience read | Audience tables — **41** |
| Grammar document compose | Renderer + schema — **52** |
| `tonight_card` gate check | Entitlement webhook — **43** |
| Cook-it navigation | Session runtime — **29** |
| Delivery time patterns consume | Pattern tables — **35** |

# Sources

- `brioela-specs/51-tonight-dinner-answer.md`
- `build-guide/38-tonight/`
- `brioela-specs/33-minimum-spend-meal-plan.md`
- `brioela-specs/40-wearables-integration.md`
- `brioela-specs/52-craving-decoder.md`
- `brioela-specs/23-ambient-notification-strategy.md`
- `brioela-specs/42-brioela-generative-grammar.md`
- `_records/connections/34-tonight-connections.md`
- `_records/build-order/35-layer-tonight.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- Neighbor `_features/34-pantry-meal-plan/`, `36-wearables/`, `37-craving-decoder/`, `41-mesa/`, `21-platform-notifications/`, `43-pricing-tiers/`, `52-generative-grammar/`, `35-ambient-intelligence/`, `29-cooking-session/`
