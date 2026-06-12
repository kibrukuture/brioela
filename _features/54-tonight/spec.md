# Tonight — Spec

Feature **54**. Daily zero-decision dinner answer: once per local day, at the user's learned cooking-meal decision window, Brioela surfaces one in-app ambient card (and optionally one earned medium push) with exactly one dish, exactly two pre-computed swaps, and three one-gesture responses — Cook it, Swap, Not tonight. Generation reads pantry inventory, active meal-plan slot, Mesa audience, time-of-day patterns, wearable readiness, and calendar-derived time budget; converges strictly with **34** when a weekly plan is active; learns silently from responses via `memory_event` and `tonight_answer`.

**Not in this feature:** Weekly meal-plan generation, slot DDL, shopping-list delta, inventory estimate tables (**34** — consumer only); wearables ingest and `health.biometrics` writes (**36**); craving evidence assembly and decode skill (**37** — consumer for `tonight_adjust` handoff only); push transport, suppression ledger DDL, medium-slot arbitration (**21**); Mesa audience tables and clearance pipeline (**41** — consumer only); recipe CRUD and `recipes` DDL (**08** — pool input); time-of-day pattern tables and weekly pass (**35**/**12**); generative grammar schema/renderer core (**52** — composes/renders card document); map/geo discovery (**28**); Ground find-to-cooking pre-trip triggers (**35** — separate ambient moment); guard/lexicon/reading-gate tooling.

**Living catalog note:** Product name **Tonight** — reclaimed-word family (Ground, Find, Passport, Harvest). Code namespace: `tonight` — table `tonight_answer`; handlers under `backend/src/agents/brain/_handlers/tonight/`; tools under `tools/tonight/`; mobile under `mobile/features/tonight/`. **Spec numbering:** product behavior lives in `brioela-specs/51-tonight-dinner-answer.md`; feature folder is **54** by build order. Do not confuse with build-guide folder `38-tonight/` (historical layer index).

---

## Purpose

Spec **33** (**34**) solves the planned week — user-initiated, seven days at once. Spec **14** (fridge rescue in **34**) solves the urgent now. Neither covers the daily ambient 5pm decision-fatigue moment that arrives whether or not the user planned anything, and that no user reliably remembers to ask about (spec **00** second law).

**54** is the purest expression of the ambient law: the answer arrives, unasked, at the moment the question forms.

```text
Learned delivery alarm → tier gate → assemble 6 inputs → converge plan OR rank pool → (≤1 LLM) → grammar card → store → in-app surface [+ earned push]
        │
        └── responses → memory_event + tonight_answer row → delivery-time learning + suppression ladder
```

Without **54**, Luma's daily planning layer has no ambient face; **34**'s active plan slot has no daily restatement; **36** readiness and **41** audience signals have no dinner-specific consumer; **37** sleep-cause offers have no execution target.

---

## Product definition

| Term | Meaning |
|---|---|
| **Tonight** | The daily dinner (or learned cooking-meal) answer card — "Tonight: misir wot. 35 minutes. Everything's in your kitchen." |
| **Answer** | One `recipe_id` + headline copy + inventory claim + optional sub-line |
| **Swap** | Exactly two pre-computed alternatives — same at-home ingredients where possible; never a browse list |
| **Convergence** | When **34** plan active → Tonight **is** today's slot, re-validated; never a competing suggestion |
| **Honesty fallback** | Single-item pickup permitted ("grab one can of chickpeas"); shopping trip is **34**'s job |
| **Silence rule** | No acceptable answer → **no card** — silence over filler (spec **00**) |
| **Learned timing** | Delivery moment from cooking-session starts, recipe opens, fridge-scan moments — never user-configured |
| **Cold start** | Sensible late-afternoon default; in-app only; **no push for first two weeks** |
| **`tonight_answer`** | One Brain DO row per local day — answer, swaps, reasoning tags, delivery channel, response |
| **`reasoning_tags`** | `inventory_covered` \| `expiring_item` \| `low_readiness` \| `mesa_audience` \| `plan_slot` \| `time_budget` \| `single_item_pickup` \| `craving_adjust` |
| **Cooking meal** | Learned — user whose history shows lunch is their cooking meal gets Tonight at lunch decision time; one answer per day is fixed |

**Design principles (non-negotiable):**

- One card, once per day. No re-prompts, no "you didn't cook yesterday" nudges.
- Three responses only: Cook it / Swap / Not tonight — all one gesture.
- Constraint clearance (user + active Mesa audience) is a hard filter — same pipeline as **34**.
- Mesa audience inference is conservative — explicit active audience or recurring-pattern memory only; never guessed.
- Sub-lines name signals in plain language ("looks like a low-energy day") — never metrics, never share surface (no share on Tonight).
- Zero configuration surfaces — no dinner time picker, no cuisine pickers (spec **00** zero-form law).
- Dinner only by default; meal hour is learned; no breakfast/lunch expansion.
- Restaurant/delivery suggestions out of scope — Tonight answers with cooking.
- Entirely private Brain DO computation — no Supabase, no Ground.

---

## User outcome (what the user sees)

**Headline (always):**

> Tonight: misir wot. 35 minutes. Everything's in your kitchen.

**Sub-line (only when a real signal earned it — one max):**

- "Kept it easy — looks like a low-energy day." (readiness **36**)
- "Works for everyone eating tonight." (Mesa **41**)
- "Uses the spinach before it turns." (expiring inventory **34**)
- "Matches your plan for today." (plan convergence **34**)

**Honesty pickup variant:**

> Tonight: pasta e ceci — if you grab one can of chickpeas on the way home.

**Three actions:**

| Action | User gesture | System behavior |
|---|---|---|
| **Cook it** | One tap | Chef+ (**43** Culina): Mira voice session pre-loaded (**20**/**29**). Luma+: standard recipe cooking view (**29**). |
| **Swap** | One tap → pick 1 of 2 | Exactly two alternatives shown; never a scroll list. Same swap logic family as **34**. |
| **Not tonight** | One tap | Card dismisses silently. No follow-up until tomorrow. |

**When weekly plan active:** card restates today's plan slot with current-context adjustments — the two features converge instead of competing.

---

## Answer selection — six inputs (ordered)

> **Authoritative:** `build-guide/38-tonight/01-answer-generation.md`, `brioela-specs/51-tonight-dinner-answer.md` § The Answer Selection.

| # | Input | Source feature | Rule |
|---|---|---|---|
| 1 | **audience** | **41** Mesa | Active audience for tonight if known; else user. Full constraint clearance — hard filter (**07**, **23**). |
| 2 | **inventory** | **34** pantry | Prefer fully-covered dishes; expiring items rank first (waste rule). |
| 3 | **time budget** | **35** patterns + optional calendar | Weekday vs weekend session starts; "tight evening / open evening" from optional calendar grant (**22**) — never store event contents. |
| 4 | **state** | **36** wearables | `health.biometrics` readiness/sleep when present: low → simple + nourishing; high-activity → substantial. |
| 5 | **pool** | **08**/**34** | made-and-liked > saved > new-but-near (**34** order); variety guard vs last 3 cooked days. |
| 6 | **answer** | **54** | One dish + exactly two pre-computed swaps. |

**Convergence rule (strict):**

- Active **34** plan slot for today → answer **is** that slot, re-validated against current inventory + readiness.
- Re-validation failure (ingredient gone) → adjusted answer served **and** plan slot updated in **34**.
- Tonight never contradicts the plan with a competing suggestion.

**Craving decoder handoff (**37**):**

- When user accepts `tonight_adjust` offer (short-sleep cause), generation biases toward early, light dinner for that day only.
- Phrase: *"Tonight's dinner could be early and light — want me to factor that in?"* — execution lives in **54**; decode lives in **37**.

---

## Timing and delivery

> **Authoritative:** `build-guide/38-tonight/02-timing-and-delivery.md`, `brioela-specs/23-ambient-notification-strategy.md`.

| Phase | Rule |
|---|---|
| **Cold start** | Sensible late-afternoon default (local). In-app card only. **No push for first two weeks.** |
| **Learning** | Cooking session starts, recipe opens, fridge-scan moments converge delivery ~45–90 min before real decision moment. |
| **Generation alarm** | Runs in Brain DO **ahead of** delivery time (**09**/**14**). ≤1 structured LLM call over locally assembled context. Card open is instant from stored answer. |
| **In-app** | Ambient card always when answer exists. |
| **Push** | `tonight_dinner`, `priority: medium` — only after cold-start window; competes for **one medium push/day** (**21**). Price alert or other medium winner → Tonight in-app only that day. |
| **Quiet hours** | 11pm–7am local — no push except critical (**23**). |
| **Active session** | Non-critical push queued until session ends (**23**). |
| **Suppression** | Card dismissed twice without action → category quiet 14 days; three → permanent unless re-enabled (**23**). |

---

## Learning loop

> **Authoritative:** `build-guide/38-tonight/03-learning-loop.md`.

| Response | Signal strength | Effect |
|---|---|---|
| **Cooked to completion** | Strongest positive | Dish + context (day type, time budget, audience) reinforce via `memory_event`. |
| **Swapped** | Medium | Chosen swap attributes preferred; consistent directions become ranking signals → **35**/**12** patterns. |
| **Opened** | Weak positive | Engagement without commitment — timing validation. |
| **Dismissed** | Weak negative | Dish-level negative; repeated **card** dismissal feeds suppression ladder. |
| **Ignored** | Timing negative | Delivery-time learning only. |

All signals: `memory_event` spine (**05**) + `tonight_answer.response` column. Weekly pattern pass consumes like any signal.

---

## Data model (Brain DO SQLite — private)

```sql
tonight_answer (
  answer_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date_local TEXT NOT NULL,           -- YYYY-MM-DD in user TZ
  recipe_id TEXT NOT NULL,
  swap_recipe_ids_json TEXT NOT NULL, -- exactly 2 recipe ids
  reasoning_tags_json TEXT NOT NULL,
  headline TEXT NOT NULL,
  subline TEXT,
  pickup_item_json TEXT,              -- optional single-item honesty fallback
  document_json TEXT NOT NULL,        -- BrioelaGenerativeUiDocument for card (**52**)
  generated_at INTEGER NOT NULL,
  delivered_at INTEGER,
  delivery_channel TEXT CHECK(delivery_channel IN ('in_app','push')),
  response TEXT CHECK(response IN ('cooked','swapped','opened','dismissed','ignored')),
  responded_at INTEGER,
  swap_chosen_recipe_id TEXT,
  UNIQUE(user_id, date_local)
)
```

Optional preference row (same migration):

```sql
tonight_delivery_preference (
  user_id TEXT PRIMARY KEY,
  learned_delivery_minute INTEGER,    -- minutes from local midnight
  cooking_meal TEXT CHECK(cooking_meal IN ('breakfast','lunch','dinner')),
  cold_start_ends_at INTEGER,
  craving_adjust_until_local TEXT     -- YYYY-MM-DD from **37** handoff
)
```

---

## Generative grammar surface (**52**)

- Card is a **`ambient_surface`** generative-grammar document (`GenerativeSurface`: `tonight_daily_card_brioela_generative_ui`).
- Low-energy Tuesday vs Saturday cook-up should feel different — emotional tone, motion, Skia tokens differ by `reasoning_tags`.
- Static Tier-0 fallback renders first; grammar is additive (**52** doctrine).
- Pre-compose at generation time (like **53** Harvest) — card open has no 400ms live LLM gate.

---

## Tier placement (**43**)

| Capability | Minimum tier | Notes |
|---|---|---|
| Tonight card (see answer) | **Luma** (`tonight_card`) | Spec **51** "Core" = Luma in **43**. Free/Sapor: no daily card; no teaser in daily flow. |
| Cook it → recipe view | **Luma** | Standard cooking view (**29**). |
| Cook it → Mira voice | **Culina** (`voice_cooking_session`) | Chef+ in spec prose = Culina in product names. |

---

## Privacy

- Entirely private Brain DO — answer + learning history never leave user's DO.
- Calendar: derived tight/open evening only — never event titles or attendees.
- Readiness: sub-line plain language only — never HRV/sleep scores in UI.
- No share surface on Tonight — ever.

---

## Success metrics

| Metric | Intent |
|---|---|
| Acceptance rate (cooked or swapped-then-cooked) | Headline — trajectory matters more than absolute |
| Cooked-to-completion rate of accepted answers | Handoff quality |
| Swap rate direction over time | Falling = learning (same logic as **34**) |
| Dismissal + suppression-trigger rates | Annoyance ceiling |
| Generation-bar coverage | Share of eligible days with an answer |
| Retention delta | Users with 4+ accepted answers/month vs matched baseline |

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** `rg 'tonight_answer|tonight_dinner|composeTonight' backend/src shared/ mobile/` — **zero product matches**.

| # | Component | Type | In **54**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **`tonight_answer` table** | Brain SQLite | **Yes** | No | Daily answer + learning history | spec **51** § Data Model |
| 2 | **`tonight_delivery_preference` table** | Brain SQLite | **Yes** | No | Learned timing + craving adjust flag | `02-timing-and-delivery.md` |
| 3 | **`TonightReasoningTag` constant** | Shared constant | **Yes** | No | Reasoning tag enum | spec **51** |
| 4 | **`TonightResponse` constant** | Shared constant | **Yes** | No | Response enum | `03-learning-loop.md` |
| 5 | **Tier gate `tonight_card`** | Entitlement check | **Cross — 43** | No | Luma+ only | **43** `tier.entitlement.matrix` |
| 6 | **Assemble tonight context** | Brain helper | **Yes** | No | Gather 6 inputs | `01-answer-generation.md` |
| 7 | **Load active plan slot** | **34** consumer | **Cross** | No | Today's slot if plan active | spec **33** § Daily Ambient |
| 8 | **Converge with meal plan** | Brain helper | **Yes** | No | Strict convergence + slot update | `01-answer-generation.md` |
| 9 | **Inventory coverage rank** | **34** consumer | **Cross** | No | Pantry estimate read | **34** `assembleInventorySnapshot` |
| 10 | **Readiness modulation** | **36** consumer | **Cross** | No | `health.biometrics` read | spec **40** § Downstream |
| 11 | **Mesa audience resolve** | **41** consumer | **Cross** | No | Conservative inference | spec **51** § Technical |
| 12 | **Time budget resolve** | **35** consumer | **Cross** | No | Patterns + calendar signal | spec **17** / **35** |
| 13 | **Recipe pool rank** | Brain helper | **Yes** | No | Pool order + variety guard | **34** shared order |
| 14 | **Swap pair generator** | Brain helper | **Yes** | No | Exactly 2 swaps | spec **51**, **34** swap family |
| 15 | **Single-item pickup evaluator** | Brain helper | **Yes** | No | Honesty fallback | spec **51** |
| 16 | **Generate tonight answer (LLM)** | Brain handler | **Yes** | No | ≤1 structured call | spec **51** § Technical |
| 17 | **Compose tonight card document** | Brain handler | **Yes** | No | **52** `ambient_surface` | `02-timing-and-delivery.md` |
| 18 | **Store tonight answer** | Brain handler | **Yes** | No | Persist row + document | spec **51** |
| 19 | **Learn delivery time** | Brain helper | **Yes** | No | Session/scan signals | `02-timing-and-delivery.md` |
| 20 | **Schedule generation alarm** | Brain helper | **Yes** | No | Ahead of delivery | **09** tools |
| 21 | **Handle generation alarm** | Brain handler | **Yes** | No | Full pipeline entry | `00-overview.md` |
| 22 | **Deliver tonight card** | Brain handler | **Yes** | No | In-app + push decision | `02-timing-and-delivery.md` |
| 23 | **`tonight_dinner` notification trigger** | Brain handler | **Cross — 21** | No | Medium slot arbitration | **21** spec inventory |
| 24 | **Record tonight response** | Brain handler | **Yes** | No | Update row + events | `03-learning-loop.md` |
| 25 | **Write tonight learning events** | Brain handler | **Yes** | No | `memory_event` append | **05** |
| 26 | **Apply craving tonight adjustment** | Brain handler | **Yes** | No | **37** `tonight_adjust` accept | **37** `match.craving.offer` |
| 27 | **Suppression ladder integration** | **21** consumer | **Cross** | No | `notification_suppression` | spec **23** |
| 28 | **Cook-it handoff** | Mobile + **29** | **Cross** | No | Voice vs recipe by tier | spec **51** § User Outcome |
| 29 | **Tonight ambient card screen** | Mobile | **Yes** | No | In-app surface | `02-timing-and-delivery.md` |
| 30 | **Swap picker UI** | Mobile component | **Yes** | No | 2-option sheet | spec **51** |
| 31 | **Tonight API contract** | Shared contract | **Yes** | No | GET today + POST response | — |
| 32 | **Metrics events** | Analytics hooks | **Yes** | No | Success metrics | spec **51** |

---

## Architecture

```text
Signals (not owned by 54)
  ├── Pantry inventory estimate (**34**)
  ├── Active meal_plan_slot for date_local (**34**)
  ├── Mesa active audience (**41**)
  ├── health.biometrics readiness (**36**)
  ├── Time-of-day patterns (**35** / **12**)
  ├── Calendar tight/open evening (**22** optional)
  └── craving_adjust flag (**37** accept)

        │
        ▼
tonight_generation alarm (Brain DO, **09**/**14**)
        │
        ├── checkTonightTierGate (**43** Luma+)
        ├── assembleTonightContext (6 inputs)
        ├── convergeWithMealPlan OR rankTonightRecipePool
        ├── generateTonightAnswer (≤1 LLM) — skip LLM if pure plan restatement
        ├── composeTonightCardDocument (**52** ambient_surface)
        └── storeTonightAnswer

tonight_delivery alarm
        │
        ├── deliverTonightCard (in-app always)
        └── triggerTonightDinnerNotification (**21**) if earned medium slot

User on mobile
        │
        ├── Cook it → startCookingSession (**29**) or recipe view (tier)
        ├── Swap → recordTonightResponse + show 2 alternatives
        └── Not tonight → recordTonightResponse(dismissed) + suppression check (**21**)

Cooking session end (**29**)
        └── if recipe matches tonight answer → recordTonightResponse(cooked) + learning events
```

---

## 54 vs neighbor boundaries

| In **54** (this feature) | In separate feature |
|---|---|
| Daily single-answer generation + card surface | Weekly plan generation + slots DDL — **34** |
| Inventory **read** + coverage ranking | Pantry tables, purchase patterns — **34** |
| Plan slot **re-validation** + slot update on failure | `meal_plan` / `meal_plan_slot` ownership — **34** |
| Readiness **bias** in ranking | Wearables ingest + `health.biometrics` writes — **36** |
| `tonight_adjust` **execution** after **37** offer accepted | Craving decode skill + evidence — **37** |
| `tonight_dinner` trigger payload + timing learn | Push send, medium-slot queue, suppression DDL — **21** |
| Mesa audience **read** for clearance | Audience tables + setup — **41** |
| `ambient_surface` document compose + store | Grammar schema, renderer, validation — **52** |
| `tonight_card` tier gate call | Entitlement matrix + webhook — **43** |
| Cook-it navigation / session start request | Cooking session runtime — **29**; voice shell — **20** |
| Time budget from patterns | Pattern tables + weekly pass — **35**/**12** |
| Map nearby / price alert | **28** — separate medium-slot competitors |
| Ground find-to-cooking | **35** — pre-trip ambient, not daily dinner |

---

## Conflicts and ledger notes

| ID | Issue | Resolution |
|---|---|---|
| **N1** | Spec **51** / folder **54** numbering split | Expected — same pattern as spec **49** / feature **53**. |
| **N2** | Build-guide `38-tonight/` vs feature `54-tonight/` | Historical build-order layer **35** used guide index 38; `_features/` uses product build order 54. |
| **N3** | Spec **51** "Core tier" vs **43** `Luma` | **43** wins for code — `tonight_card` minimum `BrioelaTier.LUMA`. |
| **N4** | Spec **51** "Chef+" voice vs **43** `Culina` | Map at entitlement boundary — `voice_cooking_session` = Culina+. |
| **N5** | Build-guide `38-tonight/00` lists `27-generative-grammar` | Maps to feature **52** in `_features/` index. |
| **N6** | `_features/56-tonight/` ghost paths in glob | Stale — canonical folder is **54-tonight** only. |

---

## Sources

- `brioela-specs/51-tonight-dinner-answer.md` — primary
- `build-guide/38-tonight/` (`00`–`03`)
- `brioela-specs/33-minimum-spend-meal-plan.md` § Daily Ambient Surface
- `brioela-specs/40-wearables-integration.md` § Downstream Consumers
- `brioela-specs/52-craving-decoder.md` — tonight adjustment offer
- `brioela-specs/23-ambient-notification-strategy.md`
- `brioela-specs/42-brioela-generative-grammar.md`
- `_records/build-order/35-layer-tonight.md`
- `_records/connections/34-tonight-connections.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- Neighbor `_features/34-pantry-meal-plan/`, `36-wearables/`, `37-craving-decoder/`, `41-mesa/`, `21-platform-notifications/`, `43-pricing-tiers/`, `52-generative-grammar/`, `35-ambient-intelligence/`, `29-cooking-session/`
