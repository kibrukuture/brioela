# 08. Personal Food Memory Engine

## Goal
Provide a long-lived, user-specific memory layer that accumulates food preferences, history, recipes, constraints, and learned patterns to increase relevance over time.

## Why This Exists
This is the retention spine of Brioela. It makes the product more useful the longer a person uses it and raises switching costs by preserving accumulated food context.

## Memory Domains
- Preferences and dislikes.
- Hard constraints and dietary identity.
- Scan history.
- Recipe history.
- Spend patterns.
- Restaurant and market preferences.
- Prior negative outcomes such as feeling sick after a product or place.

## Storage Model
- Private, per-user storage.
- Structured first, narrative summary second.
- Event log plus derived views.

## Data Model
- `memory_event`: user_id, kind, payload_json, captured_at, source. Append-only event log.
- `user_memory`: id (`namespace:key`), namespace (dot-separated, e.g. `health.medications`, `diet.restrictions`), key, value (JSON object), confidence, source, active, read_count, write_count, last_read, last_write, updated_at. The single table for all declarative facts about the user — see spec 09 Memory Namespace System for full schema and write rules.
- `user_personality`: trait (AI-decided name), evidence (JSON array of observation IDs), strength (0.0–1.0), inferred_at, updated_at. Synthesized trait patterns built from multiple observations over time.
- `memory_summary`: user_id, summary_type, content, generated_at. Disposable, rebuildable.

## Update Rules
- Raw events are append-only.
- Facts are derived and replaceable.
- Generated summaries are disposable and can be rebuilt.

## Read Paths
- Scan personalization.
- Recipe reranking.
- Ambient recommendation generation.
- Cooking context injection.

## Technical Notes
- Memory should prefer explicit, queryable schema for stable product features.
- LLM-generated summaries should augment but not replace structured storage.
- All user-visible actions that materially affect preference or safety should emit a memory event.

## Success Metrics
- Increase in recommendation relevance over user lifetime.
- Decrease in repeated irrelevant suggestions.
- Number of active product surfaces reading from memory.
