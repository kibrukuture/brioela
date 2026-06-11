# Brain Skill Tools — Spec

Feature **06**. Five AI-callable tools for procedural skills: create, update, view, archive, delete. Skills are markdown instruction sets the agent builds over time and loads on demand — not facts (`user_memory`) and not traits (`user_personality`).

---

## Purpose

- **`skills`** — current skill state (name PK, description index line, full content, versioning, use metrics, lifecycle status).
- **`skill_versions`** — immutable archive before every content rewrite or final deletion snapshot.

The skill **index** (`name: description` per active/stale skill, ordered by `use_count DESC`) is injected into every session system prompt (feature **15**). Full **content** loads only via `view_user_skill`.

System skills (`source = 'system'`) are seeded at DO initialization (feature **04** gap today). All five tools reject mutations on system skills.

---

## Tables owned (tool semantics)

Schemas live in `backend/src/agents/brain/_schemas/` (created by **04-brain-foundation**). This feature owns **write/read rules and tool behavior**.

### `skills`

| Column | Type | Notes |
|---|---|---|
| `name` | TEXT PK | `/^[a-z][a-z0-9-]*$/`, max 64 — never renamed after create |
| `user_id` | TEXT | Owner |
| `description` | TEXT | Max 120 chars — **only** field in session index |
| `content` | TEXT | Full markdown — loaded on `view_user_skill` only |
| `tags` | TEXT | JSON array — Brain maintenance metadata only, not in index |
| `source` | TEXT | `'system' \| 'user'` |
| `status` | TEXT | `'active' \| 'stale' \| 'archived'` |
| `version` | INTEGER | Starts 1; increments on every `update_user_skill` |
| `use_count` | INTEGER | Increments on every `view_user_skill` |
| `last_used_at` | INTEGER ms nullable | Set on view |
| `archived_reason` | TEXT nullable | Set on archive |
| `created_at` / `updated_at` | INTEGER ms | |

**Indexes (shipped):** `(status, use_count)`, `(source, status)`, `(last_used_at)`.

**System skills at launch (seeded in code, not via tools):**

```text
cooking-coach, allergy-detection, illness-detective,
recipe-reconstruction, medication-awareness
```

### `skill_versions`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `createId()` |
| `skill_name` | TEXT | Logical FK to `skills.name` — **no hard SQL FK** (history survives delete) |
| `user_id` | TEXT | Owner |
| `version` | INTEGER | Version number **before** increment |
| `content` | TEXT | Archived markdown |
| `description` | TEXT | Description at that version |
| `updated_by` | TEXT | `'agent' \| 'brain_maintenance'` |
| `update_reason` | TEXT | Required; `[DELETED]` prefix on delete snapshot |
| `archived_at` | INTEGER ms | System-set at archive time |

**Schema alignment:** Complaint **001** fixed `description`, `updated_by`, `update_reason` columns (migrations `0002`, `0003`). Drizzle schema matches implementable spec today.

---

## Tool split layout (mandatory)

Per complaint **007** and shipped memory/recipe/alarm pattern — each tool is four files:

```text
_tools/[name].tool.ts           — AI SDK `tool()` wrapper
_tools/_schemas/[name].schema.ts
_tools/_prompts/[name].prompt.ts
_tools/_executables/[name].executable.ts
```

Barrel `index.ts` in `_schemas/`, `_prompts/`, `_executables/`. Zod from `@brioela/shared/zod`. Repos use `getOne` / `getReturned` from `@/database/drizzle/_database` (complaint **008**). Row IDs via `createId()` (complaint **009**).

---

## Tool 1: `create_user_skill`

**Purpose:** Insert a new user skill (`source = 'user'`, `version = 1`).

**When:** Agent discovers a **repeatable procedure** worth preserving — not a one-off fact (`write_user_memory`).

**Pre-check:** Agent should scan session skill index for duplicates; tool enforces duplicate name guard.

**Input:**

| Field | Required | Notes |
|---|---|---|
| `name` | yes | SkillName regex, max 64 |
| `description` | yes | 1–120 chars |
| `content` | yes | Markdown, min 1 |
| `tags` | no | Default `[]` |
| `reason` | yes | Audit string — **spec requires input; no column persists it today** (see G8) |

**System-filled:** `user_id`, `source='user'`, `status='active'`, `version=1`, `use_count=0`, `last_used_at=null`, timestamps.

**Returns:** `{ name, status: 'created', version: 1 }`

**Errors:** Zod validation; `skill_already_exists` with hint to use update.

**Who:** Agent only — **not** Brain maintenance, **not** for system skills.

**Side effects:** Index picks up skill on **next session start**. Optional: increment `sessions.skills_created` during active session (session lifecycle spec — see G11).

---

## Tool 2: `update_user_skill`

**Purpose:** Rewrite skill content. **Mandatory** archive to `skill_versions` + increment `version` in **one transaction**.

**When:** Better procedure mid-session; Brain maintenance refinement; description sharpened for index selection.

**Input:**

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Must exist, `source = 'user'` |
| `content` | yes | Replaces entire content |
| `description` | no | Keep existing if omitted |
| `tags` | no | Keep existing if omitted |
| `reason` | yes | Stored in `skill_versions.update_reason` |
| `updated_by` | yes | `'agent' \| 'brain_maintenance'` |

**Transaction order:**

1. Insert `skill_versions` row (current version, content, description, updated_by, reason).
2. Update `skills` (content, optional description/tags, `version + 1`, `updated_at`).

**Returns:** `{ name, previous_version, new_version, archived: true, status: 'updated' }`

**Errors:** `skill_not_found`; `system_skill_immutable`; transaction rollback on failure.

**Who:** Agent + Brain maintenance — user skills only.

**Note:** Spec does not expose `status` on update input. Marking `stale` via maintenance may need a dedicated path (see G9).

---

## Tool 3: `view_user_skill`

**Purpose:** Load full skill content into agent context on demand.

**When:** Index description matches current task; user asks how a skill works.

**Input:** `name` (SkillName).

**Read filter:** `status IN ('active', 'stale')` — archived skills return `{ found: false, hint }`.

**Returns:** `{ name, description, content, version, use_count, source, status }` or not-found object.

**Side effects:** Fire-and-forget increment `use_count`, set `last_used_at`, bump `updated_at` — same pattern as `read_user_memory` + `waitUntil` (complaint/spec parity — see G7).

**Who:** Agent only — Brain maintenance reads DB directly, not via tool.

---

## Tool 4: `archive_user_skill`

**Purpose:** Soft-remove from index — row stays, `status = 'archived'`, `archived_reason` set.

**When:** User says skill unneeded; superseded; Brain maintenance stale rules.

**Input:** `name`, `reason`, `archived_by` (`'agent' \| 'brain_maintenance'`).

**Writes:** Update `skills` only — **no** `skill_versions` row (archive ≠ rewrite).

**Errors:** `skill_not_found`; `system_skill_immutable`; `already_archived`.

**Who:** Agent + Brain maintenance.

**Default over delete:** Archive unless user language demands permanent removal.

---

## Tool 5: `delete_user_skill`

**Purpose:** Remove `skills` row permanently. **`skill_versions` history kept.**

**When:** Explicit permanent removal; mistake skill never used (`version=1`, `use_count=0`).

**Transaction:**

1. Insert final `skill_versions` snapshot with `updateReason: '[DELETED] ${reason}'`, `updatedBy: 'agent'`.
2. `DELETE FROM skills WHERE name = ?`.

**Returns:** `{ name, deleted: true, final_version_archived: true, reason }`

**Who:** Agent only — Brain maintenance **never** deletes.

**Archived skills:** May still be deleted if user insists.

---

## Permission matrix (`SessionKind`)

From `build-guide/05-brain/02-tool-protocol.md`:

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern |
|---|---|---|---|---|---|
| `create_user_skill` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `update_user_skill` | ✓ | ✓ | ✗ | ✓ | ✗ |
| `view_user_skill` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `archive_user_skill` | ✓ | ✓ | ✗ | ✓ | ✗ |
| `delete_user_skill` | ✓ | ✓ | ✗ | ✗ | ✗ |

`getBrainTools()` must register all five and filter by this matrix (not shipped — G2).

---

## Brain maintenance interaction (feature **12** — not this feature)

Maintenance Pass 1 (skill maintenance) uses:

- `get_skills_for_brain_maintenance` — internal read, **not** in the five public tools (G10)
- `update_user_skill` / `archive_user_skill` with `updated_by` / `archived_by` = `'brain_maintenance'`
- Never `create_user_skill`, never `delete_user_skill`, never touch `source = 'system'`

Rules in `build-guide/06-brain-memory/02-brain-maintenance-passes.md` and `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`.

---

## Skill index injection (feature **15** — not this feature)

Every session prompt includes:

```text
active + stale skills, ordered by use_count DESC
format: "name: description" per line
```

Full content never preloaded. Implemented in system prompt builder / session open — **not built** (G12).

---

## What is NOT this feature

- Drizzle table DDL → **04-brain-foundation** (schemas + migrations exist)
- System skill seed at DO init → **04-brain-foundation** (G2 there)
- Skill index in system prompt → **15-brain-system-prompt**
- Maintenance passes + `get_skills_for_brain_maintenance` → **12-brain-sub-agents**
- Live session tool wiring → **20-brain-chat-runtime**
- Developer rollback from `skill_versions` → no agent tool (by design)

---

## Sources

- `implementable-specs/04-skills.md`
- `implementable-specs/05-skill-versions.md`
- `implementable-specs/brioela-tools/04-create-user-skill.md`
- `implementable-specs/brioela-tools/05-update-user-skill.md`
- `implementable-specs/brioela-tools/06-view-user-skill.md`
- `implementable-specs/brioela-tools/07-archive-user-skill.md`
- `implementable-specs/brioela-tools/08-delete-user-skill.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` (caller rules)
- `implementable-specs/17-session-lifecycle.md` (`skills_created` counter)
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md` (index block)
- `build-guide/06-brain-memory/01-sqlite-schema.md` (tables 4–5)
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md` (Pass 1)
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0002.skill-tools.md`
- `_records/while-implementation-user-complaints/02-user-complaints/001-skill-versions-schema-mismatch.md`
- `_records/while-implementation-user-complaints/02-user-complaints/007-tool-monolithic-file-structure-mismatch.md`
- `_records/while-implementation-user-complaints/02-user-complaints/008-returning-query-operator-mismatch.md` (repo operators)
