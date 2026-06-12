# Draft: verified.routes.ts (gap — file does not exist)

Target: `shared/routes/verified.routes.ts`

Source: `build.md` API manifest

---

```typescript
export const VERIFIED_ROUTES = {
  apply: '/api/verified/apply',
  publicProfile: '/api/verified/profiles/:slug',
  businessTransparency: '/api/verified/business/:profileId/transparency',
  practitionerConnectionRequest: '/api/verified/practitioner/connections/request',
  practitionerConnectionRespond: '/api/verified/practitioner/connections/respond',
  practitionerConnectionRevoke: '/api/verified/practitioner/connections/:relationshipId',
  practitionerClients: '/api/verified/practitioner/clients',
  practitionerClientConditions: '/api/verified/practitioner/clients/:userId/conditions',
  practitionerAnnotation: '/api/verified/practitioner/clients/:userId/annotations',
  analytics: '/api/verified/analytics/:profileId',
  creatorVideos: '/api/verified/creator-videos',
} as const

export type VerifiedRouteKey = keyof typeof VERIFIED_ROUTES
```
