# Craving Decoder — Safety Guard and Privacy

## What This File Covers

The disordered-eating guard and the privacy boundaries.

## Source Specs

- `brioela-specs/52-craving-decoder.md`

## The Disordered-Eating Guard

Hard rule. If the user's questions or patterns suggest disordered eating — compensatory language, punishment framing, extreme restriction — the decoder:

- declines analysis gently, without labeling the user
- does not log, gamify, or pattern-match further on that thread
- never simulates treatment. Brioela is not a treatment tool.

Implementation: the guard lives in the skill content AND in the session safety rules — part of the sacred block, immune to context compression. It cannot be summarized away mid-session.

## Cycle Context Rules

- used only if the user volunteered it into memory themselves
- phrased as their own observed pattern, never as a hormonal claim
- never inferred from purchase patterns
- deleting it removes it from all future decodes, fully

## Privacy Boundaries

- decodes, craving events, and patterns are private Brain DO data; listed in "what Brioela knows about me"; individually deletable
- craving data never feeds Ground, Mesa member views, Passport, practitioner surfaces, or the Harvest (sensitive-class exclusion)

## Metrics To Instrument

engagement rate (follow-ups/bridges), cause confirmation rate (accuracy proxy), "no pattern" rate (honesty floor), bridge acceptance + downstream receipt evidence, pattern hardening rate, guard trigger rate (monitored for prevalence, never engagement).
