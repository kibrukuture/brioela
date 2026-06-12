# Draft: time.machine.inline.tsx (gap — file does not exist)

Target: `mobile/features/ambient/components/time.machine.inline.tsx`

**Gap (feature 35):** Secondary line below scan verdict or on recipe open — no push.

**Source:** `brioela-specs/38-food-time-machine.md`, `build-guide/18-ambient-intelligence/04-food-time-machine.md`

---

```tsx
import { Text, View } from 'react-native'

type TimeMachineInlineProps = {
  text: string
  onExpand?: () => void
}

export function TimeMachineInline({ text, onExpand }: TimeMachineInlineProps) {
  return (
    <View className="mt-2 px-1">
      <Text
        className="text-sm text-muted-foreground"
        onPress={onExpand}
        accessibilityRole="text"
      >
        {text}
      </Text>
    </View>
  )
}
```

Parent screen (**24** scan, **08** recipe) calls Brain/API to `pickTimeMachineMoment` for entity context. Warm factual copy only — no streak language.
