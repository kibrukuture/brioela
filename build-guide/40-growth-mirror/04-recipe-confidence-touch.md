# Growth Mirror — The Recipe-Confidence Touch

## What This File Covers

Difficulty framing that adapts to demonstrated skill.

## Source Specs

- `brioela-specs/53-growth-mirror.md`
- `brioela-specs/39-generative-ui.md` (recipe card context)

## Behavior

- A recipe whose techniques the trajectory shows mastered: warnings dropped, nothing pre-explained — the `familiar` energy applied to skill. The app stops talking to a competent cook like a beginner.
- A recipe one notch above the demonstrated repertoire: framed as within reach; Mira pre-briefed on which step deserves attention.
- No UI element announces any of this. The adaptation is silent.

## Implementation

- The recipe-card context (generative grammar recipe surface) receives a demonstrated-skill summary alongside the existing context blocks — same injection path, one more input.
- Mira session payloads for one-notch-up recipes carry the attention-step note.
- Mapping technique requirements to trajectory dimensions uses the recipe's existing technique/difficulty metadata — no new recipe fields.

## The Annual Handoff

The year's strongest trajectory arc becomes the Harvest `craft` chapter (spec 49) — the only place growth is ever composed into a shareable artifact, inheriting that spec's share rules entirely.

## Metrics To Instrument

recognition resonance (positive response / "tell me more"), on-demand question rate (trust signal), recognition accuracy audit (every claim traces to evidence refs), retention delta at 2+ surfaced recognitions vs. matched session-count baseline, one-notch-up completion rate vs. historical baseline, dismissal rate (annoyance ceiling).

## Rule

The touch must stay invisible. The moment a user can point at a "skill level" in the UI, this feature has failed its spec.
