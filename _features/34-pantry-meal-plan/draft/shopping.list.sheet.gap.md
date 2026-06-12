# Draft: shopping.list.sheet.tsx (gap — file does not exist)

Target: `mobile/features/pantry/components/shopping.list.sheet.tsx`

**Gap (feature 34):** Unified shopping list — plan delta + predictive footer section.

**Source:** `brioela-specs/33-minimum-spend-meal-plan.md`, `brioela-specs/36-predictive-pantry-intelligence.md`

---

```tsx
import { View, Text, Pressable, SectionList } from 'react-native'
import { useShoppingList } from '../hooks/use.shopping.list.hook'

type ListSection = {
  title: string
  data: Array<{
    id: string
    ingredientName: string
    status: 'to_buy' | 'already_have' | 'bought'
    estimatedCost?: number
    storeSuggestion?: string
    source: 'plan' | 'predictive'
  }>
}

export function ShoppingListSheet() {
  const { items, markBought, loading } = useShoppingList()

  if (loading) return <Text>Loading list…</Text>

  const planItems = items.filter((i) => i.source === 'plan' && i.status === 'to_buy')
  const haveItems = items.filter((i) => i.status === 'already_have')
  const predictiveItems = items.filter((i) => i.source === 'predictive')

  const sections: ListSection[] = [
    { title: 'To buy', data: planItems },
    { title: 'You have', data: haveItems },
    { title: 'Probably need soon', data: predictiveItems },
  ].filter((s) => s.data.length > 0)

  const totalCost = planItems.reduce((sum, i) => sum + (i.estimatedCost ?? 0), 0)

  return (
    <View>
      {totalCost > 0 ? <Text>Estimated total: ${totalCost.toFixed(2)}</Text> : null}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text>{section.title}</Text>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.status === 'to_buy') void markBought(item.id)
            }}
          >
            <Text style={{ textDecorationLine: item.status === 'already_have' ? 'line-through' : 'none' }}>
              {item.ingredientName}
              {item.estimatedCost !== undefined ? ` · $${item.estimatedCost.toFixed(2)}` : ''}
            </Text>
            {item.storeSuggestion ? <Text>{item.storeSuggestion}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  )
}
```

Predictive section separate from plan lines (spec 36 integration).
