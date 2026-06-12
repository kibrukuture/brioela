# Draft: passport.preview.sheet.tsx (gap — file does not exist)

Target: `mobile/features/passport/components/passport.preview.sheet.tsx`

**Gap (feature 47):** Preview-before-share sheet — edit lines, pick share mode, translate, cancel.

**Source:** `build-guide/28-passport/03-generation-flow.md`, `01-design-system/13-evidence-first-ui.md`

---

```tsx
import { useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import type { PassportKind } from '@brioela/shared/constants/passport/passport.kind.constant'
import type { PassportResponse } from '@brioela/shared/validator/passport/passport.schema'
import { usePassportPreview } from '../hooks/use.passport.preview.hook'

type PassportPreviewSheetProps = {
	visible: boolean
	kind: PassportKind
	onClose: () => void
	onConfirmed: (passport: PassportResponse) => void
}

export function PassportPreviewSheet({
	visible,
	kind,
	onClose,
	onConfirmed,
}: PassportPreviewSheetProps) {
	const { preview, confirm, isLoading } = usePassportPreview({ kind })
	const [shareMode, setShareMode] = useState<
		'show_on_screen' | 'image' | 'pdf' | 'qr_link' | 'text'
	>('show_on_screen')

	if (!visible) return null

	return (
		<View accessibilityRole="summary">
			<Text>Passport</Text>
			<ScrollView>
				{preview?.instructionBlocks.map((block) => (
					<View key={block.heading}>
						<Text>{block.heading}</Text>
						{block.lines.map((line) => (
							<Text key={line}>{line}</Text>
						))}
					</View>
				))}
			</ScrollView>
			<Pressable
				disabled={isLoading}
				onPress={async () => {
					const created = await confirm({ shareMode, consentLevel: 'preview_confirmed' })
					if (created) onConfirmed(created)
				}}
			>
				<Text>Show to staff</Text>
			</Pressable>
			<Pressable onPress={onClose}>
				<Text>Cancel</Text>
			</Pressable>
		</View>
	)
}
```
