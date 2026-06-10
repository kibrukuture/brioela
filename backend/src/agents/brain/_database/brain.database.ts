import type { createDatabase } from '@/agents/brain/_database/create.database.helper'

export type BrainDatabase = ReturnType<typeof createDatabase>
