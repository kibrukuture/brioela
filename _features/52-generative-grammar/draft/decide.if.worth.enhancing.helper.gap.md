# Draft: decide-if-worth-enhancing.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/decide-if-worth-enhancing.ts`

**Gap (feature 52):** Silence gate — generation is the exception, not the reflex.

**Source:** `13-how-ai-selects.md`, `brioela-specs/00-product-philosophy-and-ux.md`

---

```typescript
import type { ComposeBrioelaGenerativeUiInput } from './compose-brioela-generative-ui'

export type WorthEnhancingContext = ComposeBrioelaGenerativeUiInput & {
	recentlySurfaced?: boolean
	confidence?: number
}

export async function decideIfWorthEnhancing(
	input: WorthEnhancingContext,
): Promise<boolean> {
	if (input.recentlySurfaced) {
		return false
	}

	if (input.confidence !== undefined && input.confidence < 0.55) {
		return false
	}

	// surface-specific cheap heuristics live in feature payload builders
	return true
}
```
