# Draft: heirloom.recipient.view.screen.tsx (gap — file does not exist)

Target: `mobile/features/heirloom/screens/heirloom.recipient.view.screen.tsx`

**First experience for inheritance-entry users:** this screen opens after sign-in, not the scanner.

---

```tsx
import { View, Text, ScrollView } from 'react-native'
import { CookStyleProfileCard } from '../components/cook.style.profile.card'
import { CookInStyleCta } from '../components/cook.in.style.cta'

type Props = {
	heirloomId: string
}

export function HeirloomRecipientViewScreen({ heirloomId }: Props) {
	// load heirloom via GET /api/heirlooms/:id
	const heirloom = null as {
		cookName: string
		dedicationText?: string
		recipes: Array<{ id: string; title: string }>
		styleProfile?: { id: string; styleSummaryText: string }
	} | null

	if (!heirloom) return <Text>Loading…</Text>

	return (
		<ScrollView>
			<Text>{heirloom.cookName}&apos;s Heirloom</Text>
			{heirloom.dedicationText && <Text>{heirloom.dedicationText}</Text>}
			{heirloom.styleProfile && (
				<CookStyleProfileCard profile={heirloom.styleProfile} editable={false} />
			)}
			{heirloom.recipes.map((recipe) => (
				<View key={recipe.id}>
					<Text>{recipe.title}</Text>
					{heirloom.styleProfile && (
						<CookInStyleCta recipeId={recipe.id} profileId={heirloom.styleProfile.id} />
					)}
				</View>
			))}
		</ScrollView>
	)
}
```
