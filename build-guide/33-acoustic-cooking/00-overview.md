# Acoustic Cooking Intelligence — Overview

## What This Folder Covers
Mira hears the kitchen, not just the cook. Non-speech kitchen sound — sizzle pitch, boil-over signatures, pressure-cooker whistles, abnormal silence — becomes cooking-state evidence inside existing Mira audio sessions. Intervention on acoustic risk, acoustic step confirmation via recipe sound cues, and evidence fusion with vision when the camera is on. Zero new pipeline: this is system-instruction content, a recipe schema extension, and event labeling on top of the audio stream Gemini Live already receives.

## Status
[x] guide complete — three files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-prompt-extension.md` | the acoustic awareness block in Mira session instructions; silence and anti-nag rules; mic honesty |
| `02-sound-cues-schema.md` | the optional per-step `sound_cue` field; authoring sources; learned cues from sessions |
| `03-intervention-events.md` | the acoustic intervention taxonomy; `evidence_source` column on vision_event; fusion with vision |

## Specs This Folder Draws From
- `brioela-specs/46-acoustic-cooking-intelligence.md` — the full feature spec
- `brioela-specs/10-mira-cooking-voice.md` — host session and silence rules
- `brioela-specs/11-live-vision-cooking-coach.md` — intervention bar and event vocabulary (extended, not replaced)
- `brioela-specs/32-grandma-style-flavor-profile.md` — spoken instincts → observable checkpoints (sound cues are the acoustic half)

## Key Decisions From Specs
- No new audio pipeline, classifier, or DSP. The capability is prompt- and recipe-level instruction to the same Gemini Live session.
- The spec 11 intervention bar applies verbatim: a missed intervention is better than a false positive; never repeat within 60 seconds; never narrate.
- Acoustic evidence is calibrated against the current recipe step — a hard sizzle is correct during searing, wrong during a sweat.
- `vision_event` gains `evidence_source` (`visual | acoustic | fused`) — one intervention stream per session regardless of sense.
- Recipe steps gain optional `sound_cue` text. Steps without cues degrade to risk-intervention only.
- Mic honesty: when the phone is clearly far from the cooking (or the mic is on an earbud), weight acoustic evidence lower and say so when asked ("I can't hear the pan well from here").
- No passive listening ever. No session, no audio. No smoke/fire/gas detection claims.
- Ships wherever Mira audio exists (Chef+), no separate gate, no added per-minute cost.

## What This Folder Depends On
- `08-cooking-session` — the Mira session runtime and system-instruction assembly this extends
- `19-recipe-ingestion` — recipe schema (sound_cue field lands in the steps JSON)
- `30-mira` — Mira speech decision rules

## What Depends On This Folder
- `40-growth-mirror` — acoustic events are a skill-evidence stream (heat control dimension)
- `32-in-store-copilot` — none directly; listed for clarity (no acoustic logic in stores)
