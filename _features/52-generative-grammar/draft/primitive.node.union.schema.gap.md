# Draft: primitives/index.ts (gap — file does not exist)

Target: `shared/grammar/schema/primitives/index.ts`

**Gap (feature 52):** Three-layer primitive union for recursive render trees inside layout templates.

**Source:** `03-primitive-families.md`, `14-primitive-layers-and-reuse.md`

---

```typescript
import { z } from '@brioela/shared/zod'
import { toneSchema } from '../tokens/tone'
import { spacingTokenSchema } from '../tokens/spacing'

const headlineNodeSchema = z.object({
	type: z.literal('headline'),
	text: z.string().max(120),
	tone: toneSchema,
})

const captionNodeSchema = z.object({
	type: z.literal('caption'),
	text: z.string().max(200),
	tone: toneSchema,
})

const stackNodeSchema: z.ZodType<StackNode> = z.lazy(() =>
	z.object({
		type: z.literal('stack'),
		gap: spacingTokenSchema,
		children: z.array(uiLayoutNodeSchema).max(8),
	}),
)

const metricSingleNodeSchema = z.object({
	type: z.literal('metric_single'),
	label: z.string().max(40),
	value: z.string().max(40),
	tone: toneSchema,
})

const mesaMemberRowNodeSchema = z.object({
	type: z.literal('mesa_member_row'),
	memberLabel: z.string().max(32),
	verdict: z.enum(['works', 'caution', 'avoid']),
	note: z.string().max(120).nullable(),
})

export const uiLayoutNodeSchema: z.ZodType<UiLayoutNode> = z.lazy(() =>
	z.discriminatedUnion('type', [
		stackNodeSchema,
		headlineNodeSchema,
		captionNodeSchema,
		metricSingleNodeSchema,
		mesaMemberRowNodeSchema,
	]),
)

export type UiLayoutNode =
	| { type: 'stack'; gap: z.infer<typeof spacingTokenSchema>; children: UiLayoutNode[] }
	| { type: 'headline'; text: string; tone: z.infer<typeof toneSchema> }
	| { type: 'caption'; text: string; tone: z.infer<typeof toneSchema> }
	| {
			type: 'metric_single'
			label: string
			value: string
			tone: z.infer<typeof toneSchema>
	  }
	| {
			type: 'mesa_member_row'
			memberLabel: string
			verdict: 'works' | 'caution' | 'avoid'
			note: string | null
	  }

type StackNode = Extract<UiLayoutNode, { type: 'stack' }>
```
