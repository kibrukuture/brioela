import { z } from '@brioela/shared/zod'

export interface BrainMigrationJournalEntry {
	idx: number
	when: number
	tag: string
	breakpoints: boolean
}

export interface BrainMigrationJournal {
	entries: BrainMigrationJournalEntry[]
}

export interface BrainMigrationBundle {
	journal: BrainMigrationJournal
	migrations: Record<string, string>
}

export const migrationLockSchema = z
	.object({
		runId: z.string().trim().min(1),
		deploymentId: z.string().trim().min(1),
		startedAt: z.number().int().min(0),
		expiresAt: z.number().int().min(0),
	})
	.strict()

export interface BrainMigrationReadiness {
	status: 'ready' | 'migration_failed' | 'needs_retry'
	checkedAtEpochMs: number
	verifiedEventCount: number
}

export type BrainMigrationLock = z.infer<typeof migrationLockSchema>
