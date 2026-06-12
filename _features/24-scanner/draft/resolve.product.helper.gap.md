# Gap snapshot: resolve.product.helper.ts

Target: `backend/src/api/scan/_helpers/resolve.product.helper.ts`

**Status:** Not in repo. Three-layer stack from `build-guide/07-scanner/02-product-resolution.md`.

---

```typescript
import { Redis } from '@upstash/redis'
import { supabase } from '@/core/db/supabase.client'
import type { Env } from '@/types/env'
import type { Product } from '@brioela/shared/validator/product'
import { fetchFromExternalSources } from './fetch.external.product.helper'

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60

export async function resolveProduct(
  upc: string,
  userId: string,
  env: Env,
): Promise<Product | null> {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_URL,
    token: env.UPSTASH_REDIS_TOKEN,
  })

  const cacheKey = `product:${upc}`
  const cached = await redis.get<Product>(cacheKey)
  if (cached) return cached

  const { data: existing } = await supabase
    .from('products')
    .select('*')
    .eq('upc', upc)
    .maybeSingle()

  if (existing) {
    await redis.set(cacheKey, existing, { ex: CACHE_TTL_SECONDS })
    return existing as Product
  }

  const resolved = await fetchFromExternalSources(upc, userId, env)
  if (!resolved) return null

  await supabase.from('products').insert(resolved)
  await redis.set(cacheKey, resolved, { ex: CACHE_TTL_SECONDS })

  return resolved
}
```

**Performance:** Cache hit < 500ms server; OFF path ~1–2s.
