# Draft: read.product.kin.response.cached.helper.ts (gap — file does not exist)

Target: `backend/src/core/products/read.product.kin.response.cached.helper.ts`

**Gap (feature 50):** Redis-cached Supabase read — spec **24** product cache path.

---

```typescript
import type { ProductKinResponseRow } from '@brioela/shared/drizzle/schema/kin.product.response.schema'
import { passesKinServingGates } from '@/agents/brain/_helpers/kin/passes.kin.serving.gates.helper'

type ReadProductKinResponseCachedEnv = {
	PRODUCT_CACHE: KVNamespace
	DB: D1Database | unknown
}

export async function readProductKinResponseCached(args: {
	env: ReadProductKinResponseCachedEnv
	productId: string
	clusterId: string
	clusterMemberCount: number
}): Promise<ProductKinResponseRow | null> {
	const cacheKey = `product_kin:${args.productId}:${args.clusterId}`
	const cached = await args.env.PRODUCT_CACHE.get(cacheKey, 'json')
	if (cached) {
		const row = cached as ProductKinResponseRow
		if (
			passesKinServingGates({
				sampleCount: row.sampleCount,
				clusterMemberCount: args.clusterMemberCount,
			})
		) {
			return row
		}
		return null
	}

	const row = await fetchProductKinResponseFromDb(args.env, args.productId, args.clusterId)
	if (!row) return null

	await args.env.PRODUCT_CACHE.put(cacheKey, JSON.stringify(row), { expirationTtl: 3600 })

	if (
		!passesKinServingGates({
			sampleCount: row.sampleCount,
			clusterMemberCount: args.clusterMemberCount,
		})
	) {
		return null
	}

	return row
}

async function fetchProductKinResponseFromDb(
	env: ReadProductKinResponseCachedEnv,
	productId: string,
	clusterId: string,
): Promise<ProductKinResponseRow | null> {
	void env
	void productId
	void clusterId
	return null
}
```

One extra cached lookup — 3-second scan target unchanged.
