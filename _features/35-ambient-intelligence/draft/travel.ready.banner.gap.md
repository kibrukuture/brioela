# Draft: travel.ready.banner.tsx (gap — file does not exist)

Target: `mobile/features/ambient/components/travel.ready.banner.tsx`

**Gap (feature 35):** Quiet in-app moment on arrival or preload complete — complements `travel_preload_ready` push (**21**).

**Source:** `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`

---

```tsx
import { Pressable, Text, View } from 'react-native'

type TravelReadyBannerProps = {
  destinationCity: string
  onOpenMap: () => void
  onDismiss: () => void
}

export function TravelReadyBanner({
  destinationCity,
  onOpenMap,
  onDismiss,
}: TravelReadyBannerProps) {
  return (
    <View className="mx-4 mb-3 rounded-lg bg-card p-4 shadow-sm">
      <Text className="text-base font-medium">
        You&apos;re in {destinationCity}. Local food intel is ready.
      </Text>
      <View className="mt-3 flex-row gap-3">
        <Pressable onPress={onOpenMap} className="rounded-md bg-primary px-4 py-2">
          <Text className="text-primary-foreground">Open map</Text>
        </Pressable>
        <Pressable onPress={onDismiss}>
          <Text className="py-2 text-muted-foreground">Dismiss</Text>
        </Pressable>
      </View>
    </View>
  )
}
```

Map screen (**28**) reads preloaded geo cache; banner is optional if push already delivered.
