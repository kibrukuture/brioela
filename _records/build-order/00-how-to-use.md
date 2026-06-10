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
- `04-layer-brain-memory.md`
- `05-layer-scanner.md`
- `06-layer-cooking-session.md`
- `07-layer-ground.md`
- `08-layer-map.md`
- `09-layer-bela.md`
- `27-layer-health-intelligence.md`
- `28-layer-encore.md`
- `29-layer-in-store-copilot.md`
- `30-layer-acoustic-cooking.md`
- `31-layer-kin.md`
- `32-layer-heirloom.md`
- `33-layer-harvest.md`
- `34-layer-negative-space-nutrition.md`
- `35-layer-tonight.md`
- `36-layer-craving-decoder.md`
- `37-layer-growth-mirror.md`

Cross-layer note: layer 33 (Harvest) consumes layer 37 (Growth Mirror) as an
OPTIONAL input — the `craft` chapter. The edition ships without it, so the ordering
holds for required dependencies. Recorded per the exception rule below.

## When to update
When a new dependency is discovered during building, update the relevant layer file.
If a dependency crosses layers unexpectedly, record it here with a note explaining why.

## Recovery
If reading after context compaction: read `_records/session-log/` last numbered file first.
Then read the layer file for whatever layer was in progress.
