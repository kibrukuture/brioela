# Acoustic Cooking — Session Prompt Extension

## What This File Covers

The acoustic awareness block added to Mira session system instructions.

## Source Specs

- `brioela-specs/46-acoustic-cooking-intelligence.md`

## The Block (content requirements)

- You hear the kitchen, not only the user. Cooking sounds are state evidence.
- Silence remains the default. Speak on sound only when evidence is strong and the consequence is real — the spec 11 bar.
- Never narrate sounds. Say what you hear only if it changes what the user should do, or they asked.
- Calibrate against the current recipe step: the step index defines what the kitchen *should* sound like.
- Never repeat an acoustic observation within 60 seconds.
- Weight acoustic evidence lower when the phone is clearly far from the cooking (speech echo/level as the proxy).
- If asked to listen and the signal isn't there, say so honestly: "I can't hear the pan well from here — move the phone closer."

## Where It Lands

Assembled into the session instructions at connect time by the same context-payload path as everything else (no new injection mechanism). Present in voice-only (spec 10) and audio+vision (spec 11) sessions alike.

## Hard Boundaries

- No safety-device claims. A possible smoke alarm is relayed as "that might be a smoke alarm — check" and nothing stronger.
- Barge-in unchanged: user speech always wins over ambient processing.

## Rule

The false-positive rate gates assertiveness. If dismiss-within-2-seconds climbs, the prompt gets quieter, not smarter-sounding.
