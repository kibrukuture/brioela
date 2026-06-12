# Draft: session.credit.balance.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/session.credit.balance.schema.ts`

**Gap:** Metered voice/vision/room credits (spec 19) — no balance storage.

**Source:** `build-guide/25-pricing-tiers/05-metered-and-add-ons.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const sessionCreditBalance = sqliteTable('session_credit_balance', {
  userId: text('user_id').primaryKey(),
  voiceCredits: integer('voice_credits').notNull().default(0),
  visionCredits: integer('vision_credits').notNull().default(0),
  roomCredits: integer('room_credits').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
})

/**
 * Rules (05-metered-and-add-ons.md):
 * - credits never expire
 * - show estimated use before paid session
 * - do not consume if session fails before meaningful use
 * - refund on backend failure
 */
export type SessionCreditType = 'voice' | 'vision' | 'room'
```
