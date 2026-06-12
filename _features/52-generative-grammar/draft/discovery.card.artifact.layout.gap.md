# Draft: share-discovery-stamp.ts (gap — file does not exist)

Target: `shared/grammar/schema/compositions/share-discovery-stamp.ts`

**Gap (feature 52):** Discovery Card Artifact layout template + content schema.

**Source:** `06-surface-integration.md`, `24-viral-sharing/02-discovery-card-system.md`, naming law (**G5** reconciles **51** draft)

---

```typescript
import { z } from '@brioela/shared/zod'

export const shareDiscoveryStampLayoutSchema = z.object({
	type: z.literal('share_discovery_stamp_layout'),
})

export const shareDiscoveryStampContentSchema = z.object({
	type: z.literal('share_discovery_stamp_layout'),
	headline: z.string().max(80),
	finding: z.string().max(140),
	contextLine: z.string().max(100).nullable(),
	attribution: z.string().max(48),
	visualEntity: z
		.object({
			kind: z.enum(['product', 'recipe', 'plate', 'none']),
			label: z.string().max(60).nullable(),
		})
		.nullable(),
})

export type ShareDiscoveryStampContent = z.infer<typeof shareDiscoveryStampContentSchema>

/** Example document shape **51** buildDiscoveryCardGrammarDocument should emit */
export const exampleDiscoveryCardDocument = {
	grammarVersion: '1',
	surface: 'discovery_card_brioela_generative_ui',
	safetyLock: true,
	emotionalTone: 'discovery_informational',
	backgroundEffect: {
		family: 'discovery_highlight_background',
		intensity: 'low',
		tone: 'neutral',
	},
	layoutTemplate: { type: 'share_discovery_stamp_layout' },
	content: {
		type: 'share_discovery_stamp_layout',
		headline: 'Found something interesting',
		finding: 'Four sugar cubes in one serving.',
		contextLine: null,
		attribution: 'Scanned with Brioela',
		visualEntity: { kind: 'product', label: null },
	},
	entranceMotion: null,
	typographyStyle: 'typography_body',
	expiresAt: null,
} as const
```
