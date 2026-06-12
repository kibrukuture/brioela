# Draft: version.ts (gap — file does not exist)

Target: `shared/grammar/version.ts`

**Gap (feature 52):** Grammar version policy — client and server must agree before render.

**Source:** `build-guide/27-generative-grammar/02-grammar-document.md`, `15-validation-and-repair.md`

---

```typescript
export const GRAMMAR_VERSION = '1' as const

export type GrammarVersion = typeof GRAMMAR_VERSION

export const SUPPORTED_GRAMMAR_VERSIONS = [GRAMMAR_VERSION] as const satisfies readonly GrammarVersion[]

export function isSupportedGrammarVersion(value: string): value is GrammarVersion {
	return (SUPPORTED_GRAMMAR_VERSIONS as readonly string[]).includes(value)
}

/** Reject unknown versions on live path — static fallback stands */
export function assertSupportedGrammarVersion(value: string): GrammarVersion {
	if (!isSupportedGrammarVersion(value)) {
		throw new Error(`Unsupported grammarVersion: ${value}`)
	}
	return value
}
```
