# Draft: kin.transparency.section.tsx (gap — file does not exist)

Target: `mobile/features/kin/screens/kin.transparency.section.tsx`

**Gap (feature 50):** "What Brioela knows about me" — **47** consumer.

---

```tsx
import { View, Text, Pressable } from 'react-native'
import { useKinState } from '@/features/kin/hooks/use-kin-state'

export function KinTransparencySection() {
	const { data, deleteContribution, optOut } = useKinState()

	if (!data) return null

	return (
		<View className="gap-3">
			<Text className="text-lg font-semibold">Kin</Text>
			<Text className="text-sm text-muted-foreground">
				{data.optedIn ? 'On' : 'Off'}
				{data.clusterDescription ? ` — ${data.clusterDescription}` : ''}
			</Text>

			{data.contributions.length > 0 && (
				<View className="gap-2">
					<Text className="text-sm font-medium">What you contributed</Text>
					{data.contributions.map((row) => (
						<View key={row.contributionId} className="flex-row items-center justify-between">
							<Text className="text-sm">{row.productName}</Text>
							<Pressable onPress={() => deleteContribution(row.contributionId)}>
								<Text className="text-sm text-destructive">Delete</Text>
							</Pressable>
						</View>
					))}
				</View>
			)}

			{data.optedIn && (
				<Pressable onPress={optOut}>
					<Text className="text-sm text-destructive">Turn off Kin</Text>
				</Pressable>
			)}
		</View>
	)
}
```

Per-item deletion marks contribution withdrawn; aggregates recompute next batch.
