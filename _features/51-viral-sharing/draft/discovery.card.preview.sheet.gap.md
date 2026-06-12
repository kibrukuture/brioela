# Draft: discovery.card.preview.sheet.tsx (gap — file does not exist)

Target: `mobile/features/viral.sharing/components/discovery.card.preview.sheet.tsx`

**Gap (feature 51):** Preview before system share sheet — never auto-share.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md`, `03-privacy-scrub-and-consent.md`

---

```tsx
import { Modal, Pressable, Text, View } from 'react-native'
import type { DiscoveryCard } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'
import type { ShareConsentLevel } from '@brioela/shared/constants/viral.sharing/share.consent.level.constant'
import { confirmDiscoveryCardShare } from '@/network/viral.sharing/viral.sharing.api'
import { openSystemShareSheet } from '@/lib/share/open.system.share.sheet'

type Props = {
	visible: boolean
	card: DiscoveryCard
	requiresExplicitConsent: boolean
	onDismiss: () => void
	onShared: () => void
}

export function DiscoveryCardPreviewSheet({
	visible,
	card,
	requiresExplicitConsent,
	onDismiss,
	onShared,
}: Props) {
	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
			<View>
				<Text>{card.title}</Text>
				<Text>{card.finding}</Text>
				{card.contextLine ? <Text>{card.contextLine}</Text> : null}
				<Text>{card.attribution}</Text>

				{requiresExplicitConsent ? (
					<Text>
						This card includes personal response wording. Share only if you are
						comfortable.
					</Text>
				) : null}

				<Pressable
					onPress={async () => {
						const consentLevel: ShareConsentLevel = requiresExplicitConsent
							? 'explicit_sensitive_opt_in'
							: 'preview_confirmed'
						const { artifactRef } = await confirmDiscoveryCardShare({
							cardId: card.cardId,
							consentLevel,
						})
						await openSystemShareSheet({ artifactRef, mimeType: 'image/png' })
						onShared()
					}}
				>
					<Text>Share</Text>
				</Pressable>

				<Pressable onPress={onDismiss}>
					<Text>Not now</Text>
				</Pressable>
			</View>
		</Modal>
	)
}
```
