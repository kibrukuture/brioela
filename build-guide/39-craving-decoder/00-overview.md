# Craving Decoder — Overview

## What This Folder Covers
"Why am I craving this?" answered from evidence only Brioela has: last night's sleep, today's eating gap, this week's stress signals, the user's own craving history, and glucose dynamics where present. At most two causes named, one practical offer matched to the cause, and an honest "no pattern I can see — sometimes chocolate is just chocolate" when the evidence isn't there. Ships as a system skill; runs on existing infrastructure with no new tables.

## Status
[x] guide complete — three files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-decoder-skill.md` | the `craving-decoder` system skill: seeding, triggers, language rules |
| `02-evidence-assembly.md` | the six-step evidence order, the confabulation rule, the matched offer |
| `03-safety-guard.md` | the disordered-eating guard, cycle-context rules, privacy boundaries |

## Specs This Folder Draws From
- `brioela-specs/52-craving-decoder.md` — the full feature spec
- `brioela-specs/17-behavioral-food-pattern-detection.md` — the shared loop: decoded events feed the weekly pass
- `brioela-specs/40-wearables-integration.md` — sleep/HRV/glucose evidence
- `brioela-specs/47-kin.md` — flattest-alternative notes
- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md` — the real-food bridge from inventory

## Key Decisions From Specs
- This feature speaks second, never first. Triggers: explicit voiced craving questions, craving-shaped scan questions, craving-context scans where the user engaged the screen. No unsolicited craving commentary ever (the one exception belongs to spec 17's budget, not here).
- The confabulation rule is the integrity core: at most two causes, ranked, evidence-thresholded; below threshold → "no pattern", a frequent designed answer. A decoder that always finds a cause is a horoscope.
- Every claim carries its source in plain words ("your ring says", "nothing's been logged since", "the last four times").
- One offer, singular, optional, matched to the cause (real-food bridge / tonight adjustment / flatter alternative). Then silence. Never moralizing, no willpower framing, no grading.
- The eating-gap estimate inherits the negative-space coverage honesty: observed gap, stated as observed.
- Disordered-eating guard: compensatory language, punishment framing, or extreme restriction → gentle decline, no further pattern-matching on that thread. The guard lives in the skill content and the session safety rules (sacred block, compression-immune).
- Cycle context only if the user volunteered it into memory; never inferred from purchases; deletable with full effect.
- No new tables: memory_event (`craving_decoded`), behavior_pattern (`craving_correlation`), user_memory (`personality.cravings`), one system skill row.
- Core tier+; degrades by data, not by gate (works from behavior alone; physiological teeth with wearables).

## What This Folder Depends On
- `05-brain` — skills system (system-skill seeding), memory event log, FTS history search
- `06-brain-memory` — memory namespaces in session context
- `18-ambient-intelligence` — the weekly pattern pass consuming decoded events
- `20-wearables` — physiological evidence
- `30-mira` — conversational delivery rules

## What Depends On This Folder
- `18-ambient-intelligence` — craving_correlation patterns harden from decoded events
- `38-tonight` — sleep-cause decodes can feed a tonight adjustment
