# Draft: kin.opt.in.prompt.sheet.tsx (gap — file does not exist)

Target: `mobile/features/kin/components/kin.opt.in.prompt.sheet.tsx`

**Gap (feature 50):** Value-first reciprocal opt-in — shown after CGM + personal correlation.

---

```tsx
import { useState } from 'react'
import { View, Text } from 'react-native'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

type KinOptInPromptSheetProps = {
	visible: boolean
	onAccept: () => Promise<void>
	onDecline: () => void
}

export function KinOptInPromptSheet({ visible, onAccept, onDecline }: KinOptInPromptSheetProps) {
	const [loading, setLoading] = useState(false)

	return (
		<Sheet visible={visible} onDismiss={onDecline} title="Meet your Kin">
			<View className="gap-4 p-4">
				<Text className="text-base text-foreground">
					Use anonymous glucose response patterns from people whose bodies respond like yours — and
					contribute yours anonymously in return. You will never see who they are.
				</Text>
				<Text className="text-sm text-muted-foreground">
					Turn this off anytime in Connected Devices. That stops both directions.
				</Text>
				<Button
					label={loading ? 'Turning on…' : 'Use Kin'}
					onPress={async () => {
						setLoading(true)
						try {
							await onAccept()
						} finally {
							setLoading(false)
						}
					}}
				/>
				<Button variant="ghost" label="Not now" onPress={onDecline} />
			</View>
		</Sheet>
	)
}
```

Never re-ask after decline — entry remains in Connected Devices only.
