# Draft: entrance-motion.ts (gap — file does not exist)

Target: `mobile/grammar/motion/entrance-motion.ts`

**Gap (feature 52):** Map entrance motion presets to Reanimated styles.

**Source:** `17-motion-beats-system.md`

---

```typescript
import { useReducedMotion } from 'react-native-reanimated'
import type { EntranceMotion } from '@brioela/shared/grammar/schema/tokens/entrance-motion'

export type EntranceStyle = {
	opacity: number
	transform: { translateY: number }[]
}

export function useEntranceMotion(
	motion: EntranceMotion | null,
): EntranceStyle {
	const reducedMotion = useReducedMotion()

	if (reducedMotion || !motion) {
		return { opacity: 1, transform: [{ translateY: 0 }] }
	}

	switch (motion.preset) {
		case 'fade_all_entrance':
			return { opacity: 1, transform: [{ translateY: 0 }] }
		case 'slide_primary_then_details_entrance':
			return { opacity: 1, transform: [{ translateY: 0 }] }
		case 'scale_primary_then_supporting_entrance':
			return { opacity: 1, transform: [{ translateY: 0 }] }
		case 'settle_all_entrance':
			return { opacity: 1, transform: [{ translateY: 0 }] }
		case 'cascade_details_entrance':
			return { opacity: 1, transform: [{ translateY: 0 }] }
		default: {
			const _exhaustive: never = motion.preset
			return _exhaustive
		}
	}
}
```
