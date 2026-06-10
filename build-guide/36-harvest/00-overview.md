# Harvest — Overview

## What This Folder Covers
The annual mirror artifact. On the user's account anniversary, a Brain DO alarm composes the year's data — Time Machine candidates, firsts, maintained avoidances, heritage history, cooking growth — into a 6–10 chapter generative-grammar story with pre-rendered static share cards per chapter. Free for every user. Anniversary timing spreads share moments across the calendar. Every chapter number must trace to a query (`source_queries_json`) or the chapter does not ship.

## Status
[x] guide complete — four files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-composition-workflow.md` | the six-step alarm-triggered workflow: gather → candidates → ranking → narrative → grammar → store |
| `02-chapter-rules.md` | chapter types, the sensitivity exclusion list, copy rules, the 6-chapter floor and 10-week eligibility floor |
| `03-grammar-rendering.md` | the stored BrioelaGenerativeUiDocument set, instant open, offline rendering, edition archive |
| `04-share-cards.md` | per-chapter static cards, EXIF/metadata rules, share-link attribution |

## Specs This Folder Draws From
- `brioela-specs/49-harvest.md` — the full feature spec
- `brioela-specs/38-food-time-machine.md` — salience heuristics and the candidate archive (the raw material)
- `brioela-specs/42-brioela-generative-grammar.md` — document rendering and the Artifact Layer
- `brioela-specs/25-viral-growth-and-sharing.md` — share-card law
- `brioela-specs/23-ambient-notification-strategy.md` — the one-notification delivery rule

## Key Decisions From Specs
- Anniversary timing, not calendar year-end: full year of data per edition, share moments dripped across the calendar.
- Eligibility floor: under 10 active weeks of data → no edition (the spec 38 milestone moment fires instead). Chapter floor: fewer than 6 strong chapters → no edition. Silence over filler.
- Hard sensitivity exclusion enforced at the candidate layer (illness, medical, medication, glucose, guest details, precise locations) — excluded categories cannot become candidates, so no later pass can leak them.
- Copy rules: numbers from queries only (`source_queries_json` mandatory), observations never advice, maintained change observed never scored.
- Composed and stored ahead of delivery → instant open, fully offline render. The spec 42 400ms rule never bites.
- One notification, once, never re-pushed. Unopened editions wait quietly in-app.
- Free for all users. At most one quiet line about what a fuller year could look like — never push, never mid-story.
- Editions are permanent, archived, individually deletable.

## What This Folder Depends On
- `05-brain` / `06-brain-memory` — the year's data and the alarm cycle
- `18-ambient-intelligence` — Time Machine candidate computation
- `27-generative-grammar` — document rendering + artifact (card) pipeline
- `12-notifications` — the single delivery notification
- `40-growth-mirror` — the `craft` chapter source (optional; edition works without it)

## What Depends On This Folder
- `24-viral-sharing` — the highest-volume share surface in the product
