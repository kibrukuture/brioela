# Tool: create_user_skill

## Purpose

`create_user_skill` creates a new procedural skill row in `skills`. Skills are reusable instruction sets the agent loads on demand when it recognizes a task that matches a known procedure.

The agent calls this when it discovers a new procedure worth preserving — something it figured out during a session that will be useful again. Not every useful thing becomes a skill. A skill is a repeatable, generalized procedure. A one-off observation is a `user_memory` fact.

Examples of things that become skills:
- The agent developed a specific multi-step approach for coaching a user through cooking a complex dish — worth preserving as `doro-wat-coaching`
- The agent identified a pattern for detecting this specific user's foodborne illness signals — worth preserving as `illness-signal-detection`

Examples of things that do NOT become skills:
- The agent noticed the user prefers spicy food — that is a `user_memory` fact
- The agent answered a question well — a good response is not a reusable procedure

## Before Calling This Tool

The full skill index (name + description for every active skill) is injected into every session prompt. Before calling `create_user_skill`, the agent must review the existing index and confirm:
1. No existing skill covers this procedure
2. No existing skill could be updated to cover it via `update_user_skill`

Duplicate skills fragment the index and confuse skill selection. The agent is the deduplication layer — it reads the index and judges. This tool does not perform semantic deduplication.

## Input Schema

```typescript
import { z } from 'zod'

export const CreateUserSkillSchema = z.object({
  name: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // The skill's unique name — primary key in the skills table.
  // This is the exact string used in view_user_skill(name).
  // Format: lowercase, hyphens only, starts with a letter.
  // Examples: 'doro-wat-coaching', 'illness-signal-detection', 'spice-layering'
  // Must not conflict with any existing skill name.

  description: z.string().min(1).max(120),
  // One-line description — the ONLY part shown in the skill index every session.
  // Max 120 chars. Must be specific enough for the agent to decide to load this skill.
  // Bad:  "helps with cooking" (too vague — what kind of cooking?)
  // Good: "Multi-step voice coaching procedure for long Ethiopian stew sessions"

  content: z.string().min(1),
  // Full markdown content of the skill — the actual procedure.
  // Only loaded into context when view_user_skill(name) is called.
  // No size cap enforced here — but content exceeding ~4000 tokens becomes a
  // context burden and the Brain maintenance will flag it.

  tags: z.array(z.string()).default([]),
  // Brain maintenance metadata only — never shown in the index, never used for skill selection.
  // Used by the Brain maintenance for grouping and overlap detection.
  // Examples: ["cooking", "voice", "ethiopian"]

  reason: z.string().min(1),
  // Why this skill is being created. Logged for audit.
  // Examples: "Developed during 2-hour doro wat session — procedure worth preserving"
})
```

## Duplicate Name Guard

Before inserting, the tool checks whether a skill with this name already exists:

```typescript
const existing = db.select()
  .from(skills)
  .where(eq(skills.name, input.name))
  .get()

if (existing) {
  return {
    error: 'skill_already_exists',
    name: input.name,
    hint: 'Use update_user_skill to update the existing skill instead.'
  }
}
```

The agent should have checked the index before calling this. The guard is a safety net, not the primary check.

## What the System Fills In Automatically

| Field | Value |
|---|---|
| `user_id` | From DO context |
| `source` | `'user'` — always. System skills are seeded at initialization, not through this tool |
| `status` | `'active'` |
| `version` | `1` |
| `use_count` | `0` |
| `last_used_at` | `NULL` |
| `archived_reason` | `NULL` |
| `created_at` | `Date.now()` |
| `updated_at` | `Date.now()` |

## What It Writes

One row inserted into `skills`:

```typescript
db.insert(skills).values({
  name:           input.name,
  userId:         ctx.userId,
  description:    input.description,
  content:        input.content,
  tags:           JSON.stringify(input.tags),
  source:         'user',
  status:         'active',
  version:        1,
  useCount:       0,
  lastUsedAt:     null,
  archivedReason: null,
  createdAt:      Date.now(),
  updatedAt:      Date.now(),
})
```

## What It Returns

On success:

```json
{
  "name": "doro-wat-coaching",
  "status": "created",
  "version": 1
}
```

## Side Effects

None immediate. The skill index is rebuilt at the start of the next session — the new skill will appear in the index from then on. Within the current session, the agent knows the skill exists because it just created it.

No alarm, no background job triggered.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Name format wrong, description over 120 chars, content empty | Zod error with failing field |
| Skill already exists | A row with this name already exists in `skills` | `{ error: 'skill_already_exists', name, hint }` |
| Write failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session, for `source = 'user'` skills only
- **NOT the Brain maintenance** — the Brain maintenance updates and archives existing skills, it never creates new ones
- **NOT for system skills** — system skills are seeded at DO initialization via code, not through this tool

## What Is NOT This Tool's Job

- Updating an existing skill's content → `update_user_skill`
- Loading a skill's content into context → `view_user_skill`
- Archiving a skill → `archive_user_skill`
- Deleting a skill → `delete_user_skill`
- Creating system skills → DO initialization code only
