# Menu Scanning — Shared Menu Intelligence

## What This File Covers

How menu scans become reusable restaurant intelligence without leaking private health profiles. This file covers shared menu data, aggregate safety signals, validation, and the network effect from many users scanning the same restaurant.

---

## Product Thesis

Every restaurant menu scan has two outputs:

- A private result for the current user: green, yellow, red, and waiter questions based on their health profile.
- A public restaurant/menu signal: structured facts about the menu and aggregate safety patterns that can help future users.

At small scale, this makes one scan useful. At very large scale, this creates a health-aware restaurant intelligence layer that generic review platforms do not have.

If many users scan the same restaurant, Brioela learns which dishes are commonly risky, which menu sections are unclear, which restaurants handle dietary constraints well, which QR menus are stale, and which places are a good fit for specific health needs.

---

## Private Versus Shared Data

Private data lives in the user's Brain SQLite:

- User's allergies, diet, dislikes, medical watchlists, and preferences.
- User scanned a restaurant.
- User's personalized green/yellow/red counts.
- User saved, ate, avoided, or asked about a dish.
- User-specific follow-up memory.

Shared data lives in Postgres/Supabase restaurant intelligence tables:

- Restaurant/place identity.
- Menu source URLs and QR-resolved URLs.
- Menu version fingerprints.
- Dish names, sections, public descriptions, prices if visible.
- Aggregate dish risk tags not tied to a specific user.
- Aggregate confidence about preparation clarity, allergen transparency, and community corrections.

Never write a user's private health profile into shared restaurant tables.

---

## Shared Data Model

The first shared model should be explicit and conservative:

```sql
restaurant_menu_source (
  source_id uuid primary key,
  place_id uuid not null,
  source_type text check (source_type in ('qr_url','url','photo_vision_extraction','merchant_feed')),
  resolved_url text,
  url_hash text,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  scan_count int not null default 1,
  status text check (status in ('active','stale','blocked','needs_review')),
  confidence numeric not null
)

restaurant_menu_version (
  version_id uuid primary key,
  place_id uuid not null,
  source_id uuid references restaurant_menu_source(source_id),
  menu_fingerprint text not null,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  observed_count int not null default 1,
  status text check (status in ('current','superseded','uncertain'))
)

restaurant_menu_dish (
  dish_id uuid primary key,
  place_id uuid not null,
  version_id uuid references restaurant_menu_version(version_id),
  section text,
  name text not null,
  description text,
  price_text text,
  ingredient_terms text[] not null default '{}',
  cooking_method text,
  confidence numeric not null,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null
)

restaurant_dish_signal_summary (
  dish_id uuid references restaurant_menu_dish(dish_id),
  signal_kind text check (signal_kind in ('allergen_visible','hidden_ingredient_risk','shared_prep_risk','dietary_fit','price_value','community_correction')),
  signal_value text not null,
  observed_count int not null default 0,
  last_seen_at timestamptz not null,
  confidence numeric not null,
  primary key (dish_id, signal_kind, signal_value)
)

restaurant_fit_summary (
  place_id uuid primary key,
  allergy_clarity_score numeric,
  dietary_fit_score numeric,
  affordability_score numeric,
  menu_freshness_score numeric,
  community_confidence_score numeric,
  updated_at timestamptz not null
)
```

This model stores public menu intelligence. It does not store "Sarah has peanut allergy" or "user X got red results."

---

## Menu Fingerprinting

Menus change. QR URLs can stay the same while dish content changes.

Use a menu fingerprint to detect whether a scan matches the known menu version:

```typescript
type MenuFingerprintInput = {
  placeId: string
  resolvedUrl: string | null
  normalizedDishNames: string[]
  normalizedSections: string[]
  normalizedPriceTexts: string[]
}
```

Fingerprint rules:

- Normalize case, whitespace, punctuation, and currency formatting.
- Sort dish names within sections only when order is unreliable.
- Include enough dish names to detect menu changes.
- Do not include user verdicts in the fingerprint.
- If the fingerprint changes materially, create a new `restaurant_menu_version`.

This lets Brioela know when a QR menu has changed without keeping raw extracted text forever.

---

## Contribution Pipeline

Not every scan should immediately update shared intelligence. The pipeline must validate first.

1. User scans paper, QR, or URL menu.
2. Brioela produces the private personalized result immediately.
3. Backend normalizes public menu facts.
4. Public facts are matched to a place and menu source.
5. Facts pass validation and abuse checks.
6. Shared restaurant tables are inserted or updated.
7. Aggregate summaries are recomputed for map/discovery.

Validation checks:

- Place match confidence is high enough.
- Menu content appears to belong to the place.
- Dish extraction confidence is high enough.
- Data is not promotional text, comments, ads, or unrelated page content.
- No personal health profile or private user note is included.
- Duplicate scans increment observations instead of creating duplicates.

For photo vision extraction, shared contribution should be more conservative than for QR/URL because image extraction can misread dish names.

---

## Aggregate Safety Signals

The shared layer should store reusable signals, not personalized verdicts.

Good shared signals:

- Dish visibly contains peanut.
- Dish likely involves shared fryer risk.
- Menu clearly labels gluten-free options.
- Menu has many dishes with hidden sauce/marinade uncertainty.
- Multiple users corrected the same dish ingredient.
- Restaurant has high clarity for vegan/vegetarian labeling.
- QR source has been observed recently and matches the current menu.

Bad shared signals:

- "This dish is safe for everyone."
- "This dish is safe for user 123."
- "People with condition X should eat here."
- Raw personal health constraints.
- Raw private waiter conversations.

The shared layer increases confidence and discovery quality. The final verdict remains personalized at request time.

---

## Scale Effect

At 100 users, menu scanning helps individuals.

At 100,000 users, Brioela starts to know which restaurants have useful, current, health-readable menus.

At 100 million users, Brioela has a daily live graph of food reality:

- restaurant menus changing by city and neighborhood
- dish-level allergen and dietary ambiguity
- QR menu freshness
- price movement at restaurants and food shops
- user action after seeing a dish result
- places that consistently fit specific health/diet profiles

That creates a different product than Yelp or Google. Those systems mainly rank by popularity, reviews, distance, and ads. Brioela can rank by personal health fit, menu clarity, price, freshness, and trusted community evidence.

---

## Privacy And Abuse Boundaries

Rules that cannot be broken:

- No public user profiles for menu contributors.
- No star reviews or popularity contests from menu scans.
- No private health constraint in shared restaurant tables.
- No exact user-level scan history exposed to restaurants or other users.
- No restaurant punishment from a single low-confidence scan.
- No "safe for allergy" public claim without user-specific evaluation.

Shared intelligence must be aggregated, confidence-scored, and reversible if later scans disprove it.

---

## Relationship To Ground And Map

Menu intelligence is not a social feed. It is structured restaurant data.

Boundary:

- `17-menu-scanning` owns menu extraction, dish facts, and aggregate menu safety signals.
- `09-ground` owns individual community Finds and authenticity-gated observations.
- `10-map` owns rendering and nearby ranking.

Map can combine all three: place data, Ground observations, and menu intelligence. The user should experience this as one smart map, but the data layers stay separate.
