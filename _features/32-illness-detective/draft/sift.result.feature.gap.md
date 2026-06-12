# Draft: sift.feature.tsx (gap — file does not exist)

Target: `mobile/features/illness.detective/sift.feature.tsx`

**Source:** `build-guide/16-illness-detective/05-output-privacy-and-followup.md`, `brioela-specs/39-generative-ui.md` (empathetic tone; safety banner static).

---

```tsx
import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SiftSuspectCard } from './_components/sift-suspect-card'
import { SiftSafetyBanner } from './_components/sift-safety-banner'
import { SiftFollowupQuestions } from './_components/sift-followup-questions'

export type SiftSuspect = {
	rank: number
	suspectType: 'product' | 'restaurant' | 'meal'
	label: string
	confidenceScore: number
	reasonText: string
	recallActive: boolean
	recallMatchId?: string
}

export type SiftResultProps = {
	reportId: string
	suspects: SiftSuspect[]
	safetySummary: string
	headline?: string
	onFollowupAnswer?: (answers: { othersSick?: boolean; fullyCooked?: boolean }) => void
	onResolve?: () => void
}

export function SiftResultFeature({
	reportId,
	suspects,
	safetySummary,
	headline = 'Here is what stood out from your last few days',
	onFollowupAnswer,
	onResolve,
}: SiftResultProps) {
	return (
		<ScrollView className="flex-1 bg-surface px-4 py-6">
			<Text className="font-parafina text-3xl text-ink">{headline}</Text>
			<Text className="mt-2 text-base text-ink-muted">{safetySummary}</Text>

			<SiftSafetyBanner className="mt-4" />

			<View className="mt-6 gap-3">
				{suspects.map((s) => (
					<SiftSuspectCard key={`${reportId}-${s.rank}`} suspect={s} />
				))}
			</View>

			<SiftFollowupQuestions className="mt-8" onSubmit={onFollowupAnswer} />

			{onResolve ? (
				<Text
					accessibilityRole="button"
					className="mt-8 text-center text-base text-accent"
					onPress={onResolve}
				>
					I feel better — mark resolved
				</Text>
			) : null}
		</ScrollView>
	)
}
```

Entry via chat (**20**) may navigate to `mobile/app/sift/[reportId].tsx` with fetched report payload.
