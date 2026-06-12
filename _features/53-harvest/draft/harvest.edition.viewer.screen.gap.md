# Draft: harvest.edition.viewer.screen.tsx (gap — file does not exist)

Target: `mobile/features/harvest/screens/harvest.edition.viewer.screen.tsx`

**Gap (feature 53):** Full-screen paged story — renders stored **52** documents instantly.

**Source:** `brioela-specs/49-harvest.md` § User Outcome; `36-harvest/03-grammar-rendering.md`

---

```tsx
import { useState } from 'react'
import { View, FlatList, Dimensions } from 'react-native'
import { BrioelaGenerativeUiRenderer } from '@/grammar/brioela-generative-ui-renderer'
import { HarvestChapterShareButton } from '@/features/harvest/components/harvest.chapter.share.button'
import { useHarvestEdition } from '@/features/harvest/hooks/use.harvest.edition'
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'

type HarvestEditionViewerProps = {
	editionId: string
}

export function HarvestEditionViewerScreen({ editionId }: HarvestEditionViewerProps) {
	const { edition, chapters, documentSet, markOpened } = useHarvestEdition(editionId)
	const [pageIndex, setPageIndex] = useState(0)
	const width = Dimensions.get('window').width

	if (!edition || !documentSet) {
		return null
	}

	const pages: Array<{ chapterId: string; document: BrioelaGenerativeUiDocument }> =
		documentSet.chapters

	return (
		<View style={{ flex: 1 }}>
			<FlatList
				data={pages}
				horizontal
				pagingEnabled
				keyExtractor={(item) => item.chapterId}
				onMomentumScrollEnd={(e) => {
					const index = Math.round(e.nativeEvent.contentOffset.x / width)
					setPageIndex(index)
					if (index === 0 && !edition.openedAt) {
						void markOpened()
					}
				}}
				renderItem={({ item, index }) => {
					const chapter = chapters[index]
					return (
						<View style={{ width }}>
							<BrioelaGenerativeUiRenderer
								document={item.document}
								fallbackHeadline={chapter?.headline ?? ''}
								fallbackBody={chapter?.body ?? ''}
							/>
							{chapter ? (
								<HarvestChapterShareButton
									editionId={editionId}
									chapterId={chapter.chapterId}
									shareCardRef={chapter.shareCardRef}
								/>
							) : null}
						</View>
					)
				}}
			/>
		</View>
	)
}
```
