# Draft: get.passport.link.handler.ts (gap — file does not exist)

Target: `backend/src/api/passport/_handlers/get.passport.link.handler.ts`

**Gap (feature 47):** Public QR/link route — content only, no account state.

**Source:** `build-guide/28-passport/04-privacy-and-consent.md` (Link Privacy)

---

```typescript
import type { Context } from 'hono'

export type PublicPassportLinkResponse = {
	title: string
	language: string
	instructionBlocks: Array<{
		heading: string
		lines: string[]
		severity: 'info' | 'ask' | 'avoid' | 'critical'
	}>
	expiresAt: number
	expired: boolean
	revoked: boolean
}

export async function getPassportLinkHandler(c: Context): Promise<Response> {
	const linkToken = c.req.param('linkToken')

	// TODO: Brain RPC by linkToken — no userId in response
	// Return 404 if missing, expired, or revoked
	// Record passport_audit_event viewed (metadata: link)

	void linkToken

	const body: PublicPassportLinkResponse = {
		title: 'Passport',
		language: 'en',
		instructionBlocks: [],
		expiresAt: 0,
		expired: true,
		revoked: false,
	}

	return c.json(body, 404)
}
```
