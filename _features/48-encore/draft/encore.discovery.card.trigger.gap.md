# Draft: encore.discovery.card.trigger.tsx (gap — file does not exist)

Target: `mobile/features/encore/components/encore.discovery.card.trigger.tsx`

**Gap (feature 48):** Offer Discovery Card after first completed home cook — generation is **51**.

**Source:** `build-guide/31-encore/05-share-and-records.md`, `brioela-specs/25-viral-growth-and-sharing.md`

```tsx
import { Pressable, Text, View } from 'react-native'
import { requestDiscoveryCard } from '@/features/viral-sharing/viral.sharing.api'

type Props = {
	encoreId: string
	originCity?: string
	dishName: string
	platePhotoRef: string
	homeCookedPhotoRef: string
	onDecline: () => void
}

export function EncoreDiscoveryCardTrigger({
	encoreId,
	originCity,
	dishName,
	platePhotoRef,
	homeCookedPhotoRef,
	onDecline,
}: Props) {
	return (
		<View>
			<Text>
				{tastedInCity(originCity)} — cooked at home with Brioela
			</Text>
			<Pressable
				onPress={() =>
					requestDiscoveryCard({
						kind: 'encore_first_cook',
						encoreId,
						dishName,
						city: originCity,
						platePhotoRef,
						homeCookedPhotoRef,
					})
				}
			>
				<Text>Share your Encore</Text>
			</Pressable>
			<Pressable onPress={onDecline}>
				<Text>Not now</Text>
			</Pressable>
		</View>
	)
}

function tastedInCity(city?: string): string {
	return city ? `Tasted in ${city}` : 'Tasted away from home'
}
```

**Boundary:** Card scrub/render pipeline owned by **51** — this component only fires the request.
