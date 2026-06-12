# Draft: pantry.capture.feature.tsx (gap — file does not exist)

Target: `mobile/features/pantry/components/pantry.capture.feature.tsx`

**Gap (feature 34):** Fridge/pantry camera capture for ingredient rescue (Culina tier).

**Source:** `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`

---

```tsx
import { useState } from 'react'
import { View, Pressable, Text } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { postPantrySnapshot } from '@/network/pantry/post-snapshot.api'
import { RescueRecipeList } from './rescue.recipe.list'

export function PantryCaptureFeature() {
  const [permission, requestPermission] = useCameraPermissions()
  const [snapshotId, setSnapshotId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useIsomorphicLayoutEffect(() => {
    if (permission === null) return
    if (!permission.granted) void requestPermission()
  }, [permission, requestPermission])

  async function handleCapture(photoBase64: string) {
    setLoading(true)
    try {
      const result = await postPantrySnapshot({
        sourceType: 'camera',
        imageBase64: photoBase64,
      })
      setSnapshotId(result.snapshotId)
    } finally {
      setLoading(false)
    }
  }

  if (permission === null || !permission.granted) {
    return (
      <View>
        <Text>Camera permission required for pantry rescue.</Text>
      </View>
    )
  }

  return (
    <View>
      <CameraView style={{ flex: 1 }} facing="back">
        <Pressable
          onPress={() => {
            // wire capture → base64 → handleCapture
          }}
          disabled={loading}
        >
          <Text>{loading ? 'Scanning…' : 'Capture pantry'}</Text>
        </Pressable>
      </CameraView>
      {snapshotId !== null ? <RescueRecipeList snapshotId={snapshotId} /> : null}
    </View>
  )
}
```

Detection confidence not shown in primary UX (spec 14).
