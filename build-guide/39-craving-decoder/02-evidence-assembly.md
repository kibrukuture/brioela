# Craving Decoder — Evidence Assembly and the Offer

## What This File Covers

The evidence order, the confabulation rule, and the matched offer.

## Source Specs

- `brioela-specs/52-craving-decoder.md`

## Assembly Order (skill-defined)

1. **physiological now** — last night's sleep + today's readiness from memory; flag short-sleep state
2. **eating gap** — hours since last observed eating event; honesty rule: observed gap, stated as such
3. **craving history** — prior decoded cravings + stress-eating and time-of-day patterns matching this category/hour
4. **context signals** — this week's wellbeing signals, travel state, user-volunteered cycle context
5. **glucose dynamics** — recent rapid drop (classic driver) if CGM; flattest-alternative note if Kin data serves
6. **synthesis** — at most TWO causes, ranked; below evidence threshold → "no pattern", never confabulate

## Mechanics

- Answer from injected context first (relevant namespaces are already in session context via `buildMemoryContext()`); at most one auxiliary structured call when history assembly needs FTS over `memory_event`.
- First sentence never waits on the auxiliary call — answer, then refine if more evidence lands.

## The Matched Offer (one, optional)

| Cause | Offer |
|---|---|
| eating gap | real-food bridge from current inventory ("you have eggs and the leftover rice — want the 10-minute version?") |
| short sleep | tonight adjustment ("early and light — want me to factor that in?") |
| no cause | honesty + where data exists, the flattest sweet option the user already buys |

## Learning

Each decode writes one `memory_event` (kind `craving_decoded`): category, named causes, evidence refs, what the user did next. The weekly pattern pass hardens recurring cause-pairs into `behavior_pattern` rows (`craving_correlation`). One loop, not two systems.

## Rule

The "no pattern" rate must stay materially above zero. Zero means confabulation — the honesty metric.
