# Status

open

Schemas for `skills` and `skill_versions` exist in `backend/`. **No skill tools, repositories, registry entries, or tests.** Feature is **not** done per full spec — hunt list below.

# Shipped in backend (partial)

- [x] `skills` Drizzle schema + CHECK constraints + indexes
- [x] `skill_versions` Drizzle schema (aligned with spec after complaint 001 — migrations 0002/0003)
- [x] Tables created via foundation migration `0000` + skill_versions reshape in `0002`/`0003`

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `create_user_skill` tool (split layout) | No files under `_tools/*skill*` |
| G2 | No `update_user_skill` tool | Same |
| G3 | No `view_user_skill` tool | Same |
| G4 | No `archive_user_skill` tool | Same |
| G5 | No `delete_user_skill` tool | Same |
| G6 | No `read.user.skill.repository.ts` / `write.user.skill.repository.ts` | `_repositories/index.ts` has no skill exports |
| G7 | Skill tools not in `getBrainTools()` / `TOOL_PERMISSIONS` | `get.brain.tools.ts` — memory/recipe/alarm only |
| G8 | `create_user_skill` `reason` input not persisted anywhere | Spec requires field; no column/event write defined |
| G9 | No path to set `status = 'stale'` via tools | Maintenance spec ambiguous vs `update_user_skill` schema |
| G10 | `get_skills_for_brain_maintenance` internal tool not built | `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` |
| G11 | `sessions.skills_created` not incremented on create | `implementable-specs/07-sessions.md` — needs session handler |
| G12 | Skill index not injected into system prompt | **15-brain-system-prompt** / session open |
| G13 | System skills not seeded at DO init | **04-brain-foundation** G2 — five launch skills in spec only |
| G14 | No `skill.tool.test.ts` | Ledger 0002 verification plan |
| G15 | Live chat never exposes skill tools | **20-brain-chat-runtime** |

# Blocked by

- 04-brain-foundation (schemas + DB — partial; seed still open there)

# Blocks

- 12-brain-sub-agents (maintenance Pass 1 needs update/archive tools)
- 15-brain-system-prompt (skill index block)
- 19-brain-tool-registry (full 17-tool matrix)
- 20-brain-chat-runtime (session tool surface)

# Sources

- `implementable-specs/04-skills.md`
- `implementable-specs/05-skill-versions.md`
- `implementable-specs/brioela-tools/04-create-user-skill.md` through `08-delete-user-skill.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0002.skill-tools.md`
- `_records/while-implementation-user-complaints/02-user-complaints/001-skill-versions-schema-mismatch.md`
- `_records/while-implementation-user-complaints/02-user-complaints/007-tool-monolithic-file-structure-mismatch.md`

# Draft count

**3** files in `draft/` — schemas + `get.brain.tools` gap excerpt (no tool code exists yet).
