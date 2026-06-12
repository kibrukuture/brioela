# Draft: brioela-generative-ui-renderer.tsx (gap — file does not exist)

Target: `mobile/grammar/brioela-generative-ui-renderer.tsx`

**Gap (feature 52):** Main renderer entry — validate, 400ms budget, recursive scene mount.

**Source:** `05-renderer-and-fallback.md`, `15-validation-and-repair.md`

---

```tsx
import { useRef, useState } from 'react'
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import { validateReceivedBrioelaGenerativeUi } from './client-validate'
import { CompositionScene } from './compositions/composition-scene'
import { BackgroundEffectField } from './background-effect/background-effect-field'
import { useEntranceMotion } from './motion/entrance-motion'
import { ENHANCEMENT_BUDGET_MS } from './fallback'

export type BrioelaGenerativeUiRendererProps = {
	document: BrioelaGenerativeUiDocument | null | undefined
	fallback: React.ReactNode
	receivedAt?: number
}

export function BrioelaGenerativeUiRenderer({
	document,
	fallback,
	receivedAt,
}: BrioelaGenerativeUiRendererProps) {
	const mountedAt = useRef(Date.now())
	const [enhancementVisible, setEnhancementVisible] = useState(false)

	if (!document) {
		return <>{fallback}</>
	}

	const arrival = receivedAt ?? Date.now()
	if (arrival - mountedAt.current > ENHANCEMENT_BUDGET_MS) {
		return <>{fallback}</>
	}

	const validated = validateReceivedBrioelaGenerativeUi(document)
	if (!validated.ok) {
		return <>{fallback}</>
	}

	const doc = validated.document
	const entranceStyle = useEntranceMotion(doc.entranceMotion)

	if (!enhancementVisible) {
		setEnhancementVisible(true)
	}

	return (
		<>
			{doc.backgroundEffect ? (
				<BackgroundEffectField selection={doc.backgroundEffect} />
			) : null}
			<CompositionScene
				document={doc}
				entranceStyle={entranceStyle}
			/>
		</>
	)
}
```
