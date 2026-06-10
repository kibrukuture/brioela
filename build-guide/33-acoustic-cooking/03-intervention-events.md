# Acoustic Cooking — Intervention Events and Fusion

## What This File Covers

The acoustic intervention taxonomy and event storage.

## Source Specs

- `brioela-specs/46-acoustic-cooking-intelligence.md`
- `brioela-specs/11-live-vision-cooking-coach.md`

## Taxonomy

| Event | Acoustic evidence | Behavior |
|---|---|---|
| heat_warning | crackle pitch/density beyond the step's call | immediate, short |
| boil_over_warning | boil intensity climbing toward overflow | immediate |
| burning_onset | sizzle character shifting toward scorch | immediate |
| step_confirmed | step's sound_cue signature reached | confirm and advance (same flow as visual) |
| abnormal_silence | active-heat step gone quiet unexpectedly | one gentle check |

## Storage

Acoustic events are `vision_event` rows with the new column:

```
evidence_source text check(evidence_source in ('visual','acoustic','fused'))
```

One intervention stream per session regardless of sense. No raw audio is ever stored — derived events only, identical to the no-raw-frames rule.

## Fusion (audio+vision sessions)

Evidence fuses in the same Gemini Live reasoning pass — that is the point of one multimodal model. Sound often leads vision: a boil-over is audible seconds before it is visible at 1 frame per 2–4s. Fused events store `evidence_source = 'fused'`. Intervention rules unchanged; evidence gets stronger.

## Metrics To Instrument

useful acoustic intervention rate, acoustic false-positive rate (dismissed <2s — the assertiveness gate), step-confirmation accuracy on cued recipes, boil-over/burn saves per 100 sessions, audio-only completion rate vs. pre-feature baseline.
