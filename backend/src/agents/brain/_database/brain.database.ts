import type { createDatabase } from '@/agents/brain/_database/create.brain.database.helper'

export type BrainDatabase = ReturnType<typeof createDatabase>
