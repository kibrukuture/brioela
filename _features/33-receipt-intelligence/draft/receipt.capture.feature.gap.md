# Draft: receipt.capture.feature.tsx (gap — file does not exist)

Target: `mobile/features/receipt/components/receipt.capture.feature.tsx`

**Source:** `build-guide/13-receipt-intelligence/06-receipt-ui-and-voice.md`, `brioela-specs/20-platform-and-app-distribution.md`

---

```tsx
import { useCallback, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useReceiptIngest } from '@/features/receipt/hooks/use.receipt.ingest.hook'

export function ReceiptCaptureFeature() {
  const [permission, requestPermission] = useCameraPermissions()
  const { ingest, isPending, error } = useReceiptIngest()
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null)

  const onCapture = useCallback(async () => {
    if (!cameraRef) return
    const photo = await cameraRef.takePictureAsync({
      quality: 0.8,
      base64: true,
      skipProcessing: false,
    })
    if (!photo?.base64) return
    await ingest({
      imageBase64: photo.base64,
      mimeType: 'image/jpeg',
      source: 'camera',
    })
  }, [cameraRef, ingest])

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base text-center mb-4">
          Camera access is needed to scan grocery receipts.
        </Text>
        <Pressable onPress={requestPermission} className="rounded-xl bg-primary px-6 py-3">
          <Text className="text-white font-medium">Allow camera</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={setCameraRef} className="flex-1" facing="back" />
      <View className="absolute bottom-8 left-0 right-0 items-center">
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Pressable
            onPress={onCapture}
            className="h-20 w-20 rounded-full border-4 border-white bg-white/20"
            accessibilityLabel="Capture receipt"
          />
        )}
        {error ? (
          <Text className="text-red-300 text-sm mt-3 px-4 text-center">{error.message}</Text>
        ) : null}
      </View>
    </View>
  )
}
```

Single frame sent for GPT-4o mini vision extraction (spec 20). Luma entitlement check in `useReceiptIngest` hook.
