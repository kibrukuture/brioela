# Kin — Opt-In and Opt-Out

## What This File Covers

The consent lifecycle.

## Source Specs

- `brioela-specs/47-kin.md`
- `brioela-specs/40-wearables-integration.md` (disconnect flow)

## Opt-In

- One question, reciprocal, plainly worded: use anonymous response data from people metabolically similar to you, and contribute yours anonymously in return.
- Asked only after the user has a working CGM connection AND has seen at least one personal correlation — value first, question after (the onboarding doctrine).
- Never re-asked after a decline; the option lives quietly in Connected Devices.

## Opt-Out

One tap in Connected Devices. On opt-out:

- the Brain DO stops contributing immediately
- pending contributions are withdrawn; affected aggregates recompute next batch
- the user stops receiving Kin rows — reciprocity ends both directions, stated plainly at opt-out

## Implications

- Disconnecting the CGM entirely implies Kin opt-out automatically.
- Deleting entries from `kin_contribution_log` marks those contributions for recomputation removal.

## Transparency Surface

"What Brioela knows about me" shows: opted-in status, the cluster in plain language ("your responses are pooled with people who spike fast on refined carbs and recover quickly"), and the full contribution log with per-item deletion.

## Rule

Consent here is binary, visible, and cheap to reverse. No partial modes, no dark patterns, no win-back prompts.
