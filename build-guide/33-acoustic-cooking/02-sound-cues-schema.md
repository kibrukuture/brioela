# Acoustic Cooking — Recipe Sound Cues

## What This File Covers

The optional per-step `sound_cue` field and where cues come from.

## Source Specs

- `brioela-specs/46-acoustic-cooking-intelligence.md`
- `brioela-specs/32-grandma-style-flavor-profile.md`

## Schema

Recipe steps JSON gains one optional field:

```
sound_cue: string | null
-- short natural-language description of what this step should sound like
-- and what marks completion, e.g.
-- "medium sizzle, steady; done when the popping fades"
-- "count three whistles, then off the heat"
```

No enum, no taxonomy — the consumer is the model, and natural language is its native format.

## Cue Sources (in order of arrival)

1. **Authoring at ingestion/reconstruction** — recipe import (spec 02), generational capture (spec 13), Encore (spec 44) write cues when the source material implies them.
2. **Generational capture extraction** — grandma's "you'll hear when it's ready" is a sound cue; the spec 32 instinct-to-checkpoint extraction covers the acoustic half here.
3. **Learned from sessions** — when Mira acoustically confirms a step, the confirmation can be written back as a learned cue on that recipe (post-session workflow write).

## Injection

Cues ride with the recipe in the session payload. Steps without cues have no acoustic checkpoint — risk interventions still apply.

## Rule

A cue describes sound, never temperature or time. "Until it sounds dry" is a cue; "8 minutes at medium" is a step instruction and lives where it always did.
