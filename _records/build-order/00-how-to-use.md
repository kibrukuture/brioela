# Build Order — How to Use

The dependency graph for the entire project. Nothing gets built out of order.
One file per dependency layer. A layer cannot be started until all layers before it are complete.

## The rule
If build-guide file B depends on build-guide file A existing and working,
then A must be in a lower-numbered layer than B. No exceptions.

## Files in this folder (to be filled during spec reading pass)
- `01-layer-foundation.md`     — monorepo, Cloudflare Workers, Supabase setup — depends on nothing
- `02-layer-auth.md`           — Supabase auth, session management — depends on layer 1
- `03-layer-orchestrator.md`   — Orchestrator DO, SQLite schema — CRITICAL PATH, depends on layer 2
- `04-layer-scanner.md`        — camera, barcode, constraint check — depends on layer 3
- `05-layer-memory.md`         — memory read/write, constraint profile — depends on layer 3
- `06-layer-cooking-session.md`— CookingAgent DO, Gemini Live, Realtime SFU — depends on layers 3, 4, 5
- `07-layer-ground.md`         — Mapbox 3D, find submission, AI gate — depends on layers 3, 4, 5
- `08-layer-bela.md`           — full Bela delivery stack — depends on layers 3, 4, 5, 6, 7

## When to update
When a new dependency is discovered during building, update the relevant layer file.
If a dependency crosses layers unexpectedly, record it here with a note explaining why.

## Recovery
If reading after context compaction: read `_records/session-log/` last numbered file first.
Then read the layer file for whatever layer was in progress.
