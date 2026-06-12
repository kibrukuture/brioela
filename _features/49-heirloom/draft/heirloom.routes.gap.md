# Draft: heirloom.routes.ts (gap — file does not exist)

Target: `shared/routes/heirloom.routes.ts`

---

```typescript
export const HEIRLOOM_ROUTES = {
	assemble: '/api/heirlooms',
	invite: '/api/heirlooms/:id/invitations',
	accept: '/api/heirlooms/invitations/:id/accept',
	push: '/api/heirlooms/:id/push',
	successor: '/api/heirlooms/:id/successor',
	broker: '/api/heirloom-broker/transfer',
} as const
```
