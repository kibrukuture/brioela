# Brain Skill Tools — Build

Feature **06**. Production paths under `backend/src/agents/brain/`.

---

## Shipped today

| Area | Status |
|---|---|
| `_schemas/skill.schema.ts` | ✓ |
| `_schemas/skill.version.schema.ts` | ✓ |
| All tool files below | ✗ not created |
| Repositories | ✗ |
| `get.brain.tools.ts` skill entries | ✗ |
| Tests | ✗ |

---

## File manifest (intended — matches ledger 0002 + recipe/alarm split pattern)

### Schemas (owned by 04, used here)

| File | Role |
|---|---|
| `_schemas/skill.schema.ts` | `skills` table + CHECKs + indexes |
| `_schemas/skill.version.schema.ts` | `skill_versions` table + CHECKs + index |

### Repositories (to implement)

| File | Role |
|---|---|
| `_repositories/read.user.skill.repository.ts` | `readUserSkill`, `readActiveUserSkill`, `listSkillIndexRows` (active+stale by use_count) |
| `_repositories/write.user.skill.repository.ts` | `insertUserSkill`, `updateUserSkillWithArchive`, `archiveUserSkill`, `deleteUserSkillWithSnapshot`, `incrementSkillUseCount` |

Export from `_repositories/index.ts`.

### Tools — split layout (5 × 4 files = 20 files)

| Tool | `.tool.ts` | `_schemas/` | `_prompts/` | `_executables/` |
|---|---|---|---|---|
| `create_user_skill` | `create.user.skill.tool.ts` | `create.user.skill.schema.ts` | `create.user.skill.prompt.ts` | `create.user.skill.executable.ts` |
| `update_user_skill` | `update.user.skill.tool.ts` | `update.user.skill.schema.ts` | `update.user.skill.prompt.ts` | `update.user.skill.executable.ts` |
| `view_user_skill` | `view.user.skill.tool.ts` | `view.user.skill.schema.ts` | `view.user.skill.prompt.ts` | `view.user.skill.executable.ts` |
| `archive_user_skill` | `archive.user.skill.tool.ts` | `archive.user.skill.schema.ts` | `archive.user.skill.prompt.ts` | `archive.user.skill.executable.ts` |
| `delete_user_skill` | `delete.user.skill.tool.ts` | `delete.user.skill.schema.ts` | `delete.user.skill.prompt.ts` | `delete.user.skill.executable.ts` |

Reference shipped pattern: `view.user.recipe.tool.ts` + siblings.

### Registration

| File | Change |
|---|---|
| `_tools/get.brain.tools.ts` | Add 5 tools to `TOOL_PERMISSIONS` + `getBrainTools()` `all` map |
| `_tools/_schemas/index.ts` | Export skill schemas |
| `_tools/_prompts/index.ts` | Export skill prompts |
| `_tools/_executables/index.ts` | Export skill executables |
| `_tools/index.ts` | Re-export skill tool factories |

### Tests (to implement)

| File | Role |
|---|---|
| `_tools/skill.tool.test.ts` | Workers DO tests: create, duplicate guard, update+version archive, view+use_count, archive guards, delete snapshot+row gone, system skill immutable |

Ledger originally pointed at `memory.tool.test.ts` — use dedicated `skill.tool.test.ts` (same pattern as `recipe.tool.test.ts`, `alarm.tool.test.ts`).

---

## Executable contracts (summary)

### `createUserSkillExecutable`

- Parse Zod → check duplicate via `readUserSkill` → `insertUserSkill`
- Return `skill_already_exists` if name taken

### `updateUserSkillExecutable`

- Load skill → reject system → transaction: insert version row → update skill
- Mirror `updateUserRecipeExecutable` + `replaceUserRecipeContent` transaction style

### `viewUserSkillExecutable`

- `readActiveUserSkill` → if null return `{ found: false }`
- Return content + metadata; `waitUntil` → `incrementSkillUseCount`

### `archiveUserSkillExecutable`

- Guards: exists, not system, not already archived → update status + reason

### `deleteUserSkillExecutable`

- Guards: exists, not system → transaction: version snapshot with `[DELETED]` reason → delete row

---

## `get.brain.tools.ts` — required additions

```typescript
// TOOL_PERMISSIONS excerpts to add:
chat: [ ..., 'create_user_skill', 'update_user_skill', 'view_user_skill', 'archive_user_skill', 'delete_user_skill' ],
cooking: [ ..., same five ],
brain_maintenance: [ ..., 'update_user_skill', 'archive_user_skill' ],

// getBrainTools() all map:
create_user_skill: createUserSkillTool(db, userId),
update_user_skill: updateUserSkillTool(db, userId),
view_user_skill: viewUserSkillTool(db, userId, waitUntil),
archive_user_skill: archiveUserSkillTool(db, userId),
delete_user_skill: deleteUserSkillTool(db, userId),
```

`view_user_skill` needs optional `waitUntil` like `read_user_memory`.

---

## Verification commands (when implemented)

```bash
cd backend && bun run brain:typecheck
cd backend && bun run brain:test
```

---

## Draft folder

Snapshots of **shipped** production files only today:

- `schemas.skill.schema.md`
- `schemas.skill.version.schema.md`
- `get.brain.tools.skill-gap.md` — current registry showing skill tools absent

When tools ship, regenerate draft for all 20+ tool/repo files (same script pattern as **04** / **05**).
