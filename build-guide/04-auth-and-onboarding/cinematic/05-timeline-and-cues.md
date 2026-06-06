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

## Strongest Cinematic Beats

1. Flame appears.
2. Hands appear.
3. “Until hunger became home.”
4. “A people could live inside a pot.”
5. “A voice could return through a bite.” Burst.
6. “Someone fed you.” Convergence begins.
7. Brioela thesis line. Wordmark completes.
8. Camera reveal.

Everything else supports these moments.

## Refined Beat Map

```text
Before memory had words,        black. tiny ember.
it had taste.                   ember glows. first warmth.

Before recipes,                 ember opens.
there was flame.                fire appears. first haptic.

Before maps,                    smoke rises.
there was smoke.                smoke becomes paths, then dissolves.

Before names,                   hand-shadow enters.
there were hands.               ingredients appear around the hands.

Hands that washed.              water shimmer.
Hands that cut.                 line of light.
Hands that stirred              particles spiral.
until hunger became home.       pot-universe stabilizes. long pause.

A people could live             pot expands into a small cosmos.
inside a pot.                   stillness. culture implied in particles.

A place could rise              smoke forms room fragments.
from a smell.                   room shifts with phone tilt.

A voice could return            single particle moves toward lens.
through a bite.                 burst. whoosh. haptic.

Someone fed you.                particles return inward.

And before you knew             warm pulse forms.
what love was called,           pulse becomes body-memory ring.
your body knew                  particles begin shaping letters.
what love felt like.            first Brioela letter appears.

One taste opens the door.       wordmark/lens opens slightly.
One breath brings back the room. room fragments return behind logo.
One bite returns the hands      hand-shadow flickers once.
that held you.                  frame warms like an embrace.

Brioela begins                  wordmark completes.
where language ends:            handpan/krar note.
in the taste your body          final particles lock.
remembers                       wordmark breathes once.
before your mind does.          silence begins.

Show Brioela something you eat. camera fully open. text only.
```
