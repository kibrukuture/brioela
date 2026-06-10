# Negative Space Nutrition — Surfacing and Closure

## What This File Covers

How a gap reaches the user and what happens after.

## Source Specs

- `brioela-specs/50-negative-space-nutrition.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md`

## Delivery

- Conversational only, mid-interaction (relevant scan, plan generation, cooking conversation). Never a standalone push, never a dashboard.
- Evidence attached, window named, observation framing: "Looking at the last two months, almost nothing with omega-3 has come through your kitchen. Want me to keep an eye on that?"
- Shares the spec 17 weekly budget — one insight of any kind per week, enforced in the queue.

## One Question, One Answer

| Answer | Effect |
|---|---|
| yes | gap → `watching` (standing concern) |
| no / "I get that elsewhere" | gap → `closed`, reason recorded, never raised again |
| mentions a supplement | recorded as the closure reason; Brioela never recommends supplements |

Closure writes `memory_update(namespace: "diet.gaps", key: <category>, value: { status, reason, closed_at })`.

## Standing Concerns

Confirmed concerns flow through existing surfaces only:

- meal plan quietly favors carrier recipes
- scan verdicts gently note helpful products ("good source of what you've been missing")
- weekly summary tracks the close

No new screen, no report card, no progress bar.

## Suppression

Standard ladder applies: the gap-insight category dismissed twice → 14-day quiet; three times → permanent unless re-enabled.

## Rule

Closed is closed. A gap the user answered is never re-litigated, even if the data still shows it.
