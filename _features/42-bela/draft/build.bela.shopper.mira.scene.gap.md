# Draft: build.bela.shopper.mira.scene.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_scenes/build.bela.shopper.mira.scene.ts`

**Gap:** No Mira `bela_shopper` scene. Resolves G1 — use MiraSession, NOT `shopperGeminiWs` on BelaOrderAgent.

**Source:** `build-guide/30-mira/01-scene-contract.md`, `build-guide/11-bela/14-shopper-ai-assistant.md`, `implementable-specs/bela/14-shopper-ai-assistant.md` (content only — transport per build-guide)

---

```typescript
import type { MiraScene, MiraSpeechPolicy } from '@brioela/shared/validator/mira/mira.scene.contract.schema'
import type { OrderConstraintSnapshot } from '@brioela/shared/validator/bela/order.constraint.snapshot.schema'

export type BelaShopperSceneInput = {
	orderId: string
	items: Array<{ description: string; quantity: string; note: string | null }>
	snapshot: OrderConstraintSnapshot
	storeName: string
	groundSignals: string[]
	shopperNotes: string | null
}

const belaShopperSpeechPolicy: MiraSpeechPolicy = {
	audience: 'shopper_only',
	maxSentenceCount: 2,
	hardBlockTone: 'directive',
	proactiveCooldownMs: 30_000,
	shopperSpeechDeadZoneMs: 5_000,
}

export function buildBelaShopperMiraScene(input: BelaShopperSceneInput): MiraScene {
	const systemInstruction = buildBelaShopperSystemInstruction(input)
	return {
		kind: 'bela_shopper',
		orderId: input.orderId,
		systemInstruction,
		speechPolicy: belaShopperSpeechPolicy,
		toolDeclarations: [],
		capabilities: {
			voiceIn: true,
			voiceOut: true,
			videoIn: true,
			forwardToBrainTools: false,
		},
	}
}

function buildBelaShopperSystemInstruction(input: BelaShopperSceneInput): string {
	const parts: string[] = [
		`You are Brioela's shopping assistant for order ${input.orderId}.`,
		`You help the shopper find products, check ingredients, and avoid anything harmful to the customer.`,
		`Respond by voice. Be brief — the shopper is moving through ${input.storeName}.`,
		'',
		`## ORDER LIST (${input.items.length} items)`,
		...input.items.map(
			(item) => `- ${item.description}, ${item.quantity}${item.note ? ` — note: "${item.note}"` : ''}`,
		),
	]

	if (input.snapshot.hardBlocks.length > 0) {
		parts.push('', '## NEVER ALLOW — HARD BLOCKS')
		for (const block of input.snapshot.hardBlocks) {
			parts.push(`- ${block.entityValue} (${block.kind})`)
		}
		parts.push('If you see these through the camera, stop the shopper immediately.')
	}

	if (input.snapshot.softGuidance.length > 0) {
		parts.push('', '## PREFERENCES (guide, do not block)')
		for (const g of input.snapshot.softGuidance) {
			parts.push(`- ${g.instruction}`)
		}
	}

	if (input.groundSignals.length > 0) {
		parts.push('', '## GROUND SIGNALS FOR THIS STORE')
		parts.push(...input.groundSignals.map((s) => `- ${s}`))
	}

	if (input.shopperNotes) {
		parts.push('', '## YOUR NOTES ON THIS CUSTOMER', input.shopperNotes)
	}

	parts.push('', 'Do not reveal the customer\'s name or private history beyond this order.')

	return parts.join('\n')
}
```
