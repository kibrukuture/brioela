# Bela — Shopper Quality and Trust

## Why a New Quality Score Matters

Every grocery delivery platform has a rating system. The user gives the shopper 1–5 stars. The shopper with the most stars wins.

This system fails for two reasons:
1. Users rate emotionally — a friendly shopper who bought the wrong product gets 5 stars because the interaction was pleasant
2. Nothing in the rating reflects the thing that actually matters in Brioela: did the shopper follow the user's health and dietary profile?

Brioela's quality score is built from objective signal — scanner data, not subjective feelings. A shopper who followed every constraint perfectly on 50 orders has a verifiably better quality record than a shopper who got good vibes from users but let an allergen through three times.

---

## The Four Score Components

### 1. Constraint Compliance Score (40% weight)

Measures how well the shopper followed the user's constraint profile.

Calculated per order, then averaged across the last 30 orders (or all orders if fewer than 30):

```
compliance_score = (items_purchased_with_no_violation / total_items_scanned) × 100
```

**Events that hurt compliance score:**
- A hard block override initiated by the shopper (this cannot happen — hard blocks have no shopper override — so this score can only be damaged by manual checks on unresolved products that later turn out to have been constraint violations)
- An item delivered that generated a dispute for being a constraint violation (see `12-dispute-resolution.md`)

**Events that do NOT hurt compliance score:**
- A user-initiated override (the user overrode their own constraint — not the shopper's fault)
- An item that was not in the database (the shopper completed a manual check — this is logged but not penalized if the check was completed)

A shopper with 100% compliance score has never been associated with a constraint violation across their entire order history. This is the metric that matters most for health-sensitive users.

### 2. Item Accuracy Score (30% weight)

Measures how many items on the order list were delivered correctly.

```
accuracy_score = (items_delivered_correctly / items_on_order) × 100
```

- Items marked unavailable by the shopper and accepted by the user: not penalized (legitimate unavailability)
- Items marked unavailable but disputed as "shopper didn't look hard enough": penalized (generates a dispute event)
- Wrong items delivered (not in the order, not a substitution): penalized at 2× weight
- Substitutions accepted by the user: neutral (not penalized, not rewarded)
- Substitutions rejected by the user but delivered anyway: penalized at 3× weight

### 3. Delivery Accuracy Score (20% weight)

Measures delivery execution:
- Order delivered within the committed window: +1 point
- Order delivered more than 15 minutes late: -1 point
- Order delivered more than 45 minutes late: -2 points
- Delivery photo submitted (proof of contents): required — orders without a photo receive a -1 point modifier applied to the full order quality score
- User confirmed delivery without dispute: +0.5 points

### 4. User Satisfaction Score (10% weight)

The traditional rating — but weighted low because it is subjective:
- User rates the shopper 1–5 after delivery (optional — not required to confirm delivery)
- Users who do not rate: order is excluded from this component calculation
- Ratings older than 90 days decay by 50% (recent behavior matters more than old)

---

## Trust Relationship — Your Dedicated Shopper

After a user has ordered from the same shopper 3 or more times with no disputes and no constraint violations from that shopper, the system recognizes a **trust relationship**.

**What trust unlocks:**

1. **Priority dispatch**: when the user places an order, the system checks if their trusted shopper is currently available. If yes, the order is offered to the trusted shopper first for a 5-minute exclusive window before broadcasting to the general pool.

2. **Shopper profile note**: the trusted shopper can optionally write a short note visible only to that user (not public): "I know which stall has the freshest berbere at the Wednesday market. I'll check there first." The user sees this note in the order confirmation view.

3. **Preference accumulation**: the trusted shopper's order history with this specific user feeds an extended preference model. Beyond the constraint database, the shopper can note in-app: "User always picks the large bag, not the medium" or "User prefers the stall at the north entrance of the market." These notes are stored per user-shopper pair, not in the general user profile, and are only used for that shopper's orders.

4. **Instant reconnect**: if the trusted shopper declines or is unavailable, the user gets a soft notification: "Your usual shopper isn't available right now. Send to the next available shopper?" with a 60-second hold before auto-dispatching.

**The trust relationship ends if:**
- The shopper receives a dispute on an order for this user
- The shopper receives 2 or more disputes from other users within 30 days
- The shopper's quality score drops below the minimum threshold for 14 consecutive days

---

## Quality Score Thresholds and Consequences

| Score range | Status | Consequence |
|---|---|---|
| 90–100 | Excellent | Priority in dispatch pool, eligible for trusted shopper status |
| 75–89 | Good | Normal dispatch, no restriction |
| 60–74 | Fair | Normal dispatch but flagged for review if any dispute occurs |
| 45–59 | Below standard | Receives 20% fewer order dispatches, prompted to improve |
| Below 45 | Suspended | Automatically suspended pending manual review |

The quality score is recalculated after every completed order. It never resets — historical scores decay over time (orders older than 90 days contribute at 50% weight) but they do not disappear.

---

## Shopper Score Transparency

Shoppers can see their own quality score breakdown in the shopper earnings screen:
- Overall score (as a number and tier label)
- Breakdown by component (compliance, accuracy, delivery, satisfaction)
- Recent order history with per-order scores
- What to improve: the app surfaces the lowest-scoring component and one specific action ("Your delivery accuracy dropped — 2 of your last 5 orders were late. Check the delivery window before accepting new orders.")

Shoppers cannot see other shoppers' scores. The score is private to the individual shopper.

---

## The Scan Override Log

Every scanner event during a shopping session is logged in `order_events`. At order completion, a summary of scanner events is written to `shopper_scan_log` in Supabase. This log is:
- Used for shopper quality calculations
- Used for dispute investigation (see `12-dispute-resolution.md`)
- Used for platform-level constraint enforcement accuracy analysis (do our ingredient lists catch what they should?)
- Never shown to the user in full — they see a simplified order history, not raw scan logs

The scan log is retained for 12 months per order then archived.
