# 45. In-Store Co-Pilot

## Goal

Give the user a hands-free voice companion for the highest-frequency food ritual there is: the grocery run. One earbud in, phone in pocket, Mira walks the store with them — list awareness, running spend total against their own baseline, shelf-level swap suggestions from their personal data, fresh Ground intelligence for this exact store, and Mesa compatibility on everything they pick up.

## Why This Exists

Bela already specifies this entire experience — for the gig shopper. The Bela shopper AI assistant (implementable-specs/bela/14) puts a voice + camera AI in the shopper's ear with real-time constraint enforcement while they shop for someone else. The user shopping for themselves gets only the one-at-a-time scan loop of spec 01: open camera, scan, read verdict, repeat.

The in-store co-pilot points the same session runtime at the user. No new infrastructure: the Mira session lifecycle (spec 10), the scanner pipeline (spec 01), receipt-derived spend baselines (specs 06, 29), CGM response data where it exists (spec 40), Ground finds for the store (spec 35), pantry predictions (spec 36), the active meal plan (spec 33), and Mesa audiences (spec 41) all already exist. The co-pilot is a read-path across them, delivered as a low-cost audio-only session.

A weekly 20–30 minute shop is the single most regular food moment in a user's life. Owning it makes Brioela a habit, not an app.

## User Outcome

- User walks into a store and starts a shopping session (one tap, or accepts the ambient prompt when Brioela notices they are at a known grocery location).
- Mira, in their ear, knows: the shopping list (from the meal plan, the predictive pantry list, or dictated on the spot), the user's full constraint profile, their price history at this store, and today's Ground finds here.
- As they shop, the user scans items naturally or just talks: "I'm grabbing the usual yogurt." Mira answers only when it matters:
  - "That one spikes your glucose — the one two shelves down has stayed flat for you." (spec 40)
  - "Cheaper than your usual — good time to stock up." (spec 29)
  - "That has sesame. Not safe for your son." (spec 41 Mesa audience)
  - "Someone spotted fresh teff at the back left this morning." (spec 35)
  - "You're at about $52 — six dollars under your usual week." (spec 06)
- At checkout, the session ends. The receipt scan (spec 06) closes the loop, confirms the list, and updates pantry state and price history automatically.

## In Scope

- Audio-only Mira session scoped to a store visit (camera used only for normal scans, not continuous frames).
- List assembly from the active meal plan (spec 33), the predictive pantry list (spec 36), and voice dictation.
- Running spend estimate from scans plus the user's own price history.
- Constraint and Mesa-audience checks on every scanned item — same enforcement path as Bela constraint travel (bela/03), pointed at the user.
- Personal swap suggestions: glucose response (spec 40), price (spec 29), condition flags (spec 28).
- Store-scoped Ground intelligence injected at session start.
- Session-end handoff to receipt scanning.

## Out of Scope

- Continuous camera streaming inside the store (cost, battery, social acceptability — scans are discrete, as in spec 01).
- Indoor positioning or aisle-level navigation. Mira can relay what Ground finds say about where something is ("back left, spice wall") but never claims live in-store positioning.
- Store partnerships, planograms, or retailer inventory feeds.
- Payment. The user pays the store normally. This is not Bela checkout.

## Session Lifecycle

The co-pilot session is a Mira session DO scoped to the store visit, named `shop-{userId}-{visitId}`. It follows the standard Mira session rules (spec 10): full-duplex Gemini Live audio, `thinkingLevel: minimal`, context injected at connect time, mid-session pushes via `send_realtime_input`, inactivity timeout, post-session summarization workflow.

**Session start context payload** (assembled by the Brain DO):
- Shopping list with per-item status (from plan, from prediction, dictated).
- Hard constraints, dietary identity, active medical conditions, medications.
- Active Mesa audience if one is selected ("shopping for the family").
- Price history for this store (top recurring items + baseline weekly spend).
- Glucose spike triggers from `health.glucose` where CGM data exists.
- Ground finds for this store from the last 7 days, fresh finds first.
- Predictive pantry nudges currently open (spec 36).

**Mid-session events pushed into the live session:**
- Every scan result (verdict + constraint matches + price delta + glucose note).
- List item check-offs inferred from scans.
- Running total updates.

**Session end:** triggered by the user ("I'm done"), by checkout context ("scanning the receipt"), or by leaving the store geofence. Post-session workflow writes: list completion state, items bought vs. skipped (dislike signals, spec 21 behavioral discovery), price events (spec 29), and pantry resets (spec 36).

## When Mira Speaks (Silence Rules)

The spec 00 silence law applies with full force — a chatty store companion is unbearable. Mira speaks only when:

1. The user asked something.
2. A scanned item violates a hard constraint or Mesa-member constraint (critical, always).
3. A swap suggestion clears a high bar: personal evidence exists (the user's own glucose data, their own price history, a confirmed condition rule) AND the alternative is plausibly in this store. Population-level "this is unhealthy" commentary is never volunteered — that is what the scan verdict screen is for.
4. One store-relevant Ground find matches the user's ingredient profile — at most one per visit, offered at session start, never mid-aisle unless asked.
5. The running total crosses the user's own baseline — mentioned once, never repeated.

Maximum unprompted interventions per visit, excluding safety: 3. Safety interruptions are unlimited and immediate.

## Spend Awareness

The running total is an estimate built from: scanned items matched to the user's price history at this store (spec 29 `purchase_price_event`), falling back to the most recent community price signal for this store (spec 15), falling back to "unpriced" (excluded from the total, counted as items). Mira always frames the total as an estimate. The receipt scan at the end is the ground truth that retrains the estimates.

## Relationship to Bela

The co-pilot and the Bela shopper assistant (bela/14) are the same capability with a different principal:

| | Bela shopper assistant | In-store co-pilot |
|---|---|---|
| Who shops | Gig shopper | The user |
| Whose constraints | The ordering user's, enforced as hard blocks | The user's own + active Mesa audience |
| Constraint behavior | Scanner blocks purchase | Scanner warns, user decides |
| Payment | Bela card + escrow | User pays store directly, out of scope |
| Camera | Continuous shopper scanning flow | Discrete user scans only |

Code-level: both run on the Mira session runtime and the same constraint-check tools. The build must share these, not fork them.

## Data Model

Stored in the Brain DO SQLite (private):

- `shop_visit`: visit_id, user_id, place_id, started_at, ended_at, list_source (plan | pantry | dictated | mixed), items_listed, items_scanned, items_bought_estimate, spend_estimate, receipt_id (nullable, linked after receipt scan).
- `shop_visit_event`: visit_id, event_type (scan, swap_suggested, swap_taken, constraint_warning, ground_find_relayed, total_milestone), payload_json, created_at.

No audio is ever stored. Transcript handling follows the standard Mira session storage rules (cooking-session/07).

## API Surface

- `POST /api/shop/session` — start a co-pilot session; returns session connection parameters (same shape as spec 10 voice sessions).
- `POST /api/shop/session/events` — mid-session event push (scan results, list updates).
- `POST /api/shop/session/end` — close and trigger the post-visit workflow.

## Technical Constraints

- Audio-only economics: at ~$0.0045/min (spec 24 cost model), a 30-minute weekly shop costs ~$0.14/week per user — viable at Chef tier session allowances.
- Store presence detection uses the same geo signals as Ground's ambient contribution prompt (spec 35) — no continuous background tracking beyond what the user already opted into.
- Grocery stores have notoriously bad signal. The session must degrade gracefully: scans queue offline (spec 24 offline queue), Mira acknowledges degraded mode honestly ("I lost connection — your scans are saved, I'll catch up"), and the visit record completes from the receipt even if the live session died.
- The constraint-check path must be the same code as Bela constraint travel (bela/03) — one enforcement implementation, two callers.

## Tier Placement

In-store co-pilot sessions are Chef tier (spec 19), drawing from the same monthly voice-session allowance as Mira cooking voice. Power tier is unlimited. Free and Core users shopping in a store keep the full normal scan experience — the co-pilot is the voice layer on top, and the first attempted session shows the standard inline upgrade prompt.

## Privacy

- Visit records, spend estimates, and swap history are private Brain DO data.
- Store location is recorded at place level, not as a GPS trace. No path-through-store data exists at all (no indoor positioning).
- Nothing from a shopping session is written to Ground without the user explicitly submitting a find (the spec 34/35 intent boundary applies).

## Success Metrics

- Sessions per active Chef user per month (target: approaching weekly — this is the habit metric).
- Swap acceptance rate (suggestions taken vs. ignored), split by evidence type (glucose, price, condition).
- Constraint warning rate and prevented-purchase proxy (warned item absent from the receipt).
- Spend estimate accuracy vs. receipt ground truth.
- Session survival rate in degraded connectivity.
- Chef conversion rate among users who hit the co-pilot upgrade prompt in-store.
