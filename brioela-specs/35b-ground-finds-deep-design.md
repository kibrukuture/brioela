# 35b. Ground & Finds — Deep Design

> **Extension of spec 35 (Ground — Community Intelligence Layer).**
> Spec 35 defines what Ground is, the data model, privacy rules, and what is not built. This file defines the five design angles that make Ground feel alive rather than just functional. Read spec 35 first.

---

## Definitions

### What is Ground?

Ground is Brioela's living intelligence layer about the physical food environment around you — the stores, markets, stalls, and shelves in the real world right now.

It is not a review platform. Yelp is a review platform. Yelp tells you whether a restaurant was good in 2022. Ground tells you what is on the shelf this morning, what price things dropped to yesterday, and what just arrived at the market two streets away.

Ground is built from the observations of real people who shop, cook, and eat in the same place you do — anonymized, structured by AI, and routed only to the people near enough to act on it. It does not accumulate opinions. It accumulates observations. A find from 61 days ago disappears from the map. Ground has no memory beyond what is still fresh enough to act on.

The word "Ground" means: grounded in reality, grounded in place. Not a feed. Not content. The state of the ground beneath your feet, as it relates to food.

### What is a Find?

A Find is a single, time-stamped, location-tagged observation about food in the physical world made by one person, in one moment.

A Find is not:
- A review ("this place is great")
- A rating (4 stars)
- An opinion ("I love their hummus")
- A post (designed to be seen)

A Find is:
- "Dried hibiscus flowers, $2.40 for a large bag, back corner of the spice wall. As of this morning."
- "Fresh teff flour just arrived at the Ethiopian shop on Bole Road. Big bags. Looked very fresh."
- "The sesame oil here is now $7.80 — was $6.20 last month."
- "Never seen this brand of injera here before. Came in two sizes."

A Find answers one question: **What did you notice, specifically, right now?**

Every Find has five properties that define it:
1. **Specific** — names a product, ingredient, dish, or place. Not a vague claim.
2. **Located** — attached to a real physical place from the places database.
3. **Fresh** — older than 14 days shows as stale; older than 60 days is gone from the map.
4. **Authentic** — cleared by the AI authenticity gate before it appears anywhere.
5. **Anonymous** — the contributor is never visible to anyone, including the person reading the Find.

A Find is not content. It is intelligence. The person who wrote it is irrelevant. What they noticed is everything.

---

## Design Angle 1 — The Map Shows YOUR Ground, Not Everyone's Ground

### The Problem with Proximity-Only Sorting

The current spec says the map is sorted by recency and proximity. That is correct for a general audience. It is wrong for Brioela, because Brioela already knows who you are.

A user who scans Ethiopian ingredients and cooks berbere from scratch should open the Ground map and immediately see:
- The orange signal dot for "Fresh fenugreek just arrived" at the Ethiopian grocery 400 meters away
- The orange signal dot for "Whole dried red chilies, $3 per kilo, back shelf" at the spice shop across the street

They should NOT lead with:
- A green price signal for Greek yogurt at the supermarket
- A blue new-product signal for a French energy drink at the convenience store

Those signals exist on the map. They are just small. The fenugreek and chilies are large, bright, and surface first — because the AI knows this user cooks Ethiopian food.

### How It Works

At map load time, the API receives:
- The user's location bounding box (what is visible on screen)
- The user's ingredient profile from their scan history and memory — top 20 ingredients by scan frequency, constraint flags, and active cooking skills

The map rendering layer scores each visible `location_signal_summary` point with a relevance multiplier before rendering:

```
base_size = signal count at location (1–5 scale)
relevance_score = overlap between find content keywords and user ingredient profile
rendered_dot_size = base_size × (1 + relevance_score × 0.8)
```

A find mentioning "fenugreek" for a user whose memory contains `cooking_profile: Ethiopian cuisine` gets a 1.6x size multiplier. A find mentioning "yogurt" for the same user gets 1.0x — it appears at base size, not suppressed, but not amplified.

### What This Looks Like in Practice

**Scenario**: Aster lives in Addis Ababa. She opens the Ground map on a Saturday morning. She cooks Ethiopian food five nights a week — the AI knows this from her cooking sessions, her scan history, and her memory.

What she sees at neighborhood zoom:
- A large, brightly pulsing orange dot on the market building two streets over (fresh teff, fresh injera flour, dried lentils — three ingredient-relevant finds from this morning)
- A medium green dot on the supermarket building (price drop on eggs — moderately relevant, she buys eggs)
- Small grey dots on a convenience store and a fast food restaurant — visible but clearly not for her

What a different user — someone who scans Korean ingredients — sees standing at the exact same location:
- A large orange dot on the Korean grocery three blocks away (gochugaru, fresh tofu, kimchi ingredients)
- The same small grey dots everywhere else

Same map. Same real-time data. Completely different picture. This is what personalization means in Ground — not filtering the world, but sizing it correctly for you.

---

## Design Angle 2 — AI-Drafted Finds (Near-Zero Effort Contribution)

### The Problem with Voice-First Contribution

The voice-to-find flow is well-designed for users who want to contribute. But most people will not tap a microphone and speak out loud in a grocery store. The friction of intentional contribution is high. Most Ground data will never be created.

The insight: after a scan, the AI already knows:
- What product the user just scanned (name, brand, category)
- Exactly where the user is standing (geolocation, place matched from the places database)
- Whether the product is new at this location (no prior find for this product at this location)
- Whether the price differs from recent Finds at this location (from receipt history)
- What the health score was (green/yellow/red)

It does not need to ask. It can draft the Find itself.

### The Draft Flow

After every green or yellow scan result, if the location is known:

1. Scan result appears (green card: "Looks clean — no flagged additives")
2. Below the result, quietly: a pre-formatted draft appears in a collapsed card:

```
Draft Find — tap to review
"[Product name] — clean label, no additives flagged. At [Store name]."
```

3. The user taps the card to expand it. They see the full draft and can:
   - Tap **Submit** — one tap, done, Find enters the gate
   - Tap **Edit** — opens a short text field with the draft pre-filled
   - Tap **Dismiss** — no Find submitted, no friction

4. If the user taps Submit without editing: submitted in under 3 seconds from the scan completion.

The user never speaks. Never opens a dictation field. Never previews an AI-formatted version. The AI did the work. The user approves it.

### What Drafts Look Like by Scenario

**New product at this location:**
> "Haven't seen this brand of oat milk here before — [Product name], [store name], near the dairy section. Added today."

**Price change detected (from receipt data or prior finds):**
> "Olive oil price dropped here — [Product name] is now [price inferred from receipt]. Was higher last month."

**Product with notable ingredient detail:**
> "100% teff flour, single ingredient, no fillers. [Brand name] at [store name]."

**Health concern (yellow scan):**
> "This one has carrageenan and three synthetic preservatives — [product name] at [store name]. Health score: yellow."

### What the AI Never Drafts

- Opinions ("this is great")
- Promotional language ("incredible value")
- Comparisons to other products
- Claims that cannot be verified from scan data alone
- Anything that sounds like a recommendation rather than an observation

The AI draft passes through the same authenticity gate as any manually written Find. The gate does not treat AI-drafted finds differently — they must pass all checks before appearing on the map.

### Expected Impact

A user who has never intentionally contributed a Find will have submitted 3–8 finds in their first month just by approving AI drafts after scans. The contribution rate (currently targeted at 15–25% of active users) increases because the barrier to a first contribution drops from "open microphone in public" to "tap approve on a card that was already written."

---

## Design Angle 3 — Haptic Walking Discovery

### The Problem with Passive Map Checking

The spec currently has one ambient prompt: "Seen anything worth sharing while you're here?" — a text prompt that surfaces when the user is at a market. This is contribution-oriented. It asks the user to give.

The reverse direction — the map telling the user something useful without them opening the app — is not designed at all. A user who never opens the Ground map will never benefit from it. Ground requires the user to remember to look.

### The Mechanism

When a user is walking and has background location enabled (opt-in, explained as "let Brioela notice what's near you"), Ground runs a quiet relevance check every 60 seconds:

1. Fetch all `location_signal_summary` rows within a 150-meter radius
2. Score each against the user's ingredient profile (same algorithm as Angle 1)
3. If any location has a fresh find (< 4 hours old) with a relevance score above 0.6: trigger a single haptic pulse

The haptic pattern is distinct — not the same as a notification vibration. One slow pulse, like a heartbeat. No sound. No banner. No lock screen notification.

When the user pulls out the phone:
- If they open Brioela: the map opens centered on the relevant find, highlighted and pulsing
- If they open nothing: no follow-up, no second haptic. The moment passes.

### What This Feels Like

**Scenario**: Marcus is walking home from work in Accra. He regularly scans African food products. As he passes within 80 meters of a market he has never been to, his phone gives one quiet pulse.

He doesn't know why. He pulls out his phone, opens Brioela. The map is already centered on a building 80 meters to his left — a green market he's never noticed. There's a fresh orange dot on it, pulsing fast. He taps it:

> "Fresh garden eggs and dried okra just arrived this morning. The okra is the good kind — dried whole, not powdered. Stall at the back entrance."
> *— 47 minutes ago*

He walks in. Finds exactly what was described. Buys it.

That is the "can't live without it" moment from spec 00. Ground created it without Marcus ever opening the app intentionally.

### What Triggers a Haptic (and What Doesn't)

**Triggers:**
- Fresh find (< 4 hours) for an ingredient in the user's profile
- Location the user has never been to (from `place_visited` events in memory_event)
- User is walking (not driving — speed threshold: < 8 km/h)

**Does NOT trigger:**
- User is in an active cooking session
- User has already been to this location in the last 7 days
- Last haptic was less than 20 minutes ago (regardless of location)
- User has dismissed more than 3 haptics in the last week without opening — rate reduces to once per day for that user
- Signal type is one the user has historically never acted on (tracked in user_find_history)

### Privacy Note

Location is never stored during haptic check passes. The check runs on-device using the last known location fetched from the cached `location_signal_summary` data. No server call per-step. No location trace stored server-side. The check is local; only the "open map" action sends a server call to fetch the full Find detail.

---

## Design Angle 4 — Find-to-Cooking-Session (Ground as a Cooking Trigger)

### The Missed Connection

Spec 35 states: "Ground does not write to user memory by default. If a user acts on a find (taps 'I went here', or it triggers a scan), the downstream action may write to memory. The find itself does not."

This is correct as a data model rule. But it leaves a deeper connection unused.

The Brioela AI knows:
- What ingredients the user is missing for dishes they cook
- What recipes they've started cooking but never finished
- What seasonal ingredients they have not been able to find in their city recently

When a fresh Find surfaces an ingredient that matches a gap in the user's cooking context, the AI can close that gap automatically.

### The Trigger Flow

The AI checks this connection every time a high-relevance find enters the user's Ground feed:

1. A new Find enters the database: "Fresh injera flour just arrived — [store], [location]"
2. Ground routing checks which users near this location have `injera` or `teff` in their cooking memory
3. For each matched user: the Orchestrator AI checks whether injera or teff is in their "ingredients I want to find" context (derived from cooking sessions, recipe saves, or memory events where the user mentioned needing something)
4. If there is a match: the AI surfaces a connected suggestion

**What the user sees** (not a notification — surfaces in the ambient notification surface, spec 23):

> "Fresh injera flour spotted 300 meters away at [store name]. You mentioned wanting to make injera last week. Want to grab it today and cook tonight?"

Two actions below:
- **"Set reminder for today"** — schedules a gentle nudge at a time the user specifies
- **"Start a cooking session"** — opens the live cooking interface, pre-loaded with the injera recipe from the user's recipe collection

The Find did not just inform. It triggered an entire cooking journey.

### Scenario — Seasonal Gap Closed

Tigist has been making berbere every few months. The last time she tried to buy dried red Anaheim chilies, she could not find them. The AI stored that gap as a memory event: `ingredient_not_found: dried red chilies, captured_at: [date]`.

Three weeks later, a Find enters Ground: "Dried whole red chilies, big sack, very good quality — [Ethiopian spice shop name]. As of this morning."

The AI matches: `ingredient_not_found: dried red chilies` + fresh find for red chilies at a nearby location.

Tigist receives:
> "The dried red chilies you were looking for are in stock right now — [store name], 400 meters away. Make berbere this weekend?"

She had forgotten she was looking for them. The AI did not. This is the ambient operating system from spec 00 working at full capability.

### What This Feature Requires (not all of it exists yet)

- `ingredient_not_found` memory event kind (new — not currently in spec 01's event type list)
- Ground routing that can match incoming finds against user cooking context (currently Ground has no connection to the Orchestrator AI)
- The ambient notification surface (spec 23) must be able to render a two-action card tied to a specific Find

These are design dependencies, not blockers. They define what needs to be connected before this angle is live.

---

## Design Angle 5 — The Pulse Animation Is the Hero Visual

### Why This Matters

When a user opens the Ground map for the first time in a city with good find density, they must feel something. The word "wow" is a product requirement here, not a compliment. If the map looks like Google Maps with colored pins, it fails. If it looks like a living city breathing with real food knowledge, it succeeds.

The animation is doing more work than decoration. It communicates:
- **Freshness** (how recently a find was submitted) — via pulse speed
- **Relevance to you** (how much this find matters based on your profile) — via dot size
- **Signal type** (what kind of find it is) — via color
- **Activity level** (how many finds are at this location) — via cluster density

All four dimensions must be readable in one second without reading a legend.

### Pulse Speed = Freshness

| Age of most recent find at location | Pulse behavior | Visual feeling |
|---|---|---|
| < 2 hours | Fast pulse: 1 beat per 1.2 seconds | Urgent, alive right now |
| 2–12 hours | Medium pulse: 1 beat per 2.5 seconds | Fresh, today |
| 12–48 hours | Slow pulse: 1 beat per 5 seconds | Recent, still useful |
| 2–7 days | Very slow: 1 beat per 10 seconds | Getting old |
| 7–14 days | No pulse — static dim dot | Stale, still visible |
| > 14 days | Faded static dot, 25% opacity | Expiring soon |

The pulse is not a loading state. It is a freshness signal. A user who learns this once reads every dot instantly without thinking about it.

### Dot Size = Relevance to Your Profile

The base dot size (from signal count) is modified by the relevance score (from Angle 1):

| Relevance score | Size modifier | What it means |
|---|---|---|
| 0.8–1.0 (high) | 1.6× base | This is directly for you |
| 0.5–0.8 (moderate) | 1.2× base | Probably useful |
| 0.2–0.5 (low) | 1.0× base | Might be useful |
| 0.0–0.2 (none) | 0.75× base | Not for your profile |

A user who never scans dairy products sees the dairy-related find at the supermarket as a small faded dot. It is still there — it is true ground intelligence — but it does not demand their attention.

### Color = Signal Type (unchanged from spec 35)

| Color | Type |
|---|---|
| Red | Health / safety — contamination, recall spotted |
| Orange | Ingredient / product availability |
| Green | Price signal |
| Blue | New product |
| Grey | General observation |

### Building Highlight on Tap

When the user taps a building (zoom level: building or closer):

1. The building briefly illuminates with a soft glow in the color of the strongest active signal type at that location. Duration: 400ms, then fades to normal 3D rendering. This tells the user immediately: this is a health alert building (red glow) vs a price-signal building (green glow) before they read a word.
2. The building's find list slides up from the bottom of the screen. Finds are sorted by freshness, most recent first.
3. Each find card shows: signal type icon (color-coded), formatted content, time ago ("47 minutes ago", not a timestamp), and any attached media below.

### Cluster Behavior at City and Neighborhood Zoom

At city zoom:
- Clusters show as colored rings. The outer ring is the color of the most urgent signal type in the cluster (red > orange > blue > green > grey). The inner ring is grey. The count is shown in the center.
- A cluster with even one red find shows a red outer ring — safety is always visible regardless of cluster dominance.

At neighborhood zoom:
- Individual buildings become visible. Buildings with active finds show a small badge in the corner: the count of active (non-stale) finds.
- The badge color is the dominant signal type color for that building.
- No pulse at this zoom level — the pulse appears when zoomed to building level.

### What the First Open Looks Like

A user opens Ground for the first time in a city with 40 active finds.

They see a 3D cityscape. Some buildings have small colored badges. Some of those badges are large; some are small. One building has a red badge — they look at it immediately because red catches attention and they know what it means without reading anything.

They pinch-zoom toward their neighborhood. Buildings come into sharper focus. A few orange dots appear, pulsing at different speeds. The one pulsing fastest is the freshest. They tap it. The building glows orange briefly, then the find list slides up:

> "Fresh yam flour — big bags, arrived this morning. Price is fair — about what you'd expect. Back of the store, left side."
> *21 minutes ago*

They close the list and keep exploring. They have learned the entire interface in 30 seconds. No tutorial required.

---

## Dependencies and What Needs to Be Built

| Angle | What spec 35 already has | What this file adds | What does not yet exist |
|---|---|---|---|
| 1 — Personalized map | Proximity + recency sorting | Relevance scoring against user ingredient profile | API must accept user profile at map load time |
| 2 — AI-drafted finds | Voice-to-find flow | AI draft card below scan result | Draft generation logic in scan API response |
| 3 — Haptic walking | Ambient contribution prompt (text) | Background relevance check, single haptic, location history from memory | `ingredient_not_found` event kind in spec 01 |
| 4 — Find-to-cooking | No connection to cooking session | Full trigger flow from fresh find to recipe suggestion | Ground routing connected to Orchestrator AI; ambient notification two-action card (spec 23) |
| 5 — Pulse animation | "Pulsing signal dots" described | Full animation spec: pulse speed table, dot sizing, cluster behavior, building highlight | Native animation implementation on Mapbox GL layer |

None of these are blockers for shipping a basic Ground. Angles 1, 2, and 5 can ship with the first version of Ground. Angles 3 and 4 require additional infrastructure (background location opt-in, Orchestrator AI connection) and are second-release features.
