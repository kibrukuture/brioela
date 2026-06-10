# Growth Mirror — Trajectory Model

## What This File Covers

Maintaining per-dimension skill trajectories.

## Source Specs

- `brioela-specs/53-growth-mirror.md`

## Where It Runs

The existing weekly Brain maintenance pass (alarm cycle) gains a trajectory update step. No new scheduler, no new model infrastructure.

## Evidence Floors

- 8 sessions overall before any trajectory exists.
- 5 evidence events per dimension before that dimension reports anything but `insufficient_evidence`.
- Below the floors the mirror has nothing to say and says nothing.

## Data

```sql
skill_trajectory (
  dimension text,                -- agent-extensible beyond the shipped seven
  direction check(direction in ('improving','steady','insufficient_evidence')),
  confidence real,               -- 0..1
  evidence_refs_json,            -- memory_event ids — every claim traces
  baseline_note, latest_note,
  sessions_observed, updated_at
)
```

- The agent may add user-specific dimensions over time (the spec 34 autonomy principle) — but every dimension, shipped or agent-added, requires citing evidence refs.
- Honest sparse-data behavior: "hard to say — we haven't done much knife-heavy cooking lately" is the correct answer for a thin dimension.

## Recognition Candidates

When a trajectory crosses a notability threshold — sustained improvement across 5+ sessions, a long-broken failure pattern, a first ("first multi-dish meal without a single timing intervention") — a `growth_recognition` candidate enters the queue (file 03).

## Rule

`insufficient_evidence` is a designed state, not a failure. The mirror never reaches.
