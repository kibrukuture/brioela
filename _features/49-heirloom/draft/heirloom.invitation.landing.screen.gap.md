# Draft: heirloom.invitation.landing.screen.tsx (gap — file does not exist)

Target: `mobile/features/heirloom/screens/heirloom.invitation.landing.screen.tsx`

**Rule:** Landing shows cover metadata only — no recipe content in invitation (`02-invitation-flow.md`).

---

```tsx
import { View, Text, Pressable } from 'react-native'
import { useHeirloomInvitation } from '../hooks/use.heirloom.invitation.hook'

type Props = {
	invitationId: string
}

export function HeirloomInvitationLandingScreen({ invitationId }: Props) {
	const { cover, inviterName, expired, accept, signInAndAccept } = useHeirloomInvitation(invitationId)

	if (expired) {
		return (
			<View>
				<Text>This invitation has expired.</Text>
			</View>
		)
	}

	return (
		<View>
			{cover?.coverPhotoRef && <Text>{/* cover image */}</Text>}
			<Text>{cover?.cookName}&apos;s Heirloom</Text>
			<Text>{inviterName} invited you to receive their family recipes.</Text>
			<Pressable onPress={signInAndAccept}>
				<Text>Accept with Apple or Google</Text>
			</Pressable>
			<Pressable onPress={accept}>
				<Text>I already have Brioela — accept</Text>
			</Pressable>
		</View>
	)
}
```
