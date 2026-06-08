# Tool: delete_user_skill

## Purpose

`delete_user_skill` permanently removes a skill row from `skills`. Unlike `archive_user_skill`, which preserves the row and content forever, deletion is irreversible — the skill's content, description, tags, and metadata are gone. The `skill_versions` history for this skill is intentionally preserved after deletion, giving developers a record that the skill existed and what it contained at each version.

This is the nuclear option. `archive_user_skill` is the right call 95% of the time. Deletion is only appropriate when the user explicitly wants the skill gone and has no interest in its history surfacing anywhere.

## When to Call It

Call `delete_user_skill` only when:
- The user explicitly says something to the effect of "delete it", "get rid of it", "remove it completely" — not just "we don't need it anymore" (that is archive)
- The skill was created by mistake and has never been used (`version = 1`, `use_count = 0`)

Do NOT call `delete_user_skill` when:
- The user just wants the skill removed from the active index → `archive_user_skill`
- The skill is outdated or superseded → `archive_user_skill`
- The skill needs content changes → `update_user_skill`
- The skill has `source = 'system'` — system skills cannot be deleted via tools, ever

Default to `archive_user_skill`. Only escalate to `delete_user_skill` when the user's language is unambiguous about permanent removal.

## Input Schema

```typescript
import { z } from 'zod'

export const DeleteUserSkillSchema = z.object({
  name: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // The exact skill name to permanently delete. Must be source = 'user'.

  reason: z.string().min(1),
  // Why this skill is being permanently deleted. Required — stored in the
  // final skill_versions snapshot created before deletion.
  // This is the audit trail after the row is gone.
})
```

## Pre-Delete Guards

```typescript
const skill = db.select().from(skills).where(eq(skills.name, input.name)).get()

if (!skill) {
  return { error: 'skill_not_found', name: input.name }
}

if (skill.source === 'system') {
  return {
    error: 'system_skill_immutable',
    name: input.name,
    hint: 'System skills cannot be deleted. Use archive_user_skill for user skills only.'
  }
}
```

Note: archived skills CAN be deleted. If a skill is already archived and the user wants it permanently removed, deletion is valid.

## What It Writes

### Step 1 — Snapshot to skill_versions before deletion

Before removing the row, the tool archives the current skill state to `skill_versions` as a final snapshot:

```typescript
db.insert(skillVersions).values({
  id:           crypto.randomUUID(),
  skillName:    skill.name,
  userId:       ctx.userId,
  version:      skill.version,
  content:      skill.content,
  description:  skill.description,
  updatedBy:    'agent',
  updateReason: `[DELETED] ${input.reason}`,
  archivedAt:   Date.now(),
})
```

The `[DELETED]` prefix in `updateReason` marks this as a deletion snapshot, not a regular version archive. Developers reading `skill_versions` after the skill is gone can see exactly what the final content was and why it was deleted.

### Step 2 — Delete the skills row

```typescript
db.delete(skills).where(eq(skills.name, input.name)).run()
```

Both steps run in a single transaction. If the snapshot insert fails, the delete does not happen.

```typescript
db.transaction(() => {
  db.insert(skillVersions).values({ ... }).run()
  db.delete(skills).where(eq(skills.name, input.name)).run()
})
```

### What survives deletion

- All `skill_versions` rows for this skill — history is permanent
- The final snapshot created in step 1

### What is gone after deletion

- The `skills` row — name, description, content, tags, status, version, use_count
- The skill's presence in any future session index injection

## What It Returns

On success:

```json
{
  "name": "failed-experiment-skill",
  "deleted": true,
  "final_version_archived": true,
  "reason": "User asked to remove completely — skill was created in error"
}
```

## Side Effects

- The skill disappears from the session index at the next session start
- `skill_versions` gains a final deletion snapshot
- No alarm triggered. No other table touched.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Name format wrong, reason empty | Zod error with failing field |
| Skill not found | No row with this name in `skills` | `{ error: 'skill_not_found', name }` |
| System skill | source = 'system' | `{ error: 'system_skill_immutable', name, hint }` |
| Transaction failure | Either snapshot or delete fails | Error — both rolled back, skill unchanged |

## Who Can Call It

- **Agent** — for `source = 'user'` skills, only when user's intent is unambiguous permanent removal
- **NOT the Brain maintenance** — the Brain maintenance archives, it never deletes
- **Neither** — for `source = 'system'` skills

## What Is NOT This Tool's Job

- Soft removal / deprecation → `archive_user_skill`
- Content changes → `update_user_skill`
- Deleting skill version history → not exposed, developer-only
- Deleting system skills → never done via tools
