# Gap snapshot: healthy-signal-layer.tsx

Target: `mobile/features/map/components/healthy-signal-layer.tsx`

**Status:** Not in repo. From `build-guide/01-design-system/05-skia-layers.md` Layer 4, `10-map/06-map-ui-layers.md`.

```typescript
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia'
import { useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import type { RankedPlace } from '@brioela/shared/validator/map.schema'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'

type HealthySignalLayerProps = {
  places: RankedPlace[]
  onDotPress: (placeId: string) => void
}

function healthColor(healthyScore: number): string {
  if (healthyScore >= 0.75) return '#34C759'
  if (healthyScore >= 0.5) return '#FFCC00'
  return '#FF9500'
}

function PlaceDot({
  cx,
  cy,
  place,
}: {
  cx: number
  cy: number
  place: RankedPlace
}) {
  const pulse = useSharedValue(1.0)
  const radius = place.renderedDotSize / 2
  const color = healthColor(place.signal.healthyScore)

  useIsomorphicLayoutEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1200 }),
        withTiming(1.0, { duration: 900 }),
      ),
      -1,
      false,
    )
  }, [pulse])

  return (
    <>
      <Circle cx={cx} cy={cy} r={pulse} color={color} />
      <Circle cx={cx} cy={cy} r={radius * 1.8} opacity={0.35}>
        <RadialGradient
          c={vec(cx, cy)}
          r={radius * 2.5}
          colors={[color, 'transparent']}
        />
      </Circle>
    </>
  )
}

export function HealthySignalLayer({ places, onDotPress }: HealthySignalLayerProps) {
  // Screen projection: Mapbox coordinate → pixel — wire via Mapbox PointAnnotation or custom projection hook
  const projected = places.map((place) => ({
    place,
    cx: 0,
    cy: 0,
  }))

  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {projected.map(({ place, cx, cy }) => (
        <PlaceDot key={place.placeId} cx={cx} cy={cy} place={place} />
      ))}
    </Canvas>
  )
}
```

**Performance:** single Canvas, shared Paint — up to ~200 dots (`05-skia-layers.md`).
