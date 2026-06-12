# Draft: scan-explanation-focus-scene.tsx (gap — file does not exist)

Target: `mobile/grammar/compositions/scan-explanation-focus-scene.tsx`

**Gap (feature 52):** First vertical-slice layout template Scene.

**Source:** `11-composition-catalog-and-scale.md`, `20-contracts-and-stage-delivery.md`

---

```tsx
import { View } from 'react-native'
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import type { EntranceStyle } from '../motion/entrance-motion'
import { HeadlineNode } from '../nodes/expressive/headline-node'
import { CaptionNode } from '../nodes/expressive/caption-node'

export type ScanExplanationFocusSceneProps = {
	document: Extract<
		BrioelaGenerativeUiDocument,
		{ layoutTemplate: { type: 'scan_explanation_focus_layout' } }
	>
	entranceStyle: EntranceStyle
}

export function ScanExplanationFocusScene({
	document,
	entranceStyle,
}: ScanExplanationFocusSceneProps) {
	const content = document.content
	if (content.type !== 'scan_explanation_focus_layout') {
		return null
	}

	return (
		<View style={{ opacity: entranceStyle.opacity }}>
			<HeadlineNode
				node={{
					type: 'headline',
					text: content.headline,
					tone: 'neutral',
				}}
			/>
			{content.caption ? (
				<CaptionNode
					node={{
						type: 'caption',
						text: content.caption,
						tone: 'neutral',
					}}
				/>
			) : null}
		</View>
	)
}
```
