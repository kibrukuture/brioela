# Draft: passport-instruction-frame.ts (gap — file does not exist)

Target: `shared/grammar/schema/compositions/passport-instruction-frame.ts`

**Gap (feature 52):** Passport render surface — frame only; instruction blocks are fixed slots.

**Source:** `28-passport/07-rendering-with-grammar.md`, `12-naming-law.md` (supersedes `hero_line`)

---

```typescript
import { z } from '@brioela/shared/zod'

export const passportInstructionFrameLayoutSchema = z.object({
	type: z.literal('passport_instruction_frame_layout'),
})

const passportInstructionBlockSlotSchema = z.object({
	heading: z.string().max(80),
	lines: z.array(z.string().max(200)).max(8),
	severity: z.enum(['info', 'ask', 'avoid', 'critical']),
})

export const passportInstructionFrameContentSchema = z.object({
	type: z.literal('passport_instruction_frame_layout'),
	title: z.string().max(80),
	instructionBlocks: z.array(passportInstructionBlockSlotSchema).max(12),
	language: z.string().max(16),
	expiresAtLabel: z.string().max(40),
	showQrAnchor: z.boolean(),
})

export type PassportInstructionFrameContent = z.infer<
	typeof passportInstructionFrameContentSchema
>

export const PASSPORT_GENERATIVE_SURFACE = 'passport_render_brioela_generative_ui' as const

/** Allowed emotional tones for passport handoffs — no celebratory */
export const passportAllowedEmotionalTones = [
	'neutral_factual',
	'caution_explanatory',
	'focused_instructional',
] as const
```
