# Draft: medications.routes.ts — production snapshot (constants only)

Target: `shared/api/medications.routes.ts`

**Gap G3:** Routes defined but not mounted in `mount.routes.handler.ts`. Superseded by Brain RPC for Brioela product path.

```typescript
export const MEDICATION_ROUTES = {
  base: "/v1/medications",

  getAll: () => "/v1/medications",

  getById: (id: string) => `/v1/medications/${id}`,

  create: () => "/v1/medications",

  uploadImage: (id: string) => `/v1/medications/${id}/upload`,

  delete: (id: string) => `/v1/medications/${id}`,

  getReminders: (id: string) => `/v1/medications/${id}/reminders`,
} as const;
```

Mobile `medications.api.ts` still calls these paths — will 404 until Brain-backed API replaces or routes mount with Brain delegation.
