# Gap snapshot: components/AmbientCanvas/AmbientCanvas.tsx

Target: `mobile/components/AmbientCanvas/AmbientCanvas.tsx`

**Status:** Not in repo. Spec: `build-guide/01-design-system/05-skia-layers.md` Layer 1 + `09-texture.md`.

```typescript
import { Canvas, Fill, Shader } from '@shopify/react-native-skia'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { useColorScheme } from '@/lib/useColorScheme'
import { ambientFieldSkSL } from '@/design-system/shaders/ambient.glsl'
import { textureSkSL } from '@/design-system/shaders/texture.glsl'

type AmbientCanvasProps = {
  intensity?: number
}

const SESSION_SEED = Math.random()

export function AmbientCanvas({ intensity = 0.3 }: AmbientCanvasProps) {
  const { isDarkColorScheme } = useColorScheme()
  const time = useSharedValue(0)
  const amplitude = useSharedValue(intensity)

  useIsomorphicLayoutEffect(() => {
    time.value = withRepeat(withTiming(1, { duration: 8000 }), -1, false)
  }, [time])

  useIsomorphicLayoutEffect(() => {
    amplitude.value = withTiming(intensity, { duration: 300 })
  }, [amplitude, intensity])

  const baseColor = isDarkColorScheme
    ? [0.055, 0.047, 0.063]
    : [0.973, 0.965, 0.949]

  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none">
      <Fill>
        <Shader
          source={ambientFieldSkSL}
          uniforms={{ time, amplitude, baseColor }}
        />
      </Fill>
      <Fill>
        <Shader
          source={textureSkSL}
          uniforms={{
            seed: SESSION_SEED,
            amplitude: isDarkColorScheme ? 0.018 : 0.012,
            baseColor,
          }}
        />
      </Fill>
    </Canvas>
  )
}
```

**Production:** `@shopify/react-native-skia` 2.6.4 installed; only used in `features/onboarding/temp/prototypes/scene-01-ember/`. No root ambient canvas in `app/_layout.tsx`.
