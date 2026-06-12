# Draft: harvest.archive.shelf.screen.tsx (gap — file does not exist)

Target: `mobile/features/harvest/screens/harvest.archive.shelf.screen.tsx`

**Gap (feature 53):** Past editions shelf — permanent personal history.

**Source:** `brioela-specs/49-harvest.md` § User Outcome

---

```tsx
import { FlatList, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useHarvestEditionsList } from '@/features/harvest/hooks/use.harvest.editions.list'

export function HarvestArchiveShelfScreen() {
	const router = useRouter()
	const { editions, isLoading } = useHarvestEditionsList()

	if (isLoading) {
		return null
	}

	return (
		<View style={{ flex: 1, padding: 16 }}>
			<Text style={{ fontSize: 24, marginBottom: 16 }}>Your Harvests</Text>
			<FlatList
				data={editions}
				keyExtractor={(item) => item.editionId}
				renderItem={({ item }) => (
					<Pressable
						onPress={() => router.push(`/harvest/${item.editionId}`)}
						style={{ paddingVertical: 12, borderBottomWidth: 1 }}
					>
						<Text style={{ fontSize: 18 }}>
							Year {item.yearIndex}
						</Text>
						<Text style={{ opacity: 0.7 }}>
							{item.chapterCount} chapters
						</Text>
					</Pressable>
				)}
			/>
		</View>
	)
}
```
