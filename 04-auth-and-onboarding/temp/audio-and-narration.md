# Brioela Onboarding Audio And Narration Notes

This file captures the current direction for narration, music, sound design, and haptics. The onboarding should be treated like a short film score, not like voice plus background music.

## Core Principle

There are four layers:

1. Narration
2. Music bed
3. Scene sound design
4. Haptics

These should not be designed separately. They need to be written, generated, edited, and timed as one piece.

The final onboarding should feel conducted:

- voice conducts memory
- music conducts emotion
- particles conduct the world
- haptics make it physical
- camera makes it real

The moment it becomes a list of effects, it dies. The moment every beat has meaning, it becomes cinematic.

## Narration Recording Strategy

Record the narration as one full continuous performance, not separate lines.

Why:

- the emotion depends on breath and pacing
- the pauses between lines matter
- the voice needs one continuous arc
- separate clips will feel stitched together
- the narrator has to carry tension, silence, and release across the whole piece

After recording, cut it into timestamped sections in editing.

Recommended structure:

- source recording: one complete take
- app asset: one full narration file
- metadata: cue timestamps in `timeline.json`
- optional edit markers: per-scene cue points

## Voice Direction

The voice should not be a movie trailer voice.

It should feel:

- close
- warm
- low
- unhurried
- ancient
- intimate
- certain
- almost whispered, but still strong

Reference feeling:

- someone telling an old truth
- a myth or folktale opening
- a voice speaking to one person, not millions
- not an ad
- not a meditation app
- not a product narrator

## ElevenLabs Or Human Voice

If using ElevenLabs:

- generate the full script as one prompt
- use pauses/breaks if supported
- export audio
- export alignment/timestamp data if available
- manually adjust in a DAW if needed

If using a real voice actor:

- record the full script in one take
- request 3 takes:
  - whisper-intimate
  - sacred-calm
  - more cinematic
- choose the best performance
- do timing cleanup in audio editor
- create timestamps manually or with transcription alignment

Best outcome:

- real voice actor or excellent ElevenLabs voice
- full continuous read
- no line-by-line generation

## Music Bed

The music should be mostly invisible.

Not a song. Not a melody-heavy track. Not emotional piano everywhere.

It should be a cinematic bed:

- low drone
- warm bowed texture
- subtle breath-like swell
- single notes at key moments
- maybe handpan, krar, cello, low brass, or organic percussion

Music movement:

1. Origin
   - very low
   - almost silence
   - ember/fire sound carries it
   - no melody

2. Memory
   - warm drone grows
   - soft harmonics enter
   - subtle pulse appears
   - still restrained

3. Arrival
   - one strong note when Brioela wordmark completes
   - music dissolves into silence before camera

The music should never compete with narration.

## Sound Design Map

### Before memory had words / it had taste

- almost silence
- low room tone
- tiny ember crackle
- no music yet
- voice very close

### Before recipes / there was flame

- flame blooms
- low drone enters quietly
- first haptic
- faint warmth in stereo field

### Before maps / there was smoke

- airy smoke movement
- soft wind/sand texture
- no percussion

### Before names / there were hands

- first organic tactile sound
- cloth/water/wood textures
- no literal chopping-board sound yet

### Hands that washed / cut / stirred / until hunger became home

- washed: water shimmer
- cut: clean soft slice, not sharp horror slice
- stirred: circular clay/wood resonance
- home: music holds and then leaves space
- long silence after "home"

### A people could live / inside a pot

- pot resonance
- low ceramic hum
- faint communal texture, almost like distant breath or room tone
- no literal crowd

### A place could rise / from a smell

- smoke swell
- room tone opens wider
- stereo field expands
- tiny high harmonic appears

### A voice could return / through a bite

- everything narrows
- one small intake/breath-like sound
- on "bite": burst, whoosh, haptic
- memory impact

### Someone fed you

- after burst, near silence
- particles returning with soft granular motion
- voice carries the line alone

### Before love had a name / body knew love

- warm pulse enters
- heartbeat-like low swell, not a literal heartbeat
- music starts resolving

### One taste / one breath / one bite

- door: thin light shimmer
- room: reverb opens
- hands: soft tactile texture returns
- held you: warmth, low harmonic

### Brioela begins where language ends

- music narrows into one note
- handpan/krar/cello strike on the Brioela arrival moment
- wordmark completion has haptic
- sound decays into silence

### Show Brioela something you eat

- should likely not be spoken
- camera room tone
- tiny lens/opening shimmer if needed
- silence matters

## Final Line: Spoken Or Text?

Recommended: do not speak the final line.

The narrator should stop at:

```text
before your mind does.
```

Then the camera opens.

Then text appears:

```text
Show Brioela something you eat.
```

Why:

- spoken instruction can break the spell
- text over camera feels like invitation
- silence makes the real world feel important

## Audio Asset Strategy

Use separate assets for each layer, but keep narration as one full file.

Recommended assets:

```text
narration.mp3
music-bed.mp3
sfx-ember.wav
sfx-flame-bloom.wav
sfx-water-shimmer.wav
sfx-cut-light.wav
sfx-stir-clay.wav
sfx-pot-resonance.wav
sfx-smoke-room.wav
sfx-bite-burst.wav
sfx-convergence.wav
sfx-brioela-note.wav
sfx-camera-open.wav
timeline.json
```

Why not one mixed master only:

- hard to adjust timing
- hard to react to skip
- hard to sync haptics
- hard to fade camera transition
- hard to tune relative volume on devices

Why not all individual narration lines:

- performance feels stitched
- emotion suffers

Best setup:

- narration: one full file
- music: one full file
- SFX: separate files
- haptics and visual events: driven by timeline JSON

## Timeline JSON

`timeline.json` is the orchestration brain.

Example shape:

```json
[
  { "time": 0.0, "event": "black.start" },
  { "time": 1.2, "event": "ember.appear" },
  { "time": 4.0, "event": "narration.start" },
  { "time": 7.4, "event": "flame.bloom", "haptic": "heavy", "sfx": "sfx-flame-bloom" },
  { "time": 14.8, "event": "hands.enter" },
  { "time": 23.5, "event": "memory.burst", "haptic": "rigid", "sfx": "sfx-bite-burst" },
  { "time": 31.2, "event": "wordmark.complete", "haptic": "heavy", "sfx": "sfx-brioela-note" },
  { "time": 36.0, "event": "camera.reveal" }
]
```

Each event can trigger:

- Skia state change
- Reanimated shared values
- SFX playback
- haptic
- text visibility

## Production Order

1. Lock script.
2. Generate rough voice in ElevenLabs.
3. Listen without visuals.
4. Adjust words and pauses until it lands emotionally.
5. Generate 3-5 voice versions.
6. Choose one.
7. Build rough timeline around the voice.
8. Build temporary visual prototype.
9. Add music bed.
10. Add SFX.
11. Adjust voice/music/SFX levels.
12. Polish visuals last.

Voice comes first.

## Timestamp Granularity

We need cue timestamps, not every word.

Needed:

- line starts
- emotional beats
- big visual moments
- pauses
- wordmark completion
- camera reveal

Avoid animating every word. Too much word-syncing becomes cheesy.
