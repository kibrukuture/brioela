# Draft: passport.schema.ts (gap — file does not exist)

Target: `shared/validator/passport/passport.schema.ts`

**Gap (feature 47):** Zod contracts for preview/create/read payloads.

**Source:** `brioela-specs/43-passport.md`, `build-guide/28-passport/02-passport-data-model.md`

---

```typescript
import { z } from 'zod'
import { passportKindValues } from '@brioela/shared/constants/passport/passport.kind.constant'

export const passportShareModeValues = [
	'show_on_screen',
	'image',
	'pdf',
	'qr_link',
	'text',
] as const

export const passportConsentLevelValues = [
	'preview_confirmed',
	'include_sensitive_detail',
	'translated_preview_confirmed',
] as const

export const passportInstructionBlockSchema = z.object({
	heading: z.string().min(1),
	lines: z.array(z.string().min(1)).min(1),
	severity: z.enum(['info', 'ask', 'avoid', 'critical']),
})

export const passportPreviewRequestSchema = z.object({
	kind: z.enum(passportKindValues),
	audience: z.enum(['self', 'mesa', 'selected_members', 'guest_session']),
	sourceContext: z
		.object({
			menuScanId: z.string().optional(),
			belaOrderId: z.string().optional(),
			travelIntentId: z.string().optional(),
			practitionerAnnotationIds: z.array(z.string()).optional(),
		})
		.optional(),
	targetLanguage: z.string().optional(),
})

export const passportCreateRequestSchema = passportPreviewRequestSchema.extend({
	title: z.string().min(1),
	instructionBlocks: z.array(passportInstructionBlockSchema).min(1),
	language: z.string().min(2),
	shareMode: z.enum(passportShareModeValues),
	consentLevel: z.enum(passportConsentLevelValues),
	expiresAt: z.number().int().positive().optional(),
})

export const passportResponseSchema = z.object({
	passportId: z.string(),
	kind: z.enum(passportKindValues),
	title: z.string(),
	instructionBlocks: z.array(passportInstructionBlockSchema),
	language: z.string(),
	shareMode: z.enum(passportShareModeValues),
	sensitivity: z.enum(['public_safe', 'limited_sensitive', 'blocked']),
	status: z.enum(['active', 'expired', 'revoked']),
	expiresAt: z.number(),
	revokedAt: z.number().nullable(),
	createdAt: z.number(),
	linkUrl: z.string().url().optional(),
})

export type PassportPreviewRequest = z.infer<typeof passportPreviewRequestSchema>
export type PassportCreateRequest = z.infer<typeof passportCreateRequestSchema>
export type PassportResponse = z.infer<typeof passportResponseSchema>
```
