# 38. Food Time Machine

## Goal

Surface the user's personal food history as meaningful, emotionally resonant moments — making the accumulated data feel like a story about them, not just a log. The longer someone uses Brioela, the more this becomes a genuinely personal artifact.

## Why This Exists

Brioela accumulates an enormous amount of food data over time: every scan, every recipe, every cooking session, every receipt, every product first encountered. None of this is surfaced back to the user as personal history. It sits in the memory engine as structured data but never becomes meaningful.

The Food Time Machine reads that same data and surfaces it as moments. Not metrics. Not summaries. Moments.

"You first tried tahini 11 months ago. Since then you've made 6 recipes with it."
"On this day last year you were making lentil soup."
"This is the 40th product you've scanned in this store."
"You've been avoiding palm oil for 8 months."

This is the kind of thing that makes a user feel seen by the app. It creates emotional stickiness that no utility feature can. It also validates the user's memory — "I didn't realize I'd been doing that" is a powerful moment.

## How It Works

The Food Time Machine is not a screen the user navigates to. It is a read path that surfaces at existing moments in the app.

### Ambient Surfacing Points

**At scan**: when a user scans a product, a quiet secondary line below the verdict can say:
- "First time with this product." (when it's genuinely new to their scan history)
- "You've scanned this 12 times." (when it's a long-term staple)
- "You stopped scanning this 6 months ago." (when a previously regular item goes absent — curiosity trigger)

**On recipe open**: when a user opens a recipe they've made before:
- "You've made this 4 times. Last time was 3 months ago."
- "You first saved this from [source] 14 months ago."

**On app open (rare, only when something notable is true)**:
- "On this day last year you were making [dish]." — only surfaces if the date match is real and the recipe/meal was one the user actually made, not just saved.
- "You've been using Brioela for 1 year. You've scanned 847 products." — milestone moments only, not weekly stats.

**In the weekly summary (spec 16)**:
- One "from your history" line per week — something pulled from a year ago or a meaningful pattern milestone.

### What It Does Not Do

- Does not create a dedicated "timeline" or "history" screen — that becomes a chore to maintain.
- Does not send notifications specifically to surface history — these appear inline at existing app moments only.
- Does not surface sensitive history (illness events from spec 30, medical condition entries) as nostalgic moments.
- Does not require the user to do anything to maintain it. The data is already being collected.

## Generational Recipe Connection

This feature has a natural connection to spec 13 (Generational Recipe Capture). If the user captured a grandparent's recipe and has made it multiple times, the Food Time Machine can surface:

"You've made [grandmother]'s [dish] 3 times. You first captured the recipe 7 months ago."

This is the only place in the app where the emotional weight of that feature is surfaced back. It requires no additional data collection — the recipe source and cook history are already there.

## Pattern Milestones

Some moments are worth surfacing because they mark a genuine behavioral shift:

- "You haven't bought [product category] in 60 days." (dietary change maintained)
- "You've tried 8 new cuisines this year." (based on recipe and scan diversity)
- "You've made home-cooked meals 5 days in a row." (based on recipe logs and cooking sessions)

These are surfaced once, quietly, when the milestone threshold is crossed. Never as streaks or gamification. Just as observation.

The difference between a milestone and gamification: a milestone observes something real ("you've maintained this change for 60 days"), while gamification incentivizes behavior to earn a reward. The Food Time Machine never creates incentive structures.

## Data Sources

All data already exists in the Brain DO and Supabase:

| Moment type | Source |
|---|---|
| First scan of a product | `scan_events` — earliest entry for that UPC per user |
| Scan count for a product | `scan_events` — count query |
| Last time a recipe was made | `recipe_history` — last entry |
| Total products scanned | `scan_events` — count per user_id |
| Dietary behavior changes | `user_memory` — namespace `diet.*`, compare write_dates |
| Cooking session history | `session_archive` in Brain DO |
| Generational recipe use | `recipe_history` joined with `recipe.source='generational'` |

No new data collection. This is entirely a read + presentation layer over existing data.

## Computation

Time Machine moments are computed during the Brain DO's weekly alarm cycle and stored as a small candidate queue — typically 5–10 candidate moments ranked by emotional salience. The inline surfaces draw from this queue as opportunities arise (scan, recipe open, weekly summary).

Moments expire from the queue after 14 days if not surfaced. The weekly cycle regenerates new candidates.

The AI scores moment salience with a simple heuristic:
- First-ever events: highest salience
- Long gaps (resuming something after 90+ days): high salience
- Round numbers (10th recipe with an ingredient, 1-year mark): medium salience
- Frequency counts on staples: low salience, surfaced rarely

## Privacy Note

Time Machine moments are read from private user data and displayed only to the user. They are never shared to Ground, never included in any community surface, and are not included in any export by default (they are derived, not raw data).

## Success Metrics

- Inline moment impression rate: how often Time Machine moments are shown per active user per week.
- Moment engagement rate: how often the user taps to expand or acts on a surfaced moment.
- Retention proxy: whether users who see Time Machine moments have higher 90-day retention than those who don't (the main hypothesis: personal history creates stickiness).
- Sentiment: qualitative feedback — does this feel like surveillance or like the app knowing you?
