# 09 - Performance Plan

## Target

Cinematic, but not fragile.

## Performance Rules

- Preload audio before scene starts.
- Preload camera where possible.
- Keep particle counts bounded.
- Use Reanimated shared values for scene state.
- Keep visual transitions on UI thread where possible.
- Avoid heavy JS during animation.
- Use fallback mode on weak devices.

## Fallback Mode

If device is weak:

- fewer particles
- simpler smoke
- no expensive blur
- static wordmark mask instead of full particle assembly
- camera reveal remains intact

## Risk Areas

- Skia particle count
- camera warmup
- audio preload latency
- low-end Android GPU
- haptic timing drift

## Rule

The emotional beat matters more than particle count.
