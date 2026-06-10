# Growth Mirror — Skill Evidence Extraction

## What This File Covers

How skill evidence is harvested from sessions.

## Source Specs

- `brioela-specs/53-growth-mirror.md`

## Where It Runs

The existing post-session summarization workflow gains one extraction target: skill-evidence signals. Zero new model passes during live sessions; one small structured-extraction addition to a call that already runs. Extract-then-compress, same as everything else.

## Evidence Streams by Dimension

| Dimension | Stream |
|---|---|
| knife work | vision events: chop speed/uniformity observations |
| heat control | heat warnings + burning-onset events per active-heat minute (visual + acoustic) |
| timing & parallelism | timer adherence, multi-dish outcomes, step-overrun deltas |
| technique vocabulary | definition questions asked then never re-asked (transcripts) |
| independence | interventions + assistance requests per session, difficulty-adjusted |
| repertoire | distinct techniques and cuisines cooked to completion |
| improvisation | substitutions self-initiated vs. requested |

## Output

`memory_event` rows, kind `skill_evidence`: dimension, signal, session ref. Append-only, the standard spine.

## Difficulty Normalization (mandatory)

Every independence/timing signal is normalized by the recipe's difficulty field. Interventions per session mean nothing if the user moved from toast to croissants. Un-normalized signals are not written.

## Multi-Person Rule

Evidence is extracted only for the account owner from their own attributed actions (transcript attribution is best-effort; unattributed actions produce no evidence). Guests and family members are never skill-profiled.

## Rule

A claim that cannot cite a concrete session event is not evidence and is not written.
