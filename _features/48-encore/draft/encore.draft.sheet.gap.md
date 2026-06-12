# Draft: encore.draft.sheet.tsx (gap — file does not exist)

Target: `mobile/features/encore/components/encore.draft.sheet.tsx`

**Gap (feature 48):** High-priority in-app surface when reconstruction draft arrives.

```tsx
import { Sheet } from '@/components/sheet'
import { Text, View } from 'react-native'
import { useEncoreReconstruction } from '../hooks/use.encore.reconstruction.hook'
import { EncoreTierPreviewGate } from './encore.tier.preview.gate'
import { EncoreSourcingList } from './encore.sourcing.list'

type Props = {
	encoreId: string
	onDismiss: () => void
}

export function EncoreDraftSheet({ encoreId, onDismiss }: Props) {
	const { data, isLoading } = useEncoreReconstruction(encoreId)

	if (isLoading || !data) return null

	return (
		<Sheet onDismiss={onDismiss}>
			<Text>{data.draftRecipe?.title ?? 'Your Encore'}</Text>
			<EncoreTierPreviewGate encore={data}>
				<View>
					<EncoreSourcingList items={data.sourcing ?? []} />
					{data.openQuestions?.map((q) => (
						<Text key={q.id}>{q.questionText}</Text>
					))}
				</View>
			</EncoreTierPreviewGate>
		</Sheet>
	)
}
```
