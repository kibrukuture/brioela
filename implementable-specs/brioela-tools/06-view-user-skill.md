# Tool: view_user_skill

## Purpose

`view_user_skill` loads a skill's full content into the agent's context on demand. The skill index (name + description) is injected into every session prompt — the agent reads the index, recognizes which skill is relevant, and calls `view_user_skill` to load the full procedure only when it actually needs it.

Full skill content is never preloaded into every prompt. Token cost is zero until this tool is called. This is the only tool that triggers `use_count` and `last_used_at` updates — every call is a signal that this skill is actively being used.

## When to Call It

Call `view_user_skill` when:
- The agent recognized a task in the skill index that matches the current situation
- The agent needs the full procedure to guide a session, not just the description
- The user explicitly asks about a skill: "how do you do the illness detective thing?"

Do NOT call `view_user_skill` for:
- Skills the agent already loaded earlier in the same session — content is in context, no repeat call needed
- Browsing skills out of curiosity — only load when the procedure is actually needed
- Checking if a skill exists — the index already shows all active skills

## Input Schema

```typescript
import { z } from 'zod'

export const ViewUserSkillSchema = z.object({
  name: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // The exact skill name from the index.
  // Must match the primary key in skills exactly — case-sensitive, exact string.
})
```

## What It Reads

```typescript
const skill = db.select()
  .from(skills)
  .where(
    and(
      eq(skills.name, input.name),
      inArray(skills.status, ['active', 'stale'])
    )
  )
  .get()
```

Only `active` and `stale` skills are readable. `archived` skills are not returned — they are excluded from the index and the agent should never attempt to load them.

## Side Effects

`use_count` and `last_used_at` are updated fire-and-forget after the content is returned. Never awaited. The agent receives the full content immediately.

```typescript
// after returning result — fire and forget
ctx.waitUntil(
  db.update(skills)
    .set({
      useCount:   sql`use_count + 1`,
      lastUsedAt: Date.now(),
      updatedAt:  Date.now(),
    })
    .where(eq(skills.name, input.name))
    .run()
)
```

These counters are the Brain maintenance's primary signal for stale detection. Every `view_user_skill` call extends the skill's active life.

## What It Returns

On success:

```json
{
  "name": "illness-signal-detection",
  "description": "Behavioral pattern analysis for detecting foodborne illness signals from recent events",
  "content": "# Illness Signal Detection\n\n## Step 1: ...",
  "version": 3,
  "use_count": 12,
  "source": "user",
  "status": "active"
}
```

The agent receives the full `content` — the complete markdown procedure — plus metadata for context.

**Skill not found or archived:**

```json
{
  "found": false,
  "name": "illness-signal-detection",
  "hint": "Skill not found or archived. Check the skill index for available skills."
}
```

Not an error. The agent should check the index and re-evaluate.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Name format wrong | Zod error with failing field |
| Not found / archived | Skill does not exist or status = 'archived' | `{ found: false, name, hint }` |
| Read failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session
- **NOT the Brain maintenance** — the Brain maintenance reads skill content directly in its maintenance pass, not through tools
- **NOT device SDK**

## What Is NOT This Tool's Job

- Creating a skill → `create_user_skill`
- Updating a skill's content → `update_user_skill`
- Listing all skills → the skill index is injected into every session prompt automatically
- Loading archived skills → not exposed, developer only
