# 08 - Assets And Sources

## Asset Groups

### Voice

```text
narration.mp3
narration-timestamps.json
```

### Music

```text
music-bed.mp3
```

### Sound Effects

```text
sfx-ember.wav
sfx-flame-bloom.wav
sfx-smoke-air.wav
sfx-water-shimmer.wav
sfx-cut-light.wav
sfx-stir-clay.wav
sfx-pot-resonance.wav
sfx-room-rise.wav
sfx-bite-burst.wav
sfx-particle-return.wav
sfx-brioela-note.wav
sfx-camera-open.wav
```

### Visual Assets

```text
particle-grain.png
particle-spice.png
particle-oil.png
particle-ash.png
wordmark-mask.png
wordmark-points.json
```

## Source Options

- ElevenLabs for narration.
- ElevenLabs for sound effects tests.
- Suno for music mood exploration.
- Artlist / Epidemic / Musicbed for reference-quality cinematic beds.
- Custom sound design if needed.

## Rule

Do not lock implementation to one source. The app should consume final exported assets, not depend on generation services at runtime.
