# Draft: guest.constraint.badge.tsx (gap — file does not exist)

Target: `mobile/features/ambient/components/guest.constraint.badge.tsx`

**Gap (feature 35):** Dual verdict when product fine for user but not guest.

**Source:** `brioela-specs/37-guest-and-cooking-for-others.md`

---

```tsx
import { Text, View } from 'react-native'

type GuestConstraintBadgeProps = {
  message: string
}

export function GuestConstraintBadge({ message }: GuestConstraintBadgeProps) {
  return (
    <View className="mt-2 rounded-md bg-amber-500/10 px-3 py-2">
      <Text className="text-sm text-amber-800">{message}</Text>
    </View>
  )
}
```

Example message: `Fine for you. Contains gluten — not OK for your guest.`

Hook `use.active.guest.session.ts` loads layered constraints from Brain.
