# Draft: heirloom.invitation.status.constant.ts (gap — file does not exist)

Target: `shared/constants/heirloom/heirloom.invitation.status.constant.ts`

---

```typescript
export const heirloomInvitationStatusValues = [
	'sent',
	'accepted',
	'declined',
	'expired',
] as const

export type HeirloomInvitationStatus = (typeof heirloomInvitationStatusValues)[number]

export const HEIRLOOM_INVITATION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000
```
