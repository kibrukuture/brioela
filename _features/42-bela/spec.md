# Bela — Spec

Feature **42**. Brioela's personal grocery delivery product — brand name **Bela**, not a feature label. Users say "I'll Bela it." The user's full AI constraint profile (allergies, dietary restrictions, boycotts, preferences) travels with the order and enforces on the shopper's scanner in real time. Payment: Stripe PaymentIntent manual capture (authorization hold at shopper accept, capture at delivery confirm or 10-minute auto-capture). No wallet. No Stripe Issuing. Shopper pays at store till with a dedicated **Bela card** (registered debit/prepaid), reimbursed via Stripe Connect Express on user confirmation.

**Not in this feature:** MiraSession DO transport and Gemini bridge implementation body (**29-cooking-session**); `MiraScene` contract types and `MiraSpeechDecisionEngine` module (**30-mira-speech-engine**); product barcode scan pipeline and `product_profile` resolution (**24-scanner**); Ground authenticity gate and `find` tables (**27-ground**); map `product_sighting`, `map_place_signal`, routing tables (**28-map**); probabilistic pantry inventory model (**34-pantry-meal-plan** — Bela reads for list generation); Food Audience / Mesa compatibility engine (**41-mesa** — consumer hook only); receipt vision extraction pipeline (**33-receipt-intelligence**); Brain child sub-agents (**12**); guard/lexicon/reading-gate tooling.

**Living catalog note:** Bela is a major product surface that will grow (new cities, payment fallbacks, Mesa integration). `BelaOrderAgent` is an ephemeral order DO — not a Brain child sub-agent. Mira `bela_shopper` is one scene on the shared `MiraSession` class (**29**/**30**). Shopper AI architecture has a documented conflict between implementable-spec (Gemini inside BelaOrderAgent) and build-guide (MiraSession + scene) — **42** resolves toward build-guide + **30-mira**.

---

## Purpose

Every grocery delivery service has shoppers and lists. None carry the user's health and dietary identity into the store with enforcement per product in real time. Bela is Brioela's answer: a KYC-verified gig shopper shops with constraint-enforced scanning, optional live scan-together with the user, voice+vision AI in the shopper's ear (Mira `bela_shopper`), smart multi-store routing from Ground + map data, standing pantry replenishment, and cooking-intent-triggered orders that link back to Mira cooking sessions.

Without **42**, constraint profiles stop at the user's phone — they do not protect someone shopping on the user's behalf.

---

## Product definition

| Term | Meaning |
|---|---|
| **Bela** | Product brand for personal grocery delivery by Brioela |
| **BelaOrderAgent** | Ephemeral Durable Object per active order — state machine, scan relay, payment alarms |
| **Shopper** | KYC-verified gig worker; same Brioela app, role-gated shopper mode |
| **Bela card** | Shopper's dedicated debit/prepaid card for in-store checkout only |
| **Constraint snapshot** | Frozen `order_constraint_snapshot` at order placement — scanner enforcement source |
| **Live scan-together** | WebSocket data sync: shopper scan → same result card on user phone (< 200ms) |
| **Mira `bela_shopper`** | Live voice+vision AI scene for shopper during `shopping` status |
| **Standing order** | Recurring pantry replenishment with AI-generated list + approval window |
| **Cooking intent trigger** | Conversation/recipe/save → pantry gap → Bela order offer |
| **Order for others** | Sender pays; recipient's constraints enforce (Brioela user or `recipient_profile`) |
| **Trust relationship** | Same user+shopper 3+ orders → priority dispatch, shopper notes |
| **Two-scan proof** | Receipt scan at store + receipt scan at door → user confirmation timer |

**Design principle (non-negotiable):** Hard constraint blocks cannot be overridden by the shopper. Only the user may `user_override` during live scan session. Constraint violations in disputes are health incidents — full refund + shopper suspension pending review.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `implementable-specs/bela/`, `build-guide/11-bela/`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/12`, `24`, `27`, `28`, `29`, `30`, `34`, `41`.

| # | Component | Type | In **42**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **BelaOrderAgent DO** | Ephemeral order DO | **Yes** | No | Created on shopper accept | `00-overview`, `13-data-model` |
| 2 | **Order state machine** | BelaOrderAgent + Supabase | **Yes** | No | `pending`→`completed`/`disputed` | `01-order-creation` |
| 3 | **`orders` table** | Supabase Postgres | **Yes** | No | Shared cross-user | `13-data-model` |
| 4 | **`order_items` table** | Supabase | **Yes** | No | Per-line resolution | `13-data-model` |
| 5 | **`order_events` append-only** | Supabase | **Yes** | No | Audit trail | `01`, `04`, `12` |
| 6 | **`order_constraint_snapshot`** | Supabase | **Yes** | No | Frozen at place order | `03-constraint-travel` |
| 7 | **`shoppers` table** | Supabase | **Yes** | No | KYC + quality scores | `02-shopper-platform` |
| 8 | **`standing_orders` / `standing_order_cycles`** | Supabase | **Yes** | No | Recurring replenishment | `09-standing-order` |
| 9 | **`disputes` table** | Supabase | **Yes** | No | Post-delivery window | `12-dispute-resolution` |
| 10 | **`order_payment_events` ledger** | Supabase | **Yes** | No | Append-only payment audit | `05-escrow-payment` |
| 11 | **`shopper_scan_log`** | Supabase | **Yes** | No | Quality + dispute evidence | `06-shopper-quality` |
| 12 | **`family_links` table** | Supabase | **Yes** | No | Mutual-consent linked accounts | `11-for-others` |
| 13 | **`order_receipt_scans`** | Supabase | **Yes** | No | Store + door receipt proof | `15-checkout-payment`, build `13` |
| 14 | **`recipient_profiles` (Brain)** | Brain SQLite | **Yes** | No | Non-user recipients | `11-for-others` |
| 15 | **AI list generation** | Brain + **34** read | **Yes** | No | Pantry gap, cooking, recipe | `01-order-creation` |
| 16 | **Order creation UI/API** | Platform | **Yes** | No | User + ambient notification | `01-order-creation` |
| 17 | **Shopper onboarding** | API + Veriff + Stripe | **Yes** | No | KYC, Connect, Bela card | `02-shopper-platform` |
| 18 | **Constraint snapshot capture** | Brain RPC → Supabase | **Yes** | No | At order confirm | `03-constraint-travel` |
| 19 | **`checkConstraintForOrder`** | Shared helper | **Yes** | No | Per-scan enforcement | `03`, build `tools/bela/` |
| 20 | **Live scan WebSocket relay** | BelaOrderAgent `/scan-session` | **Yes** | No | `shopping` status | `04-live-scan-session` |
| 21 | **PaymentIntent authorization** | Stripe | **Yes** | No | On shopper accept | `05-escrow-payment` |
| 22 | **`incrementAuthorization`** | Stripe | **Yes** | No | Receipt exceeds estimate | `05`, `15` |
| 23 | **Capture + Connect transfer** | Stripe | **Yes** | No | User confirm / auto-capture | `05-escrow-payment` |
| 24 | **Auto-capture DO alarm** | BelaOrderAgent | **Yes** | No | 10 min after door scan | `05`, `15` |
| 25 | **Tip PaymentIntent** | Stripe | **Yes** | No | Separate from hold | `05-escrow-payment` |
| 26 | **Shopper quality score** | Post-order job | **Yes** | No | 4 components weighted | `06-shopper-quality` |
| 27 | **Trust relationship dispatch** | Order dispatch | **Yes** | No | 3+ orders, 5 min window | `06-shopper-quality` |
| 28 | **Shopper Ground draft batch** | **27** consumer | **Cross** | No | Opt-in post-session | `07-ground-contribution` |
| 29 | **Smart routing** | **28** + **27** read | **Cross** | No | At shopper accept | `08-smart-routing` |
| 30 | **Standing order scheduler** | Cron/alarm | **Yes** | No | Day-before notify | `09-standing-order` |
| 31 | **`cooking_intent` memory event** | Brain | **Cross** | No | **01** event kind gap | `10-cooking-intent-trigger` |
| 32 | **Cooking intent → order offer** | Brain tool/flow | **Yes** | No | Gap check + user tap | `10-cooking-intent-trigger` |
| 33 | **Post-delivery "Start cooking"** | Mobile + **29** | **Cross** | No | `source_kind: cooking_intent` | `10-cooking-intent-trigger` |
| 34 | **Order for Brioela recipient** | Order flow | **Yes** | No | Recipient constraints | `11-for-others` |
| 35 | **Order for non-user recipient** | Order flow + Brain | **Yes** | No | `recipient_profile` | `11-for-others` |
| 36 | **Dispute auto-resolution** | Handler | **Yes** | No | Scan log evidence | `12-dispute-resolution` |
| 37 | **Mira `bela_shopper` scene** | MiraSession + **30** | **Yes** | No | Shopper taps Start shopping | `14-shopper-ai-assistant` |
| 38 | **Store receipt scan** | **33** + Bela handler | **Cross** | No | Blocks delivery until pass | `15-checkout-payment` |
| 39 | **Door receipt scan** | Bela handler | **Yes** | No | Starts confirm timer | `15-checkout-payment` |
| 40 | **Delivery photos (R2)** | R2 upload | **Yes** | No | Pre-departure proof | `02-shopper-platform` |
| 41 | **Scanner pipeline reuse** | **24** consumer | **Cross** | No | Same constraint check path | `03-constraint-travel` |
| 42 | **Mesa audience on order** | **41** consumer | **Cross** | No | "not OK for Mesa" warnings | `brioela-specs/41-mesa.md` |
| 43 | **Encore Bela handoff** | **48** consumer | **Cross** | No | Missing ingredients order | `brioela-specs/44-encore.md` |
| 44 | **Passport `bela_shopper` kind** | **47** consumer | **Cross** | No | Handoff artifact | `brioela-specs/43-passport.md` |
| 45 | **In-store co-pilot shared enforcement** | **45** consumer | **Cross** | No | Same `checkConstraintForOrder` | `brioela-specs/45-in-store-copilot.md` |
| 46 | **Pantry update post-delivery** | Brain memory | **Yes** | No | Delivered items → model | `00-overview` step 17 |
| 47 | **Order dispatch / shopper notify** | **21** consumer | **Cross** | No | Push + in-app | `01-order-creation` |
| 48 | **Bela tab + shopper mode UI** | Mobile | **Yes** | No | User + shopper surfaces | build `11-bela/` |
| 49 | **`tools/bela/` registry** | Brain/platform tools | **Yes** | No | Constraint, escrow, transfer | build `00-overview` |
| 50 | **Wrangler `ORDER_AGENT` binding** | Infrastructure | **Yes** | No | Separate from Brain/Mira | `brioela-specs/24-technical-architecture-backbone.md` |

### Shipped in repo today (bela-related)

- `build-guide/11-bela/` — **16 files complete** (docs only).
- `implementable-specs/bela/` — **16 files** (product specs).
- `_records/connections/06-bela-connections.md`, `_records/build-order/09-layer-bela.md`.
- `_records/session-log/011-bela-complete.md`.
- **`rg 'bela|BelaOrder|ORDER_AGENT|shopper|order_constraint' backend/src shared/ mobile/`** — zero product matches (lexicon guard only in `tools/brioela-lexicon-guard/`).

---

## Architecture — BelaOrderAgent vs MiraSession vs Brain

```text
User phone                          Shopper phone
──────────                          ─────────────
Order creation ──► Supabase orders (pending)
                        │
                        ▼
              Shopper accepts order
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  BelaOrderAgent    PaymentIntent    Constraint snapshot
  DO created        auth hold        (already in Supabase;
  (ORDER_AGENT)                      captured from Brain at place order)
        │
        ├── status machine ──► Supabase orders.status + order_events
        │
        ├── /scan-session WebSocket relay (user + shopper)
        │     └── checkConstraintForOrder(snapshot, product)  [24 pipeline]
        │
        ├── auto-capture alarm (10 min after door receipt scan)
        │
        └── orchestrates Mira bela_shopper session (AUTHORITATIVE PATH):
              MiraSession DO  scene: bela_shopper
                    │
                    ├── Cloudflare Realtime SFU (shopper A/V)
                    ├── Gemini 3.1 Flash Live
                    ├── MiraSpeechDecisionEngine (**30**)
                    └── reads order list + snapshot only (no full Brain profile)

BrioelaBrain (per user) — PERMANENT
  ├── constraints table (**07**) ──► snapshot at order time
  ├── recipient_profiles (**42** Brain table)
  ├── memory_event cooking_intent (**42** new kind)
  ├── pantry model read (**34** integration)
  └── does NOT host order state machine or scan relay

CRITICAL SPLIT
  BelaOrderAgent  = order truth, WebSockets, payment triggers, scan audit
  MiraSession     = shopper voice+vision runtime (bela_shopper scene)
  BrioelaBrain    = user constraints, recipients, intent events, pantry reads
```

### Shopper AI conflict (must resolve before ship)

| Source | Shopper Gemini location |
|---|---|
| `implementable-specs/bela/14-shopper-ai-assistant.md` | **Inside BelaOrderAgent** — `shopperGeminiWs`, `/shopper-session` on order DO |
| `build-guide/11-bela/14-shopper-ai-assistant.md` | **MiraSession** with `bela_shopper` scene; BelaOrderAgent for order state only |
| `build-guide/30-mira/01-scene-contract.md` | `bela_shopper` is a `MiraSceneKind` on shared MiraSession |
| `_features/12-brain-sub-agents/spec.md` | Documents conflict; **42** owns resolution |

**Authoritative direction for migration:** MiraSession + `buildBelaShopperMiraScene` (**29**/**30** pattern). BelaOrderAgent coordinates session start/stop and passes order context; it does not embed a second Gemini stack unless implementation proves a single-DO requirement (not current build-guide).

---

## Order state machine

```
pending        → shoppers notified; no PaymentIntent yet
accepted       → shopper committed; auth hold; BelaOrderAgent created
shopping       → scanning; live session; Mira bela_shopper available
in_transit     → delivery photo uploaded; en route
delivered      → door receipt scan; awaiting user confirmation
completed      → capture + Connect transfer; pantry update
disputed       → capture held; dispute flow
cancelled      → before accepted only; auth released if any
refunded       → dispute resolved user-favor
```

Every transition → `order_events` row. `orders.status` updated; history never deleted.

**Dispatch timing:** No shopper in 15 min → retry notify. No accept in 60 min → user may cancel without charge.

---

## Order creation (`01-order-creation`)

**Path A — AI-generated list triggers:** pantry gap (**34**), post-cooking session, recipe save, standing order schedule, cooking intent conversation.

**Path B — user-initiated:** Bela tab → New order; AI pre-fills; user edits by voice/scan/text.

**Item confidence:** `exact match` | `best match` | `open description` (shopper resolves at scan; constraints still apply).

**Delivery window:** ASAP, today slots, tomorrow, custom up to 7 days.

**On Place order:**
1. Insert `orders` + `order_items` (`status = pending`)
2. Write `order_constraint_snapshot` from Brain constraints (+ Mesa merge when **41** ships)
3. Notify nearby shoppers
4. **No payment authorization until shopper accepts**

**Scan-time resolution:** exact match | category match (auto-approve 10s) | hard block | no match (orange).

---

## Constraint travel (`03-constraint-travel`)

Snapshot shape: `hardBlocks[]` (allergy, intolerance, boycott) + `softGuidance[]` (dislike, preference).

- Loaded into BelaOrderAgent at session start; not re-fetched per scan from Brain.
- Hard blocks: red card, no shopper override.
- Soft guidance: orange card, shopper may proceed.
- User override only from user live session UI → `user_override` event.
- Unresolved products: manual ingredient check required; logged `unresolved_product_manual_check`.
- Snapshot retained 90 days post-completion then deleted.
- Shopper sees scanner feedback only — not raw constraint database or medical rationale.

**Shared enforcement:** `checkConstraintForOrder` must be the same implementation **45** in-store co-pilot calls (`brioela-specs/45-in-store-copilot.md`).

---

## Live scan session (`04-live-scan-session`)

- Endpoint: BelaOrderAgent `/scan-session`
- Roles: `shopper` | `user` with order-scoped tokens
- Broadcast scan results to both WebSockets; < 200ms target
- User: passive banner or active reject/approve/substitution/note/override
- Substitution auto-accept 90s
- Session opens at `shopping`; closes at "Shopping done"
- All scans logged to `order_events` even if user not watching

---

## Payment and escrow (`05-escrow-payment`, `15-checkout-payment`)

**Model:** PaymentIntent `capture_method: 'manual'`. No wallet. No Stripe Issuing.

**Authorization at accept:** estimate + 20% buffer + delivery fee + platform fee (tiered service fee on actual grocery at capture).

**Shopper checkout:** dedicated Bela card at store till; receipt scan verifies last-4 + total; `incrementAuthorization` if needed before leaving store.

**Door:** second receipt scan → full-screen user confirm; 10-minute timer; BelaOrderAgent alarm auto-captures.

**Tips:** separate PaymentIntent; 100% to shopper via Connect.

**Cancellation:** only before `shopping` starts (after accept but before scan session).

---

## Shopper platform (`02-shopper-platform`)

Onboarding: application → Veriff KYC → background check → Stripe Connect Express → Bela card SetupIntent → `shoppers.status = active`.

Shopper mode: availability toggle, pending orders (90s accept window), shopping mode, delivery mode.

Suspension triggers: 3+ scanner overrides/order, 2 disputes/30 days, KYC failure, quality score < 45.

---

## Shopper quality (`06-shopper-quality`)

| Component | Weight |
|---|---|
| Constraint compliance | 40% |
| Item accuracy | 30% |
| Delivery accuracy | 20% |
| User satisfaction (1–5, optional) | 10% |

Trust relationship after 3+ clean orders: priority dispatch (5 min exclusive), shopper notes, preference accumulation per user-shopper pair.

---

## Ground contribution (`07-ground-contribution`)

Opt-in at shopper onboarding. Auto-draft finds after session: price signal (>5% delta), availability (stale sighting), new product, produce freshness (manual tap).

Post-session batch UI: Share all / Review / Skip. Same authenticity gate as **27** — `source: bela_shopper` on find rows. No order/user identity in find content. Constraint blocks never become finds.

---

## Smart routing (`08-smart-routing`)

Inputs: Ground `location_signal_summary`, **28** `product_sighting`, `map_place_signal`, user `place_visited` from Brain memory.

Score (location, item): availability 50%, price 30%, store quality 10%, user preference 10%.

Max two store stops if route < 2km total detour. Native maps deep link — no turn-by-turn engine in **42**.

---

## Standing orders (`09-standing-order`)

Frequencies: weekly / biweekly / monthly. AI list day-before; 3-hour approval window; auto-confirm default (toggle off available). Budget cap trims by priority score. Payment method pre-check day-before.

---

## Cooking intent trigger (`10-cooking-intent-trigger`)

Sources: cooking session conversation, recipe save gap check, mid-session missing ingredient (same-day urgent path).

Requires explicit user tap to order — never auto-place.

`orders.source_kind = 'cooking_intent'`; post-delivery → "Start cooking" opens **29** session with recipe context.

**Gap:** `cooking_intent` not yet in `memory_event` kind list (`implementable-specs/01-memory-event.md`).

---

## Order for others (`11-for-others`)

**Brioela recipient:** recipient's constraints; sender pays; recipient may watch live scan.

**Non-user:** `recipient_profiles` in sender's Brain DO; one-time manual constraint form; SMS notification to recipient.

**Family links:** mutual consent in Supabase `family_links`.

**Mesa note:** Charitable pantry scenario in spec uses manual recipient notes — when **41** ships, linked Brioela recipients should use Mesa audience on their account, not sender's profile.

---

## Dispute resolution (`12-dispute-resolution`)

30-minute window after confirm/auto-confirm. Types: wrong item, missing item, constraint violation (health — full refund + shopper suspend), quality (user photo).

Auto-resolution from scan log + delivery photo for types 1–3 in clear cases.

---

## Data model summary (`13-data-model`)

| Store | Tables / state |
|---|---|
| **Supabase** | `shoppers`, `orders`, `order_items`, `order_events`, `order_constraint_snapshot`, `standing_orders`, `standing_order_cycles`, `disputes`, `shopper_scan_log`, `family_links`, `order_payment_events`, `order_receipt_scans` |
| **Brain DO** | `recipient_profiles`; pantry model keys; `constraints` (**07**); `cooking_intent` events |
| **BelaOrderAgent** | In-memory: WS clients, snapshot cache, pending substitution, Mira session handle |
| **R2** | Receipt images, delivery photos, dispute photos |

**Stale — do not implement:** `wallet_transactions`, user wallet balance cache (removed in session 011 / build `13-data-model`).

**Required shopper fields:** `bela_card_payment_method_id`, `bela_card_last4`, `bela_card_brand`.

---

## Mira bela_shopper scene (`14-shopper-ai-assistant`)

- Gemini 3.1 Flash Live; JPEG via `client_content`; PCM audio; proactive reconnect (90s) per **29** `09-reconnection.md`
- System instruction from: order items, snapshot, Ground context for store, trust shopper notes
- Earbuds-first; short responses; hard-block phrasing non-equivocal
- User does **not** hear shopper-side Mira channel (scan cards only via live session)
- Proactive triggers: allergen in frame, better option visible, off-list product — **30** suppression rules (5s after shopper speech, 30s after Mira spoke)
- Session: `shopping` start → "Shopping done" end

---

## Feature integration summary

| Surface | Bela behavior |
|---|---|
| **Scanner (24)** | Constraint check function reused for shopper scans |
| **Cooking (29)** | Cooking intent source; post-delivery session link |
| **Mira (30)** | `bela_shopper` scene builder + speech policy |
| **Ground (27)** | Shopper find drafts; routing price signals |
| **Map (28)** | `product_sighting`, place signals for routing |
| **Pantry (34)** | List generation + gap check inputs |
| **Receipt (33)** | Store receipt vision extraction |
| **Mesa (41)** | Active Food Audience on substitutions — "not OK for Mesa" |
| **Notifications (21)** | Order lifecycle pushes |
| **Encore (48)** | One-tap missing-ingredient Bela order |
| **Passport (47)** | `bela_shopper` passport kind for handoff |
| **Co-pilot (45)** | Same constraint enforcement helper |

---

## Explicitly out of scope (`00-overview`)

- Turn-by-turn navigation (native maps deep link only)
- Owned delivery fleet
- Restaurant / prepared food delivery
- Real-time shopper GPS dot for users
- Stripe Issuing / virtual cards / platform-held wallet

---

## Sources (authoritative)

### Implementable specs — all read

- `implementable-specs/bela/00-overview.md` through `15-checkout-payment.md` (16 files)

### Build guide — all read

- `build-guide/11-bela/00-overview.md` through `15-checkout-payment.md` (16 files)

### Cross-feature

- `_features/12-brain-sub-agents/spec.md` — agent catalog, BelaOrderAgent vs Mira conflict
- `_features/29-cooking-session/spec.md` — MiraSession pattern
- `_features/30-mira-speech-engine/spec.md` — `bela_shopper` scene contract
- `_features/27-ground/spec.md`, `_features/28-map/spec.md` — routing + find drafts
- `_features/34-pantry-meal-plan/spec.md` — pantry gap input
- `_features/41-mesa/spec.md` — Mesa order hook
- `brioela-specs/41-mesa.md`, `43-passport.md`, `44-encore.md`, `45-in-store-copilot.md`
- `build-guide/30-mira/01-scene-contract.md`
- `_records/connections/06-bela-connections.md`
- `_records/build-order/09-layer-bela.md`
- `_records/session-log/011-bela-complete.md`
