# Draft: passport.generative.surface.ts (gap — file does not exist)

Target: `shared/constants/grammar/passport.generative.surface.ts` (or **52** registry path)

**Gap (feature 47):** Grammar surface contract — frame only; cannot mutate instruction content.

**Source:** `build-guide/28-passport/07-rendering-with-grammar.md`

---

```typescript
export const PASSPORT_GENERATIVE_SURFACE = 'passport_render_brioela_generative_ui' as const

export type PassportGenerativeSurface = typeof PASSPORT_GENERATIVE_SURFACE

export const passportGenerativeAllowedNodes = [
	'stack',
	'hero_line',
	'instruction_block',
	'severity_ribbon',
	'translation_pair',
	'expiration_note',
	'qr_anchor',
] as const

export type PassportGenerativeNode = (typeof passportGenerativeAllowedNodes)[number]

/** Visual tokens only — no playful moods for safety handoffs */
export const passportGenerativeVisualTokens = [
	'plain_truth',
	'warm_caution',
	'table_care',
	'focused_cooking',
] as const
```
