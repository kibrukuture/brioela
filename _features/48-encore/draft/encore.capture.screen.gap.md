# Draft: encore.capture.screen.tsx (gap — file does not exist)

Target: `mobile/features/encore/screens/encore.capture.screen.tsx`

**Gap (feature 48):** Explicit recreate flow — separate from passive visual intake (**34**).

```tsx
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { CameraView } from 'expo-camera'
import { useEncoreCapture } from '../hooks/use.encore.capture.hook'

export function EncoreCaptureScreen() {
	const [photoIds, setPhotoIds] = useState<string[]>([])
	const { submitCapture, isSubmitting } = useEncoreCapture()

	return (
		<View style={{ flex: 1 }}>
			<CameraView
				style={{ flex: 1 }}
				onPictureTaken={(photo) => {
					setPhotoIds((prev) => [...prev, photo.uploadId])
				}}
			/>
			<Text>I want this forever</Text>
			<Pressable
				disabled={photoIds.length === 0 || isSubmitting}
				onPress={() =>
					submitCapture({
						photoUploadIds: photoIds,
						context: { capturedAt: Date.now() },
					})
				}
			>
				<Text>Encore it</Text>
			</Pressable>
		</View>
	)
}
```

**Rule:** This route must not be reachable from universal visual intake passive meal log path.
