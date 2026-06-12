# Status

open

Three recipe tools, repositories, schemas, migrations, registry entries, and tests exist in `backend/`. Feature is **not** fully done per full spec — permission drift, recipe index injection, session-end lifecycle, and live runtime wiring remain open.

# Shipped in backend (partial)

- [x] `recipes` + `recipe_versions` Drizzle schemas with CHECKs and indexes
- [x] Migrations `0004`–`0006` (session_id/origin/link_url naming, version column, title sync CHECK, `recipe_versions` table)
- [x] `normalized.recipe.content.schema.ts` + `recipe.origin.schema.ts` + `deriveIngredientNames`
- [x] `readUserRecipe`, `readActiveUserRecipe`, `writeUserRecipe`, `archiveUserRecipe`, `replaceUserRecipeContent`
- [x] `view_user_recipe`, `update_user_recipe`, `archive_user_recipe` split tools (12 files)
- [x] Recipe tools registered in `getBrainTools()` + `_tools` barrel exports
- [x] `recipe.tool.test.ts` — 6 tests passing (`bunx vitest run .../recipe.tool.test.ts`)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | `TOOL_PERMISSIONS` drift vs build-guide + tool specs | Production: `chat` view-only; `brain_maintenance` has update+archive. Build-guide + `14`/`15` + maintenance hard boundary: all three in chat+cooking; maintenance none. Test codifies drift at `recipe.tool.test.ts:125` |
| G2 | No recipe index repository or prompt injection | No `listActiveUserRecipeIndexRows`; **15-brain-system-prompt** not built. `view_user_recipe` assumes index exists |
| G3 | No recipe create path (by design — no tool) | `writeUserRecipe` used in tests only; Mira session-end insert + recipe-reconstruction not built (**29-cooking-session**) |
| G4 | `cook_count` / `last_cooked_at` not incremented anywhere | Spec: session end fire-and-forget; no handler |
| G5 | Session-end decision tree not implemented | `09-recipes.md` tree — no session close handler |
| G6 | `archive_user_recipe` `reason` validated but not persisted | By spec — belongs in `outcome_summary`; session handler not built |
| G7 | Live chat/session handler does not expose tools | **20-brain-chat-runtime** — `getBrainTools` exists but no session handler |
| G8 | Open table-spec edge cases | `09-recipes.md`: recipe correction across sessions; implicit recipe confidence threshold — still undocumented |
| G9 | Ledger 0005 permission prose obsolete | Grants `brain_maintenance` update/archive; uses "general" not `chat`; contradicts `15-brain-maintenance` |
| G10 | `brioela-tools/00-index.md` status table stale | Still says recipe tools "backend pending" — implementation shipped |
| G11 | `_tools/_prompts/index.ts` omits recipe prompts | Tools import directly — minor barrel gap |

# Blocked by

- 04-brain-foundation (schemas + migrations — shipped for recipe tables)

# Blocks

- 15-brain-system-prompt (recipe index block)
- 19-brain-tool-registry (tools 13–15 in full matrix — registry partial)
- 20-brain-chat-runtime (live tool surface)
- 25-recipe-ingestion (share_import row creation)
- 29-cooking-session (create path, cook_count, decision tree, outcome_summary reason)
- 24-scanner / constraint surfaces (ingredient check after `view_user_recipe`)

# Sources

- `implementable-specs/09-recipes.md`
- `implementable-specs/09-recipe-versions.md`
- `implementable-specs/brioela-tools/13-view-user-recipe.md`
- `implementable-specs/brioela-tools/14-update-user-recipe.md`
- `implementable-specs/brioela-tools/15-archive-user-recipe.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/13-gaps-and-missing-specs.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/19-recipe-ingestion/04-recipe-normalization.md`
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0005.recipe-tools.md`
- `_records/while-implementation-user-complaints/02-user-complaints/007-tool-monolithic-file-structure-mismatch.md`

# Draft count

**24** files in `draft/` (23 production snapshots + `get.brain.tools.recipe-permissions.md` gap note).
