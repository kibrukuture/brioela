import { tool, asSchema } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { writeUserMemorySchema } from '@/agents/brain/_tools/_schemas/write.user.memory.schema'
import { writeUserMemoryPrompt } from '@/agents/brain/_tools/_prompts/write.user.memory.prompt'
import { writeUserMemoryExecute } from '@/agents/brain/_tools/_executables/write.user.memory.executable'

export const writeUserMemoryTool = (db: BrainDatabase, userId: string) => tool({
	description: writeUserMemoryPrompt,
	inputSchema: asSchema(writeUserMemorySchema),
	execute: async (params) => writeUserMemoryExecute(db, userId, params),
})
