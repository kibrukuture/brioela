# Draft: price.history.chart.tsx (gap — file does not exist)

Target: `mobile/features/receipt/components/price.history.chart.tsx`

**Source:** `brioela-specs/29-food-cost-inflation-tracker.md`, `build-guide/13-receipt-intelligence/06-receipt-ui-and-voice.md`

---

```tsx
import { View, Text } from 'react-native'
import { VictoryChart, VictoryLine, VictoryScatter, VictoryAxis } from 'victory-native'
import { usePriceHistory } from '@/features/receipt/hooks/use.price.history.hook'

type PriceHistoryChartProps = {
  productId: string
  productName: string
}

const STORE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444']

export function PriceHistoryChart({ productId, productName }: PriceHistoryChartProps) {
  const { data, isLoading, error } = usePriceHistory(productId)

  if (isLoading) {
    return <Text className="text-muted-foreground p-4">Loading price history…</Text>
  }

  if (error || !data || data.points.length < 3) {
    return (
      <View className="p-4 rounded-2xl bg-card">
        <Text className="font-medium">{productName}</Text>
        <Text className="text-sm text-muted-foreground mt-2">Not enough history yet.</Text>
      </View>
    )
  }

  const chartData = data.points.map((p) => ({
    x: new Date(p.purchase_date),
    y: p.price,
    store: p.store_name,
  }))

  return (
    <View className="p-4 rounded-2xl bg-card">
      <Text className="font-medium text-lg">{productName}</Text>
      <Text className="text-sm text-muted-foreground mt-1">
        30d avg {data.currency} {data.avg_30d.toFixed(2)} · 90d avg{' '}
        {data.currency} {data.avg_90d.toFixed(2)}
      </Text>
      <Text className="text-sm mt-1">
        Current vs baseline:{' '}
        {data.pct_vs_90d > 0 ? '+' : ''}
        {(data.pct_vs_90d * 100).toFixed(0)}%
      </Text>

      <VictoryChart height={220} padding={{ top: 20, bottom: 40, left: 50, right: 20 }}>
        <VictoryAxis tickFormat={(t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
        <VictoryAxis dependentAxis tickFormat={(v) => `$${v}`} />
        <VictoryLine data={chartData} style={{ data: { stroke: '#3b82f6', strokeWidth: 2 } }} />
        <VictoryScatter
          data={chartData}
          size={4}
          style={{
            data: {
              fill: ({ index }) => STORE_COLORS[(index ?? 0) % STORE_COLORS.length],
            },
          }}
        />
      </VictoryChart>

      <Text className="text-xs text-muted-foreground">
        Points are color-coded by store. Data from your private receipt history.
      </Text>
    </View>
  )
}
```

**Tier:** Core/Luma+ per spec 29. Reads private Brain history via API — not **28** shared sightings.
