# Gap snapshot: components/GlassCard/GlassCard.tsx

Target: `mobile/components/GlassCard/GlassCard.tsx`

**Status:** Not in repo. Spec: `build-guide/01-design-system/05-skia-layers.md` Layer 3 + `10-cva-component-variants.md`.

```typescript
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { BackdropFilter, Blur, RoundedRect } from '@shopify/react-native-skia'
import { View } from 'react-native'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { cardVariants } from '@/design-system/variants/card.variants'
import { spring } from '@/design-system/motion'
import { useColorScheme } from '@/lib/useColorScheme'
import { semantic } from '@/design-system/colors'

type GlassCardProps = VariantProps<typeof cardVariants> & {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ surface = 'glass', verdict = 'none', size = 'md', children, className }: GlassCardProps) {
  const { isDarkColorScheme } = useColorScheme()
  const blur = useSharedValue(0)
  const mode = isDarkColorScheme ? 'dark' : 'light'
  const glassColor = semantic[mode].surface.glass

  useSharedValue(() => {
    blur.value = withSpring(20, spring.landing)
  })

  return (
    <Animated.View entering={FadeInDown.springify().stiffness(200).damping(0.82)} className={cn(cardVariants({ surface, verdict, size }), className)}>
      <BackdropFilter filter={<Blur blur={blur} />}>
        <RoundedRect x={0} y={0} width={320} height={200} r={16} color={glassColor} />
      </BackdropFilter>
      <View className="relative z-10">{children}</View>
    </Animated.View>
  )
}
```

**Note:** Exact Skia `BackdropFilter` API must match installed `@shopify/react-native-skia` 2.6.4 at implementation time — verify against current docs before shipping.
