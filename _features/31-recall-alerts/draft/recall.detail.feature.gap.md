# Gap snapshot: recall.feature.tsx

Target: `mobile/features/recall/recall.feature.tsx`

**Status:** Not in repo. From `build-guide/15-recall-alerts/04-recall-detail-and-resolution.md`, `01-design-system/13-evidence-first-ui.md`.

**Static safety layer:** Recall detail uses **evidence-first** layout — reason and lots before decorative chrome. Generative grammar tier: static safety (`42-brioela-generative-grammar.md`).

---

```tsx
import { useLocalSearchParams, Linking } from 'expo-router'
import { View, Text, Image, Pressable, ScrollView } from 'react-native'
import { useRecallAlert } from '@/network/recall/use.recall.alerts.hook'
import { resolveRecallAlert } from '@/network/recall/recall.api'

type RecallDetailFeatureProps = {
  matchId: string
}

export function RecallDetailFeature({ matchId }: RecallDetailFeatureProps) {
  const { data, isLoading, refetch } = useRecallAlert(matchId)

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base text-muted-foreground">Loading recall alert…</Text>
      </View>
    )
  }

  const isResolved = Boolean(data.resolvedAt)
  const userLotHighlighted =
    data.scannedLot &&
    data.recall.lotNumbersJson.some(
      (lot) => lot.toUpperCase() === data.scannedLot?.toUpperCase(),
    )

  async function onDiscard() {
    await resolveRecallAlert(matchId)
    await refetch()
  }

  return (
    <ScrollView className="flex-1 bg-background px-4 py-6">
      <Text className="text-2xl font-semibold text-destructive">
        Recall: {data.productName}
      </Text>

      {data.productPhotoUrl ? (
        <Image
          source={{ uri: data.productPhotoUrl }}
          className="mt-4 h-48 w-full rounded-lg"
          resizeMode="cover"
          accessibilityLabel={`Photo of ${data.productName}`}
        />
      ) : null}

      <Text className="mt-4 text-base leading-6">{data.recall.reason}</Text>

      <Text className="mt-4 text-sm font-medium text-foreground">Affected lots</Text>
      {data.recall.lotNumbersJson.map((lot) => (
        <Text
          key={lot}
          className={
            userLotHighlighted && lot.toUpperCase() === data.scannedLot?.toUpperCase()
              ? 'text-destructive font-semibold'
              : 'text-muted-foreground'
          }
        >
          {lot}
        </Text>
      ))}

      {data.scannedAt ? (
        <Text className="mt-4 text-sm text-muted-foreground">
          You scanned this on {new Date(data.scannedAt).toLocaleDateString()}
        </Text>
      ) : null}

      <Text className="mt-4 text-sm text-foreground">
        Do not consume. Discard the product or return it to the store for a refund.
      </Text>

      <Pressable
        className="mt-4"
        onPress={() => Linking.openURL(data.recall.rawNoticeUrl)}
        accessibilityRole="link"
      >
        <Text className="text-primary underline">View official recall notice</Text>
      </Pressable>

      {!isResolved ? (
        <Pressable
          className="mt-8 rounded-lg bg-primary px-4 py-3"
          onPress={onDiscard}
          accessibilityRole="button"
        >
          <Text className="text-center text-base font-medium text-primary-foreground">
            I discarded it
          </Text>
        </Pressable>
      ) : (
        <Text className="mt-8 text-center text-sm text-muted-foreground">
          Marked as discarded
        </Text>
      )}
    </ScrollView>
  )
}

export default function RecallDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  if (!matchId) return null
  return <RecallDetailFeature matchId={matchId} />
}
```

```typescript
// mobile/network/recall/recall.api.ts
import { RECALL_ROUTES } from '@shared/routes/recall.routes'
import { apiClient } from '@/network/api.client'

export async function fetchRecallAlerts() {
  return apiClient.get(RECALL_ROUTES.alerts)
}

export async function fetchRecallAlert(matchId: string) {
  return apiClient.get(RECALL_ROUTES.alertById(matchId))
}

export async function resolveRecallAlert(matchId: string) {
  return apiClient.post(RECALL_ROUTES.resolveAlert(matchId), {})
}
```

**Push deep link:** **21** payload `data: { screen: 'recall_detail', match_id }` → `mobile/app/recall/[matchId].tsx`.
