# Draft: cancel.user.alarm.tool

Target: `backend/src/agents/brain/_tools/cancel.user.alarm.tool.ts`

```typescript
import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { cancelUserAlarmSchema } from '@/agents/brain/_tools/_schemas/cancel.user.alarm.schema'
import { cancelUserAlarmPrompt } from '@/agents/brain/_tools/_prompts/cancel.user.alarm.prompt'
import { cancelUserAlarmExecutable } from '@/agents/brain/_tools/_executables/cancel.user.alarm.executable'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'

export const cancelUserAlarmTool = (
	database: BrainDatabase,
	userId: string,
	wake: AlarmWakeCallbacks,
) => tool({
	description: cancelUserAlarmPrompt,
	inputSchema: cancelUserAlarmSchema,
	execute: async (params) => cancelUserAlarmExecutable(database, userId, params, wake),
})
```
