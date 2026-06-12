# Draft: background-effect-field.tsx (gap — file does not exist)

Target: `mobile/grammar/background-effect/background-effect-field.tsx`

**Gap (feature 52):** Tier-2 Skia field host — token-driven, degradation ladder.

**Source:** `16-atmosphere-skia-system.md`

---

```tsx
import { Canvas } from '@shopify/react-native-skia'
import type { BackgroundEffectSelection } from '@brioela/shared/grammar/schema/tokens/background-effect'
import { resolveUniformRange } from './uniform-ranges'
import { useBackgroundEffectDegradationLevel } from './degradation'

export type BackgroundEffectFieldProps = {
	selection: BackgroundEffectSelection
}

export function BackgroundEffectField({ selection }: BackgroundEffectFieldProps) {
	const degradation = useBackgroundEffectDegradationLevel()
	const uniforms = resolveUniformRange(selection)

	if (degradation === 'fallback' || selection.family === 'none') {
		return null
	}

	return (
		<Canvas style={{ position: 'absolute', inset: 0 }}>
			{/* Shader selected by selection.family — hand-authored SkSL in shaders/ */}
		</Canvas>
	)
}
```
