# Tool: update_user_skill

## Purpose

`update_user_skill` rewrites an existing skill's content. Before overwriting, it archives the current version to `skill_versions` so no content is ever permanently lost. The archive and the update happen in a single transaction — they either both succeed or both fail.

This is the only tool that writes to both `skills` and `skill_versions`. The version archive is not optional and not skippable.

## When to Call It

Call `update_user_skill` when:
- The agent found a better approach to an existing procedure mid-session
- The Brain maintenance determined during its maintenance pass that a skill needs refinement
- The skill's description needs to be made more specific for better index selection

Do NOT call `update_user_skill` for:
- Creating a new skill → `create_user_skill`
- Archiving a skill → `archive_user_skill`
- System skills (`source = 'system'`) — these are updated only in code and reseeded at deployment

## Input Schema

```typescript
import { z } from 'zod'

export const UpdateUserSkillSchema = z.object({
  name: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // The skill to update. Must exist and must have source = 'user'.

  content: z.string().min(1),
  // The new full markdown content. Replaces the current content entirely.
  // The old content is archived to skill_versions before this overwrites it.

  description: z.string().min(1).max(120).optional(),
  // New description — only provide if changing. If omitted, existing description is kept.

  tags: z.array(z.string()).optional(),
  // New tags — only provide if changing. If omitted, existing tags are kept.

  reason: z.string().min(1),
  // Why this skill is being updated. Required — no silent rewrites.
  // Stored permanently in skill_versions.update_reason.
  // Examples: "Refined coaching steps after grandma session revealed better timing approach"

  updated_by: z.enum(['agent', 'brain_maintenance']),
  // Who is making this update. Determines accountability in skill_versions.
})
```

## Pre-Update Guards

Before writing anything, the tool checks:

```typescript
const skill = db.select().from(skills).where(eq(skills.name, input.name)).get()

if (!skill) {
  return { error: 'skill_not_found', name: input.name }
}

if (skill.source === 'system') {
  return { error: 'system_skill_immutable', name: input.name,
           hint: 'System skills are updated only in code and reseeded at deployment.' }
}
```

## What It Writes — Two Tables, One Transaction

The archive and the update are atomic:

```typescript
db.transaction(() => {
  // Step 1: Archive current version to skill_versions FIRST
  db.insert(skillVersions).values({
    id:           crypto.randomUUID(),
    skillName:    skill.name,
    userId:       ctx.userId,
    version:      skill.version,          // the version BEFORE incrementing
    content:      skill.content,          // the content BEFORE overwriting
    description:  skill.description,      // the description BEFORE overwriting
    updatedBy:    input.updated_by,
    updateReason: input.reason,
    archivedAt:   Date.now(),
  })

  // Step 2: Update the skill row
  db.update(skills)
    .set({
      content:     input.content,
      description: input.description ?? skill.description,
      tags:        input.tags ? JSON.stringify(input.tags) : skill.tags,
      version:     skill.version + 1,
      updatedAt:   Date.now(),
    })
    .where(eq(skills.name, input.name))
    .run()
})
```

If either step fails, the transaction rolls back. The skill remains unchanged. No partial state.

## What It Returns

On success:

```json
{
  "name": "doro-wat-coaching",
  "previous_version": 2,
  "new_version": 3,
  "archived": true,
  "status": "updated"
}
```

`archived: true` confirms the old version was saved before overwriting.

## Side Effects

None beyond the two table writes. No alarm triggered. The skill index refreshes at the next session start — the updated description (if changed) appears from then on.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Name format wrong, description over 120 chars, reason empty | Zod error with failing field |
| Skill not found | No row with this name in skills | `{ error: 'skill_not_found', name }` |
| System skill | Skill has source = 'system' | `{ error: 'system_skill_immutable', name, hint }` |
| Transaction failure | SQLite error on either write | Error message — both writes rolled back |

## Who Can Call It

- **Agent** — for `source = 'user'` skills, during any active session
- **Brain maintenance** — for `source = 'user'` skills only, during its maintenance pass
- **Neither** — for `source = 'system'` skills

## What Is NOT This Tool's Job

- Creating a new skill → `create_user_skill`
- Archiving a skill → `archive_user_skill`
- Rolling back to a previous version → developer-only, no tool exposed
- Updating system skills → DO initialization code only
