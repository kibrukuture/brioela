# Draft: normalize.by.recipe.difficulty.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/growth-mirror/normalize.by.recipe.difficulty.helper.ts`

**Gap:** Mandatory difficulty normalization for independence/timing signals — spec forbids writing un-normalized values.

**Source:** `build-guide/40-growth-mirror/01-skill-evidence-extraction.md`, `brioela-specs/53-growth-mirror.md` § Technical Constraints

---

```typescript
const NORMALIZED_DIMENSIONS = new Set(['independence', 'timing_parallelism'])

export type RawSkillSignal = {
	dimension: string
	rawValue: number
	recipeDifficulty: number
}

export type NormalizedSkillSignal = {
	dimension: string
	normalizedValue: number
	recipeDifficulty: number
}

/**
 * Maps raw per-session counts (interventions, overruns) to a 0..1 scale
 * adjusted by recipe difficulty (0 = easiest, 1 = hardest).
 * Higher difficulty → more tolerance before signaling regression/improvement.
 */
export function normalizeByRecipeDifficulty(
	signal: RawSkillSignal,
): NormalizedSkillSignal | null {
	if (!NORMALIZED_DIMENSIONS.has(signal.dimension)) {
		return {
			dimension: signal.dimension,
			normalizedValue: signal.rawValue,
			recipeDifficulty: signal.recipeDifficulty,
		}
	}

	if (signal.recipeDifficulty < 0 || signal.recipeDifficulty > 1) {
		return null
	}

	const difficultyFactor = 1 + signal.recipeDifficulty * 2
	const normalizedValue = signal.rawValue / difficultyFactor

	return {
		dimension: signal.dimension,
		normalizedValue,
		recipeDifficulty: signal.recipeDifficulty,
	}
}

export function requiresDifficultyNormalization(dimension: string): boolean {
	return NORMALIZED_DIMENSIONS.has(dimension)
}
```
