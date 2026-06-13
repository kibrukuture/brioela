# Gap snapshot: components/VerdictField/VerdictField.tsx

Target: `mobile/components/VerdictField/VerdictField.tsx`

**Status:** Not in repo. Spec: `build-guide/01-design-system/02-color-system.md` Verdict Field + `13-evidence-first-ui.md`.

```typescript
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { View } from 'react-native'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { verdictBloomColors, type VerdictLevel } from '@/design-system/colors'
import { verdictSpring } from '@/design-system/motion'
import { haptic } from '@/design-system/haptics'
import { useColorScheme } from '@/lib/useColorScheme'

type VerdictFieldProps = {
  level: VerdictLevel
  children: React.ReactNode
}

export function VerdictField({ level, children }: VerdictFieldProps) {
  const { isDarkColorScheme } = useColorScheme()
  const progress = useSharedValue(0)
  const mode = isDarkColorScheme ? 'dark' : 'light'
  const bloom = verdictBloomColors(level, mode)

  useIsomorphicLayoutEffect(() => {
    if (level === 'neutral' || !bloom) {
      progress.value = 0
      return
    }
    progress.value = withSpring(1, verdictSpring[level])
    if (level !== 'neutral') {
      haptic.verdict[level]()
    }
  }, [level, bloom, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + progress.value * 0.15,
  }))

  return (
    <Animated.View style={animatedStyle} className="flex-1 bg-surface-primary">
      {children}
    </Animated.View>
  )
}
```

**Rule:** Bloom is driven by AI verdict handler — not by the card component deciding its own color (`02-color-system.md`).
