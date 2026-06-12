# Gap snapshot: use.healthy.map.hook.ts

Target: `mobile/features/map/hooks/use.healthy.map.hook.ts`

**Status:** Not in repo. From `build-guide/10-map/03-nearby-ranking-api.md`.

```typescript
import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { RankedPlace } from '@brioela/shared/validator/map.schema'
import { getNearby } from '@/network/map/get-nearby.api'
import { queryKeys } from '@/network/core/query-keys'

type Bbox = {
  minLat: number
  minLng: number
  maxLat: number
  maxLng: number
}

type UseHealthyMapOptions = {
  enabled?: boolean
  initialBbox?: Bbox
}

export function useHealthyMap(options: UseHealthyMapOptions = {}) {
  const { enabled = true, initialBbox } = options
  const [bbox, setBbox] = useState<Bbox | null>(initialBbox ?? null)

  const query = useQuery({
    queryKey: queryKeys.map.nearby(bbox),
    queryFn: () => {
      if (!bbox) throw new Error('bbox_required')
      return getNearby(bbox)
    },
    enabled: enabled && bbox !== null,
    staleTime: 30_000,
  })

  const refetch = useCallback(() => {
    void query.refetch()
  }, [query])

  const places: RankedPlace[] = query.data?.places ?? []

  return {
    places,
    isLoading: query.isLoading,
    isError: query.isError,
    bbox,
    setBbox,
    refetch,
  }
}
```

```typescript
// mobile/network/map/get-nearby.api.ts
import { API_ROUTES } from '@brioela/shared/api'
import type { MapNearbyResponse } from '@brioela/shared/validator/map.schema'
import * as api from '@/network/core'

export async function getNearby(bbox: {
  minLat: number
  minLng: number
  maxLat: number
  maxLng: number
}): Promise<MapNearbyResponse> {
  return api.get<MapNearbyResponse>(API_ROUTES.map.nearby(), bbox)
}
```

**Note:** add `map.nearby` to `queryKeys` and `API_ROUTES.map` when routes ship.
