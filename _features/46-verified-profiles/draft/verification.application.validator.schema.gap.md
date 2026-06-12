# Draft: verification.application.schema.ts (gap — file does not exist)

Target: `shared/validator/verified/verification.application.schema.ts`

Source: `build-guide/23-verified-profiles/02-verification-flow.md`

---

```typescript
import { z } from 'zod'
import {
  verifiedBusinessSubtypeValues,
  verifiedProfileKindValues,
  verifiedPersonSubtypeValues,
} from '@/shared/constants/verified/verified.profile.kind.constant'

const evidenceSchema = z.object({
  professionalIdentity: z.string().optional(),
  licenseNumber: z.string().optional(),
  jurisdiction: z.string().optional(),
  businessRegistrationRef: z.string().optional(),
  placeOwnershipProofUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  businessEmail: z.string().email().optional(),
})

export const verificationApplicationRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('verified_profile'),
    subtype: z.enum(verifiedPersonSubtypeValues),
    displayName: z.string().min(2).max(120),
    credentialSummary: z.string().max(500).optional(),
    evidence: evidenceSchema,
  }),
  z.object({
    kind: z.literal('verified_business'),
    subtype: z.enum(verifiedBusinessSubtypeValues),
    displayName: z.string().min(2).max(120),
    placeId: z.string().uuid().optional(),
    evidence: evidenceSchema,
  }),
])

export const verificationApplicationResponseSchema = z.object({
  profileId: z.string().uuid(),
  kind: z.enum(verifiedProfileKindValues),
  verificationStatus: z.enum([
    'draft',
    'pending_review',
    'verified',
    'rejected',
    'suspended',
    'expired',
  ]),
})

export type VerificationApplicationRequest = z.infer<typeof verificationApplicationRequestSchema>
```
