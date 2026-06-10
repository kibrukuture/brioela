# In-Store Co-Pilot — Speech Rules and Swap Suggestions

## What This File Covers

When Mira speaks in the store, and the swap evidence bar.

## Source Specs

- `brioela-specs/45-in-store-copilot.md`
- `brioela-specs/00-product-philosophy-and-ux.md` (silence law)

## Mira Speaks Only When

1. asked
2. a scan violates a hard constraint or Mesa-member constraint — critical, always, immediate
3. a swap clears the evidence bar (below)
4. one store-relevant Ground find matches the ingredient profile — at most one per visit, at session start
5. running total crosses the user's own baseline — once, never repeated

Hard cap: 3 unprompted interventions per visit, excluding safety. Safety is unlimited.

## The Swap Evidence Bar

A swap is volunteered only if BOTH hold:

- personal evidence exists: the user's own glucose curve (spec 40/47), own price history (spec 29), or a confirmed condition rule (spec 28)
- the alternative is plausibly in this store (scan history, Ground sighting, or category presence)

Population-level "this is unhealthy" commentary is never volunteered. That is the verdict screen's job.

## Constraint Behavior

Warn, don't block. "That has sesame — not safe for your son." The user decides. (Bela's shopper scanner blocks; this one informs. Same constraint-check code from `bela/03`, different consequence — do not fork the implementation.)

## Rule

A missed swap is better than an annoying one. The dismissal/ignore rate gates how assertive the prompt is allowed to be.
