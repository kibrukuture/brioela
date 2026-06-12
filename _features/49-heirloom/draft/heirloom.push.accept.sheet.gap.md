# Draft: heirloom.push.accept.sheet.tsx (gap — file does not exist)

Target: `mobile/features/heirloom/components/heirloom.push.accept.sheet.tsx`

**Rule:** Push-forward offers delta only — nothing lands silently (`03-do-to-do-delivery.md`).

---

```tsx
import { View, Text, Pressable } from 'react-native'

type DeltaItem = {
	itemType: 'recipe' | 'style_profile' | 'moment'
	label: string
	ownerNote?: string
	version: number
}

type Props = {
	open: boolean
	cookName: string
	delta: DeltaItem
	onAccept: () => void
	onDecline: () => void
}

export function HeirloomPushAcceptSheet({
	open,
	cookName,
	delta,
	onAccept,
	onDecline,
}: Props) {
	if (!open) return null

	return (
		<View>
			<Text>New addition to {cookName}&apos;s Heirloom</Text>
			<Text>{delta.label}</Text>
			{delta.ownerNote && <Text>{delta.ownerNote}</Text>}
			<Text>Version {delta.version}</Text>
			<Pressable onPress={onAccept}>
				<Text>Add to my copy</Text>
			</Pressable>
			<Pressable onPress={onDecline}>
				<Text>Not now</Text>
			</Pressable>
		</View>
	)
}
```
