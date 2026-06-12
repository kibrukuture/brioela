# Draft: create.passport.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/tools/passport/create.passport.tool.ts`

**Gap (feature 47):** Agent-callable create path — only after user confirms preview.

**Source:** `build-guide/28-passport/03-generation-flow.md`

---

```typescript
import { z } from 'zod'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { passportCreateRequestSchema } from '@brioela/shared/validator/passport/passport.schema'
import { createPassportHandler } from '@/agents/brain/_handlers/passport/create.passport.handler'

export const createPassportToolDefinition = {
	name: 'create_passport',
	description:
		'Create a temporary Passport instruction artifact after the user has confirmed the preview. Never call without explicit user confirmation.',
	parameters: passportCreateRequestSchema,
} as const

export async function createPassportTool(
	agent: BrioelaBrain,
	userId: string,
	args: z.infer<typeof passportCreateRequestSchema>,
): Promise<{ passportId: string; linkToken: string | null }> {
	if (args.consentLevel !== 'preview_confirmed' && args.consentLevel !== 'translated_preview_confirmed' && args.consentLevel !== 'include_sensitive_detail') {
		throw new Error('Passport requires confirmed consent level')
	}

	return createPassportHandler(agent, userId, args)
}
```
