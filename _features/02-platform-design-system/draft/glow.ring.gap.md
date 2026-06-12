# Gap snapshot: components/GlowRing/GlowRing.tsx

Target: `mobile/components/GlowRing/GlowRing.tsx`

**Status:** Not in repo. Spec: `build-guide/01-design-system/05-skia-layers.md` Layer 2; referenced in `02-coding-standards/09-mobile-patterns.md` scanner example.

```typescript
import { Canvas, Circle, Paint, SweepGradient, vec } from '@shopify/react-native-skia'
import { useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { spring } from '@/design-system/motion'
import { haptic } from '@/design-system/haptics'

export type GlowRingState = 'idle' | 'detecting' | 'locked' | 'result'

type GlowRingProps = {
  state: GlowRingState
  size?: number
}

export function GlowRing({ state, size = 280 }: GlowRingProps) {
  const startAngle = useSharedValue(0)
  const endAngle = useSharedValue(270)
  const pulse = useSharedValue(1)

  useIsomorphicLayoutEffect(() => {
    if (state === 'idle' || state === 'detecting') {
      startAngle.value = withRepeat(withTiming(360, { duration: 1200 }), -1, false)
    }
    if (state === 'locked') {
      endAngle.value = withSpring(360, spring.micro)
      haptic.impact.rigid()
    }
    if (state === 'result') {
      pulse.value = withSpring(1.2, spring.snap)
    }
  }, [state, startAngle, endAngle, pulse])

  const cx = size / 2
  const cy = size / 2
  const r = (size / 2) * pulse

  return (
    <Canvas
      style={{ position: 'absolute', width: size, height: size, alignSelf: 'center' }}
      pointerEvents="none">
      <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={4}>
        <SweepGradient c={vec(cx, cy)} colors={['#2D7A4F', 'transparent', '#2D7A4F']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 1.15} opacity={0.25}>
        <Paint blur={12} />
      </Circle>
    </Canvas>
  )
}
```

**Consumer:** Scanner feature (**24**), universal visual intake (**34**), any camera-lock UX.
