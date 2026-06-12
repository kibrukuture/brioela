# Draft: get.relevant.namespaces.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/get.relevant.namespaces.helper.ts`

**Gap (feature 15):** Namespace filter for Block 4 memory injection.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainSession } from '@/agents/brain/_schemas'

const COOKING_MEMORY_NAMESPACES = [
	'health',
	'cooking',
	'life.dietary',
	'health.medications',
] as const

const DEFAULT_MEMORY_NAMESPACES = [
	'health',
	'life',
	'cooking.preferences',
] as const

export function getRelevantNamespaces(
	sessionType: BrainSession['sessionType'],
): readonly string[] {
	if (sessionType === 'cooking') {
		return COOKING_MEMORY_NAMESPACES
	}
	return DEFAULT_MEMORY_NAMESPACES
}
```

Source: `build-guide/05-brain/03-session-lifecycle.md` lines 121–126; `_features/11-brain-sessions-lifecycle/spec.md`.

**Living block:** Product may add session-kind namespace maps (e.g. `alarm` → health-only) — extend this helper, not inline in builder.
