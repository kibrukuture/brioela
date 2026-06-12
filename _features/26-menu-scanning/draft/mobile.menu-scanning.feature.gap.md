# Gap snapshot: mobile menu-scanning feature

Target: `mobile/features/menu-scanning/`

**Status:** Not in repo. From `build-guide/17-menu-scanning/01`, `03`, `04`, `05`, `08`.

```tsx
// mobile/features/menu-scanning/components/menu-capture.feature.tsx

import { useState } from 'react'
import { View, Pressable, Text } from 'react-native'
import { CameraView } from 'expo-camera'
import { useMenuCapture } from '../hooks/use.menu.capture.hook'
import { useMenuScan } from '../hooks/use.menu.scan.hook'
import { MenuResultsFeature } from './menu-results.feature'

export function MenuCaptureFeature() {
  const capture = useMenuCapture()
  const scan = useMenuScan()
  const [result, setResult] = useState<Awaited<ReturnType<typeof scan.submitPhotos>> | null>(null)

  async function onAnalyze() {
    const response = await scan.submitPhotos({
      imagesBase64: capture.pages.map((p) => p.imageBase64),
      restaurantId: capture.restaurantId,
      placeName: capture.placeName,
      geoHash: capture.geoHash,
      capturedAt: Date.now(),
    })
    setResult(response)
  }

  if (result?.dishes) {
    return <MenuResultsFeature result={result} />
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={{ flex: 1 }} />
      <Text>{capture.pages.length} page(s) captured</Text>
      <Pressable onPress={() => capture.addPageFromCamera(/* frame */)}>
        <Text>Add page</Text>
      </Pressable>
      <Pressable onPress={onAnalyze} disabled={capture.pages.length === 0}>
        <Text>Analyze menu</Text>
      </Pressable>
    </View>
  )
}
```

```tsx
// mobile/features/menu-scanning/components/menu-results.feature.tsx

import { FlatList, Pressable, Text, View } from 'react-native'
import type { MenuScanResult } from '@brioela/shared/validator/menu.scan'
import { WaiterQuestionLargeText } from './waiter-question.large-text'
import { OfflinePartialBanner } from './offline-partial.banner'
import { MenuLanguageBridgeEntry } from './menu-language-bridge.entry'

const VERDICT_COLOR = { green: '#2ecc71', yellow: '#f1c40f', red: '#e74c3c' } as const

export function MenuResultsFeature({ result }: { result: MenuScanResult }) {
  return (
    <View style={{ flex: 1 }}>
      <OfflinePartialBanner visible={result.guardrailsUnavailable} />
      {result.placeOverlay?.summaryLines.map((line) => (
        <Text key={line}>{line}</Text>
      ))}
      <FlatList
        data={result.dishes}
        keyExtractor={(item) => item.dishId}
        renderItem={({ item }) => (
          <View style={{ borderLeftWidth: 4, borderLeftColor: VERDICT_COLOR[item.verdict] }}>
            <Text>{item.dishName}</Text>
            <Text>{item.reason}</Text>
            {item.verdict === 'yellow' && item.waiterQuestion ? (
              <>
                <WaiterQuestionLargeText question={item.waiterQuestion} />
                <MenuLanguageBridgeEntry dishId={item.dishId} question={item.waiterQuestion} />
              </>
            ) : null}
          </View>
        )}
      />
    </View>
  )
}
```

```typescript
// mobile/features/menu-scanning/hooks/use.menu.capture.hook.ts

import { useState } from 'react'

type MenuCapturePage = {
  localId: string
  imageBase64: string
  capturedAt: number
  order: number
}

export function useMenuCapture() {
  const [pages, setPages] = useState<MenuCapturePage[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [geoHash, setGeoHash] = useState<string | null>(null)

  function addPageFromCamera(imageBase64: string) {
    setPages((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        imageBase64,
        capturedAt: Date.now(),
        order: prev.length,
      },
    ])
  }

  function removePage(localId: string) {
    setPages((prev) => prev.filter((p) => p.localId !== localId).map((p, i) => ({ ...p, order: i })))
  }

  return {
    pages,
    restaurantId,
    placeName,
    geoHash,
    addPageFromCamera,
    removePage,
    setRestaurantId,
    setPlaceName,
    setGeoHash,
  }
}
```
