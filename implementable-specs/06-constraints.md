# Table: constraints

## Why This Table Exists

Constraints are safety-critical. A user with a peanut allergy receiving a recommendation that includes peanuts is not a bad UX — it is a medical incident. This table gates every food recommendation, scan result, recipe suggestion, and cooking session in the entire product. Every feature that touches food must check this table before surfacing anything to the user.

This is NOT `user_memory`. You could store `diet.restrictions:peanuts` in `user_memory`. The reason you must not: constraints have a **confirmation workflow** that `user_memory` does not. A constraint starts as `proposed` (agent inferred it from behavior) and becomes `confirmed` only when verified. A proposed peanut allergy surfaces warnings. A confirmed peanut allergy blocks unconditionally. These are two behaviors, not two confidence levels. `user_memory` has no concept of proposed vs confirmed — it has facts. Constraints need their own table.

## Confirmation Is Fully Ambient — No Forms, No Settings

Brioela has no form inputs, no settings screens, no explicit UI for managing constraints. Confirmation surfaces at contextually relevant moments during real interactions:

- User scans a product containing peanuts. Agent has seen them avoid peanut products 4 times. Mid-scan: "You've been avoiding peanuts — is that an allergy?" User says yes or no. Done.
- Mid cooking session, recipe has peanut oil. Agent in voice: "This has peanut oil. I have you flagged as avoiding peanuts — is that an allergy I should always block?"
- User never contradicts a proposed dislike across many sessions → behavioral threshold auto-confirms it. No user action needed.

Confirmation is earned through real interactions, not through a form the user fills out once and forgets.

## Confirmation Status Levels

- `proposed` — agent inferred this from behavioral patterns. Constraint is active (surfaces warnings) but not yet verified.
- `auto_confirmed` — user never contradicted it across enough touchpoints. Valid ONLY for soft constraints (dislike, boycott). Never for hard allergies or dietary identity.
- `confirmed` — user explicitly said yes in a conversation. This is the only valid status for hard_allergy and dietary_identity.
- `rejected` — user explicitly said no. Row stays (history preserved) but constraint is inactive.

## Five Constraint Types — Different Behaviors

**`hard_allergy`** — BLOCK unconditionally. Any product, recipe, or ingredient containing this triggers a hard block and an immediate warning before the user can proceed. Never auto-confirmed. Requires explicit user confirmation. A behavioral inference alone is never enough to treat something as a hard allergy — the cost of a false positive (blocking a food the user can actually eat) is low. The cost of a false negative (missing a real allergy) is a medical incident.

**`intolerance`** — WARN but do not block. The user can proceed but sees a warning. Can auto-confirm after a high behavioral threshold (many consistent avoidance events with no contradictions).

**`dislike`** — DEPRIORITIZE silently. Products and recipes containing this are shown lower or not at all. No warning shown. Auto-confirm is appropriate — the cost of being wrong is low.

**`dietary_identity`** — FILTER entire categories. Vegan filters all animal products. Halal filters pork and alcohol. Kosher filters specific combinations. This is identity-level, not ingredient-level. Requires explicit confirmation — behavioral inference alone is not enough for something this broad.

**`boycott`** — BLOCK a specific brand or place entirely. "I never buy Nestlé." "I don't go to that restaurant." Can auto-confirm from behavioral patterns (user has consistently avoided a brand across many scans with no contradictions).

## Decision: evidence points to memory_event IDs here, not user_memory IDs

Unlike `user_personality` where evidence points to `user_memory` entries, constraint evidence points to `memory_event` IDs. Reason: constraints are proposed from raw behavioral events — a scan event, a receipt event, a place_visited event. The Brain maintenance never proposes constraints (the agent does, via `propose_user_constraint` tool). The agent infers directly from events, not from derived facts. The evidence trail must point back to the raw events that triggered the inference.

## Decision: Brain maintenance never touches this table

Constraints are too safety-critical for autonomous background modification. The Brain maintenance runs periodically and makes judgment calls about stale skills and fading personality traits. That is acceptable for those tables. It is not acceptable for a hard allergy. No automated process changes constraint status without a user-triggered confirmation event. The Brain maintenance reads this table (to understand the user's restrictions for the Brain maintenance's own context) but never writes to it.

## CREATE TABLE

```sql
CREATE TABLE constraints (
  id                   TEXT PRIMARY KEY,   -- UUID v4
  user_id              TEXT NOT NULL,      -- owner — self-describing for export and Data Studio
  constraint_type      TEXT NOT NULL,      -- 'hard_allergy' | 'intolerance' | 'dislike' | 'dietary_identity' | 'boycott'
  entity_kind          TEXT NOT NULL,      -- 'ingredient' | 'category' | 'brand' | 'place'
  entity_value         TEXT NOT NULL,      -- the actual thing: "peanuts", "vegan", "Nestlé", "that shawarma place"
  status               TEXT NOT NULL DEFAULT 'proposed', -- 'proposed' | 'confirmed' | 'auto_confirmed' | 'rejected'
  confidence           REAL NOT NULL DEFAULT 0.5,        -- 0.0 to 1.0 — how certain the agent is at proposal time
  evidence             TEXT NOT NULL DEFAULT '[]',       -- JSON array of memory_event IDs that led to this proposal
  surfaced_count       INTEGER NOT NULL DEFAULT 0,       -- how many times the agent has surfaced this for confirmation
  last_surfaced_at     INTEGER,            -- unix timestamp ms — when this was last surfaced to the user (NULL = never)
  confirmation_source  TEXT,              -- 'user_explicit' | 'behavioral_threshold' | NULL if still proposed
  notes                TEXT,              -- optional context the agent captured at proposal time
  proposed_at          INTEGER NOT NULL,  -- unix timestamp ms — when the agent first inferred this
  confirmed_at         INTEGER,           -- unix timestamp ms — when status moved to confirmed/auto_confirmed (NULL if proposed/rejected)
  updated_at           INTEGER NOT NULL   -- unix timestamp ms — last change to this row
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const constraints = sqliteTable('constraints', {
  id:                 text('id').primaryKey(),
  userId:             text('user_id').notNull(),
  constraintType:     text('constraint_type').notNull(),   // free text — Zod enforces known values
  entityKind:         text('entity_kind').notNull(),        // free text — Zod enforces known values
  entityValue:        text('entity_value').notNull(),
  status:             text('status').notNull().default('proposed'),
  confidence:         real('confidence').notNull().default(0.5),
  evidence:           text('evidence').notNull().default('[]'),   // JSON array of memory_event IDs
  surfacedCount:      integer('surfaced_count').notNull().default(0),
  lastSurfacedAt:     integer('last_surfaced_at'),
  confirmationSource: text('confirmation_source'),
  notes:              text('notes'),
  proposedAt:         integer('proposed_at').notNull(),
  confirmedAt:        integer('confirmed_at'),
  updatedAt:          integer('updated_at').notNull(),
})
```

## Column Decisions

**`id` — UUID**
Constraints are referenced externally (alarm payloads, session context, scan results all need to reference a specific constraint). UUID is stable and portable.

**`constraint_type` — free text, Zod-enforced known values**
Five known values: `hard_allergy`, `intolerance`, `dislike`, `dietary_identity`, `boycott`. No SQL enum — new constraint types can be added without migration. Zod at tool boundary enforces the known set.

**`entity_kind` — free text, Zod-enforced known values**
`ingredient`, `category`, `brand`, `place`. No SQL enum. Determines what `entity_value` means and how the constraint is checked against product data.

**`entity_value` — the actual constrained thing**
Free text. "peanuts", "lactose", "gluten", "vegan", "Nestlé", "Bole Road shawarma place". This is what gets matched against product ingredients, recipe contents, and place IDs at check time.

**`status` — four states, not two**
`proposed` and `confirmed` are not enough. `auto_confirmed` is needed because the confirmation source matters — an auto-confirmed dislike has different weight than an explicitly confirmed hard allergy. `rejected` is needed because deleted rows lose history — if a user says "I'm not allergic to that" and the row is deleted, and later they ARE allergic, there is no record of the prior rejection to flag as contradictory.

**`confidence` — set at proposal time, never updated**
The agent's certainty when it first inferred the constraint. This is not a dynamic score like `user_personality.strength` — it is a snapshot of how strong the evidence was at inference time. Once confirmed or rejected, confidence is irrelevant. It is preserved for historical context only.

**`evidence` — JSON array of memory_event IDs**
Points to the raw events that triggered the inference. Different from `user_personality` which points to `user_memory` IDs — constraints are inferred directly from events, not from derived facts.

**`surfaced_count` + `last_surfaced_at`**
The agent must not hammer the user with the same confirmation request every session. `surfaced_count` and `last_surfaced_at` tell the agent when it last asked and how many times. Surfacing logic: never surface more than once per 7 days for the same constraint. Stop surfacing after 5 rejections with no contradicting behavior — the user has made their position clear.

**`confirmation_source` — 'user_explicit' or 'behavioral_threshold'**
For hard allergies: only `user_explicit` is valid. For dislikes and boycotts: `behavioral_threshold` is valid after enough consistent avoidance events. This column records which path produced the confirmation — critical for auditing safety-critical rows.

**`notes` — optional, nullable**
Context the agent captured at proposal time. "User said 'that place made me sick' after a receipt from Bole Road shawarma." Freeform. Never required. Helps the agent surface a richer confirmation message later.

**`proposed_at` vs `confirmed_at` vs `updated_at`**
- `proposed_at`: when the agent first inferred this. Never changes.
- `confirmed_at`: when status moved to confirmed or auto_confirmed. NULL until then.
- `updated_at`: when the row last changed for any reason.

## Zod Schema (Tool Boundary Enforcement)

```typescript
import { z } from 'zod'

const ProposeConstraintSchema = z.object({
  constraint_type: z.enum(['hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott']),
  entity_kind:     z.enum(['ingredient', 'category', 'brand', 'place']),
  entity_value:    z.string().min(1).max(200),
  confidence:      z.number().min(0).max(1),
  evidence:        z.array(z.string()).min(1),  // at least one memory_event ID — no evidence = no proposal
  notes:           z.string().optional(),
})

const ConfirmConstraintSchema = z.object({
  id:                  z.string().uuid(),
  confirmation_source: z.enum(['user_explicit', 'behavioral_threshold']),
})
```

## Auto-Confirmation Thresholds

Auto-confirmation (behavioral_threshold) is valid only for: `dislike`, `intolerance`, `boycott`. Never for `hard_allergy` or `dietary_identity`.

Threshold rules:
- `dislike`: 5+ avoidance events across 3+ different sessions with zero contradictions → auto-confirm
- `intolerance`: 3+ negative outcome events (felt unwell after consuming) with no contradictions → auto-confirm
- `boycott`: 7+ scan or receipt events where the brand/place was consistently avoided with no purchases → auto-confirm

These thresholds are enforced in agent logic, not in SQL. SQL stores the result.

## Indexes

```sql
CREATE INDEX idx_constraints_type_status  ON constraints (constraint_type, status);
CREATE INDEX idx_constraints_entity       ON constraints (entity_kind, entity_value, status);
CREATE INDEX idx_constraints_surfaced     ON constraints (last_surfaced_at) WHERE status = 'proposed';
```

**Why these indexes:**
- `(constraint_type, status)` — load all active hard allergies fast: `WHERE constraint_type = 'hard_allergy' AND status IN ('confirmed', 'proposed')`
- `(entity_kind, entity_value, status)` — check if a specific ingredient is constrained: `WHERE entity_kind = 'ingredient' AND entity_value = 'peanuts'`
- `(last_surfaced_at)` partial on proposed — find proposed constraints due for resurfacing: `WHERE status = 'proposed' AND last_surfaced_at < ?`

## Write Rules

- `propose_user_constraint` tool — agent only. Inserts a new row with `status = 'proposed'`. Zod validates all fields. At least one `memory_event` ID required in evidence.
- `confirm_user_constraint` tool — called after user explicitly confirms in conversation. Sets `status = 'confirmed'`, `confirmation_source = 'user_explicit'`, `confirmed_at = now`.
- Auto-confirmation — agent logic sets `status = 'auto_confirmed'`, `confirmation_source = 'behavioral_threshold'`, `confirmed_at = now`. Only for eligible constraint types.
- Rejection — agent sets `status = 'rejected'` when user says no. Row preserved.
- `surfaced_count` increments and `last_surfaced_at` updates every time the agent surfaces this constraint for confirmation.
- Brain maintenance NEVER writes to this table.

## Read Rules

- Read on every scan: `WHERE entity_kind = 'ingredient' AND entity_value IN (product_ingredients) AND status != 'rejected'`
- Read on recipe load: same ingredient check across all recipe ingredients
- Read on session context assembly: all non-rejected constraints loaded into every prompt — the agent must always know the full constraint picture
- Read by the agent before surfacing confirmation: checks `surfaced_count` and `last_surfaced_at` to decide if it's time to ask again

## What Is NOT Stored Here

- General user preferences and facts → `user_memory`
- Personality traits → `user_personality`
- Raw event history → `memory_event`
- Procedural skills → `skills`
