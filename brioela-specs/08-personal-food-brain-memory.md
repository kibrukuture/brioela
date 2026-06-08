# 08. Personal Food Brain Memory

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
- Structured storage only — event log plus derived views.

## Data Model
- `memory_event`: user_id, kind, payload_json, captured_at, source. Append-only event log.
- `user_memory`: id (`namespace:key`), namespace (dot-separated, e.g. `health.medications`, `diet.restrictions`), key, value (JSON object), confidence, source, active, read_count, write_count, last_read, last_write, updated_at. The single table for all declarative facts about the user — see spec 09 Memory Namespace System for full schema and write rules.
- `user_personality`: trait (AI-decided name), evidence (JSON array of observation IDs), strength (0.0–1.0), inferred_at, updated_at. Synthesized trait patterns built from multiple observations over time.

## memory_event — What It Is and How It Is Used

`memory_event` is the raw, append-only event log. Every meaningful action the user takes — every scan, every cook, every receipt, every sickness log, every recipe import — writes one row. Rows are never updated, never deleted. They only accumulate.

This is not a feature. It is the foundation that other features are built on. On its own it does nothing. Its value comes entirely from what reads it later.

The `kind` column identifies what happened. The `payload_json` carries the full details of that event. See spec 09 for the complete list of event types.

### What reads from memory_event and why

Other parts of the system query this log when they need to know what happened in the past. The log is the only place that has the complete, unmodified history. Nothing else does.

**1. Illness detective (spec 30)**
User opens the app and says "I've been feeling terrible since last night." The illness detective reads every event in the last 72 hours — every scan, every receipt item, every restaurant visit, every meal logged. It cross-references against active recalls and community illness signals and surfaces the most probable culprit ranked by likelihood. Without the log there is nothing to look back at. The detective is blind.

**2. Personalized recall alert (spec 26)**
A government agency issues a recall for a batch of frozen spinach contaminated with listeria. Brioela reads every scan event ever logged for this user. It finds a scan from 6 weeks ago — same product, same batch code. It fires immediately. Without the log, the match is impossible.

**3. Behavioral behavior pattern detection (spec 09, spec 17)**
The DO alarm fires after accumulating enough events to analyze. The agent reads the full event log and finds patterns invisible in any single event — stress eating signals, sickness correlations, time-of-day habits. These become `user_personality` traits and inform future recommendations.

**4. Travel pre-load (spec 22)**
A travel intent event is logged. The DO sets an alarm for 48 hours before departure. The alarm fires, reads that event — destination, date — and pre-loads food intelligence for the destination. None of this happens without the logged intent.

**5. Sickness follow-up (spec 09)**
User logs a sickness event. The DO sets a 24-hour alarm. When it fires, the agent reads the original event and follows up. The follow-up is only possible because the event is in the log and the alarm knows to return to it.

### What the user actually sees — 5 surface moments

Example: "The frozen spinach you scanned on April 12th has been recalled for listeria contamination. Check your freezer now." — fired 6 weeks after the scan, unprompted.

Example: "You weren't feeling well last night. The shawarma from that place on Bole Road shows up in 3 other illness reports this week." — fired 24 hours after the user logged sickness, no question asked.

Example: Mid-cook on doro wat — "Last time you made this was with your grandma in December. She skipped the cardamom. You said it was better." — surfaced because the same dish was started, not because the user asked.

Example: User scans an olive oil — "You've scanned this four times across three different stores. You never bought it." — the pattern only visible because every scan was logged.

Example: Two days before Tokyo — "You're heading to Tokyo in 2 days. Here are restaurants near Shinjuku that fit your restrictions, and 2 supermarkets that carry the probiotic yogurt you buy every week." — the user said nothing today. The app was waiting.

## Update Rules
- Raw events are append-only. Never updated, never deleted.
- Facts in `user_memory` and `user_personality` are derived from events and are replaceable.
- The Memory Brain maintenance (spec 34) maintains `user_memory` and `user_personality` — it never touches `memory_event`.

## Read Paths
- Scan personalization.
- Recipe reranking.
- Ambient recommendation generation.
- Cooking context injection.

## Technical Notes
- Memory should prefer explicit, queryable schema for stable product features.
- All user-visible actions that materially affect preference or safety should emit a memory event.

## Success Metrics
- Increase in recommendation relevance over user lifetime.
- Decrease in repeated irrelevant suggestions.
- Number of active product surfaces reading from memory.
