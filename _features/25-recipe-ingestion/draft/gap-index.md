# Draft index — 25-recipe-ingestion

## Production snapshots (**08** boundary — shipped)

| File | Target path | Notes |
|---|---|---|
| `normalized.recipe.content.schema.production.md` | `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.ts` | **25** normalizer output |
| `recipe.origin.schema.production.md` | `backend/src/agents/brain/_schemas/recipe.origin.schema.ts` | `share_import` enums |
| `recipe.schema.production.md` | `backend/src/agents/brain/_schemas/recipe.schema.ts` | Insert target |
| `write.user.recipe.repository.production.md` | `backend/src/agents/brain/_repositories/write.user.recipe.repository.ts` | **25** caller |

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `recipe.import.schema.gap.md` | `shared/validator/recipe.import.schema.ts` | **01** shared package |
| `shared.import.job.schema.gap.md` | `shared/drizzle/schema/shared.import.job.schema.ts` | Supabase migration |
| `recipe.source.artifact.schema.gap.md` | `shared/drizzle/schema/recipe.source.artifact.schema.ts` | Supabase migration |
| `create.shared.import.handler.gap.md` | `backend/src/api/recipes/_handlers/create.shared.import.handler.ts` | schemas, workflow |
| `get.import.status.handler.gap.md` | `backend/src/api/recipes/_handlers/get.import.status.handler.ts` | job table |
| `classify.shared.content.helper.gap.md` | `backend/src/api/recipes/_helpers/classify.shared.content.helper.ts` | validator |
| `route.shared.content.helper.gap.md` | `backend/src/api/recipes/_helpers/route.shared.content.helper.ts` | **26**/**28**/**33** stubs |
| `extract.source.artifacts.helper.gap.md` | `backend/src/api/recipes/_helpers/extract.source.artifacts.helper.ts` | AI extract-text |
| `deep.web.search.recipe.helper.gap.md` | `backend/src/api/recipes/_helpers/deep.web.search.recipe.helper.ts` | Tavily key (**18** G5) |
| `normalize.recipe.helper.gap.md` | `backend/src/api/recipes/_helpers/normalize.recipe.helper.ts` | AI SDK |
| `check.import.constraints.helper.gap.md` | `backend/src/api/recipes/_helpers/check.import.constraints.helper.ts` | **07** DO route |
| `write.imported.recipe.helper.gap.md` | `backend/src/api/recipes/_helpers/write.imported.recipe.helper.ts` | Brain internal route |
| `recipe.import.workflow.gap.md` | `backend/src/api/recipes/jobs/recipe.import.workflow.ts` | Upstash Workflow |
| `mobile.share.extension.gap.md` | `mobile/features/share-extension/` + native targets | **01** native shell |
| `mobile.import.status.gap.md` | `mobile/features/recipe-import/` | network APIs |
| `deep.web.search.boundary.gap.md` | — | Boundary doc vs **18** |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **08** | `_features/08-brain-recipe-tools/draft/` — tools, full recipe module |
| **18** | `_features/18-brain-web-search/draft/search.web.tool-boundary.gap.md` |
| **24** | `_features/24-scanner/draft/vision-extract.handler.gap.md` — vision pattern |

**Total in this folder:** 21 files (4 production + 16 gap + this index).
