# Draft: upgrade.prompt.eligibility.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/pricing/upgrade.prompt.eligibility.helper.ts`

**Gap:** First-3-scans rule and dismissal suppression from `03-upgrade-triggers.md` not implemented.

**Source:** `build-guide/25-pricing-tiers/03-upgrade-triggers.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { upgradePromptState } from '@/agents/brain/_schemas/upgrade.prompt.state.schema'
import { eq } from 'drizzle-orm'

export type UpgradePromptFamily =
  | 'recipe_save'
  | 'menu_scan'
  | 'kids_mode'
  | 'voice_cooking'
  | 'live_video'
  | 'mesa'
  | 'signet'

const SUPPRESS_AFTER_DISMISSALS = 2
const SUPPRESS_DAYS = 14

export async function shouldShowUpgradePrompt(
  db: BrainDatabase,
  userId: string,
  family: UpgradePromptFamily,
  context: { scanCount: number },
): Promise<boolean> {
  if (context.scanCount < 3 && family !== 'voice_cooking' && family !== 'live_video') {
    return false
  }

  const row = await db
    .select()
    .from(upgradePromptState)
    .where(eq(upgradePromptState.userId, userId))
    .get()

  if (!row) return true

  const familyState = row.familiesJson[family]
  if (!familyState) return true

  if (familyState.dismissCount >= SUPPRESS_AFTER_DISMISSALS + 1) {
    return familyState.userOpenedPricingSinceSuppress === true
  }

  if (familyState.dismissCount >= SUPPRESS_AFTER_DISMISSALS) {
    const suppressUntil = familyState.suppressedUntil ?? 0
    return Date.now() > suppressUntil
  }

  return true
}

export async function recordUpgradePromptDismissal(
  db: BrainDatabase,
  userId: string,
  family: UpgradePromptFamily,
): Promise<void> {
  // upsert dismissCount, set suppressedUntil = now + 14 days on 2nd dismissal
}
```
