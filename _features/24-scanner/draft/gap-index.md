# Draft index — 24-scanner

## Production snapshots (shipped or partial)

| File | Target path | Notes |
|---|---|---|
| `constraint.schema.production.md` | `backend/src/agents/brain/_schemas/constraint.schema.ts` | **07** boundary — scan reads via DO; not owned by **24** |
| `get.brain.tools.memory-event-excerpt.production.md` | `log.memory.event.tool.ts` | **05** — `product_scanned` kind ready for dual-write |

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `scan.schema.gap.md` | `shared/validator/scan.schema.ts` | **01** shared package |
| `scan.events.schema.gap.md` | `shared/drizzle/schema/scan.schema.ts` | Supabase migration |
| `products.schema.gap.md` | `shared/drizzle/schema/products.schema.ts` | Supabase migration |
| `resolve.scan.handler.gap.md` | `backend/src/api/scan/_handlers/resolve.scan.handler.ts` | schemas, **07** DO route |
| `resolve.product.helper.gap.md` | `backend/src/api/scan/_helpers/resolve.product.helper.ts` | Redis, Supabase |
| `check.constraints.helper.gap.md` | `backend/src/api/scan/_helpers/check.constraints.helper.ts` | Brain DO `/internal/check-constraints` |
| `build.verdict.helper.gap.md` | `backend/src/api/scan/_helpers/build.verdict.helper.ts` | scan.schema |
| `check-constraint.tool.gap.md` | `tools/product-scan/check-constraint.ts` | **07** matching logic |
| `log-scan-event.tool.gap.md` | `tools/product-scan/log-scan-event.ts` | **05** memory_event |
| `vision-extract.handler.gap.md` | `backend/src/api/scan/_handlers/vision-extract.scan.handler.ts` | AI SDK, scan.schema |
| `mobile.scanner.feature.gap.md` | `mobile/features/scanner/components/scanner.feature.tsx` | network hooks |
| `get.brain.tools.product-scan-kind.gap.md` | `get.brain.tools.ts` | **19** registry |
| `check.conditions.helper.gap.md` | `backend/src/api/scan/_helpers/check.conditions.helper.ts` | **23** evaluation |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **07** | `_features/07-brain-constraint-tools/draft/` |
| **22** | `_features/22-health-intelligence/draft/` — medications, community tables |
| **23** | `_features/23-medical-conditions/draft/check.product.conditions.helper.gap.md`, `condition.verdict.schema.gap.md` |

**Total in this folder:** 15 files (2 production excerpts + 12 gap + this index).
