# 36. Predictive Pantry Intelligence

## Goal

Use receipt history and scan patterns to predict when the user is running low on regularly purchased items — before they run out — without the user ever having to maintain a pantry list.

## Why This Exists

Every household has a rhythm. Milk every 8 days. Olive oil every 5–6 weeks. Coffee every 3 weeks. This rhythm lives in the receipt history Brioela already has. The user never thinks about it consciously, which is exactly why they run out of things at inconvenient times.

Brioela has the data to know before the user does. The prediction doesn't require IoT sensors, manual inventory input, or any active participation. It is pure pattern recognition over data the app already collects.

## How It Works

The Orchestrator DO runs a pantry prediction pass as part of its weekly alarm cycle. For each user with sufficient receipt history (minimum 3 purchases of the same item):

1. **Purchase interval estimation**: for each regularly bought item, compute the median days between purchases (using receipt scan history and manual receipt photos).
2. **Last seen date**: the most recent scan or receipt entry for that item.
3. **Predicted depletion date**: last_seen_date + median_interval.
4. **Alert threshold**: if today >= predicted_depletion_date − 3 days, surface a predictive nudge.

The nudge is a quiet ambient notification (spec 23 rules apply — never more than one per day, never during a cooking session): "You usually buy [item] around now. Added to your running list."

The item is added to a lightweight "probably need" list visible on the shopping list surface. The user can dismiss individual predictions with one tap. Dismissed items are downweighted for future cycles — not removed permanently, because the user might just have bought it elsewhere without scanning.

## Confidence Tiers

Not all predictions are equal. The system surfaces predictions at different confidence levels:

| Confidence | Condition | Behavior |
|---|---|---|
| High | 5+ purchase events, low variance in interval | Quiet notification + auto-add to list |
| Medium | 3–4 events or moderate variance | Added to list only, no notification |
| Low | 2 events or high variance | Surfaced only if user opens the shopping list |

Low-confidence predictions are never notified. The user should only receive notifications when the system is genuinely confident.

## Learning and Correction

- If the user buys the predicted item within 3 days of prediction: prediction was correct, interval model holds.
- If the user does not buy it within 2 weeks past prediction: either they bought it elsewhere (interval shortens slightly) or their usage changed (interval lengthens and confidence resets).
- Explicit dismissals ("I don't need this anymore") permanently archive the prediction pattern for that item.
- If a scan shows the item was purchased (any scan or receipt), prediction resets with updated last_seen_date immediately.

## What This Does Not Do

- Does not maintain a real-time inventory. It predicts when to buy, not what is physically in the cupboard right now (that is the Orchestrator DO's scan-based inventory for spec 33 meal planning).
- Does not show quantities. It predicts the need to buy, not how much to buy (though receipt history could inform typical quantity purchased — a future extension).
- Does not require the user to confirm what they have at home. Silence is not confirmation.

## Data Model

All stored in the Orchestrator DO SQLite — this is per-user private data, not shared.

```sql
purchase_pattern (
  item_key        text primary key,  -- normalized product name or UPC
  display_name    text,
  purchase_dates  text,              -- JSON array of timestamps
  median_interval_days integer,
  last_purchased  integer,           -- unix timestamp
  confidence_tier text check(confidence_tier in ('high','medium','low')),
  dismissed       integer default 0  -- 1 = permanently dismissed
)

predictive_nudge (
  nudge_id        text primary key,
  item_key        text,
  predicted_need_date integer,
  surfaced_at     integer,
  resolved_at     integer,           -- null until bought or dismissed
  outcome         text check(outcome in ('bought','dismissed','expired',null))
)
```

## Integration Points

- **Spec 33 (Meal Plan)**: the predictive pantry list feeds into the meal plan shopping list as a "you'll probably need this soon anyway" section at the bottom — separate from plan-driven purchases.
- **Spec 15 (Price Alerts)**: if a predicted item is on price alert and it's also a predicted need, both signals are combined into one notification rather than two.
- **Spec 29 (Inflation Tracker)**: when a predicted item is bought, its price is automatically recorded for inflation tracking. The user doesn't need to do anything extra.

## Success Metrics

- Prediction accuracy rate: predicted items purchased within 5 days of prediction.
- Notification acceptance rate: nudges that result in the item being added to cart or purchased.
- Dismissal rate: high dismissal = predictions are wrong or irrelevant.
- Reduction in "ran out of" moments: hard to measure directly, but proxied by receipt patterns showing fewer emergency single-item purchases.
