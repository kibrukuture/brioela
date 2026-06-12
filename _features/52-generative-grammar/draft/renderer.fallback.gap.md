# Draft: fallback.ts (gap — file does not exist)

Target: `mobile/grammar/fallback.ts`

**Gap (feature 52):** 400ms enhancement budget constant + fail-closed logging hook.

**Source:** `05-renderer-and-fallback.md`, `brioela-specs/39-generative-ui.md`

---

```typescript
/** Generative layer must arrive within this window or static UI stays */
export const ENHANCEMENT_BUDGET_MS = 400

export type GrammarFailureMode =
	| 'schema_parse_failed'
	| 'unsupported_grammar_version'
	| 'layout_not_allowed_on_surface'
	| 'illegal_background_pairing'
	| 'illegal_entrance_pairing'
	| 'enhancement_budget_exceeded'
	| 'renderer_error_boundary'

export function logGrammarFailure(input: {
	surface: string | undefined
	mode: GrammarFailureMode
}): void {
	if (__DEV__) {
		console.info('[grammar] fail_closed', input)
	}
	// production: emit telemetry — never show user
}
```
