# Draft: heirloom.assembly.screen.tsx (gap — file does not exist)

Target: `mobile/features/heirloom/screens/heirloom.assembly.screen.tsx`

---

```tsx
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import type { HeirloomAssembleInput } from '@brioela/shared/validator/heirloom/heirloom.schema'
import { HeirloomDedicationSheet } from '../components/heirloom.dedication.sheet'
import { HeirloomItemPreviewList } from '../components/heirloom.item.preview.list'
import { useHeirloomAssembly } from '../hooks/use.heirloom.assembly.hook'

export function HeirloomAssemblyScreen() {
	const { selectedRecipes, selectedProfile, moments, assemble, tierBlocked } =
		useHeirloomAssembly()
	const [dedicationOpen, setDedicationOpen] = useState(false)
	const [dedication, setDedication] = useState('')

	if (tierBlocked) {
		return (
			<View>
				<Text>Assembling an Heirloom is included with Culina.</Text>
			</View>
		)
	}

	const canPreview =
		selectedRecipes.length > 0 || selectedProfile !== null || moments.length > 0

	const handleSend = async (input: HeirloomAssembleInput) => {
		await assemble(input)
	}

	return (
		<View>
			<Text>Curate an Heirloom</Text>
			<Text>Nothing is included until you choose it.</Text>
			<HeirloomItemPreviewList
				recipes={selectedRecipes}
				profile={selectedProfile}
				moments={moments}
			/>
			{canPreview && (
				<Pressable onPress={() => setDedicationOpen(true)}>
					<Text>Preview and send</Text>
				</Pressable>
			)}
			<HeirloomDedicationSheet
				open={dedicationOpen}
				onClose={() => setDedicationOpen(false)}
				dedication={dedication}
				onDedicationChange={setDedication}
				onConfirm={(cover) => handleSend({ ...cover, dedicationText: dedication })}
			/>
		</View>
	)
}
```
