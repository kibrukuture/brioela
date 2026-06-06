# Connections — How to Use

Every relationship between a spec file and a build-guide file is recorded here.
One file per feature area. Bidirectional — spec → build-guide AND build-guide → spec.

## Why this exists
A spec often connects to multiple build-guide files. A build-guide file often draws
from multiple specs. Without this map, connections get missed and the build breaks
in ways that are hard to trace.

## Format for each entry
```
spec: brioela-specs/35-ground-community-intelligence.md
  → build-guide/09-ground/01-mapbox-3d-setup.md        [x] done
  → build-guide/09-ground/02-find-submission-flow.md   [~] partial
  → build-guide/09-ground/03-ai-gate.md                [ ] not started
```

## Files in this folder
- `01-orchestrator-connections.md`
- `02-scanner-connections.md`
- `03-cooking-session-connections.md`
- `04-ground-connections.md`
- `05-map-connections.md`
- `06-bela-connections.md`
- `06-memory-engine-connections.md`
- `07-auth-connections.md`
- `08-notifications-connections.md`
- `09-receipt-intelligence-connections.md`
- `10-pantry-meal-plan-connections.md`

## When to update
Every time a build-guide file is written: add the connection here immediately.
Every time a spec changes: check its connection file for build-guide files that need updating.
