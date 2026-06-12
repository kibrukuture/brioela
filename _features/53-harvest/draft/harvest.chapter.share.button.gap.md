# Draft: harvest.chapter.share.button.tsx (gap — file does not exist)

Target: `mobile/features/harvest/components/harvest.chapter.share.button.tsx`

**Gap (feature 53):** Explicit per-chapter share → **51** transport.

**Source:** `build-guide/36-harvest/04-share-cards.md`

---

```tsx
import { Pressable, Text, Share } from 'react-native'
import { postHarvestChapterShare } from '@/network/harvest/harvest.api'

type HarvestChapterShareButtonProps = {
	editionId: string
	chapterId: string
	shareCardRef: string | null
}

export function HarvestChapterShareButton({
	editionId,
	chapterId,
	shareCardRef,
}: HarvestChapterShareButtonProps) {
	if (!shareCardRef) {
		return null
	}

	return (
		<Pressable
			onPress={async () => {
				await postHarvestChapterShare({ editionId, chapterId })
				await Share.share({
					url: shareCardRef,
					message: 'my Harvest — Brioela',
				})
			}}
			style={{ padding: 16, alignItems: 'center' }}
		>
			<Text>Share this chapter</Text>
		</Pressable>
	)
}
```
