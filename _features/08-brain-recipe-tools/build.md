# Brain Recipe Tools — Build

Feature **08**. Production paths under `backend/src/agents/brain/`.

---

## Shipped today

| Area | Status |
|---|---|
| `_schemas/recipe.schema.ts` + `recipe.version.schema.ts` + `recipe.origin.schema.ts` + `normalized.recipe.content.schema.ts` | ✓ |
| Drizzle migrations `0004`, `0005`, `0006` (origin naming, versions, title sync) | ✓ |
| `read.user.recipe.repository.ts` + `write.user.recipe.repository.ts` | ✓ (partial — no list helper) |
| `view_user_recipe` + `update_user_recipe` + `archive_user_recipe` split tools (3 × 4 files) | ✓ |
| `get.brain.tools.ts` recipe entries | ✓ (permission drift — see G1) |
| `recipe.tool.test.ts` (6 tests) | ✓ |
| Recipe index prompt injection | ✗ |
| Session-end recipe create + cook_count | ✗ |
| Live session handler wiring | ✗ |

---

## File manifest

### Schemas (04 owns DDL; 08 owns tool semantics)

| File | Role |
|---|---|
| `_schemas/recipe.schema.ts` | `recipes` table + CHECKs + five indexes |
| `_schemas/recipe.version.schema.ts` | `recipe_versions` table + CHECKs + index |
| `_schemas/recipe.origin.schema.ts` | `origin`, `read_via`, `shared_from` enum constants |
| `_schemas/normalized.recipe.content.schema.ts` | Zod body schema + `deriveIngredientNames` |

### Migrations (recipe reshape spine)

| File | Role |
|---|---|
| `drizzle/0004_rename_recipes_source_session_id.sql` | Rename legacy `source_session` → `source_session_id` |
| `drizzle/0005_recipe_versions_and_title_sync.sql` | Add `version`, title/content CHECK, `recipe_versions` table |
| `drizzle/0006_recipe_origin_naming.sql` | `source`→`origin`, `source_session_id`→`session_id`, `source_url`→`link_url` |

### Repositories

| File | Functions |
|---|---|
| `_repositories/read.user.recipe.repository.ts` | `readUserRecipe`, `readActiveUserRecipe` |
| `_repositories/write.user.recipe.repository.ts` | `writeUserRecipe`, `archiveUserRecipe`, `replaceUserRecipeContent` |

**To add for full spec:** `listActiveUserRecipeIndexRows(database, userId)` → `{ id, title }[]` ordered for prompt block (**15**).

Export from `_repositories/index.ts` (recipe exports shipped).

### Tools — split layout (3 × 4 = 12 files)

| Tool | `.tool.ts` | `_schemas/` | `_prompts/` | `_executables/` |
|---|---|---|---|---|
| `view_user_recipe` | `view.user.recipe.tool.ts` | `view.user.recipe.schema.ts` | `view.user.recipe.prompt.ts` | `view.user.recipe.executable.ts` |
| `update_user_recipe` | `update.user.recipe.tool.ts` | `update.user.recipe.schema.ts` | `update.user.recipe.prompt.ts` | `update.user.recipe.executable.ts` |
| `archive_user_recipe` | `archive.user.recipe.tool.ts` | `archive.user.recipe.schema.ts` | `archive.user.recipe.prompt.ts` | `archive.user.recipe.executable.ts` |

Reference pattern: thin `.tool.ts` wrapping AI SDK `tool()` + executable.

### Registration

| File | Change |
|---|---|
| `_tools/get.brain.tools.ts` | Recipe tools in `TOOL_PERMISSIONS` + `all` map |
| `_tools/index.ts` | Re-export recipe tool factories |
| `_tools/_schemas/index.ts` | Export recipe schemas |
| `_tools/_executables/index.ts` | Export recipe executables |
| `_tools/_prompts/index.ts` | Recipe prompts exported from direct imports today; barrel optional |

---

## Executable contracts

### `viewUserRecipeExecutable`

1. `readActiveUserRecipe(id)` — if miss → `{ found: false, id, hint }`.
2. `JSON.parse` content — invalid JSON → `{ found: false, hint: 'Recipe content is not valid JSON.' }`.
3. `normalizedRecipeContentSchema.safeParse` — fail → `{ found: false, hint: 'Recipe content failed validation.' }`.
4. Return metadata + parsed `content` + `ingredient_names`.

### `updateUserRecipeExecutable`

1. Parse JSON + validate `NormalizedRecipeContent`.
2. Load row — missing or archived → `recipe_not_found_or_archived`.
3. `replaceUserRecipeContent` transaction: archive current version with `createId()`, `updated_by`, `reason`; set new content/title/version.
4. Return `{ id, title, previous_version, new_version, archived: true, status: 'updated' }`.

### `archiveUserRecipeExecutable`

1. `readUserRecipe(id)` — missing → `recipe_not_found`.
2. Already archived → `already_archived` with title + hint.
3. `archiveUserRecipe(id, now)` — reason validated in schema but not persisted on row (session outcome trail).
4. Return `{ id, title, status: 'archived', cook_count, last_cooked_at }`.

---

## Permission matrix (intended — align production to this)

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern_detection |
|---|---|---|---|---|---|
| `view_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `update_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `archive_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ |

**Shipped drift:** cooking-only update/archive; maintenance incorrectly has update/archive. Fix G1 before marking feature shipped.

---

## Tests (shipped)

| File | Cases |
|---|---|
| `_tools/recipe.tool.test.ts` | Session kind exposure; view active + ingredient_names; view archived → found false; update archives version + title sync; update rejects archived; archive soft-delete + already_archived |
| `_tools/recipe.tool.test.schema.helper.ts` | Minimal `recipes` / `recipe_versions` DDL for isolated DO tests |

```bash
cd backend && bunx vitest run src/agents/brain/_tools/recipe.tool.test.ts
```

Expected: 6 tests green in `Brain Recipe Tools` describe block (verified 2026-06-12).

---

## Acceptance criteria

1. All three tools exist in split layout with Zod input schemas and prompt strings.
2. `view_user_recipe` returns parsed `NormalizedRecipeContent` + `ingredient_names` for active rows only.
3. `update_user_recipe` atomically archives to `recipe_versions` and increments `recipes.version` with title sync CHECK satisfied.
4. `archive_user_recipe` sets `status = 'archived'` without version snapshot; rejects double archive.
5. `getBrainTools()` permission matrix matches build-guide (chat + cooking all three; maintenance none).
6. `recipe.tool.test.ts` passes in Workers vitest pool.
7. Recipe index injection + session-end create path tracked as dependent features — remain open in `status.md` until built.

---

## Draft folder

**24** files in `draft/` — 23 production snapshots + `get.brain.tools.recipe-permissions.md` gap note.

---

## Remaining build work (keeps feature `open`)

1. **G1** — Fix `TOOL_PERMISSIONS`: add update/archive to `chat`; remove from `brain_maintenance`; update tests.
2. **G2** — Add `listActiveUserRecipeIndexRows` + wire into system prompt (**15**).
3. **G3** — Mira session-end recipe create via `writeUserRecipe` + decision tree (**29**).
4. **G4** — `cook_count` / `last_cooked_at` increment at session end (**29**).
5. **G5** — Live session handler exposes recipe tools (**20**).

Do not mark feature `shipped` until G1 is closed. G2–G5 may complete in dependent features but must stay tracked in `status.md`.
