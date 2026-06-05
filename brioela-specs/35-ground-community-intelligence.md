# 35. Ground — Community Intelligence Layer

## Name and Philosophy

**Ground**: the system. The layer of real, hyperlocal food knowledge accumulated by people who actually shop, cook, and eat in a place.

**Find**: a single contribution. One person, one moment, one specific thing they noticed. Not a post. Not content. A find.

The design principle that cannot be broken: **the product is the center, not the person.**

There are no profiles. There is no feed. There is no following. There is no engagement score. Ground is not a social network that happens to be about food. It is a living intelligence layer about the physical food environment near you, built from the observations of real people.

Every design decision flows from this: does this feature make the intelligence better, or does it make people perform for each other? If the latter, it does not ship.

## Why This Exists

Apps that display community food data today are either review platforms (Yelp), nutrition databases (Open Food Facts), or price aggregators. None of them capture the living, real-time state of what is actually on shelves, at markets, and available right now — the freshness of produce at a specific stall, the price of eggs at the store three blocks away, the new product that just appeared at the Korean grocery on the corner.

Brioela users are already scanning products, photographing menus, and logging receipts. Ground is the decision to surface what those users collectively know — anonymized, structured, and routed to the people near enough to act on it.

## What a Find Is

A Find is a single, time-stamped, location-tagged observation about food in the physical world. It must be:

- **Specific**: about a named product, ingredient, dish, or place — not a general opinion
- **Located**: tied to a physical location (store, market, restaurant, stall)
- **Fresh**: older than 14 days is shown as stale; older than 60 days is archived from the active map
- **Authentic**: passed through an AI gate before it appears anywhere

A Find is not a review. It does not have a star rating. It does not say "this place is great." It says: "Dried hibiscus flowers, $2.40 for a large bag, back corner of the spice wall — as of this morning."

## Three Entry Points

### 1. From a Scan

After scanning a product, if the location is known, a prompt appears: "Found something worth sharing about this?" One tap opens a voice dictation field. The product name and current location are already pre-filled. The user adds what they noticed. Done.

### 2. From the 3D Map

User is looking at the Ground map. They tap a building or location. A "+" button appears at the bottom. Opens a find submission for that location.

### 3. Ambient Suggestion

When the user is at a market or store (location signal + recent scan), Brioela can surface a soft prompt: "Seen anything worth sharing while you're here?" Dismissible, never more than once per location visit.

## Voice-to-Find Flow

Voice is the primary input. Typing is the fallback.

1. User taps the dictation button.
2. Client-side speech recognition transcribes locally (Web Speech API or equivalent native SDK).
3. Raw transcript is sent to the AI formatting layer along with the pre-filled location and product context.
4. AI produces a structured, clean find: normalizes phrasing, removes filler words, removes any personally identifying language, removes any promotional phrasing.
5. The original voice audio is **discarded immediately** — it is never stored, never transmitted after the transcription step.
6. User sees a preview of the formatted find and confirms or edits.
7. Confirmed find enters the authenticity gate.

The voice audio leaving the device is the only thing that could carry biometric identity. Discarding it is non-negotiable.

## AI Authenticity Gate

Every find passes through the gate before appearing on any map or in any feed. The gate is a single structured LLM call that returns a decision and a rejection reason if it fails.

**Gate checks (all must pass):**

| Check | Pass condition | Fail reason returned |
|---|---|---|
| Specificity | Names a specific product, ingredient, or place — not a general claim | "Too vague — what product or place specifically?" |
| No promotion | Does not sound like marketing copy, brand language, or a referral | "Sounds promotional — finds are observations, not endorsements" |
| No negativity targeting | Does not appear designed to harm a specific business | "Appears targeted — finds describe what you observed, not judgments" |
| Freshness plausibility | Claimed observation is consistent with the current date and location | "Date or location appears inconsistent" |
| No personal information | Does not contain names, phone numbers, faces described, personal details | "Contains personal information — removed before submitting" |
| Face detection (images/video) | No human faces in submitted media | "Face detected — Ground does not publish images with faces" |
| Minimum information density | Contains at least one concrete, useful data point (price, availability, ingredient detail, etc.) | "Not specific enough to be useful — what exactly did you notice?" |

If any check fails, the find is returned to the user with the rejection reason. The user can edit and resubmit. The gate does not silently drop finds.

**Video rule**: video is accepted but all audio is stripped and replaced with silence before display. No faces allowed. Video finds are muted, short (max 30 seconds), and serve as visual evidence only (showing the shelf, the product, the stall).

## Content Types

**Allowed:**
- Text (voice-to-text or typed), max 280 characters after AI formatting
- Product images (no faces)
- Muted video clips, max 30 seconds (no faces, audio stripped)

**Blocked at gate:**
- Audio-only content (voice discarded at source)
- Images containing faces
- Content without a specific, verifiable claim
- Content that names individuals
- Content with pricing that appears implausible (outlier check vs. known price history for that item in that area)

## The 3D Map

Ground's primary display surface is a 3D map built on Mapbox GL JS (web) and Mapbox Maps SDK (native). The map renders buildings in 3D using Mapbox's building extrusion layer.

**Visual language:**

Finds appear as pulsing signal dots anchored to physical locations. Signals sit on top of or beside the building they belong to. The pulse animation fades over time — a find from this morning pulses bright; a find from last week is dim; older than 14 days stops pulsing and shows as a static faded dot.

**Color by signal type:**

| Color | Type | Example |
|---|---|---|
| Red | Health / safety | Contamination warning, recall spotted on shelf |
| Orange | Ingredient / product availability | "Fresh fenugreek just arrived" |
| Green | Price signal | "Eggs dropped to $3.20 today" |
| Blue | New product | "Never seen this brand here before" |
| Grey | General observation | Anything that doesn't fit above |

**Zoom behavior:**

- City level: clusters shown as colored count bubbles
- Neighborhood level: individual buildings show signal count badges
- Building level: building is highlighted, all finds for that location listed below the map
- Product level: reached from a find tap — shows the find in full with timestamp, formatted text, and any media

**No street view. No user location sharing beyond the find submission moment.**

## What is Explicitly Not Built

This list is a spec constraint, not a future roadmap. These features are blocked:

- **No likes, hearts, or upvotes** — no engagement signals of any kind
- **No public user profiles** — contributors are anonymous, always
- **No follower or reputation systems**
- **No comment threads** — finds are not discussion starters
- **No leaderboards or contribution counts visible to other users**
- **No "trending" feeds** — the map is sorted by recency and proximity, not virality
- **No notifications about how your find performed** — you do not get told how many people saw it
- **No gamification** — no badges, streaks, or rewards for contributing
- **No sharing to other platforms** — finds exist in Brioela, not as shareable links to social networks

Internal analytics track contribution patterns for product quality (e.g., detecting bad actors, measuring gate accuracy). These are never exposed to users.

## Privacy Model

- Contributor identity is never stored with the find in any user-facing table. The `find` table stores a hashed user identifier for abuse prevention only, not visible in any UI.
- Location is stored at the business/place level (from a places database), not as raw GPS coordinates.
- If a user deletes their account, all their finds are anonymized in place (hashed ID nulled), not deleted, because the intelligence is collective.
- Voice audio is never stored (see Voice-to-Find Flow above).
- Find media (images, video) is stored in Cloudflare R2 with no EXIF data retained.

## Data Model

```sql
-- A single contributed observation
find (
  find_id       uuid primary key,
  location_id   uuid references places(place_id),   -- business/stall/market from places db
  signal_type   text check(signal_type in ('health','ingredient','price','new_product','general')),
  content       text not null,                       -- AI-formatted text, max 280 chars
  media_urls    text[],                              -- R2 URLs, nullable
  captured_at   timestamptz not null,
  expires_at    timestamptz,                         -- captured_at + 60 days default
  status        text default 'active' check(status in ('active','stale','archived','removed')),
  contributor_hash text,                             -- hashed user_id for abuse only, not displayed
  gate_passed   boolean not null default false,
  gate_log      jsonb                                -- gate check results, internal only
)

-- Aggregated signal count per location for map rendering
location_signal_summary (
  location_id   uuid references places(place_id),
  signal_type   text,
  active_count  int default 0,
  last_find_at  timestamptz,
  updated_at    timestamptz
)

-- User's own find history (local reference, not shared)
-- Stored in Orchestrator DO SQLite, not Supabase
user_find_history (
  find_id       text,
  submitted_at  integer,
  location_id   text,
  signal_type   text,
  content_preview text
)
```

`find` and `location_signal_summary` live in **Supabase Postgres** — they are shared, community data.

`user_find_history` lives in the **Orchestrator DO SQLite** — it is private, per-user, and never synced to the community tables.

## Technical Constraints

- **Gate latency target**: under 1.5 seconds from submission to gate decision. Single structured LLM call, not a multi-step chain.
- **Map tile strategy**: `location_signal_summary` is the only table queried for map rendering — it is a pre-aggregated count view, updated via Supabase triggers when `find` rows change. Map never queries individual finds for rendering.
- **Media pipeline**: image/video uploaded directly to Cloudflare R2 from client. Server receives only the R2 URL + metadata. EXIF stripped client-side before upload. Face detection runs server-side on the R2 object before gate decision.
- **Stale transition**: a DO alarm or Supabase scheduled function runs daily, setting `status='stale'` for finds where `captured_at < now() - 14 days` and `status='active'`. Archived at 60 days.
- **Early city density problem**: in cities with few users, the map will be sparse. This is intentional and honest. No synthetic or AI-generated finds are ever added to fill gaps. Sparse is better than fake.
- **Abuse surface**: gate + hashed contributor ID are the only abuse mechanisms. Rate limiting: max 10 finds per user per day. Repeated gate failures from the same hash trigger a soft block (24hr cooldown on submissions).

## Relationship to Other Specs

- **Spec 35b (Ground Finds — Deep Design)**: The UX and design depth for Ground lives in `35b-ground-finds-deep-design.md`. That file covers: what Ground and Find mean precisely, personalized map rendering, AI-drafted finds from scan context, haptic walking discovery, find-to-cooking-session triggers, and the full pulse animation spec. Read both files before implementing any Ground feature.
- **Spec 04 (Healthy Food Map)**: Ground signals overlay the same map used for the healthy food map. They are different data layers on the same base map. The food map shows curated health data; Ground shows real-time community observations. Both visible simultaneously with layer toggles.
- **Spec 03 (Hyperlocal Community Notes)**: Ground supersedes spec 03. Spec 03 described a generic community note system. Ground is the fully designed, privacy-first, authenticity-gated replacement. Spec 03 should be treated as deprecated in favor of this spec.
- **Spec 26 (Recall Alerts)**: health signal type finds (red) are visually consistent with recall alert styling. A recall match surfaces in the same red color family on the map. They are different data sources but the same visual vocabulary.
- **Spec 08 (Memory Engine)**: Ground does not write to user memory by default. If a user acts on a find (taps "I went here", or it triggers a scan), the downstream action may write to memory. The find itself does not.

## Success Metrics

- **Gate pass rate**: percentage of submitted finds that clear the authenticity gate. Target: 75–85% (too high means gate is weak; too low means UX is frustrating).
- **Find density per active city**: finds per square kilometer in the top 5 cities by user count. Tracks whether the layer is useful in practice.
- **Stale decay rate**: how quickly individual finds age out. A healthy Ground has high churn — observations are recent.
- **Find-to-action rate**: how often a user sees a find and then scans the referenced product or visits the referenced location. This is the primary value metric — did the intelligence change behavior?
- **Contribution rate**: percentage of active users who have submitted at least one find in the last 30 days. Target: 15–25% (most users consume; a healthy minority contributes — this is normal for community intelligence layers).
- **Gate rejection-to-resubmission rate**: how often users edit and resubmit after a rejection. High rate means the gate is providing useful guidance. Zero rate means rejections are frustrating and opaque.
