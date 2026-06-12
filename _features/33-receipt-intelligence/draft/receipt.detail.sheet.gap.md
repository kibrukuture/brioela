# Draft: receipt.detail.sheet.tsx (gap — file does not exist)

Target: `mobile/features/receipt/components/receipt.detail.sheet.tsx`

**Source:** `build-guide/13-receipt-intelligence/06-receipt-ui-and-voice.md`

---

```tsx
import { View, Text, ScrollView, Pressable } from 'react-native'
import type { ReceiptDetailResponse } from '@brioela/shared/validator/receipt/receipt.schema'
import { UnresolvedLinesCard } from './unresolved.lines.card'
import { PriceHistoryChart } from './price.history.chart'

type ReceiptDetailSheetProps = {
  receipt: ReceiptDetailResponse
  onSelectProduct: (productId: string) => void
  onClose: () => void
}

export function ReceiptDetailSheet({
  receipt,
  onSelectProduct,
  onClose,
}: ReceiptDetailSheetProps) {
  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-xl font-semibold">
            {receipt.merchant_name ?? 'Unknown store'}
          </Text>
          <Text className="text-muted-foreground mt-1">
            {new Date(receipt.captured_at).toLocaleDateString()} · {receipt.currency}{' '}
            {receipt.total.toFixed(2)}
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Close receipt detail">
          <Text className="text-primary">Done</Text>
        </Pressable>
      </View>

      {receipt.healthy_spend != null ? (
        <View className="rounded-2xl bg-card p-4 mb-4">
          <Text className="font-medium mb-2">Health spend on this trip</Text>
          <Text className="text-sm">
            Healthy {receipt.currency} {receipt.healthy_spend?.toFixed(2)} · Less healthy{' '}
            {receipt.currency} {receipt.non_healthy_spend?.toFixed(2)}
          </Text>
        </View>
      ) : null}

      {receipt.unresolved_line_count > 0 ? (
        <UnresolvedLinesCard count={receipt.unresolved_line_count} />
      ) : null}

      <Text className="text-lg font-medium mb-2">Line items</Text>
      {receipt.line_items.map((line) => (
        <Pressable
          key={line.id}
          onPress={() => line.matched_product_id && onSelectProduct(line.matched_product_id)}
          className="py-3 border-b border-border"
          disabled={!line.matched_product_id}
        >
          <Text className="font-medium">{line.raw_label}</Text>
          <Text className="text-sm text-muted-foreground">
            {line.resolution === 'matched_product'
              ? `Matched · ${((line.match_confidence ?? 0) * 100).toFixed(0)}%`
              : line.resolution === 'matched_category'
                ? 'Category only'
                : 'Unresolved'}
            {line.line_total != null ? ` · ${receipt.currency} ${line.line_total.toFixed(2)}` : ''}
          </Text>
        </Pressable>
      ))}

      {/* Price history chart mounts when user taps a matched product */}
    </ScrollView>
  )
}

export { PriceHistoryChart }
```

Evidence-first layout per `01-design-system/13-evidence-first-ui.md`.
