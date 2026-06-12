# Gap snapshot: ground-signal-layer.tsx

Target: `mobile/features/ground/components/ground-signal-layer.tsx`

**Status:** Not in repo. From `build-guide/01-design-system/05-skia-layers.md` Layer 4, `09-ground/04-map-rendering.md`, 35b Angle 5.

```typescript
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import type { LocationSignalSummary } from '@brioela/shared/validator/find'

const SIGNAL_COLORS: Record<LocationSignalSummary['signalType'], string> = {
  health: '#EF4444',
  ingredient: '#F97316',
  price: '#22C55E',
  new_product: '#3B82F6',
  general: '#9CA3AF',
}

type GroundSignalLayerProps = {
  summaries: Array<LocationSignalSummary & { lat: number; lng: number }>
  onDotPress: (locationId: string) => void
  onBuildingLongPress: (locationId: string) => void
  projectCoordinate: (lat: number, lng: number) => { x: number; y: number } | null
}

function pulseDurationMs(lastFindAt: string | null): number {
  if (!lastFindAt) return 10_000
  const ageHours = (Date.now() - new Date(lastFindAt).getTime()) / 3_600_000
  if (ageHours < 2) return 1_200
  if (ageHours < 12) return 2_500
  if (ageHours < 48) return 5_000
  if (ageHours < 168) return 10_000
  return 0
}

export function GroundSignalLayer({
  summaries,
  projectCoordinate,
}: GroundSignalLayerProps) {
  const dots = useMemo(
    () =>
      summaries
        .map((s) => {
          const screen = projectCoordinate(s.lat, s.lng)
          if (!screen) return null
          return {
            ...s,
            x: screen.x,
            y: screen.y,
            color: SIGNAL_COLORS[s.signalType],
            radius: (s.renderedDotSize ?? 8) / 2,
            pulseMs: pulseDurationMs(s.lastFindAt ?? null),
          }
        })
        .filter(Boolean),
    [summaries, projectCoordinate],
  )

  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      {dots.map((dot) => (
        <PulsingDot key={`${dot.locationId}-${dot.signalType}`} dot={dot} />
      ))}
    </Canvas>
  )
}

function PulsingDot({
  dot,
}: {
  dot: {
    x: number
    y: number
    color: string
    radius: number
    pulseMs: number
  }
}) {
  const scale = useSharedValue(1)

  if (dot.pulseMs > 0) {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: dot.pulseMs / 2 }),
        withTiming(1.0, { duration: dot.pulseMs / 2 }),
      ),
      -1,
    )
  }

  const r = dot.radius
  return (
    <>
      <Circle cx={dot.x} cy={dot.y} r={r} color={dot.color} />
      <Circle cx={dot.x} cy={dot.y} r={r * 2}>
        <RadialGradient
          c={vec(dot.x, dot.y)}
          r={r * 2}
          colors={[dot.color, 'transparent']}
        />
      </Circle>
    </>
  )
}
```

**Performance:** single Canvas, one GPU draw call for up to ~200 dots (`05-skia-layers.md`). Touch handling in React Native layer above canvas.
