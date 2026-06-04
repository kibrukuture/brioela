# Table: user_personality

## Why This Table Exists

`user_personality` holds synthesized personality traits the agent infers from patterns across accumulated facts. Not a single observation. Not a declared preference. A pattern that emerged over time from many observations.

Examples:
- "stress-eater" — agent noticed the user scans comfort food late at night repeatedly after certain kinds of days
- "texture-sensitive" — agent noticed the user consistently rejects foods with certain textures across many sessions
- "adventurous-abroad" — agent noticed the user tries unfamiliar foods when traveling but sticks to familiar foods at home
- "grandma-cook" — agent recognized the user consistently gravitates toward traditional recipes and multi-generational techniques

None of these are declared by the user. None are predefined by the developer. The agent invents them from evidence.

This is NOT `user_memory`. A fact is a specific thing that is true: "user takes metformin." A trait is a behavioral pattern synthesized across many facts: "user eats defensively around health scares." Facts are atomic. Traits are emergent.

## Decision: Why not store traits inside user_memory?

`user_memory` is keyed by `namespace:key`. You could store a trait as `personality.traits:stress-eater`. But that collapses two fundamentally different things into one table:
- Facts: discrete, directly observed, merged on update
- Traits: synthesized, probabilistic, have a strength that decays over time, carry an evidence trail

The Curator treats them completely differently. Facts get merged. Traits get revised — strength updated, evidence extended, decay applied. Putting them in the same table means the Curator needs conditional logic everywhere: "if this entry is a trait, do X; if it's a fact, do Y." That is a design smell. Separate tables, separate semantics, clean Curator logic.

## Decision: UUID is the primary key, UNIQUE constraint on trait name

`id` is a UUID. `trait` has a UNIQUE constraint. Reason: the Curator can refine trait names over time — `stress-eater` might become `emotional-eater` as evidence sharpens. If `trait` were the primary key, renaming it means delete + re-insert and `inferred_at` history is destroyed. UUID absorbs the rename — the row keeps its identity, `inferred_at` stays, history is preserved. Uniqueness on `trait` still enforces one row per name.

## Decision: evidence points to user_memory IDs, not memory_event IDs

The spec says "JSON array of observation IDs" without defining what an observation is.

The chain is:
```
memory_event (raw) → agent extracts → user_memory (facts) → Curator synthesizes → user_personality (traits)
```

The Curator never touches `memory_event`. It reads `user_memory`. So evidence must point to what the Curator actually reads — `user_memory` composite IDs (`namespace:key` strings). This makes the evidence trail auditable: you can look at any trait, read its evidence array, and pull the exact `user_memory` entries that caused the Curator to infer it.

## Decision: trait names follow the same Zod constraint as skills

The spec says "AI-decided name" — correct, the developer defines zero valid traits. But the AI must follow a naming format. Reason: `trait` is the primary key and `skill_view`-style exact lookups depend on consistent naming. If the AI writes `Stress Eater` once and `stress-eater` next time, they are two different primary keys — two rows for the same trait, neither complete.

Constraint: `/^[a-z][a-z0-9-]*$/`, max 64 chars. Lowercase, hyphens only. Same as skills. Enforced by Zod at the tool boundary.

## Decision: strength decay rule

The spec defines the range (0.0–1.0) but not how strength moves. Rules defined here:

- **First inference**: AI sets initial strength based on how much evidence it has at inference time. Strong pattern → 0.7+. Tentative → 0.4.
- **Curator pass — supporting evidence found**: strength increases by 0.05 per new supporting `user_memory` entry, capped at 1.0.
- **Curator pass — contradicting evidence found**: strength decreases by 0.1 per contradicting entry, floor 0.0.
- **Curator pass — no new evidence in 30 days**: strength decays by 0.03. Passive decay for traits the user's behavior no longer supports.
- **Strength below 0.15 after decay**: Curator sets `active = 0`. Trait is deactivated, not deleted.

## CREATE TABLE

```sql
CREATE TABLE user_personality (
  id            TEXT PRIMARY KEY,   -- UUID v4 — stable identity even if trait name is refined
  user_id       TEXT NOT NULL,      -- owner — self-describing for export and Data Studio
  trait         TEXT NOT NULL UNIQUE, -- AI-invented name: lowercase, hyphens only, max 64 chars
  summary       TEXT NOT NULL,      -- Curator-written paragraph describing the specific observed pattern for this user — the real content the LLM uses
  evidence      TEXT NOT NULL,      -- JSON array of user_memory IDs (namespace:key strings) that support this trait
  strength      REAL NOT NULL,      -- 0.0 to 1.0 — how strongly this trait is supported by evidence
  active        INTEGER NOT NULL DEFAULT 1,  -- 1 = active, 0 = deactivated by Curator (never hard deleted)
  revised_count INTEGER NOT NULL DEFAULT 0,  -- how many times the Curator has updated this trait
  inferred_at   INTEGER NOT NULL,   -- unix timestamp ms — when this trait was first created
  last_seen_at  INTEGER NOT NULL,   -- unix timestamp ms — when the most recent supporting evidence was observed
  updated_at    INTEGER NOT NULL    -- unix timestamp ms — when this row last changed (strength, evidence, active)
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const userPersonality = sqliteTable('user_personality', {
  id:           text('id').primaryKey(),           // UUID — stable even if trait name is refined
  userId:       text('user_id').notNull(),
  trait:        text('trait').notNull().unique(),  // AI-invented, Zod-enforced format
  summary:      text('summary').notNull(),         // Curator-written paragraph — the actual content the LLM reads
  evidence:     text('evidence').notNull(),        // JSON array of user_memory IDs
  strength:     real('strength').notNull(),
  active:       integer('active').notNull().default(1),
  revisedCount: integer('revised_count').notNull().default(0),
  inferredAt:   integer('inferred_at').notNull(),
  lastSeenAt:   integer('last_seen_at').notNull(),
  updatedAt:    integer('updated_at').notNull(),
})
```

## Column Decisions

**`id` — UUID, never changes**
The stable identity of the row. Even if the Curator refines the trait name, the UUID stays. All external references (scheduled jobs, logs) point to the UUID, not the name.

**`trait` — UNIQUE, AI-invented, Zod-constrained**
The name the agent chooses for the pattern it observed. Developer defines nothing. The AI sees the existing trait list before creating a new one — same intelligence layer as `user_memory` namespaces — and extends existing traits before inventing new ones. Zod enforces format: `/^[a-z][a-z0-9-]*$/`, max 64. UNIQUE constraint prevents two rows with the same name.

**`summary` — the actual content the LLM uses**
The trait name alone ("stress-eater") is a label. The LLM would guess its meaning from training data — which means it guesses what stress-eater means generically, not what it means for THIS user specifically. Two users can both be "stress-eaters" in completely different ways. The `summary` is a short paragraph the Curator writes when it first infers the trait and updates as the trait evolves. Example:

```
"Consistently scans and buys comfort food (chips, chocolate, instant noodles)
late at night on weekdays. Pattern strongest after 9pm. Correlates with days
where calendar shows back-to-back meetings."
```

This is user-specific. This is what gives the trait real meaning beyond a word. The LLM reads this in the system prompt and has actual context to act on — not a generic interpretation.

**`user_id` — kept**
Same reason as all other tables. Rows must be self-describing outside the DO.

**`evidence` — JSON array of user_memory IDs**
Every trait must be traceable. The evidence array is the audit trail — the exact `user_memory` entries the Curator read when it inferred this trait. When the Curator revisits a trait, it reads the evidence array, re-reads those `user_memory` entries, checks if they still exist and are still active, and adjusts strength accordingly. Evidence grows on each Curator pass as new supporting entries are added. It never shrinks — even if a `user_memory` entry is deactivated, the evidence reference stays so the history is preserved.

**`strength` — 0.0 to 1.0, moves on every Curator pass**
Not static. Strength reflects current evidence weight, not historical peak. A trait that was strong 6 months ago but has had no supporting evidence since will decay toward deactivation. A trait with fresh, repeated evidence stays high.

**`active` — soft delete only**
A deactivated trait is invisible to the agent during sessions. But it stays in the table. Reason: if the behavior returns, the Curator can reactivate the existing trait and its full history rather than creating a new one from scratch. History is never destroyed.

**`revised_count` — Curator stability signal**
A trait revised once and held steady is a stable, well-established pattern. A trait revised 15 times with fluctuating strength is uncertain — the agent keeps changing its mind about it. High `revised_count` + low `strength` + many contradicting evidence entries = strong deactivation candidate.

**`inferred_at` vs `last_seen_at` vs `updated_at` — three different timestamps**
- `inferred_at`: when the trait was born. Never changes.
- `last_seen_at`: when the most recent supporting evidence in `user_memory` was last written. The Curator updates this when it finds fresh supporting entries. If `last_seen_at` is 60+ days ago, the user's behavior no longer supports this trait.
- `updated_at`: when this row last changed for any reason. Catches all Curator writes even if `last_seen_at` didn't move.

## Zod Schema (Tool Boundary Enforcement)

```typescript
import { z } from 'zod'

const PersonalityTraitSchema = z.object({
  trait: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    // allows:  "stress-eater", "texture-sensitive", "grandma-cook"
    // rejects: "Stress Eater" (uppercase), "stress_eater" (underscore), "stress eater" (space)
    .max(64),
  summary: z.string().min(1),           // Curator writes this — cannot be empty
  evidence: z.array(z.string()).min(1), // at least one user_memory ID — no evidence = no trait
  strength: z.number().min(0).max(1),
})
```

## Indexes

```sql
CREATE INDEX idx_user_personality_active   ON user_personality (active, strength DESC);
CREATE INDEX idx_user_personality_seen     ON user_personality (last_seen_at DESC) WHERE active = 1;
```

**Why these indexes:**
- `(active, strength DESC)` — session context assembly: load all active traits ordered by strength — strongest traits injected first, weakest last (or truncated if too many)
- `(last_seen_at DESC)` partial on active — Curator decay pass: find active traits with no recent evidence, candidates for strength reduction or deactivation

## Write Rules

- Written ONLY by the Curator on its maintenance pass.
- The agent does NOT write to this table directly mid-conversation. Traits emerge from the Curator's analysis, not from a single conversation.
- On first inference: full row insert with initial strength set by the Curator's model pass.
- On Curator revision: `strength`, `evidence`, `last_seen_at`, `revised_count`, `updated_at` updated. `trait` and `inferred_at` never change after insert.
- On deactivation: `active = 0`, `updated_at` updated. Row stays.
- `updated_at` always set to `Date.now()` at write time by the Curator, never passed in externally.

## Read Rules

- Loaded into session context by `get_session_context()` — active traits only, ordered by `strength DESC`.
- Read by the Curator on its maintenance pass — reads all active traits, re-evaluates evidence, updates strength.
- Used by recommendation engine to personalize suggestions (a `stress-eater` trait triggers different recommendations than a `meal-planner` trait).
- NEVER loaded in bulk into every prompt — only the top N strongest active traits are injected to avoid context bloat.

## What Is NOT Stored Here

- Declarative facts about the user → `user_memory`
- Raw event history → `memory_event`
- Procedural skill instructions → `skills`
- Hard safety constraints (allergies, dietary restrictions) → `constraints`
