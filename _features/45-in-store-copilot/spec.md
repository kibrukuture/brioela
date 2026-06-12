# In-Store Co-Pilot — Spec

Feature **45**. Audio-only Mira voice companion for the user's own grocery run: shopping-list awareness (meal plan + predictive pantry + dictation), running spend estimate against personal receipt baselines, personal swap suggestions (glucose, price, condition evidence), Mesa-audience warnings on scans, store-scoped Ground intelligence relay, discrete scan verdict pushes, receipt checkout close-out, and post-visit workflow writes — all on the shared MiraSession runtime (**29**/**30**) with Brain-assembled context.

**Not in this feature:** Bela order state machine, escrow, shopper KYC, live scan-together WebSocket relay, or `bela_shopper` Mira scene (**42**); product scan pipeline and verdict assembly (**24**); shared Ground `find` tables and authenticity gate (**27**); map place identity, `price_sighting` writes, indoor positioning (**28**); meal plan generation, shopping list delta tables, predictive pantry alarm execution (**34**); receipt vision extraction and `purchase_price_event` writes (**33**); Mesa member tables and compatibility engine body (**41** — consumer of active audience only); CGM ingest and spike-trigger memory (**36**); cooking RealtimeKit room + video stream (**29**); guard/lexicon/reading-gate tooling.

**Living catalog note:** In-store co-pilot and Bela shopper AI share MiraSession transport and constraint-check tools — they must **not** fork enforcement. Scene kind, speech policy, principal, and consequence differ. DO name pattern `shop-{userId}-{visitId}` is **45** only; Bela uses order-scoped MiraSession with `bela_shopper`.

---

## Purpose

Bela (**42**) already specifies voice + scan enforcement for gig shoppers shopping on someone else's behalf. The signed-in user shopping for themselves gets only the discrete scan loop (**24**): open camera, scan, read verdict, repeat.

**45** points the same Mira session runtime at the user. No new infrastructure spine: Mira lifecycle (**29**/**30**), scanner pipeline (**24**), receipt-derived spend baselines (**33**), CGM spike triggers where they exist (**36**), Ground finds for the store (**27**), pantry predictions (**34**), active meal plan (**34**), and Mesa audiences (**41**) are read-path inputs delivered as a low-cost audio-only session.

A weekly 20–30 minute shop is the single most regular food moment in a user's life. Owning it makes Brioela a habit, not an app.

---

## Product definition

| Term | Meaning |
|---|---|
| **In-store co-pilot** | Audio-only Mira session scoped to one store visit by the signed-in user |
| **Shop visit** | Brain DO SQLite record (`shop_visit`) for one grocery run — place-level location, list source, spend estimate, receipt link |
| **Visit context payload** | One-shot assembly at session connect — list, constraints, Mesa audience, price history, glucose triggers, Ground finds, pantry nudges |
| **Running spend estimate** | Sum of scanned item prices resolved from personal history → community sighting → unpriced |
| **Personal swap** | Voice suggestion backed by the user's own evidence (glucose curve, price history, confirmed condition rule) |
| **Constraint warning** | Hard or Mesa-member violation spoken by Mira — user decides (warn, not block) |
| **Ground find relay** | At most one store-relevant find offered at session start unless asked |
| **Checkout handoff** | Session end → receipt scan (**33**) as ground truth for spend + pantry |

**Design principle (non-negotiable):** Silence law applies with full force — a chatty store companion is unbearable. Max **3** unprompted interventions per visit excluding safety; safety interruptions unlimited and immediate.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/32-in-store-copilot/`, `brioela-specs/45-in-store-copilot.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/24`, `27`, `28`, `29`, `30`, `33`, `34`, `36`, `41`, `42`, `43`.

| # | Component | Type | In **45**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Explicit session start** | Mobile UX | **Yes** | No | One tap from scanner surface | `01-session-lifecycle.md` |
| 2 | **Ambient store prompt** | Mobile + geo | **Yes** | No | Known grocery location — dismissible, once per visit | `01-session-lifecycle.md`, **27** geo signal |
| 3 | **MiraSession DO `shop-{userId}-{visitId}`** | Ephemeral DO | **Yes** | No | Brain spawns on start | spec 45, **29** |
| 4 | **`MiraSceneKind: in_store_copilot`** | Scene enum | **Yes** | No | **30** type + **45** builder | `30-mira/00-overview.md` gap |
| 5 | **`buildInStoreCopilotMiraScene`** | Scene builder | **Yes** | No | Audio-only, scan stimuli | `draft/build.in.store.copilot.mira.scene.gap.md` |
| 6 | **Gemini Live audio (no continuous video)** | Transport | **Yes** | No | `thinkingLevel: minimal` | spec 45, **29** |
| 7 | **Visit context payload assembly** | Brain helper | **Yes** | No | `get_session_context` shop variant | `02-context-payload.md` |
| 8 | **Shopping list block** | Payload slice | **Yes** | No | Plan + predictive + dictated status | **34** |
| 9 | **Constraint + medication slice** | Payload slice | **Yes** | No | Hard constraints, conditions | **07**, **23** |
| 10 | **Active Mesa audience slice** | Payload slice | **Cross** | No | Conservative — explicit or recurring only | **41** |
| 11 | **Store price history slice** | Payload slice | **Yes** | No | Top recurring + weekly baseline | **33** `purchase_price_event` |
| 12 | **Glucose spike triggers slice** | Payload slice | **Cross** | No | `user_memory.health.glucose` | **36** |
| 13 | **Ground finds slice (7d, store-scoped)** | Payload slice | **Cross** | No | Cached map paths only | **27** |
| 14 | **Open predictive pantry nudges** | Payload slice | **Cross** | No | Footer list items | **34** spec 36 |
| 15 | **Mid-session scan verdict push** | Mira stimulus | **Yes** | No | Every resolve → `send_realtime_input` | **24** → **45** |
| 16 | **List check-off inference** | Session logic | **Yes** | No | From scan → list item match | spec 45 |
| 17 | **Running total updates** | Session logic | **Yes** | No | After each priced scan | `04-spend-estimate.md` |
| 18 | **Speech policy / intervention cap** | Mira engine | **Yes** | No | 3 cap + safety unlimited | `03-speech-rules-and-swaps.md` |
| 19 | **Swap evidence bar evaluator** | Brain helper | **Yes** | No | Personal evidence + in-store plausibility | `03-speech-rules-and-swaps.md` |
| 20 | **Constraint warn path** | Shared enforcement | **Cross** | No | Same check as Bela — warn only | **42** `checkConstraintForOrder` |
| 21 | **Mesa member constraint on scan** | **41** consumer | **Cross** | No | "Not safe for your son" | spec 45 |
| 22 | **Ground find relay (max 1)** | Speech rule | **Yes** | No | Session start unless asked | `03-speech-rules-and-swaps.md` |
| 23 | **Baseline crossing mention (once)** | Speech rule | **Yes** | No | User's own weekly avg | `04-spend-estimate.md` |
| 24 | **`shop_visit` Brain table** | Brain SQLite | **Yes** | No | Visit header | spec 45 |
| 25 | **`shop_visit_event` Brain table** | Brain SQLite | **Yes** | No | scan, swap, warning, milestone | spec 45 |
| 26 | **`POST /api/shop/session`** | Hono handler | **Yes** | No | Start + connection params | spec 45 |
| 27 | **`POST /api/shop/session/events`** | Hono handler | **Yes** | No | Mid-session pushes | spec 45 |
| 28 | **`POST /api/shop/session/end`** | Hono handler | **Yes** | No | Close + workflow trigger | spec 45 |
| 29 | **Post-visit Upstash workflow** | Async job | **Yes** | No | List completion, price events, pantry | `01-session-lifecycle.md` |
| 30 | **Receipt checkout handoff** | Entry route | **Cross** | No | `source: shop_visit` on receipt | **33** |
| 31 | **Offline scan queue survival** | Mobile + **24** | **Cross** | No | FIFO, honest degraded mode | `05-offline-degradation.md` |
| 32 | **Session end: user done / receipt / geofence** | Lifecycle | **Yes** | No | Three triggers | `01-session-lifecycle.md` |
| 33 | **Dislike signals from skipped items** | Brain write | **Cross** | No | Behavioral discovery | spec 45 → **21**? |
| 34 | **Tier gate `in_store_copilot`** | Entitlement | **Cross** | No | Culina+; scan stays free | **43** |
| 35 | **Voice session allowance draw** | Usage meter | **Cross** | No | Same pool as cooking voice | spec 45, **43** |
| 36 | **No audio storage** | Privacy | **Yes** | No | Transcript per Mira rules | **29** |
| 37 | **Place-level location only** | Privacy | **Yes** | No | No GPS trace, no aisle positioning | spec 45 |
| 38 | **Mobile co-pilot shell** | React Native | **Yes** | No | Earbud UX, session controls | `draft/in.store.copilot.feature.gap.md` |
| 39 | **Geofence end trigger** | Mobile + platform | **Yes** | No | Store exit — same signal as Ground | **27** ambient |
| 40 | **Smart routing / aisle hints** | Out of scope | **No** | No | Ground text relay only — no live nav | spec 45 out of scope |

### Shipped in repo today (in-store-copilot-related)

- `build-guide/32-in-store-copilot/` — **6 files complete** (docs only).
- `brioela-specs/45-in-store-copilot.md` — primary spec.
- `_records/connections/28-in-store-copilot-connections.md`, `_records/build-order/29-layer-in-store-copilot.md`.
- **43** tier matrix documents `in_store_copilot` → Culina minimum (`draft/tier.entitlement.matrix.constant.gap.md`).
- **33** receipt validator draft includes `source: shop_visit` enum value.
- **`rg 'shop_visit|in_store_copilot|/api/shop' backend/src shared/ mobile/`** — **zero** product matches.
- Mobile `card-controls.tsx` "in-store card" strings — **legacy Schnl payments**, unrelated to **45**.

---

## Architecture — read-path across existing features

```text
Session start (mobile)
  ├── tier check: in_store_copilot (**43**)
  ├── resolve place_id (map context **28** / geo **27**)
  └── Brain assembleShopSessionContext(userId, placeId)
        ├── shopping list (**34** meal_plan_shopping_list + predictive nudges)
        ├── constraints + conditions (**07**, **23**)
        ├── active Mesa audience (**41** mesa_food_audience)
        ├── purchase_price_event top items + weekly baseline (**33**)
        ├── health.glucose spike_triggers (**36**)
        ├── Ground finds 7d store-scoped (**27** cached summary)
        └── open predictive_nudge rows (**34**)

        ▼
  MIRA_SESSION.idFromName(`shop-${userId}-${visitId}`)
  scene: in_store_copilot  (audio-only stimuli)
  Gemini Live full-duplex, thinkingLevel: minimal

Mid-session loop
  User scans product (**24** discrete — not continuous camera)
        │
        ├── buildVerdict + checkConstraints + checkConditions
        ├── pushScanVerdictToShopSession → Mira send_realtime_input
        ├── estimateRunningSpend (price history → sighting → unpriced)
        ├── inferListCheckoff
        ├── enforceInStoreSpeechPolicy (cap 3 / safety unlimited)
        └── append shop_visit_event

Session end (user done | receipt scan starts | geofence exit)
        │
        ├── close MiraSession + transcript summary (**29** rules)
        ├── POST /api/shop/session/end
        └── Upstash post-visit workflow
              ├── list completion / bought vs skipped
              ├── purchase_price_event from receipt (**33** ground truth)
              ├── pantry resets (**34**)
              └── link shop_visit.receipt_id

Offline / dead zone
  Live audio may drop; scans queue locally (**24** offline queue)
  Visit completes from receipt + queued scans if session never recovers
```

---

## Critical boundary: **45** in-store co-pilot vs **42** Bela shopper

Same capability spine, **different principal and consequence**. Do not merge scenes or fork constraint-check code.

| | **Bela shopper assistant (`bela_shopper`)** | **In-store co-pilot (`in_store_copilot`)** |
|---|---|---|
| **Who shops** | KYC gig shopper | The signed-in user |
| **Session host** | MiraSession orchestrated by BelaOrderAgent | MiraSession orchestrated by Brain shop API |
| **DO naming** | Order-scoped (`bela_shopper:${sessionId}` or order id) | `shop-{userId}-{visitId}` |
| **Whose constraints** | Ordering user's frozen snapshot | User's own + active Mesa audience |
| **Constraint behavior** | Scanner **blocks** purchase (hard blocks) | Scanner **warns** — user decides |
| **Mira audience** | Shopper only — no full user profile | User only |
| **Camera / video** | Continuous shopper scanning flow (vision frames) | **Audio-only** — discrete user scans only |
| **Payment** | Bela card + escrow + Stripe | User pays store directly — **out of scope** |
| **List source** | Bela order items + AI list gen | Meal plan + predictive pantry + dictation |
| **Ground writes** | Shopper opt-in drafts `source: bela_shopper` | User explicit find submit only — no session auto-write |
| **Receipt** | Store + door proof workflow (**42**/**33**) | User receipt scan closes visit (**33** `shop_visit` source) |
| **Tier** | Per-order Bela fees — not subscription gate | Culina+ `in_store_copilot`; scan free |

**Code rule:** `checkConstraintForOrder` (or shared successor) is **one implementation, two callers** — Bela blocks on hard match; **45** surfaces warning via Mira speech. Implement in **42** shared helper; **45** consumes warn path only.

**Mira scene rule:** `bela_shopper` and `in_store_copilot` are **separate** `MiraSceneKind` values with different `speechPolicy`, `stimuli`, and `capabilities`. Never alias.

---

## Session lifecycle

### Start triggers

1. **Explicit** — one tap from scanner surface.
2. **Ambient** — user at known grocery location (same geo signal as Ground's contribution prompt) → soft prompt, dismissible, **once per visit**.

**Rule:** No session, no listening. Microphone activates only inside an explicitly started session.

### Mira session rules (reuse **29**)

- DO name: `shop-{userId}-{visitId}`.
- Gemini Live full-duplex audio; `thinkingLevel: minimal`.
- Context injected at connect — **no mid-session Supabase fetches from session DO**.
- Mid-session pushes via `send_realtime_input`.
- Inactivity timeout + keepAlive during long operations.
- Post-session summarization workflow.

### Mid-session events (pushed into live session)

- Every scan result (verdict + constraint matches + price delta + glucose note).
- List item check-offs inferred from scans.
- Running total updates.

### End triggers

1. User says they're done.
2. Receipt scan begins (checkout context).
3. Store geofence exit.

### Post-visit workflow (Upstash)

Writes:

- List completion state; items bought vs skipped (dislike signals → behavioral discovery).
- Price events (**33** inflation tracker).
- Pantry resets (**34** predictive pantry).
- `shop_visit` closed; `receipt_id` linked when receipt arrives.

---

## Session context payload

Assembled by Brain DO at session start — shop-scoped `get_session_context` variant.

| Block | Source feature |
|---|---|
| Shopping list with per-item status (`plan` / `prediction` / `dictated`) | **34** |
| Hard constraints, dietary identity, conditions, medications | **07**, **23**, **22** |
| Active Mesa audience if selected | **41** |
| Price history for this store: top recurring + weekly baseline | **33** |
| Glucose spike triggers | **36** |
| Ground finds for store, last 7 days, fresh first | **27** (cached map paths) |
| Open predictive pantry nudges | **34** |

**Assembly rules:**

- One payload at connect — session DO does not query Supabase mid-flight.
- Mesa audience conservative: explicitly active audience or recurring-pattern memory only — never guessed.
- Ground finds via `location_signal_summary` + cached paths — never raw per-tile `find` queries.

---

## When Mira speaks (silence rules)

Mira speaks only when:

1. The user asked something.
2. A scanned item violates a hard constraint or Mesa-member constraint — **critical, always, immediate**.
3. A swap suggestion clears the evidence bar (below).
4. One store-relevant Ground find matches ingredient profile — **at most one per visit**, at session start, never mid-aisle unless asked.
5. Running total crosses the user's own baseline — **mentioned once**, never repeated.

**Cap:** max **3** unprompted interventions per visit, excluding safety. Safety unlimited.

### Swap evidence bar

Volunteer a swap only if **both**:

- Personal evidence exists: user's own glucose curve (**36**), own price history (**33**), or confirmed condition rule (**23**).
- Alternative plausibly in this store (scan history, Ground sighting, or category presence).

Population-level "this is unhealthy" commentary is **never** volunteered — that is the scan verdict screen's job (**24**).

---

## Spend awareness

Per scanned item price resolution order:

1. User's own `purchase_price_event` at this store (**33**).
2. Most recent community `price_sighting` for this store (**28**).
3. **Unpriced** — excluded from total, counted as item.

Mira always frames total as estimate ("about $52"). Receipt scan at checkout is ground truth that retrains estimates. Baseline comparison uses user's own weekly average from receipt history — never a generic budget.

---

## Offline degradation

Grocery stores have bad signal. Degradation ladder:

1. **Full session** — live audio + live scan verdicts.
2. **Audio drops, scans work** — scans continue; DO holds state; Mira resumes on reconnect.
3. **No connectivity** — scans queue locally (**24** FIFO offline queue); barcode on-device; cached verdicts for known products.

**Honesty:** announce once — "I lost connection — your scans are saved, I'll catch up."

**Completion without session:** if live session dies, visit still completes from receipt + queued scans. Co-pilot enhances the shop; it is not a dependency of the data loop.

---

## Data model (Brain DO SQLite — private)

### `shop_visit`

| Column | Type | Notes |
|---|---|---|
| `visit_id` | text PK | UUID |
| `user_id` | text | Owner |
| `place_id` | text | Map place — not GPS trace |
| `started_at` | timestamp | |
| `ended_at` | timestamp nullable | |
| `list_source` | enum | `plan` \| `pantry` \| `dictated` \| `mixed` |
| `items_listed` | int | |
| `items_scanned` | int | |
| `items_bought_estimate` | int | |
| `spend_estimate` | numeric nullable | Running total at end |
| `receipt_id` | text nullable | Linked after **33** ingest |

### `shop_visit_event`

| Column | Type | Notes |
|---|---|---|
| `visit_id` | text FK | |
| `event_type` | enum | `scan`, `swap_suggested`, `swap_taken`, `constraint_warning`, `ground_find_relayed`, `total_milestone` |
| `payload_json` | text | Event-specific |
| `created_at` | timestamp | |

**Privacy:** no audio stored. Transcript handling follows standard Mira session storage rules (**29**). Store location at place level only. Nothing from shopping session written to Ground without explicit user find submit (**27** intent boundary).

---

## API surface

| Method | Path | Role |
|---|---|---|
| `POST` | `/api/shop/session` | Start co-pilot; returns connection params (spec 10 / **29** voice session shape) |
| `POST` | `/api/shop/session/events` | Mid-session event push (scan results, list updates) |
| `POST` | `/api/shop/session/end` | Close session + trigger post-visit workflow |

---

## Technical constraints

- **Audio-only economics:** ~$0.0045/min → ~$0.14/week for 30-min shop — viable at Culina tier session allowances.
- **Store presence:** same geo signals as Ground ambient contribution (**27**) — no new continuous background tracking beyond existing opt-in.
- **Constraint path:** same code as Bela constraint travel — one enforcement implementation, two callers (**42**/**45**).
- **No continuous camera**, no indoor positioning, no payment, no retailer inventory feeds.

---

## Tier placement

Per **43** (canonical product tier names):

| Tier | Behavior |
|---|---|
| Free / Sapor / Luma | Full normal scan experience; co-pilot voice blocked — inline upgrade on first attempt |
| **Culina+** | `in_store_copilot` allowed; draws from monthly voice-session allowance (shared with `voice_cooking_session`) |
| **Viva+** | Unlimited voice sessions |

Scanning remains always free (**24**). Co-pilot is the voice layer on top.

**Conflict:** spec 45 prose says "Chef tier" / "Power tier" — **43** uses Culina / Viva. Reconcile in **43**; **45** follows **43** naming.

---

## Success metrics

- Sessions per active Culina user per month (target: approaching weekly).
- Swap acceptance rate by evidence type (glucose, price, condition).
- Constraint warning rate; prevented-purchase proxy (warned item absent from receipt).
- Spend estimate accuracy vs receipt ground truth.
- Session survival rate in degraded connectivity.
- Culina conversion among users who hit upgrade prompt in-store.

---

## Feature boundaries

| In **45** | In separate feature |
|---|---|
| Shop visit Mira session + scene | MiraSession DO class body (**29**) |
| `in_store_copilot` scene builder | `MiraScene` types (**30**) |
| Visit context payload assembly | List tables + generation (**34**) |
| Running spend estimate logic | `purchase_price_event` writes (**33**) |
| Scan verdict mid-session push hook | Scan pipeline (**24**) |
| Constraint warn speech | Constraint check implementation (**42** shared helper) |
| Mesa warning copy on scan | Mesa engine + audience tables (**41**) |
| Ground find relay at start | Find tables + gate (**27**) |
| Community price fallback | `price_sighting` (**28**) |
| Glucose swap evidence | CGM ingest (**36**) |
| Receipt checkout `shop_visit` source | Receipt ingest body (**33**) |
| Tier gate at session start | Entitlement matrix (**43**) |
| Geofence / ambient store prompt signal | Ground ambient geo (**27**) |

---

## Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_features/47-in-store-copilot/` | Wrong feature number — canonical is **45** |
| `_features/__tmp_47-in-store-copilot/` | Temp residue — ignore |
| Spec 45 "Chef tier" / "Power tier" | **43** uses Culina / Viva |
| `build-guide/30-mira/00-overview.md` enum | Missing `in_store_copilot` — add in **30** + **45** |
| `implementable-specs/bela/14` Gemini in BelaOrderAgent | **42** resolves to MiraSession + `bela_shopper` — do not copy that pattern for **45** |
| Spec 45 references "spec 10" Mira | Maps to **29**/**30**, not feature folder 10 |
| Spec 45 "spec 01" scanner | Maps to **24** |
| Spec 45 "spec 35" Ground | Maps to **27** in migrated index |
| Spec 45 "spec 33" meal plan | Maps to **34** pantry-meal-plan |
| Spec 45 "spec 36" pantry predictions | Maps to **34** (predictive pantry portion) |
| Spec 45 "spec 40" CGM | Maps to **36** wearables |
| Mobile `card-controls` "in-store card" | Schnl payment feature — unrelated |

---

## Sources

- `brioela-specs/45-in-store-copilot.md`
- `build-guide/32-in-store-copilot/` (00–05)
- `build-guide/30-mira/00-overview.md`, `01-scene-contract.md`
- `build-guide/11-bela/14-shopper-ai-assistant.md`, `implementable-specs/bela/03-constraint-travel.md`
- `_records/connections/28-in-store-copilot-connections.md`
- `_records/build-order/29-layer-in-store-copilot.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- Neighbor `_features/24-scanner`, `27-ground`, `28-map`, `29-cooking-session`, `30-mira-speech-engine`, `33-receipt-intelligence`, `34-pantry-meal-plan`, `36-wearables`, `41-mesa`, `42-bela`, `43-pricing-tiers`
