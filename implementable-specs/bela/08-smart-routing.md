# Bela — Smart Store Routing

## What Smart Routing Is

When a shopper accepts an order, the app does not just tell them "go to the nearest supermarket." It determines the optimal store or combination of stores that will:
1. Stock all the items on the order list with the highest confidence
2. Offer the best prices available based on Ground and product_sighting data
3. Minimize the total route distance for the shopper

This routing happens automatically at order acceptance. The shopper sees a map with their route and an explanation of why they are going where they are going.

---

## Data Sources

Smart routing combines four signals:

### 1. Ground `location_signal_summary` — Price Signals

Green signal finds (price drops, price updates) from nearby stores in the last 7 days. Fresh finds (< 4 hours) are weighted 3×. Finds from 4–48 hours are weighted 1×. Finds older than 48 hours are weighted 0.3×. Finds older than 7 days are not used for routing.

This answers: where is a specific item currently priced low?

### 2. `product_sighting` — Availability Confidence

Every time a product is scanned at a location (by any user or any shopper), a `product_sighting` row is created or updated. The confidence that a product is available at a store decays over time from the last confirmed sighting.

```typescript
function availabilityConfidence(lastSeenAt: Date): number {
  const daysSince = (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSince < 1)  return 0.95   // almost certainly still there
  if (daysSince < 3)  return 0.85
  if (daysSince < 7)  return 0.70
  if (daysSince < 14) return 0.50
  if (daysSince < 30) return 0.30
  return 0.10  // very uncertain
}
```

This answers: is this item likely to be in stock right now?

### 3. `map_place_signal` — General Store Quality

From spec 04 (Healthy Food Map): each place has a `healthy_score`, `community_score`, `affordability_score`, and `recency_score`. These are background signals. A store with consistently high affordability score is a better routing candidate for a price-sensitive order.

This answers: is this store generally good for this type of shopping?

### 4. User Preference History

From the user's Brain DO: which stores has this user bought from before (from `place_visited` events in `memory_event`)? A store the user visits regularly is preferred over an unfamiliar one — the user already knows the layout, already trusts the produce, already has reasons for going there.

This answers: is this a store the user trusts?

---

## Routing Algorithm

### Step 1: Build a candidate store list

For each item on the order:
- Query `product_sighting` for all locations within a 3km radius of the user's home with a sighting confidence > 0.5
- Merge with Ground price signals for those locations
- Score each (location, item) pair:

```
item_location_score = (
  availability_confidence × 0.50 +
  price_competitiveness × 0.30 +
  store_quality_score   × 0.10 +
  user_preference_boost × 0.10
)
```

`price_competitiveness` = (median price for this item in this city - this store's known price) / median price. Higher is better (cheaper than median = higher score). If no price data: 0 (neutral).

`user_preference_boost` = 0.2 if user has visited this store in the last 60 days, else 0.

### Step 2: Assign items to stores

Using the scored (location, item) pairs, find the minimum-store assignment that covers all items with the highest total confidence:

- **Single store covers all items with confidence > 0.8**: route to that store only
- **One store covers 80%+ of items, one secondary store covers the rest**: two-stop route
- **No single store covers more than 60%**: the order is flagged as high-uncertainty — the shopper is warned that multiple stores may not stock everything and items may be unavailable

The multi-store threshold is a product decision: two stops are acceptable if the total route distance is under 2km. More than two stops are never recommended — the shopper overhead is too high and the savings do not justify it.

### Step 3: Order the stops

If multi-stop: stops are ordered to minimize total route distance (nearest stop first, delivery address last). The shopper's route is presented as:
1. Store A (for items X, Y, Z)
2. Store B (for items P, Q)
3. User's delivery address

### Step 4: Savings summary

The routing decision is summarized for the user at order confirmation:

```
Smart routing selected 2 stores

[ Market A — 1.2km from you ]
Teff flour, berbere spice, red onions
Ground shows fresh teff and good berbere pricing here today.

[ Supermarket B — 400m from Market A ]
Olive oil, eggs
Olive oil price dropped $1.80 yesterday per a Ground find.

Estimated savings vs shopping at a single supermarket: ~$4.20
```

The user does not need to do anything with this information — it is shown for transparency, not for approval. The shopper follows the route the app provides.

---

## What the Shopper Sees

When the shopper accepts the order, the routing is already calculated and attached. They see:

```
Order #1847 — 12 items

Stop 1: Shiro Meda Market (1.4km from you)
  8 items to find here
  [ Open in Maps ]

Stop 2: Bole Supermarket (600m from Stop 1)
  4 items to find here
  [ Open in Maps ]

Delivery: Goro neighborhood (2.1km from Stop 2)
```

Each stop shows the specific items to find there. The shopper's in-app item list is segmented by stop — when they are at Stop 1, they see only the Stop 1 items highlighted; Stop 2 items are shown greyed out.

The shopper taps "Open in Maps" to get native navigation to each stop. Brioela does not build navigation — it passes a deep link to the native maps app (Google Maps on Android, Apple Maps on iOS) with the destination address.

---

## Routing Confidence and Fallback

If routing confidence is low (no recent product sighting data, no Ground price signals for any item), the shopper sees:

```
ℹ️  Limited availability data

We don't have recent information about where these items 
are in stock nearby. Our best suggestion is:

[Nearest large market or supermarket]

The user's item list is general enough that this store 
likely carries most items. You may need to call the user 
if key items are unavailable.
```

Low-confidence routing is flagged in the order record. These orders contribute to the product sighting database when the shopper scans — they make future routing better for this area.

---

## Post-Order Routing Feedback

At order completion, the routing algorithm receives a signal update:
- Items found at the recommended store: `product_sighting` updated with new `last_seen_at`
- Items not found at the recommended store: `product_sighting.confidence` is decremented for that location
- Actual price paid (from receipt): if available, updates the price signal for that product at that location

Over time, this feedback loop makes routing increasingly accurate for every neighborhood. Shoppers who complete orders are actively improving the routing algorithm for future shoppers in the same area.
