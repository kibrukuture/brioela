# Bela — Order Creation

## The Two Ways an Order Starts

### Path A: AI-Generated List (Zero Effort)

The AI proactively generates a grocery list based on what it knows about the user. No user opens a list screen. No user remembers what they are out of.

**Trigger conditions (any one of these):**

1. **Pantry gap detection**: the AI's pantry model (built from scan history, receipt ingestion, and cooking sessions) detects that frequently-used ingredients have not been scanned in longer than their typical restock cycle. If the user buys teff flour every 3 weeks and it has been 24 days, teff flour appears on the proposed list.

2. **Post-cooking session**: after a cooking session ends, the AI notes which ingredients were used and updates the pantry model. If the session used the last of something, it proposes a restock.

3. **Recipe save**: the user saves a recipe they want to cook. The AI checks the recipe ingredients against the pantry model and proposes a list of what is missing.

4. **Standing order schedule**: a recurring order triggers its list generation (see `09-standing-order.md`).

5. **Cooking intent in conversation**: the user mentions wanting to cook something specific (see `10-cooking-intent-trigger.md`).

**What the user sees** (ambient notification surface, spec 23):

```
Your pantry order is ready

Teff flour (2 kg)
Red onions (1 kg)
Niter kibbeh (1 jar)
Berbere spice (200g)
Fresh garlic (1 head)
+ 3 more items

Estimated total: ~$38
Ground shows fresh teff at [Market name] right now.

[ Review and order ]  [ Dismiss ]
```

Tapping "Review and order" opens the full order creation screen.

---

### Path B: User-Initiated Order

The user opens the Bela tab and taps "New order." The AI pre-fills a suggested list (same logic as Path A) but the user is starting from intent — they want to order now, not just approve a suggestion.

The user can:
- Accept the AI's full suggested list
- Remove items from the list
- Add items by typing or by voice: "add injera, add eggs, add 2 kg chicken"
- Scan a product they already have to add it by barcode (product resolved to canonical identity from the product database)

---

## Order Creation Screen

The order creation screen has three sections:

### 1. Item List

Each item shows:
- Product name (canonical name from product database, or user's own wording if not resolved yet)
- Quantity
- AI confidence indicator: `exact match` (product ID known from scan history) vs `best match` (AI will resolve at scan time) vs `open description` (shopper finds based on description)
- Estimated price (from Ground price signals and product_sighting data if available; null if no data)

The user can tap any item to adjust quantity, add a note ("get the large bag, not the small one"), or remove it.

**What "open description" means:** The user said "add injera." The AI cannot resolve this to a specific product ID because there are many injera brands. The item is added as a description. When the shopper scans a product matching "injera" in the store, the constraint check still runs (the user's gluten flag, if any, still applies). The user can optionally add a note: "any injera is fine, prefer larger packages."

### 2. Delivery Window

The user selects when they want delivery:

- **As soon as possible** — dispatched to the nearest available shopper immediately
- **Today, afternoon (12–5pm)** — scheduled
- **Today, evening (5–9pm)** — scheduled
- **Tomorrow morning (8am–12pm)** — scheduled
- **Custom time** — user picks a date/time up to 7 days out

The delivery window is a commitment from the platform, not a guarantee from a specific shopper. Shoppers who accept the order commit to the window.

### 3. Delivery Address

Defaults to the user's home address from their account. Can be changed per-order. If this is an order for someone else, see `11-for-others.md`.

---

## Order Confirmation

After the user taps "Place order":

1. The order is written to Supabase `orders` table with `status = 'pending'`
2. All items are written to `order_items` table
3. The user's constraint profile snapshot is written to `order_constraint_snapshot` — this is the exact constraint state at order time, used by the shopper's scanner even if the user's constraints change after the order is placed
4. Nearby available shoppers are notified (push notification + in-app alert in shopper mode)
5. The UI shows: "Looking for a shopper nearby..."

If no shopper accepts within 15 minutes: the user is notified, order returns to `pending` and retries. If no shopper accepts in 60 minutes: the user can cancel with no charge (no escrow hold is placed until a shopper accepts).

---

## Order State Machine

```
pending        → shopper notified, no escrow yet
accepted       → shopper committed, escrow hold placed, BelaOrderAgent DO created
shopping       → shopper has started scanning, live scan session available
in_transit     → shopper confirmed "on my way" with delivery photo submitted
delivered      → shopper marked delivered, awaiting user confirmation
completed      → user confirmed, escrow released, payout triggered
disputed       → user raised a dispute, resolution in progress
cancelled      → order cancelled before accepted (no charge)
refunded       → dispute resolved in user's favor, funds returned
```

Every state transition is written to Supabase `order_events` append-only table with a timestamp. No order state is ever modified in place — only the `orders.status` column is updated; the full event history lives in `order_events`.

---

## Item Resolution at Scan Time

When the shopper scans a product in the store, the BelaOrderAgent DO resolves the scanned product against the order item:

- **Exact match**: scanned product ID matches the expected product ID from the user's scan history → green check on the order item
- **Category match**: scanned product is in the same category and brand is acceptable → shown to user in live session for silent approval (auto-approved after 10 seconds of no rejection)
- **Constraint violation**: scanned product violates any user constraint regardless of match → hard block (red card, shopper must scan a different product)
- **No match**: scanned product does not match the order item at all → orange warning, shopper prompted to confirm this is the right item or find the correct one

The user sees all of these in real time through the live scan session (`04-live-scan-session.md`).

---

## What the AI Does NOT Put on the List

The AI proposes items based on pattern — not guesses:
- Items the user has scanned at least 3 times in the last 90 days qualify for pantry model tracking
- Items the user scanned once do not appear on auto-generated lists
- Items with a red health score for the user (based on their constraints) are never proposed — they are removed from the pantry model when a constraint match is detected

The AI does not propose:
- Alcohol (unless the user has scanned it regularly and has no restriction)
- Medications or supplements (ordered separately, not in scope for this feature)
- Fresh prepared food (grocery only — see `00-overview.md` out of scope)
