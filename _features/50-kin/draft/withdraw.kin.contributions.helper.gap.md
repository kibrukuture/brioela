# Draft: withdraw.kin.contributions.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/withdraw.kin.contributions.helper.ts`

**Gap (feature 50):** Opt-out and per-log deletion mark contributions withdrawn.

---

```typescript
import type { BrainStorage } from '@/agents/brain/_types/brain.storage'

export async function withdrawAllKinContributions(storage: BrainStorage, userId: string, now: number): Promise<number> {
	return storage.kinContributionLog.markWithdrawnByUser(userId, now)
}

export async function withdrawKinContributionById(
	storage: BrainStorage,
	userId: string,
	contributionId: string,
	now: number,
): Promise<boolean> {
	return storage.kinContributionLog.markWithdrawnById(userId, contributionId, now)
}
```

Withdrawn rows flagged for next hourly `recompute.kin.aggregates` batch — aggregates recomputed without them.
