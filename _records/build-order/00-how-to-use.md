# Build Order — How to Use

The dependency graph for the entire project. Nothing gets built out of order.
One file per dependency layer. A layer cannot be started until all layers before it are complete.

## The rule
If build-guide file B depends on build-guide file A existing and working,
then A must be in a lower-numbered layer than B. No exceptions.

## Files in this folder
- `01-layer-foundation.md`
- `02-layer-auth.md`
- `03-layer-brain.md`
- `04-layer-memory-engine.md`
- `05-layer-scanner.md`
- `06-layer-cooking-session.md`
- `07-layer-ground.md`
- `08-layer-map.md`
- `09-layer-bela.md`
- `27-layer-health-intelligence.md`

## When to update
When a new dependency is discovered during building, update the relevant layer file.
If a dependency crosses layers unexpectedly, record it here with a note explaining why.

## Recovery
If reading after context compaction: read `_records/session-log/` last numbered file first.
Then read the layer file for whatever layer was in progress.
