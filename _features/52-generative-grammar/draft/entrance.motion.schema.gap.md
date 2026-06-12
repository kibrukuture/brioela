# Draft: entrance-motion.ts (gap — file does not exist)

Target: `shared/grammar/schema/tokens/entrance-motion.ts`

**Gap (feature 52):** Entrance motion presets — choreographed reveal, not per-node motion tokens.

**Source:** `17-motion-beats-system.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const entranceMotionPresetValues = [
	'fade_all_entrance',
	'slide_primary_then_details_entrance',
	'scale_primary_then_supporting_entrance',
	'settle_all_entrance',
	'cascade_details_entrance',
] as const

export type EntranceMotionPreset = (typeof entranceMotionPresetValues)[number]

export const staggerTokenValues = ['none', 'small', 'medium'] as const

export type StaggerToken = (typeof staggerTokenValues)[number]

export const entranceMotionSchema = z.object({
	preset: z.enum(entranceMotionPresetValues),
	stagger: z.enum(staggerTokenValues),
})

export type EntranceMotion = z.infer<typeof entranceMotionSchema>
```
