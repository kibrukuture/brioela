# Draft: meal.plan.week.feature.tsx (gap — file does not exist)

Target: `mobile/features/pantry/components/meal.plan.week.feature.tsx`

**Gap (feature 34):** 7-day meal plan grid with at-home vs to-buy ingredient status.

**Source:** `brioela-specs/33-minimum-spend-meal-plan.md`

---

```tsx
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useMealPlan } from '../hooks/use.meal.plan.hook'
import { MealPlanSlotSwapSheet } from './meal.plan.slot.swap.sheet'

export function MealPlanWeekFeature() {
  const { plan, loading, refresh } = useMealPlan()
  const [swapSlotId, setSwapSlotId] = useState<string | null>(null)

  if (loading) return <Text>Loading plan…</Text>
  if (plan === null) return <Text>No active meal plan. Say "Plan my week."</Text>

  return (
    <ScrollView>
      <Text>Week of {plan.weekStartDate}</Text>
      {plan.estimatedTotalCost !== undefined ? (
        <Text>Estimated cost: ${plan.estimatedTotalCost.toFixed(2)}</Text>
      ) : null}

      {plan.slots.map((slot) => (
        <Pressable key={slot.slotId} onPress={() => setSwapSlotId(slot.slotId)}>
          <View>
            <Text>
              Day {slot.dayIndex} · {slot.mealType}
            </Text>
            <Text>{slot.recipeTitle}</Text>
            <Text>
              {slot.ingredientStatus.filter((i) => i.status === 'at_home').length} at home ·{' '}
              {slot.ingredientStatus.filter((i) => i.status === 'to_buy').length} to buy
            </Text>
          </View>
        </Pressable>
      ))}

      {swapSlotId !== null ? (
        <MealPlanSlotSwapSheet
          slotId={swapSlotId}
          onClose={() => {
            setSwapSlotId(null)
            void refresh()
          }}
        />
      ) : null}
    </ScrollView>
  )
}

function useState<T>(initial: T): [T, (v: T) => void] {
  // React import omitted in draft — use `import { useState } from 'react'` in production file
  void initial
  return [initial, () => {}]
}
```

Swap offers exactly 3 alternatives (spec 33).
