# Tool: archive_user_skill

## Purpose

`archive_user_skill` sets a skill's status to `archived` and records why. The row stays in `skills` permanently — content is preserved. Archiving removes the skill from the index so the agent no longer sees it in the prompt and can no longer load it via `view_user_skill`.

Archiving is not deletion. Deletion is `delete_user_skill`. Archiving is the right action when a skill is no longer useful but the history of it having existed matters.

## When to Call It

**Agent calls it when:**
- The user explicitly says "we don't need that skill anymore"
- The agent determines a skill has become obsolete — superseded by a better one it just created

**Curator calls it when:**
- `use_count` is low and `last_used_at` is beyond the stale threshold
- Two skills overlap significantly — one is archived in favor of the other
- A skill's content is no longer coherent or relevant based on accumulated user_memory

Do NOT call `archive_user_skill` for:
- System skills (`source = 'system'`) — these are never archived via tools
- Skills that just need content updates → `update_user_skill`
- Permanent removal → `delete_user_skill`

## Input Schema

```typescript
import { z } from 'zod'

export const ArchiveUserSkillSchema = z.object({
  name: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // The skill to archive. Must exist and must have source = 'user'.

  reason: z.string().min(1),
  // Why this skill is being archived. Required — stored permanently in archived_reason.
  // Examples:
  //   "Superseded by spice-layering-advanced which covers all cases this covered"
  //   "User confirmed they no longer cook this style of dish"
  //   "Stale: last used 90 days ago, use_count = 1, never refined past version 1"

  archived_by: z.enum(['agent', 'curator']),
  // Who is archiving. Stored implicitly in the reason — makes accountability clear.
})
```

## Pre-Archive Guards

```typescript
const skill = db.select().from(skills).where(eq(skills.name, input.name)).get()

if (!skill) {
  return { error: 'skill_not_found', name: input.name }
}

if (skill.source === 'system') {
  return { error: 'system_skill_immutable', name: input.name,
           hint: 'System skills cannot be archived via tools.' }
}

if (skill.status === 'archived') {
  return { error: 'already_archived', name: input.name }
}
```

## What It Writes

One update to `skills`:

```typescript
db.update(skills)
  .set({
    status:         'archived',
    archivedReason: input.reason,
    updatedAt:      Date.now(),
  })
  .where(eq(skills.name, input.name))
  .run()
```

No write to `skill_versions` — archiving does not create a version snapshot. The current content in `skills` is preserved in place. `skill_versions` records rewrites, not lifecycle changes.

## What It Returns

On success:

```json
{
  "name": "old-coaching-approach",
  "status": "archived",
  "archived_reason": "Superseded by doro-wat-coaching which covers all cases this covered"
}
```

## Effect on the Skill Index

The skill is immediately excluded from the index on the next session start. The current session's prompt still has the old index — the agent knows the skill is archived because it just archived it. No mid-session prompt refresh needed.

## Side Effects

None. No alarm triggered. No version snapshot created.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Name format wrong, reason empty | Zod error with failing field |
| Skill not found | No row with this name | `{ error: 'skill_not_found', name }` |
| System skill | source = 'system' | `{ error: 'system_skill_immutable', name, hint }` |
| Already archived | status already = 'archived' | `{ error: 'already_archived', name }` |
| Write failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — for `source = 'user'` skills, when user confirms or agent determines obsolescence
- **Curator** — for `source = 'user'` skills, during its maintenance pass
- **Neither** — for `source = 'system'` skills

## What Is NOT This Tool's Job

- Permanent deletion → `delete_user_skill`
- Updating content → `update_user_skill`
- Restoring an archived skill → developer-only action (set status = 'active' directly)
- Archiving system skills → never done via tools
