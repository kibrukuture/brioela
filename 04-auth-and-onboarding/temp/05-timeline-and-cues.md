# 05 - Timeline And Cues

## Goal

The timeline drives everything.

It controls:

- narration start
- visual scenes
- SFX
- haptics
- camera reveal
- final text

## Timeline File

Use a data file like:

```text
timeline.json
```

Example shape:

```json
[
  { "time": 0.0, "event": "black.start" },
  { "time": 1.2, "event": "ember.appear" },
  { "time": 4.0, "event": "narration.start" },
  { "time": 7.4, "event": "flame.bloom", "sfx": "sfx-flame-bloom", "haptic": "heavy" },
  { "time": 14.8, "event": "hands.enter" },
  { "time": 23.5, "event": "memory.burst", "sfx": "sfx-bite-burst", "haptic": "rigid" },
  { "time": 31.2, "event": "wordmark.complete", "sfx": "sfx-brioela-note", "haptic": "heavy" },
  { "time": 36.0, "event": "camera.reveal" }
]
```

## Cue Granularity

Do not animate every word.

Track:

- line starts
- emotional beats
- silence moments
- burst moment
- convergence moment
- wordmark completion
- camera reveal

## Rule

Too much sync feels like a lyric video. Use fewer cues with stronger meaning.
