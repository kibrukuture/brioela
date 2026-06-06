# Onboarding Temp Workspace

Temporary workspace for generating and taste-testing the Brioela cinematic onboarding.

This folder is for experiments only. Production code/assets should move out after the direction is proven.

## Current Flow

1. Keep design docs in `04-auth-and-onboarding/temp/`.
2. Generate temporary audio/timeline assets here.
3. Taste-test narration/music/SFX.
4. Keep what works, throw away what does not.

## Folders

- `prompts/` - source text and generation prompts.
- `generated/` - generated audio, timestamp JSON, and metadata.
- `scripts/` - local generation helpers.
- `timeline/` - draft event timing files.
- `prototypes/` - temporary UI experiments later.

## First Test

Run the ElevenLabs narration generation script from `mobile/`:

```sh
bun features/onboarding/temp/scripts/generate-narration.mjs
```

The script reads `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` from `mobile/.env`.
