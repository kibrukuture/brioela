# Ground — Find To Cooking Trigger

## What This File Covers

How a fresh Find can trigger a cooking journey when it matches a user's ingredient gap or recipe memory.

## Source Specs

- `brioela-specs/35b-ground-finds-deep-design.md`
- `brioela-specs/10-voice-cooking-agent.md`
- `brioela-specs/13-generational-recipe-capture.md`
- `build-guide/08-cooking-session/`
- `build-guide/05-orchestrator/`

## Status

Second-release feature. Not required for basic Ground.

## Trigger Flow

1. New Find enters Ground.
2. Ground routing identifies nearby users whose memory/cooking context matches the ingredient/product.
3. Orchestrator checks whether the item closes a cooking gap.
4. If high-confidence, Brioela surfaces an ambient card.

Example:

```text
Fresh injera flour spotted 300 meters away.
You mentioned wanting to make injera last week.
Want to grab it today and cook tonight?
```

Actions:

- Set reminder
- Start cooking session

## Required Data

- `ingredient_not_found` memory event kind or equivalent.
- user recipe/cooking memory.
- location relevance.
- Ground Find details.
- ambient notification surface.

## Rules

- Find itself does not write to memory by default.
- Acting on a Find can create memory.
- Trigger must be high-confidence and rare.
- No generic marketing notifications.
