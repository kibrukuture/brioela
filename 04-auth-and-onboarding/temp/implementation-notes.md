# Brioela Onboarding Implementation Notes

This file is for implementation planning later. Do not treat it as final architecture yet.

## Technical Shape

The onboarding should be built as one cinematic system, not a collection of slides.

Potential component structure:

```text
OnboardingOrchestrator
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

## Technology Candidates

- `@shopify/react-native-skia` for fire, smoke, particles, heat distortion, wordmark assembly.
- `react-native-reanimated` for timing, springs, alpha, camera reveal, particle movement.
- `expo-sensors` DeviceMotion for gyroscope parallax.
- `expo-haptics` for flame, burst, wordmark, and camera physical moments.
- `expo-camera` for the final camera reveal.
- `expo-audio` or `expo-av` for narration, music, and sound effects.
- `expo-blur` for soft scene transitions and atmospheric depth.
- Optional `Rive` if a living Brioela symbol is ever needed.
- Optional Lottie only for small authored details if Skia is too expensive to author manually.

## Core Engineering Rule

Do not build the animation as independent decorative effects.

Every visual state should be driven by the timeline and should map to a narrative meaning.

## Skip Behavior

- Single tap anywhere should skip to camera.
- No visible skip button.
- Skip must stop narration/music/SFX cleanly.
- Skip should still feel like entering the camera, not a hard crash into UI.

## Camera Strategy

- Camera should warm up behind the final scene if permission is already granted.
- If permission is not granted, the cinematic should not crash into a permission dialog unexpectedly.
- Permission strategy needs separate design before implementation.

## Open Implementation Questions

- Should onboarding ask camera permission before the cinematic starts, or should it end at a permission gate?
- Should the first prototype fake camera reveal with a placeholder layer before wiring real camera?
- Should narration timestamps come from ElevenLabs alignment JSON, manual timeline editing, or both?
- How do we handle low-end Android frame rate?
- How much of the particle system can be real-time versus precomputed?
- Should the wordmark point cloud be generated at build time instead of runtime?
