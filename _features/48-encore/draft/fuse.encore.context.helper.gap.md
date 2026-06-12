# Draft: fuse.encore.context.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/encore/fuse.encore.context.helper.ts`

**Gap (feature 48):** Workflow step 2 — merge vision output with automatic capture context.

```typescript
import type { PlateVisionExtraction } from './analyze.plate.vision.helper'
import type { EncoreCaptureInput } from '@brioela/shared/validator/encore/encore.schema'

export type FusedEncoreContext = {
	vision: PlateVisionExtraction
	voiceTranscript?: string
	menuDishName?: string
	menuDescription?: string
	placeCuisineType?: string
	userCuisinePriors: string[]
	originCity?: string
	originPlaceId?: string
}

export async function fuseEncoreContext(
	env: Cloudflare.Env,
	userId: string,
	vision: PlateVisionExtraction,
	capture: EncoreCaptureInput,
): Promise<FusedEncoreContext> {
	// TODO(26): load same-visit menu scan text when menuScanSessionId present — strongest signal
	const menuContext = capture.context.menuScanSessionId
		? await loadMenuScanContext(env, userId, capture.context.menuScanSessionId)
		: null

	const cuisinePriors = await loadUserCuisinePriors(env, userId)

	return {
		vision,
		voiceTranscript: capture.voiceTranscript,
		menuDishName: menuContext?.dishName,
		menuDescription: menuContext?.description,
		placeCuisineType: menuContext?.cuisineType,
		userCuisinePriors: cuisinePriors,
		originCity: capture.context.city,
		originPlaceId: capture.context.placeId,
	}
}

async function loadMenuScanContext(
	_env: Cloudflare.Env,
	_userId: string,
	_sessionId: string,
): Promise<{ dishName?: string; description?: string; cuisineType?: string } | null> {
	return null
}

async function loadUserCuisinePriors(_env: Cloudflare.Env, _userId: string): Promise<string[]> {
	return []
}
```
