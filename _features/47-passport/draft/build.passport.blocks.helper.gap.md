# Draft: build.passport.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/build.passport.blocks.helper.ts`

**Gap (feature 47):** Orchestrates kind-specific block builders + privacy + medical boundary.

**Source:** `build-guide/28-passport/03-generation-flow.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { PassportKind } from '@brioela/shared/constants/passport/passport.kind.constant'
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'
import { buildPersonalFoodSafetyBlocks } from './build.personal.food.safety.blocks.helper'
import { buildPassportMesaBlocks } from './build.passport.mesa.blocks.helper'
import { buildPassportMenuBlocks } from './build.passport.menu.blocks.helper'
import { buildPassportBelaBlocks } from './build.passport.bela.blocks.helper'
import { buildPassportCaregiverBlocks } from './build.passport.caregiver.blocks.helper'
import { buildPassportTravelBlocks } from './build.passport.travel.blocks.helper'
import { buildPassportPractitionerBlocks } from './build.passport.practitioner.blocks.helper'
import { minimizePassportPrivacy } from './minimize.passport.privacy.helper'
import { checkPassportMedicalBoundary } from './check.passport.medical.boundary.helper'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export type BuildPassportBlocksInput = {
	userId: string
	kind: PassportKind
	audience: 'self' | 'mesa' | 'selected_members' | 'guest_session'
	sourceContext?: {
		menuScanId?: string
		belaOrderId?: string
		travelIntentId?: string
		practitionerAnnotationIds?: string[]
	}
	includeSensitiveDetail?: boolean
}

export type BuildPassportBlocksResult = {
	blocks: InstructionBlock[]
	sensitivity: 'public_safe' | 'limited_sensitive' | 'blocked'
	redactions: Array<{ field: string; reason: string }>
}

export async function buildPassportBlocks(
	database: BrainDatabase,
	input: BuildPassportBlocksInput,
): Promise<BuildPassportBlocksResult> {
	let blocks: InstructionBlock[]

	switch (input.kind) {
		case 'personal_food_safety':
			blocks = await buildPersonalFoodSafetyBlocks(database, input.userId)
			break
		case 'mesa_table':
			blocks = await buildPassportMesaBlocks(database, input.userId, input.audience)
			break
		case 'restaurant_menu':
			blocks = await buildPassportMenuBlocks(database, input.userId, input.sourceContext?.menuScanId)
			break
		case 'bela_shopper':
			blocks = await buildPassportBelaBlocks(database, input.userId, input.sourceContext?.belaOrderId)
			break
		case 'caregiver_school':
			blocks = await buildPassportCaregiverBlocks(database, input.userId)
			break
		case 'travel_translation':
			blocks = await buildPassportTravelBlocks(
				database,
				input.userId,
				input.sourceContext?.travelIntentId,
			)
			break
		case 'practitioner_guidance':
			blocks = await buildPassportPractitionerBlocks(
				database,
				input.userId,
				input.sourceContext?.practitionerAnnotationIds ?? [],
			)
			break
		default: {
			const _exhaustive: never = input.kind
			throw new Error(`Unsupported passport kind: ${_exhaustive}`)
		}
	}

	const minimized = minimizePassportPrivacy(blocks, {
		includeSensitiveDetail: input.includeSensitiveDetail ?? false,
	})

	const boundary = checkPassportMedicalBoundary(minimized.blocks)
	if (!boundary.allowed) {
		return { blocks: [], sensitivity: 'blocked', redactions: boundary.violations }
	}

	return {
		blocks: minimized.blocks,
		sensitivity: minimized.sensitivity,
		redactions: minimized.redactions,
	}
}
```
