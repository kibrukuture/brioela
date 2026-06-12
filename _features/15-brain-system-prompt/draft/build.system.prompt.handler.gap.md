# Draft: build.system.prompt.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/build.system.prompt.handler.ts`

**Gap (feature 15):** System prompt orchestrator not implemented. Ledger `brain/05-session-lifecycle/0002.system-prompt-builder.md` open. Block 1 import fails until **10** ships.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { BrioelaIdentity } from '@/agents/brain/identity-prompt'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainSession } from '@/agents/brain/_schemas'
import { PERSONALITY_TRAIT_LIMIT } from '@/agents/brain/_constants/prompt.block.limits.constant'
import { formatConstraints } from '@/agents/brain/_helpers/format.constraints.helper'
import { formatMemory } from '@/agents/brain/_helpers/format.memory.helper'
import { formatMemoryNamespaces } from '@/agents/brain/_helpers/format.memory.namespaces.helper'
import { formatPendingAlarms } from '@/agents/brain/_helpers/format.pending.alarms.helper'
import { formatPersonality } from '@/agents/brain/_helpers/format.personality.helper'
import { formatPreviousSession } from '@/agents/brain/_helpers/format.previous.session.helper'
import { formatRecipeIndex } from '@/agents/brain/_helpers/format.recipe.index.helper'
import { formatSkillsIndex } from '@/agents/brain/_helpers/format.skills.index.helper'
import { getRelevantNamespaces } from '@/agents/brain/_helpers/get.relevant.namespaces.helper'
import { loadMemoryForPrompt } from '@/agents/brain/_helpers/load.memory.for.prompt.helper'
import {
	listActiveUserPersonalityTraits,
	listActiveUserRecipeIndexRows,
	listDistinctActiveMemoryNamespaces,
	listNonRejectedUserConstraints,
	listPendingUserAlarmsForPrompt,
	listSkillIndexRows,
	readLastCompletedSessionOutcome,
} from '@/agents/brain/_repositories'

export async function buildSystemPrompt(
	database: BrainDatabase,
	sessionType: BrainSession['sessionType'],
	userId: string,
): Promise<string> {
	const blocks: string[] = []

	blocks.push(BrioelaIdentity)

	const constraints = listNonRejectedUserConstraints(database, userId)
	if (constraints.length > 0) {
		blocks.push(formatConstraints(constraints))
	}

	const traits = listActiveUserPersonalityTraits(database, userId, {
		limit: PERSONALITY_TRAIT_LIMIT,
	})
	if (traits.length > 0) {
		blocks.push(formatPersonality(traits))
	}

	const namespaces = getRelevantNamespaces(sessionType)
	const memories = await loadMemoryForPrompt(database, userId, namespaces)
	if (memories.length > 0) {
		blocks.push(formatMemory(memories))
	}

	const skills = listSkillIndexRows(database, userId)
	if (skills.length > 0) {
		blocks.push(formatSkillsIndex(skills))
	}

	const recipes = listActiveUserRecipeIndexRows(database, userId)
	if (recipes.length > 0) {
		blocks.push(formatRecipeIndex(recipes))
	}

	if (sessionType !== 'background') {
		const alarms = listPendingUserAlarmsForPrompt(database, userId)
		if (alarms.length > 0) {
			blocks.push(formatPendingAlarms(alarms))
		}
	}

	if (sessionType === 'chat' || sessionType === 'cooking') {
		const namespaceCatalog = listDistinctActiveMemoryNamespaces(database, userId)
		if (namespaceCatalog.length > 0) {
			blocks.push(formatMemoryNamespaces(namespaceCatalog))
		}
	}

	const previousOutcome = readLastCompletedSessionOutcome(database, userId)
	if (previousOutcome !== null) {
		blocks.push(formatPreviousSession(previousOutcome))
	}

	return blocks.join('\n\n---\n\n')
}
```

Source: `build-guide/05-brain/03-session-lifecycle.md`, `_features/15-brain-system-prompt/spec.md`.

**Note:** `formatContinuationContext` (**13**) is appended by compression flow — not returned from this function at normal open.
