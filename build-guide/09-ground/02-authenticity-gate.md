# Ground — Authenticity Gate

## What This File Covers

The AI gate that every Find must pass before appearing in Ground.

## Source Specs

- `brioela-specs/35-ground-community-intelligence.md`

## Gate Contract

Every Find passes through one structured LLM call before display.

Target latency: under 1.5 seconds.

The gate returns:

- pass/fail decision
- structured check results
- user-facing rejection reason if failed
- internal gate log

## Checks

All must pass:

1. Specificity
2. No promotion
3. No negativity targeting
4. Freshness plausibility
5. No personal information
6. Face detection for media
7. Minimum information density

## Rejection Behavior

Failed finds are returned to the user with a reason.

Never silently drop a find.

The user can edit and resubmit.

## Media Gate

- Images allowed only if no faces.
- Video allowed only if no faces.
- Video max 30 seconds.
- Video audio stripped before display.
- Audio-only content is not allowed.
- Raw voice input for dictation is discarded after transcription.

## Abuse Rules

- Max 10 finds per user per day.
- Repeated gate failures trigger a temporary cooldown.
- Contributor hash is internal only.
- No public reputation, score, badges, or visible contribution count.

## Tool Placement

Ground tools live under `tools/ground/` later:

- `submit-find.ts`
- `run-ai-gate.ts`

All tool exports still go through `tools/index.ts`.
