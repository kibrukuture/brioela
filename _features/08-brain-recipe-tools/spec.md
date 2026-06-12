# Brain Recipe Tools — Spec

Feature **08**. Three AI-callable tools for the user's personal recipe library: `view_user_recipe`, `update_user_recipe`, `archive_user_recipe`. Recipes are structured reusable cooking artifacts — not `user_memory` facts, not `session_turns` transcripts.

There is **no `create_user_recipe` tool**. New rows are inserted by the Mira cooking session end path (recipe-reconstruction skill + direct DB write) or by recipe ingestion (**25-recipe-ingestion**). The agent refines and retires recipes via these three tools only.

---

## Purpose

- **`recipes`** — current recipe state: title mirror, normalized JSON body, origin metadata, usage counters, soft-delete status, version integer.
- **`recipe_versions`** — immutable archive of previous `content` JSON before every `update_user_recipe` overwrite (developer rollback only — no agent restore tool).

The **recipe index** (`id: title` for every active recipe) is injected into session prompts (**15-brain-system-prompt**). Full `NormalizedRecipeContent` loads on demand via `view_user_recipe(id)` — same pattern as skills.

Hard rule: **Brain maintenance never writes** to `recipes` (`15-brain-maintenance-and-behavior-patterns.md` hard boundaries). Only the live agent via these tools (plus session-end direct insert for creates).

---

## Tables owned (tool semantics)

Schemas live in `backend/src/agents/brain/_schemas/` (DDL + migrations owned by **04-brain-foundation**). This feature owns **write/read rules and tool behavior**.

### `recipes`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID v4 — stable cross-table identity |
| `user_id` | TEXT | Owner — self-describing for export |
| `title` | TEXT | Index/display mirror of `content.title` — synced on every insert/update |
| `origin` | TEXT enum | `cooking_session \| family_capture \| user_written \| share_import` |
| `session_id` | TEXT nullable | `sessions.id` when origin is `cooking_session` or `family_capture` |
| `link_url` | TEXT nullable | Original shared URL when `origin = share_import` |
| `content` | TEXT | JSON string of `NormalizedRecipeContent` |
| `version` | INTEGER | Starts 1; increments on every `update_user_recipe` |
| `cook_count` | INTEGER | Incremented at successful cook session end — **not** via view/update tools |
| `last_cooked_at` | INTEGER ms nullable | Last cook timestamp — same write path as `cook_count` |
| `status` | TEXT | `'active' \| 'archived'` — soft delete, row never hard-deleted |
| `confidence` | REAL 0–1 | Row-level confidence (distinct from content.confidence) |
| `created_at` / `updated_at` | INTEGER ms | |

**CHECK constraints (shipped):** valid JSON object; `json_extract(content, '$.title') = title`; version ≥ 1; cook_count ≥ 0; status enum; confidence 0–1; updated_at ≥ created_at.

**Indexes (shipped):** `(user_id, status, last_cooked_at)`, `(origin, created_at)`, `(status, cook_count)`, partial `(last_cooked_at) WHERE status = 'active'`, partial `(session_id) WHERE session_id IS NOT NULL`.

**Origin naming (`recipe.origin.schema.ts`):**

| Field | Meaning |
|---|---|
| `recipes.origin` | How recipe entered library |
| `content.read_via` | Share import extraction channel (`video`, `photo`, `webpage`) — share_import only |
| `content.shared_from` | Platform shared from — share_import only |
| `recipes.link_url` | Row-level shared link — share_import only |

Retired names: `source`, `shared_url`, row-level `url`, `source_session` → migrated to `origin`, `link_url`, `session_id` (migrations 0004–0006).

### `recipe_versions`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `createId()` per archive row |
| `recipe_id` | TEXT | Logical FK — no hard CASCADE (preserves history) |
| `user_id` | TEXT | Owner |
| `version` | INTEGER | Matches `recipes.version` **before** increment |
| `content` | TEXT | Full previous `NormalizedRecipeContent` JSON |
| `updated_by` | TEXT | `'agent' \| 'brain_maintenance'` — audit only; maintenance must not call update tool |
| `update_reason` | TEXT | Required reason from `update_user_recipe` input |
| `archived_at` | INTEGER ms | |

**Index:** `(recipe_id, version)`.

Written **only** by `update_user_recipe` transaction. Never updated or deleted after insert. No agent read path.

### `NormalizedRecipeContent`

Canonical shape: `build-guide/19-recipe-ingestion/04-recipe-normalization.md`. Validated by `normalizedRecipeContentSchema` on every update and on view (parse guard).

Required fields include `title`, `attribution`, `servings`, `totalTimeMinutes`, `ingredients[]`, `steps[]`, `cuisine`, `difficulty`, `tags`, `confidence`, `warnings`. Share imports may add `read_via`, `link_url`, `shared_from`.

`deriveIngredientNames(content)` returns `content.ingredients[].name` at read time for constraint checking — not stored as a column.

---

## Session-end decision tree (creates — not a tool)

Before inserting a new recipe row at cooking session end, the agent runs this tree (`09-recipes.md`). Tools in this feature do **not** implement creates.

```
1. Did session involve cooking something specific?
   → No → skip recipe handling; note in outcome_summary.

2. Does a recipe for this dish already exist?
   → Title similarity + ingredient overlap from injected index
   → Yes, not materially different → increment cook_count on existing row; done.
   → Yes, materially different → update_user_recipe OR new row (agent judgment).

3. Transcript complete enough to reconstruct?
   → No → flag incomplete in outcome_summary; skip create.

4. Genuinely new recipe with enough signal?
   → recipe-reconstruction skill → direct insert (no tool).
```

**Resolved edge cases (`09-recipes.md`, gaps doc 14–15):**

- Multi-dish session: agent judgment from transcript; two confident named dishes → two rows; ambiguous → one row + outcome note.
- Collaborative variation: same cook refining own recipe → `update_user_recipe`; different person/purpose/dietary adaptation → new row; original untouched.

**Still open in table spec (not tool scope):**

- Recipe correction across sessions ("I did it wrong last time").
- Implicit recipe — confidence threshold for dish identity inference undefined.

---

## Tool split layout (mandatory)

Same as **05** / **06**: four files per tool (`_schemas/`, `_prompts/`, `_executables/`, `.tool.ts`). Complaints **007–010** apply.

---

## Tool 1: `view_user_recipe`

**Purpose:** Load full recipe content on demand. Index shows `id: title`; this tool loads parsed JSON + metadata.

**When:** Starting a cook for a known recipe; user asks about a specific recipe; constraint check before recommending; evaluating update vs new row.

**When NOT:** Recipe already in context; only checking existence (use index); browsing all recipes without need.

**Input:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | UUID from injected index — no fuzzy title lookup |

**Reads:** Active row only (`status = 'active'`). Parses and validates `content` with `normalizedRecipeContentSchema`.

**Returns (success):** `found: true`, row metadata (`title`, `origin`, `session_id`, `link_url`, `cook_count`, `last_cooked_at`, `status`, `confidence`, `version`), parsed `content`, `ingredient_names` from `deriveIngredientNames`.

**Returns (miss):** `{ found: false, id, hint }` — not an error; archived rows same as missing.

**Side effects:** None. Does **not** increment `cook_count`, `last_cooked_at`, or any view counter.

**Constraint check pattern (agent-side, not tool side effect):**

1. `view_user_recipe(id)` → `ingredient_names`
2. Cross-check active constraints already in session context
3. hard_allergy / confirmed intolerance → warn/block; proposed → surface confirm; dislike → deprioritize

**Who:** Agent during active sessions. Not Brain maintenance (no tool reads in maintenance spec today). Not device SDK.

---

## Tool 2: `update_user_recipe`

**Purpose:** Replace `recipes.content`, sync `recipes.title` from parsed JSON title, archive previous content to `recipe_versions`, increment `version` — single transaction.

**When:** Post-cook refinement; user dictates change; session-end tree step 2 "materially different" on same dish row.

**When NOT:** Genuinely different dish → new row via reconstruction; archived recipe → cannot update; trivial variation not worth versioning.

**Input:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Must be active |
| `content` | yes | JSON string — validated with `normalizedRecipeContentSchema` |
| `reason` | yes | Stored in `recipe_versions.update_reason` |
| `updated_by` | yes | `'agent' \| 'brain_maintenance'` — maintenance must never call |

**Pre-guards:** Row exists and `status = 'active'`; content valid JSON + schema.

**Writes:** `replaceUserRecipeContent` — insert version row, then update live row (`content`, `title`, `version`, `updated_at`).

**Returns (success):** `{ id, title, previous_version, new_version, archived: true, status: 'updated' }`.

**Side effects:** One `recipe_versions` row. `cook_count` unchanged.

**Who:** Agent during active sessions — **not** Brain maintenance per hard boundary (even though schema allows `updated_by: 'brain_maintenance'` for audit consistency with skills).

---

## Tool 3: `archive_user_recipe`

**Purpose:** Set `status = 'archived'`. Row preserved; leaves active index and constraint checking surface.

**When:** User explicitly removes; never-cooked capture confirmed unwanted; duplicate dish superseded.

**When NOT:** Content changes → update; recently cooked without explicit request; already archived.

**Input:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | UUID |
| `reason` | yes | **Not stored on recipe row** — agent records in session `outcome_summary` |

**Pre-guards:** Row exists; reject if already archived (`already_archived`).

**Writes:** `archiveUserRecipe` — sets `status = 'archived'`, `updated_at`. No version snapshot.

**Returns (success):** `{ id, title, status: 'archived', cook_count, last_cooked_at }`.

**Side effects:** None on constraints. Recipe drops from next session's index injection.

**Who:** Agent only. Not Brain maintenance.

Restoration: developer sets `status = 'active'` directly — no tool.

---

## Permission matrix (`SessionKind`)

**Authoritative product intent** (`build-guide/05-brain/02-tool-protocol.md` tool table):

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern_detection |
|---|---|---|---|---|---|
| `view_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `update_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `archive_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ |

**Shipped production drift (see G1 in `status.md`):**

- `chat` — view only (update/archive withheld).
- `brain_maintenance` — update + archive incorrectly exposed (contradicts maintenance hard boundary).
- Tests codify cooking-only update/archive and chat view-only.

Resolve toward build-guide + implementable tool specs (all three in chat + cooking; none in maintenance).

---

## Read paths (no list tool)

Per specs, the agent does **not** call a recipe list tool:

- **Session prompt** — active recipe index injected at session start (**15-brain-system-prompt**). Requires `listActiveUserRecipes` (or equivalent) repository helper — not shipped (G2).
- **Constraint checker / scanner** — ingredient names from `view_user_recipe` or direct content read downstream.
- **Session history** — `sessions.recipe_id` partial index for "sessions that cooked this recipe".

---

## Repositories (shipped)

| Function | Role |
|---|---|
| `readUserRecipe` | By id, any status |
| `readActiveUserRecipe` | By id, `status = 'active'` |
| `writeUserRecipe` | Insert — used by tests + future create path |
| `archiveUserRecipe` | Soft-delete |
| `replaceUserRecipeContent` | Version archive + live update transaction |

Missing for full spec: `listActiveUserRecipeIndexRows(userId)` for prompt injection (G2).

---

## Ledger drift warning

`_records/.../0005.recipe-tools.md` file list is accurate; **permission prose is obsolete** — cites `general` session kind, grants `brain_maintenance` update/archive, contradicts `15-brain-maintenance` hard boundary. Do not implement permissions from ledger body — use implementable specs + build-guide matrix above.

---

## Cross-feature boundaries

| Feature | Relationship |
|---|---|
| **04-brain-foundation** | DDL, migrations 0004–0006, schema CHECKs |
| **07-brain-constraint-tools** | Agent cross-checks `ingredient_names` after view |
| **15-brain-system-prompt** | Recipe index block injection |
| **20-brain-chat-runtime** | `getBrainTools()` wiring into live sessions |
| **25-recipe-ingestion** | Share import creates rows; `NormalizedRecipeContent` shape |
| **29-cooking-session** | Session-end create, cook_count increment, decision tree |
| **12-brain-sub-agents** | Maintenance **never writes** recipes |

---

## Sources

- `implementable-specs/09-recipes.md`
- `implementable-specs/09-recipe-versions.md`
- `implementable-specs/brioela-tools/13-view-user-recipe.md`
- `implementable-specs/brioela-tools/14-update-user-recipe.md`
- `implementable-specs/brioela-tools/15-archive-user-recipe.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/07-sessions.md` (`recipe_id`, cooking sessions)
- `implementable-specs/13-gaps-and-missing-specs.md` (items 14–15 closed in 09-recipes)
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` (hard boundaries)
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/19-recipe-ingestion/04-recipe-normalization.md`
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0005.recipe-tools.md` (file list; permissions obsolete)
- `_records/while-implementation-user-complaints/02-user-complaints/007-tool-monolithic-file-structure-mismatch.md`
