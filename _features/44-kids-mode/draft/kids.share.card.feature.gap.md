# Draft: kids.share.prompt.tsx + payload helper (gap — files do not exist)

Target: `mobile/features/kids.mode/_components/kids.share.prompt.tsx`, `backend/.../build.kids.share.card.payload.helper.ts`

**Gap:** No share flow; **51** owns Discovery Card render.

**Source:** `build-guide/21-kids-mode/04-share-card.md`, `build-guide/24-viral-sharing/04`

---

```typescript
// backend/src/agents/brain/_helpers/kids.mode/build.kids.share.card.payload.helper.ts
import {
	kidsShareCardAttribution,
	kidsShareCardSchema,
	type KidsShareCard,
} from '@/shared/validator/kids.mode/kids.share.card.schema'
import type { KidsScanExplanation } from '@/shared/validator/kids.mode/kids.scan.explanation.schema'

type BuildKidsShareCardPayloadInput = {
	explanation: KidsScanExplanation
	productName: string
	productImageUrl: string | null
}

export function buildKidsShareCardPayload(
	input: BuildKidsShareCardPayloadInput,
): KidsShareCard {
	const payload = {
		scanEventId: input.explanation.scanEventId,
		productName: input.productName,
		productImageUrl: input.productImageUrl,
		verdictSentence: input.explanation.verdictSentence,
		coolFact: input.explanation.coolFact,
		ageRange: input.explanation.ageRange,
		attribution: kidsShareCardAttribution,
	}
	return kidsShareCardSchema.parse(payload)
}
```

```tsx
// mobile/features/kids.mode/_components/kids.share.prompt.tsx
import { Pressable, Text, View } from 'react-native'

type KidsSharePromptProps = {
	onShare: () => void
	onSaveImage: () => void
	onDismiss: () => void
}

export function KidsSharePrompt({ onShare, onSaveImage, onDismiss }: KidsSharePromptProps) {
	return (
		<View className="gap-3 rounded-xl border border-border p-4">
			<Text className="text-base font-medium">Share this learning moment?</Text>
			<Pressable className="rounded-lg bg-primary py-2" onPress={onShare}>
				<Text className="text-center text-primary-foreground">Share card</Text>
			</Pressable>
			<Pressable className="rounded-lg border border-border py-2" onPress={onSaveImage}>
				<Text className="text-center">Save image</Text>
			</Pressable>
			<Pressable onPress={onDismiss}>
				<Text className="text-center text-muted-foreground">Not now</Text>
			</Pressable>
		</View>
	)
}
```
