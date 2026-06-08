# Menu Scanning — Personalized Restaurant Discovery

## What This File Covers

How shared menu intelligence becomes personalized restaurant discovery. This file explains the long-term angle: Brioela should not dump all restaurants onto a map. It should guide the user to the best places for their body, constraints, budget, mood, and current context.

---

## Product Thesis

Generic restaurant discovery asks: "What is popular nearby?"

Brioela asks: "What is best for this person to eat right now?"

The difference is the data. Brioela knows:

- the user's private health and diet profile
- the user's preferences, dislikes, and food memory
- what menus nearby actually contain
- which dishes are green/yellow/red for this user
- current community signals about places
- affordability and price movement
- location, time, trip context, and likely intent

The map should become a personal health navigation surface, not a restaurant directory.

---

## Same Restaurant, Different Answer

The same restaurant can be a great match for one user and a poor match for another.

Examples:

- Peanut allergy user: restaurant with many peanut sauces ranks low unless it has clear peanut-safe dishes.
- Vegan user: restaurant ranks high if many dishes are clearly vegan or easily modifiable.
- Gluten-free user: shared fryer uncertainty lowers score even if reviews are good.
- Budget-focused user: healthy, affordable dishes rank higher than expensive wellness-branded places.
- Pregnancy watchlist user: raw fish and unpasteurized cheese uncertainty lowers score.

This is why Brioela cannot use one global restaurant score. The final score is per user.

---

## Discovery Inputs

Personalized restaurant discovery can combine:

- `restaurant_fit_summary` from shared menu intelligence.
- Dish-level parsed menu data.
- User constraints from Brain SQLite.
- User preferences and food memory.
- Map place quality and distance from `10-map`.
- Ground signal density and freshness from `09-ground`.
- Price and availability signals.
- Open-now status.
- Current intent: quick lunch, dinner, travel, craving, budget mode, family meal, cooking fallback.

The result is not "all restaurants near me." The result is a small set of places that are likely useful.

---

## Ranking Shape

Use hard exclusions first, then ranking.

```typescript
type PersonalizedRestaurantScore = {
  placeId: string
  userId: string
  hardExcluded: boolean
  fitScore: number
  safetyClarityScore: number
  greenDishCount: number
  yellowDishCount: number
  redDishCount: number
  affordabilityScore: number
  distanceScore: number
  cravingMatchScore: number
  communityConfidenceScore: number
  explanation: string
}
```

Ranking priorities:

1. Remove places with obvious hard conflicts unless the user explicitly asks to see all.
2. Prefer places with multiple green dishes for the user.
3. Prefer places with clear allergen/diet labeling over vague menus.
4. Prefer places with fewer yellow waiter-question burdens when the user wants low-friction eating.
5. Include price and value, not only health.
6. Respect craving and intent when it does not conflict with health constraints.
7. Use community confidence as a signal, not as a replacement for dish-level checks.

---

## Map Rendering Rule

The map should not behave like Yelp or Google Maps by default.

Default map behavior:

- Show the best-fit places first.
- Size or highlight places by personalized fit.
- Suppress obvious poor matches unless the user chooses "show all."
- Explain why a place is recommended.
- Let the user tap into the menu with precomputed green/yellow/red sections.

Example map copy:

- "Best nearby for you: 6 likely OK dishes, clear gluten labeling, moderate price."
- "Good vegan fit, but 4 dishes need sauce questions."
- "Avoid for peanut allergy: menu has multiple peanut sauces and unclear shared prep."

The user should feel guided, not forced to filter a huge list manually.

---

## Personal Menu Preview

Restaurant cards should show a compressed menu fit preview:

```typescript
type RestaurantMenuFitPreview = {
  placeId: string
  bestDishes: Array<{
    dishName: string
    verdict: "green" | "yellow" | "red"
    shortReason: string
  }>
  greenCount: number
  yellowCount: number
  redCount: number
  clarityLabel: "clear" | "mixed" | "unclear"
  priceLabel: "low" | "medium" | "high" | "unknown"
}
```

This lets the user decide quickly without opening every menu.

---

## Mood And Intent

The user may not always ask for "healthy." They may ask for:

- "I want something warm and cheap."
- "Find me a safe place near the train station."
- "I feel like noodles but no peanuts."
- "I need dinner that works for my pregnancy profile."
- "I want the healthiest affordable thing nearby."

Brioela should translate intent into ranking, then still enforce constraints.

Intent can reorder safe choices. It cannot override hard safety rules.

---

## Why This Beats Generic Discovery

Yelp and Google can tell a user what is popular. Brioela can tell the user what is edible, safe enough to ask about, affordable, nearby, and personally relevant.

With enough menu scans, Brioela does not need to guess from generic reviews. It has structured data:

- menus loaded from QR codes and websites
- dishes parsed from paper menus
- price text from real menus
- repeated scan confirmations
- community corrections
- aggregate hidden-ingredient risk
- user-specific outcomes

This creates a private-to-public intelligence loop: each user's scan helps them immediately, and privacy-filtered public facts improve the map for everyone.

---

## Non-Negotiable Boundary

Personalized discovery must not become medical advice or restaurant certification.

Use:

- "Best fit for your profile."
- "No visible conflict found."
- "Ask about shared fryer."
- "Menu clarity is high for gluten-free labeling."

Avoid:

- "Medically safe."
- "Certified allergy-safe."
- "This restaurant is safe for diabetics."
- "You should eat here for your condition."

Brioela guides food decisions using user constraints and menu intelligence. It does not certify restaurants or diagnose medical needs.
