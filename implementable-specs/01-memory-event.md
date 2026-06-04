# Table: memory_event

## Why This Table Exists

Every meaningful thing the user does — scans a product, logs sickness, starts a cook, imports a recipe, receives a receipt, declares travel intent — must be recorded permanently and immutably. This is that record.

`memory_event` is NOT `user_memory`. The distinction is fundamental:

- `user_memory` holds facts — things that are currently true about the user. Facts can be updated (medication dose changed from 500mg to 1000mg).
- `memory_event` holds history — things that happened, in order, at exact times. History cannot be revised. The scan on April 12th happened. That row never changes.

Without this table, these features are impossible:
- **Illness detective**: has nothing to look back at across the last 72 hours
- **Personalized recall alerts**: cannot match a government recall to a product scanned 6 weeks ago
- **Travel pre-load**: has no logged travel intent to act on when the alarm fires
- **Behavioral pattern detection**: has no raw material to find stress-eating patterns or sickness correlations
- **Sickness follow-up**: has no original event to return to when the 24h alarm fires

It is the only place in the system with the complete, unmodified history of what the user did. Everything else (`user_memory`, `user_personality`) is derived from it or ephemeral.

## Decision: Why not store events inside user_memory?

`user_memory` is keyed by `namespace:key` and designed for facts that get merged and updated over time. Events are not facts — they are timestamped occurrences. An event row must never be updated. Storing events in `user_memory` would corrupt the append-only guarantee, break the merge logic, and make time-range queries (illness detective: last 72h) impossible without a full table scan with filtering hacks.

## Decision: Why not use the session_turns table for events?

`session_turns` stores conversation messages (role: user/assistant/tool). A product scan might happen entirely silently — no conversation turn at all. Receipt ingestion happens in the background. Travel intent gets extracted from a passing comment. These are not conversation turns. They are domain events. They need their own table with their own schema.

## CREATE TABLE

```sql
CREATE TABLE memory_event (
  id           TEXT PRIMARY KEY,          -- UUID v4, generated at insert time
  user_id      TEXT NOT NULL,             -- owner of this event — makes rows self-describing for export, analytics, and Data Studio debugging
  kind         TEXT NOT NULL,             -- event type: see Event Types below
  payload_json TEXT NOT NULL,             -- full event details as JSON object
  captured_at  INTEGER NOT NULL,          -- unix timestamp ms — when the event actually occurred
  ingested_at  INTEGER NOT NULL,          -- unix timestamp ms — when this row was written (may differ from captured_at for offline/delayed events)
  source       TEXT NOT NULL,             -- which system path produced this event
  session_id   TEXT,                      -- which session this event was captured in (NULL if outside a session)
  entity_kind  TEXT,                      -- the kind of entity involved: 'product', 'recipe', 'place', etc. — NULL if no entity
  entity_id    TEXT,                      -- external ID of the entity involved (product_id, recipe_id, place_id) — NULL if no entity
  geo_hash     TEXT                       -- 6-char geohash of where the user was — NULL if location unavailable
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const memoryEvent = sqliteTable('memory_event', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull(),      // self-describing — needed for export, analytics, Data Studio
  kind:        text('kind').notNull(),         // free text — system constants + AI can write freely
  payloadJson: text('payload_json').notNull(),
  capturedAt:  integer('captured_at').notNull(),
  ingestedAt:  integer('ingested_at').notNull(),
  source:      text('source').notNull(),       // free text — enforced by system code, not SQL
  sessionId:   text('session_id'),
  entityKind:  text('entity_kind'),            // free text — system constants, AI can extend
  entityId:    text('entity_id'),
  geoHash:     text('geo_hash'),
})
```

## Column Decisions

**`id` — UUID, not autoincrement**
Events get referenced by ID from other places (scheduled_alarms carries event_id so the alarm handler knows which event triggered it). A UUID is portable and stable. Autoincrement integers are not safe across potential future migrations.

**`kind` — free text everywhere, no enum anywhere**
Two write paths exist: system code writes known kinds (`product_scanned`, `sickness_logged`, etc.) and the AI writes via `log_memory_event` with whatever kind it judges correct. If we enum `kind`, we break path 2 — the AI cannot log anything we didn't anticipate. Free text preserves that. The known system kinds are constants in code, not SQL constraints.

**`source` — free text, system-set**
Always set by system infrastructure, never by the AI. The system knows which code path produced the event. No enum in SQL — new entry points (a new platform integration, a new import source) don't need a migration. Constants in code are enough.

**`entity_kind` — free text, not enum**
Same reasoning as `kind`. The AI via `log_memory_event` might log an event involving an entity type we haven't defined yet (a supplement, a clinic, a brand). Free text lets it. System code uses known constants.

**`captured_at` vs `ingested_at` — two timestamps**
A user might be offline and the app buffers events. When the event finally syncs, `captured_at` is when it happened on the device, `ingested_at` is when the row was written to the DO. Illness detective must query by `captured_at` (what did the user eat in the last 72 real-world hours), not `ingested_at`. Both are needed.

**`session_id` — nullable**
Many events happen outside a conversation session: a background receipt parse, a silent scan, a delayed alarm. These have no session. Nullable is correct.

**`entity_kind` + `entity_id` — extracted from payload**
The illness detective and recall alert need to query "all scan events for product X" or "all events involving this place." Doing this with `json_extract(payload_json, '$.product_id')` on every row is slow and unindexable. Pulling entity identity into dedicated columns makes it fast and indexable.

**`geo_hash` — 6-char geohash**
6 characters = ~1.2km precision. Enough to know "user was at this restaurant district" without storing exact GPS coordinates. Used for restaurant/market context in illness detective and travel features. Nullable — many events have no location.

**`user_id` — kept, not removed**
Every row technically belongs to the same user because this is a per-user DO. But removing `user_id` makes every row anonymous outside the DO's own context. Data export (GDPR), analytics pipelines, and Cloudflare Data Studio debugging all become painful — you have to join the DO name in externally. One TEXT column per row is a trivial cost. Rows being self-describing is worth it.

## Event Types (kind values)

```
product_scanned       — user scanned a barcode
receipt_ingested      — receipt parsed (from photo or email)
recipe_imported       — recipe saved from any source
recipe_cooked         — user started/completed cooking a recipe
meal_logged           — user manually logged a meal
sickness_logged       — user reported feeling unwell
travel_intent         — destination + date detected from conversation
place_visited         — restaurant or market visit detected
constraint_declared   — user explicitly stated an allergy or dislike
visual_intake         — photo classified (spec 34): food, medication, stool, label, etc.
session_ended         — cooking session completed, summary available
```

## Indexes

```sql
CREATE INDEX idx_memory_event_kind        ON memory_event (kind, captured_at DESC);
CREATE INDEX idx_memory_event_entity      ON memory_event (entity_kind, entity_id, captured_at DESC);
CREATE INDEX idx_memory_event_captured    ON memory_event (captured_at DESC);
CREATE INDEX idx_memory_event_session     ON memory_event (session_id) WHERE session_id IS NOT NULL;
```

**Why these indexes:**
- `(kind, captured_at)` — illness detective: `WHERE kind IN (...) AND captured_at > ?` — the most common query pattern
- `(entity_kind, entity_id, captured_at)` — recall alert: `WHERE entity_kind = 'product' AND entity_id = ?` — find all scans of a specific product ever
- `(captured_at)` — behavioral pattern detection: full chronological scan of all events
- `(session_id)` — partial index (non-null only) — group all events from a single session

## Write Rules

- Written by the Orchestrator DO every time a meaningful user action occurs.
- Written by the `log_memory_event` tool when the agent logs a durable outcome.
- NEVER updated after insert. NEVER deleted.
- `ingested_at` is always `Date.now()` at insert time, set by the DO, never by the caller.
- `id` is always generated by the DO at insert time (crypto.randomUUID()).

## Read Rules

- Read by the illness detective (`run_illness_detective` tool): last 72h of events, all kinds.
- Read by recall alert infrastructure: all `product_scanned` events for a given entity_id.
- Read by behavioral pattern detection (DO alarm): full chronological scan.
- Read by travel pre-load (DO alarm): the specific `travel_intent` event that triggered the alarm.
- Read by sickness follow-up (DO alarm): the specific `sickness_logged` event that triggered the alarm.
- NEVER bulk-loaded into system prompts. Events are queried on demand, not preloaded.

## What Is NOT Stored Here

- Conversation messages → `session_turns`
- Structured facts about the user → `user_memory`
- Personality traits → `user_personality`
- Recipe content → `recipes`
- Alarm scheduling → `scheduled_alarms`
