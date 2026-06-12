# Draft: explain.to.kid.button.tsx (gap — file does not exist)

Target: `mobile/features/kids.mode/_components/explain.to.kid.button.tsx`

**Gap:** No scan result CTA; **24** mobile scanner not built.

**Source:** `build-guide/21-kids-mode/02-scan-explanation.md`, `05-safety-and-tier-boundary.md`

---

```tsx
import { Pressable, Text, View } from 'react-native'
import { useKidsModeProfile } from '../_hooks/use.kids.mode.profile.hook'
import { useKidsExplanation } from '../_hooks/use.kids.explanation.hook'
import { KidsModeTeaser } from './kids.mode.teaser'
import { AgeRangePicker } from './age.range.picker'
import { KidsExplanationPanel } from './kids.explanation.panel'

type ExplainToKidButtonProps = {
	scanEventId: string
	hasHardAllergyBlock: boolean
	adultVerdictReady: boolean
}

export function ExplainToKidButton({
	scanEventId,
	hasHardAllergyBlock,
	adultVerdictReady,
}: ExplainToKidButtonProps) {
	const { profile, needsAgePick, setAgeRange } = useKidsModeProfile()
	const { entitlement, explanation, explain, isLoading, showTeaser } = useKidsExplanation({
		scanEventId,
	})

	if (!adultVerdictReady) {
		return null
	}

	return (
		<View className="mt-4 gap-3">
			{hasHardAllergyBlock ? (
				<Text className="text-sm text-muted-foreground">
					Safety warning stays above any kid explanation.
				</Text>
			) : null}

			{showTeaser ? (
				<KidsModeTeaser onUpgrade={() => {}} />
			) : (
				<Pressable
					className="rounded-xl bg-primary px-4 py-3"
					disabled={isLoading || !entitlement?.allowed}
					onPress={() => {
						if (needsAgePick) return
						void explain(profile.ageRange)
					}}
				>
					<Text className="text-center font-medium text-primary-foreground">
						Explain to my kid
					</Text>
				</Pressable>
			)}

			{needsAgePick ? (
				<AgeRangePicker
					selected={profile.ageRange}
					onSelect={(range) => {
						void setAgeRange(range)
					}}
				/>
			) : null}

			{explanation ? <KidsExplanationPanel explanation={explanation} /> : null}
		</View>
	)
}
```
