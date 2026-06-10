# Negative Space Nutrition — The Coverage Gate

## What This File Covers

The honesty mechanism: when absence detection is allowed to run at all.

## Source Specs

- `brioela-specs/50-negative-space-nutrition.md`

## The Problem

Brioela sees what is scanned, bought on captured receipts, cooked, and photographed — not everything eaten. Restaurant meals without menu scans, the partner's shopping, snacks at work: invisible. A naive absence detector is confidently wrong constantly.

## The Coverage Score

Computed per user per window from:

- receipt regularity: does grocery cadence match the user's purchase rhythms (predictive pantry intervals)?
- meal-log density (visual intake meal logs)
- scan frequency
- share of plausible eating events with any observation

Items without nutrient data in the corpus count as "unclassifiable" and lower the score — they never silently distort the presence map.

## The Floor

- Below the floor: the detection pass aborts silently. No partial results, no hedged insights.
- Minimum window: 6 weeks of qualifying coverage before any gap candidate can exist.
- Floor calibration is a tracked metric: if almost no users clear it, too strict; if everyone does, too loose.

## Observation Framing (mandatory output rule)

Every surfaced gap claims exactly what was observed: "almost nothing with omega-3 *has come through your kitchen* in the last two months." The user's correction ("I eat fish at lunch every day") is a coverage answer — recorded, gap closed as `user_covers_elsewhere`, never re-asked.

## Rule

The feature's credibility is the coverage gate. When in doubt, silent.
