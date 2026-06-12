# Gap snapshot: use.haptic.discovery.hook.ts

Target: `mobile/features/ground/hooks/use.haptic.discovery.hook.ts`

**Status:** Not in repo. **Second release.** From `build-guide/09-ground/05-haptic-walking-discovery.md`, 35b Angle 3.

```typescript
import { useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import { useCachedGroundSummaries } from './use.cached.ground.summaries.hook'

const CHECK_INTERVAL_MS = 60_000
const RADIUS_METERS = 150
const MIN_RELEVANCE = 0.6
const MAX_FIND_AGE_HOURS = 4
const WALKING_SPEED_KMH = 8
const HAPTIC_COOLDOWN_MS = 20 * 60_000

type HapticDiscoveryOptions = {
  enabled: boolean
  isCookingSessionActive: boolean
  recentDismissCount: number
}

export function useHapticDiscovery(options: HapticDiscoveryOptions) {
  const lastHapticAt = useRef<number>(0)
  const { summaries, refreshNearby } = useCachedGroundSummaries()

  useIsomorphicLayoutEffect(() => {
    if (!options.enabled || options.isCookingSessionActive) return

    const interval = setInterval(async () => {
      const now = Date.now()
      const cooldown =
        options.recentDismissCount >= 3 ? 24 * 60 * 60_000 : HAPTIC_COOLDOWN_MS
      if (now - lastHapticAt.current < cooldown) return

      const location = await Location.getLastKnownPositionAsync()
      if (!location) return

      const speedKmh = (location.coords.speed ?? 0) * 3.6
      if (speedKmh > WALKING_SPEED_KMH) return

      await refreshNearby(location.coords, RADIUS_METERS)

      const candidate = summaries.find((s) => {
        if ((s.relevanceScore ?? 0) < MIN_RELEVANCE) return false
        if (!s.lastFindAt) return false
        const ageHours = (now - new Date(s.lastFindAt).getTime()) / 3_600_000
        return ageHours < MAX_FIND_AGE_HOURS
      })

      if (!candidate) return

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      lastHapticAt.current = now
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [options.enabled, options.isCookingSessionActive, options.recentDismissCount, summaries, refreshNearby])
}
```

**Not push.** One slow haptic pulse only (`21-platform-notifications`). On-device check from cached summaries — no server location trail.
