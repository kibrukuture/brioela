# Draft: verification.status.constant.ts (gap — file does not exist)

Target: `shared/constants/verified/verification.status.constant.ts`

Source: `build-guide/23-verified-profiles/02-verification-flow.md`

---

```typescript
export const verificationStatusValues = [
  'draft',
  'pending_review',
  'verified',
  'rejected',
  'suspended',
  'expired',
] as const

export type VerificationStatus = (typeof verificationStatusValues)[number]

/** Only verified profiles get public badges and privileged feature access. */
export const privilegedVerificationStatuses = ['verified'] as const satisfies readonly VerificationStatus[]

export const verificationStatusTransitions: Record<VerificationStatus, VerificationStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['verified', 'rejected'],
  verified: ['suspended', 'expired'],
  rejected: ['pending_review'],
  suspended: ['verified'],
  expired: ['pending_review'],
}

export function canTransitionVerificationStatus(
  from: VerificationStatus,
  to: VerificationStatus,
): boolean {
  return verificationStatusTransitions[from].includes(to)
}
```
