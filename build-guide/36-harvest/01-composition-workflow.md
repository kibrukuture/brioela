# Harvest — Composition Workflow

## What This File Covers

The alarm-triggered edition composition.

## Source Specs

- `brioela-specs/49-harvest.md`

## Trigger

Brain DO alarm in the week before the user's account anniversary (standard ambient mechanism — no cron). Eligibility check first: 10+ active weeks of data in the period, else abort silently (spec 38's milestone moment covers the anniversary instead).

## The Six Steps

1. **Gather** — local SQLite queries per the spec 38 source table, plus the year's archived Time Machine candidates (surfaced or not).
2. **Chapter candidates** — typed: firsts, avoidances maintained, heritage, discovery, craft (from growth mirror where it exists), rhythm, family (audience level only).
3. **Salience ranking** — spec 38 heuristic; select 6–10. Fewer than 6 strong → no edition this year.
4. **Narrative pass** — one structured LLM call writes chapter copy. Warm, specific, factual. Every number traceable.
5. **Grammar composition** — the AI composes the edition's BrioelaGenerativeUiDocument set: mood, typography, motion, Skia per chapter. A reverential heritage chapter and a playful discovery chapter must feel different.
6. **Store** — edition + chapters persisted; static share cards pre-rendered via the artifact pipeline.

## Cost

Harvest is local counting queries; one narrative call; one grammar call; card renders. A few cents per user per year.

## Delivery

One notification ("Your Harvest is ready"), high priority, once. Standard quiet-hours rules. Never re-pushed; unopened editions wait in-app.

## Rule

If a number cannot be traced to a query (`source_queries_json`), the chapter does not ship. This is the most-screenshotted surface in the app — the anti-hallucination gate is absolute.
