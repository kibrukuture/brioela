# Tonight — Learning Loop

## What This File Covers

How responses teach the answer engine.

## Source Specs

- `brioela-specs/51-tonight-dinner-answer.md`

## Response Signals

| Response | Signal |
|---|---|
| cooked to completion (session ended normally) | strongest positive — dish + context (day type, time budget, audience) reinforce |
| swapped | chosen swap's attributes preferred over original; consistent swap directions become ranking signals, eventually pattern-grade |
| dismissed | weak negative for the dish |
| ignored | neutral-negative for timing (feeds delivery-time learning) |

All signals are `memory_event` rows — Tonight reads and writes the same spine as everything else; the weekly pattern pass consumes them like any signal.

## Suppression Ladder

Repeated dismissal of the card itself (not the dish) triggers the standard ladder: twice ignored → category quiets for 14 days; three times → permanently suppressed unless re-enabled. The user who hates this feature stops getting it without ever finding a setting.

## Data

```sql
tonight_answer (
  answer_id, date_local, recipe_id, swap_recipe_ids_json,
  reasoning_tags_json,   -- inventory_covered | expiring_item | low_readiness |
                         -- mesa_audience | plan_slot | time_budget
  delivered_at, delivery_channel check(delivery_channel in ('in_app','push')),
  response check(response in ('cooked','swapped','opened','dismissed','ignored')),
  responded_at
)
```

One row per day maximum. The table is both learning history and suppression evidence.

## Metrics To Instrument

acceptance rate (cooked or swapped-then-cooked) and its trajectory, cooked-to-completion rate, swap-rate direction over time (falling = learning), dismissal/suppression rates (annoyance ceiling), generation-bar coverage (share of eligible days with an answer), retention delta at 4+ accepted answers/month.
