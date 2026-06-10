# 49. Harvest

## Goal

Once a year, compose the user's accumulated food history into a single, beautiful, personal annual artifact — their Harvest — rendered through the generative grammar and shareable in one tap. The yearly mirror moment: this is what you fed yourself, your family, and your memory this year.

## Naming

**Harvest** is the product name for the annual artifact. Early drafts called it "Year in Food" — that phrase survives only as a lowercase description ("your year in food"), never as the name.

- **What it names**: the once-a-year composed artifact and its moment. The edition is "your Harvest"; the notification is "Your Harvest is ready"; past years are "your Harvests."
- **Why this word**: a harvest is the gathering-in of what the year grew — food-native, warm, and exactly what this feature does with a year of food life. Reclaimed-word family (Ground, Find, Passport, Tonight). *Vintage* (a year identified by what it produced) was the runner-up — rejected for reading wine-first.
- **Where it is used**:
  - UI surfaces: the annual notification, the full-screen paged artifact, the archive shelf of past editions, per-chapter share cards ("my Harvest — Brioela").
  - Code namespace: `harvest` — tables `harvest_edition`, `harvest_chapter`; future tool code under `tools/harvest/`.
  - Docs: this spec, `build-guide/36-harvest/`, and all records use Harvest. To avoid collision, the composition pipeline's first step is called "gather" (never "harvest" as a step name) — the word Harvest is reserved for the artifact.

## Why This Exists

The Food Time Machine (spec 38) already computes the raw material — first-evers, milestones, behavioral shifts, heritage recipe history — and surfaces it one quiet moment at a time. What does not exist is the annual composition: the once-a-year artifact that gathers a whole year of those moments into one story.

The annual-recap mechanic is the most reliably viral pattern in consumer software, and Brioela's version is more personal than a listening history — it is what someone ate, cooked, avoided, and preserved. It rides entirely on existing data (spec 38: "no new data collection — this is entirely a read + presentation layer"), it is the flagship application of the generative grammar (spec 42), and it lands squarely in spec 25's "content that writes itself" doctrine.

It is also a retention event: the Harvest makes a year of quiet ambient value suddenly visible all at once — the accumulated-memory moat (spec 08) shown to the user as a story about themselves.

## User Outcome

- In the user's anniversary week (account-creation anniversary, not calendar year-end — see Timing), one notification: "Your Harvest is ready." High priority, once, never repeated (spec 23).
- They open a full-screen, paged story artifact. Example chapters for a rich year:
  - "847 products scanned. 11 of them you never touched again."
  - "You discovered tahini in March. You've cooked with it 14 times since."
  - "Grandma's doro wat: captured in December, cooked 9 times, shared with your sister."
  - "You've avoided palm oil for 8 months straight."
  - "Your most-cooked dish, your fastest-growing skill, your best food month."
- Each page has a one-tap share: a clean static card for that page, or the cover card for the whole year. Nothing shares automatically.
- The artifact is saved permanently — past years remain viewable, becoming shelves of personal history.

## In Scope

- Annual composition pass over existing Brain DO data: scan events, recipe and cooking history, receipts, constraint timeline, heritage captures, Time Machine candidate archive (spec 38), growth observations (spec 53) where they exist.
- Chapter selection and ranking by the same salience heuristic family as spec 38 (first-evers highest, maintained changes high, round numbers medium).
- Generative-grammar rendering (spec 42): the artifact's mood, pacing, layout, and motion are AI-composed per user — no two Years in Food look alike.
- Static share-card generation per chapter (spec 25 Discovery Card mechanics).
- Permanent local archive of generated editions.

## Out of Scope

- Weekly/monthly mini-recaps. The weekly summary (spec 16) already exists; diluting the annual moment with intermediate recaps kills it.
- Any comparative or competitive framing ("you scanned more than 90% of users") — no leaderboards, no social comparison, consistent with the spec 35 anti-performance law.
- Goals, scores, or streak mechanics. Spec 38's milestone-not-gamification rule governs every chapter: observe what is real, never incentivize.
- Sensitive history as content: illness events (spec 30), medical conditions (spec 28), medication data (spec 34), glucose data (spec 40), and guest constraint details (spec 37) never appear in any chapter or share card. Spec 38's sensitivity exclusion applies, hardened here because of the share surface.

## Timing: Anniversary, Not December

The Harvest generates on the user's account anniversary, not at calendar year-end:

- Every user gets a full year of data behind their edition, regardless of signup date. A September signup getting a December "year" recap of three months is a weak artifact.
- Share moments spread across the whole calendar instead of one saturated week — a steady acquisition drip rather than one spike competing with every other app's recap.
- Users with less than 10 active weeks of data in the year get no edition — a thin Harvest is worse than none. They get the standard milestone moment from spec 38 instead ("you've been using Brioela for a year").

## Composition

The composition runs as a Brain DO alarm job in the week before the anniversary (the standard ambient mechanism, spec 09 — no cron):

```text
step 1: gather — query the year's data per the spec 38 source table,
        plus the year's archived Time Machine candidates (surfaced or not)
step 2: chapter candidates — build typed candidates:
        firsts, streaks-of-absence (avoidances maintained), heritage,
        discovery (new cuisines/ingredients), craft (cooking growth, spec 53),
        rhythm (most-cooked, best month), family (Mesa/Heirloom moments
        at audience level only — never member health detail)
step 3: salience ranking — spec 38 heuristic; select 6–10 chapters;
        an edition needs 6 strong chapters or it does not generate
step 4: narrative pass — one structured LLM call writes the chapter copy:
        warm, specific, factual; every number traceable to a query;
        no invented color, no causal health claims
step 5: grammar composition — the AI composes the BrioelaGenerativeUiDocument
        set for the edition (spec 42): mood, typography, motion, Skia
        treatment per chapter — a reverential heritage chapter and a playful
        discovery chapter must feel different
step 6: store the edition + pre-render static share cards per chapter
```

Chapter copy rules: numbers come from queries, not the model's imagination; observations only ("you did X"), never advice or judgment ("you should"); the dietary-change framing follows spec 38 exactly — maintained change is observed, never scored.

## Rendering and the 400ms Rule

The edition is composed and stored ahead of time, so the spec 42 enhancement-budget rule does not bite at open: the artifact opens instantly from the stored document set. The generative grammar's safety boundaries hold — the Harvest contains no safety surfaces, no payment surfaces, and is therefore fully generative by design, the single most expressive surface in the app (spec 39's whimsy budget spent in the right place).

## Share Cards

Each chapter pre-renders one static card (image artifact, spec 42 Artifact Layer):

- Card content is exactly the chapter's headline fact and "my Harvest — Brioela." No location, no health-adjacent content (excluded categories never become chapters at all).
- The card looks like a personal moment, not an ad (spec 25's share-card law).
- Sharing is per-card, explicit, one tap to the system share sheet. Brioela never posts anywhere itself.

## Data Model

In the Brain DO SQLite (private):

- `harvest_edition`: edition_id, user_id, year_index (1st, 2nd... anniversary year), period_start, period_end, chapter_count, document_set_json (the stored grammar documents), generated_at, opened_at (nullable).
- `harvest_chapter`: chapter_id, edition_id, chapter_type, headline, body, source_queries_json (traceability — which queries produced the numbers), share_card_ref (R2 object, user-scoped), shared (boolean), rank.

Editions are permanent user data — they appear in the user's content inventory and are deletable like everything else.

## Technical Constraints

- Composition is one alarm-triggered workflow: harvest queries run against the Brain DO's own SQLite (cheap, local), one narrative LLM call, one grammar-composition call, card pre-renders via the standard artifact pipeline. Total cost per user per year is a few cents.
- The notification follows spec 23 high-priority rules: contextually delivered, once, never re-pushed. If unopened, a quiet in-app surface waits — the edition does not nag.
- Editions render fully offline once generated (stored documents + local data) — anniversary day in a dead zone still works.
- Every chapter must carry `source_queries_json`. If a number cannot be traced to a query, the chapter does not ship. This is the anti-hallucination gate for the most-screenshotted surface in the app.

## Tier Placement

The Harvest is **free for every user** (spec 19 logic: it is a viral artifact and a retention event — gating it would amputate both). Chapters that reference paid-tier features the user has (heritage captures, cooking growth) appear naturally; for free users the edition is built from scan/receipt/avoidance history and is still real. The edition may include at most one quiet line noting what a fuller year could look like — never a push notification, never a mid-story interruption (spec 23: subscription prompts are in-app, low priority, ever).

## Privacy

- Composed entirely from private Brain DO data; the edition never leaves the device except as user-initiated share cards.
- Hard exclusion list (illness, medical, medication, glucose, guest details, precise locations) is enforced at the chapter-candidate layer — excluded categories cannot become candidates, so no downstream pass can leak them.
- Share cards are static images with no embedded metadata (EXIF stripped, same rule as Ground media, spec 35).
- Past editions are part of "what Brioela knows about me" and deletable individually.

## Success Metrics

- Edition open rate within 7 days of notification.
- Completion rate (user reaches the last chapter).
- Share rate: editions with at least one card shared; cards shared per sharing user.
- Acquisition attribution: installs from Harvest share cards (distinct share-link tagging).
- Retention delta in the 60 days following an opened edition vs. matched unopened users.
- Chapter resonance: which chapter types get shared most (feeds next year's salience weights).
