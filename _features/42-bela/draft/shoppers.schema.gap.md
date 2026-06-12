# Draft: shopper.schema.ts (gap — file does not exist)

Target: `shared/validator/bela/shopper.schema.ts`

**Source:** `implementable-specs/bela/02-shopper-platform.md`, `build-guide/11-bela/13-data-model.md`

---

```typescript
import { z } from 'zod'

export const shopperStatusValues = ['pending', 'active', 'suspended', 'banned'] as const

export const shopperSchema = z.object({
	shopperId: z.string().uuid(),
	userId: z.string().min(1),
	displayName: z.string().min(1),
	status: z.enum(shopperStatusValues),
	city: z.string().min(1),
	veriffSessionId: z.string().nullable(),
	backgroundClear: z.boolean(),
	stripeConnectId: z.string().nullable(),
	belaCardPaymentMethodId: z.string().nullable(),
	belaCardLast4: z.string().length(4).nullable(),
	belaCardBrand: z.string().nullable(),
	qualityScore: z.number().min(0).max(100),
	constraintComplianceScore: z.number().min(0).max(100),
	itemAccuracyScore: z.number().min(0).max(100),
	deliveryAccuracyScore: z.number().min(0).max(100),
	satisfactionScore: z.number().min(0).max(100).nullable(),
	totalOrdersCompleted: z.number().int().nonnegative(),
	groundContributionConsent: z.boolean(),
})

export type Shopper = z.infer<typeof shopperSchema>
```
