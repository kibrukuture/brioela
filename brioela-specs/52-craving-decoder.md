# 52. Craving Decoder

## Goal

When the user asks the most common food question humans ask themselves — "why am I craving this?" — Brioela answers with evidence only it has: last night's sleep, today's eating gaps, this week's stress signals, and the user's own historical craving patterns. Then it offers the one thing that actually addresses the cause, not just the craving.

## Why This Exists

Spec 17 collects wellbeing signals passively. Spec 40 collects sleep, HRV, and glucose. Spec 08 holds months of time-stamped eating behavior. No spec connects them into the conversational moment where they are most valuable: a craving, voiced in the moment, is a real-time invitation to cross-reference everything the Brain knows — and the answer regularly produces the signature reaction the product is built for: "how did it know that?"

The science is friendly to this feature: sleep deprivation reliably increases appetite for energy-dense food, long eating gaps drive sugar-seeking, and individual craving patterns are strongly habitual (time-of-day, cycle-phase, stress-coupled). Brioela does not need lab-grade causal claims — it needs the user's own correlations, surfaced honestly as observations (the spec 17/30 language discipline).

This is also the gentlest possible intervention surface for the stress-eating patterns spec 17 already detects: not a lecture, not a tracker — an answer to a question the user themselves asked.

## User Outcome

- User, in any voice interaction or to the scan screen: "Why do I want chocolate so badly right now?" / "I can't stop thinking about chips." / *scans a candy bar at 11pm for the third time this week*.
- Brioela answers from evidence, in two or three sentences, always sourced:
  - "You slept about five hours (your ring says so), and nothing's been logged since 9am — short sleep plus a long gap is exactly when you reach for sugar. It's happened the last four times."
  - "This is the third late-night sweet scan this week — that pattern usually shows up in your stressful weeks."
- Then one practical offer, matched to the cause, never moralizing:
  - Cause is the gap → "Eat something real first — you have eggs and the leftover rice; want the 10-minute version?"
  - Cause is sleep → "Tonight's dinner could be early and light — want me to factor that in?" (feeds spec 51)
  - No cause found → honesty: "No pattern I can see — sometimes chocolate is just chocolate." Plus, where the data exists: "your flattest option of the sweet things you buy is the dark one" (specs 40/47).
- The user can act, ask more, or ignore. Nothing is logged against them; no streaks break, because none exist.

## In Scope

- Conversational craving analysis as a Brain skill — triggered by explicit voiced cravings, craving-shaped scan questions, and craving-context scans (the spec 17 stress-eating signature: late-night repeat scans of comfort categories) where the user has engaged the scan screen.
- Evidence assembly across: sleep/HRV/readiness (`health.biometrics`, spec 40), eating-gap estimation (scan/receipt/meal-log recency, spec 08), wellbeing and stress signals (spec 17), the user's own craving history, cycle-pattern correlations only where the user has volunteered that context into memory, and glucose dynamics (specs 40/47) where present.
- The matched offer: a real-food bridge from current inventory (spec 14 logic), a tonight adjustment (spec 51), or a flatter-alternative note (specs 40/47).
- Silent accumulation of a craving-pattern memory that improves both this feature and spec 17's pattern detection.

## Out of Scope

- Unsolicited craving commentary. Brioela never says "craving something?" out of nowhere. The trigger is the user's question or the user's active engagement — this feature speaks second, not first. (The one exception inherits from spec 17, not from here: a confirmed stress-eating pattern may be mentioned conversationally under spec 17's one-per-week budget.)
- Eating-disorder territory. Hard rule: if the user's questions or patterns suggest disordered eating (compensatory language, punishment framing, extreme restriction), the decoder declines analysis gently and does not gamify, log, or pattern-match further on that thread. Brioela is not a treatment tool and never simulates one.
- Diagnosis or hormone/medical claims. Cycle correlations are used only if the user put that context into memory themselves, and are phrased as their own observed pattern.
- Craving suppression coaching, willpower scoring, or any judgment framing. The decoder explains and offers; it never grades.

## The Decoder Skill

The capability ships as a system skill (spec 09 skills model): `craving-decoder` — seeded at DO initialization, `source = 'system'`, maintained in code. The skill content defines the evidence assembly order, the language rules, and the offer selection. The agent loads it via `skill_view` when the index matches a craving-shaped request — the standard index-then-load path, no new routing.

### Evidence Assembly (defined in the skill)

```text
1. physiological now  — last night's sleep + today's readiness (memory,
                        spec 40); flag short-sleep state
2. eating gap         — hours since last observed eating event; honesty rule:
                        observed gap, stated as such ("nothing logged since...")
3. craving history    — prior decoded cravings + spec 17 stress-eating and
                        time-of-day patterns matching this category/hour
4. context signals    — wellbeing signals this week (spec 17), travel state
                        (spec 22), user-volunteered cycle context (memory)
5. glucose dynamics   — if CGM: recent rapid drop is a classic craving driver;
                        if Kin data exists (spec 47), flattest-alternative note
6. synthesis          — at most TWO causes named, ranked; below evidence
                        threshold → say "no pattern", never confabulate
```

The confabulation rule is the integrity core of this feature: a decoder that always finds a cause is a horoscope. "Sometimes chocolate is just chocolate" must be a frequent, designed answer.

### Language Rules

- Every claim carries its source in plain words ("your ring says", "nothing's been logged since", "the last four times").
- Observations, never verdicts: "this is when you usually reach for sugar," never "you shouldn't."
- The offer is singular and optional. One suggestion, then silence.

## Learning Loop

Each decoded craving writes one event (`memory_event`, kind `craving_decoded`) with category, named causes, evidence refs, and what the user did next (took the bridge, cooked, scanned-and-bought anyway, ignored). The weekly pattern pass (spec 17) consumes these like any other signal — recurring cause-pairs harden into `behavior_pattern` rows, which in turn make future decodes faster and more specific. Decoder and pattern engine form one loop, not two systems.

## Data Model

No new tables. The feature runs on existing infrastructure by design:

- `memory_event` rows, kind `craving_decoded` (spec 08 append-only log).
- `behavior_pattern` rows via the existing spec 17 pass (`behavior_pattern_type = 'craving_correlation'`).
- `user_memory` entries under `personality.cravings` for stable, user-confirmed patterns ("late-night sugar when short on sleep"), written through the standard `memory_update` tool.
- The `craving-decoder` system skill row in `skills` (spec 09).

## Technical Constraints

- The decode is the live conversation's own reasoning over injected context wherever possible — the relevant memory namespaces (health.biometrics, personality.cravings) are already in session context via `buildMemoryContext()` (spec 09). At most one auxiliary structured call when history assembly exceeds what is in context (FTS over `memory_event`).
- Latency: conversational. The first sentence of the answer should not wait on history assembly — answer from context, refine if the auxiliary call adds evidence.
- The eating-gap estimate inherits the spec 50 coverage honesty problem and the same solution: claim only what was observed, phrase it that way.
- The disordered-eating guard is implemented in the skill content and in the session safety rules — and it is one of the things the safety block protects from compression (spec 24 sacred block).

## Tier Placement

The Craving Decoder is Core tier and above (spec 19) — it is part of the personal memory layer. It degrades gracefully by data, not by gate: without wearables it works from behavioral evidence alone; with Oura/CGM it gets physiological teeth. On Free tier, a craving question gets a brief generic answer plus the standard inline upgrade surface.

## Privacy

- Decodes, craving events, and patterns are private Brain DO data, visible in "what Brioela knows about me" (spec 34), individually deletable.
- Cycle-related context exists only if the user volunteered it into memory; it is never inferred from purchase patterns, never surfaced in any share or community context, and deleting it removes it from all future decodes.
- Craving data never feeds Ground, Mesa member views, Passport, practitioner surfaces (spec 18), or the Harvest (spec 49 exclusion list — craving history is sensitive-class).

## Success Metrics

- Decode engagement rate: craving questions that get a follow-up ("tell me more", bridge accepted) vs. dropped.
- Cause confirmation rate: user agrees with the named cause ("yeah, I barely slept") — the accuracy proxy.
- "No pattern" rate: must stay materially above zero (the honesty metric; zero means confabulation).
- Bridge acceptance rate (real-food offer taken), and downstream: did the comfort-category purchase still happen (receipt evidence)?
- Pattern hardening rate: decoded cravings that become confirmed `behavior_pattern` rows.
- Disordered-eating guard trigger rate (monitored for prevalence, never for engagement).
