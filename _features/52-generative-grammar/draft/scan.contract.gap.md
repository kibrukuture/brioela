# Draft: scan.contract.ts (gap — file does not exist)

Target: `shared/contracts/scan.contract.ts`

**Gap (feature 52):** First vertical slice — scan response carries optional `brioelaGenerativeUi`.

**Source:** `20-contracts-and-stage-delivery.md`, `22-ts-rest-full-stack-standard.md`

---

```typescript
import { initContract } from '@brioela/shared/contracts'
import { z } from '@brioela/shared/zod'
import { brioelaGenerativeUiSchema } from '@brioela/shared/grammar'
import { apiErrorSchema } from '@brioela/shared/contracts/api-error.schema'

const c = initContract()

const scanProductBodySchema = z.object({
	barcode: z.string().min(1),
})

const scanVerdictSchema = z.object({
	productId: z.string(),
	productName: z.string(),
	verdict: z.enum(['safe', 'caution', 'danger']),
	hardBlocks: z.array(
		z.object({
			type: z.enum(['allergy', 'medical_condition', 'recall']),
			message: z.string(),
		}),
	),
	reasons: z.array(z.string()),
})

const scanProductResponseSchema = z.object({
	scan: scanVerdictSchema,
	brioelaGenerativeUi: brioelaGenerativeUiSchema.nullable().optional(),
})

export const scanContract = c.router(
	{
		scanProduct: {
			method: 'POST',
			path: '/v1/scan/product',
			body: scanProductBodySchema,
			responses: {
				200: scanProductResponseSchema,
				400: apiErrorSchema,
				401: apiErrorSchema,
				500: apiErrorSchema,
			},
			strictStatusCodes: true,
			metadata: {
				id: 'scan.product',
				brioela_generative_ui: {
					allowed: true,
					mode: 'http_optional',
					surfaces: ['scan_explanation_brioela_generative_ui'],
					safetyLock: 'required_when_hard_blocks',
				},
			} as const,
		},
	},
	{ strictStatusCodes: true },
)

export type ScanProductBody = z.infer<typeof scanProductBodySchema>
export type ScanProductResponse = z.infer<typeof scanProductResponseSchema>
```
