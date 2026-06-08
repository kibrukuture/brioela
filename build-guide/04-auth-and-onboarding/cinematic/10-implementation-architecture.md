# 10 - Implementation Architecture

## Provisional Component Shape

```text
OnboardingCoordinator
├── AssetPreloader
├── CameraWarmup
├── TimelineController
├── AudioController
├── HapticController
├── GyroscopeController
├── SkiaSceneCanvas
│   ├── EmberScene
│   ├── FlameScene
│   ├── SmokeMemoryScene
│   ├── HandsScene
│   ├── PotUniverseScene
│   ├── BurstConvergenceScene
│   └── WordmarkLensScene
├── CameraPreviewLayer
└── FinalPromptText
```

## Responsibility Rules

- One file, one responsibility.
- Timeline owns time.
- AudioController owns audio playback.
- HapticController owns haptics.
- SkiaSceneCanvas owns visual drawing.
- CameraPreviewLayer owns camera.
- OnboardingCoordinator wires pieces together.

## Candidate Folder

```text
mobile/features/onboarding/
  components/
  controllers/
  scenes/
  assets/
  timeline/
  hooks/
  types/
```

## First Prototype Scope

Do not build the entire cinematic first.

Prototype in this order:

1. timeline runner
2. narration playback
3. ember/flame scene
4. camera reveal
5. haptic cue
6. then add smoke/hands/pot/wordmark

## Rule

The prototype should prove timing and emotion before visual complexity.
