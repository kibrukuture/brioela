# Draft index — 26-menu-scanning

## Production snapshots (**07** boundary — shipped schema)

| File | Target path | Notes |
|---|---|---|
| `constraint.schema.production.md` | `backend/src/agents/brain/_schemas/constraint.schema.ts` | **07** — dish evaluation reads via new DO RPC |

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `menu.scan.schema.gap.md` | `shared/validator/menu.scan.schema.ts` | **01** shared package |
| `restaurant.menu.intelligence.schema.gap.md` | `shared/drizzle/schema/restaurant.menu.*.ts` | Supabase migration |
| `create.menu.scan.photos.handler.gap.md` | `backend/src/api/menu-scans/_handlers/create.menu.scan.photos.handler.ts` | schemas, AI SDK |
| `create.menu.scan.url.handler.gap.md` | `backend/src/api/menu-scans/_handlers/create.menu.scan.url.handler.ts` | fetch helper |
| `get.menu.scan.handler.gap.md` | `backend/src/api/menu-scans/_handlers/get.menu.scan.handler.ts` | session store (optional) |
| `extract.menu.vision.helper.gap.md` | `backend/src/api/menu-scans/_helpers/extract.menu.vision.helper.ts` | **24** enhance helper |
| `parse.menu.helper.gap.md` | `backend/src/api/menu-scans/_helpers/parse.menu.helper.ts` | AI SDK |
| `evaluate.dish.verdicts.helper.gap.md` | `backend/src/api/menu-scans/_helpers/evaluate.dish.verdicts.helper.ts` | constraint + condition RPCs |
| `generate.waiter.question.helper.gap.md` | `backend/src/api/menu-scans/_helpers/generate.waiter.question.helper.ts` | verdict shape |
| `check.dish.constraints.helper.gap.md` | `backend/src/api/menu-scans/_helpers/check.dish.constraints.helper.ts` | **07** DO route |
| `check.dish.conditions.helper.gap.md` | `backend/src/api/menu-scans/_helpers/check.dish.conditions.helper.ts` | **23** DO route |
| `check-dish-constraint.tool.gap.md` | `tools/menu-scan/check-dish-constraint.ts` | **07** matching |
| `contribute.shared.menu.intelligence.helper.gap.md` | `backend/src/api/menu-scans/_helpers/contribute.shared.menu.intelligence.helper.ts` | Supabase schemas |
| `log.menu.scanned.helper.gap.md` | `backend/src/api/menu-scans/_helpers/log.menu.scanned.helper.ts` | **05** memory_event |
| `enhance.image.helper.gap.md` | `backend/src/api/menu-scans/_helpers/enhance.image.helper.ts` | Shared **24**/**26** |
| `mobile.menu-scanning.feature.gap.md` | `mobile/features/menu-scanning/` | network APIs |
| `menu.language.bridge.scene.gap.md` | `backend/src/agents/mira/scenes/menu-language-bridge.scene.ts` | **29**/**30** runtime |
| `recipe.ingestion.menu.route.gap.md` | **25** → **26** handoff | **25** classifier |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **07** | `_features/07-brain-constraint-tools/draft/` |
| **23** | `_features/23-medical-conditions/draft/check.product.conditions.helper.gap.md` — adapt for dishes |
| **24** | `_features/24-scanner/draft/vision-extract.handler.gap.md`, `enhance.image` |
| **25** | `_features/25-recipe-ingestion/draft/route.shared.content.helper.gap.md` |

**Total in this folder:** 20 files (1 production + 18 gap + this index).
