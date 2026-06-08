import { join } from 'node:path'

export const brainMigrationManifestPath = 'backend/src/agents/brain/_migrations/brain.migration.ts'
export const brainMigrationJournalPath = 'backend/src/agents/brain/drizzle/meta/_journal.json'
export const brainMigrationSqlFolderPath = 'backend/src/agents/brain/drizzle'

export function resolveWorkspacePath(workspaceRoot: string, repoPath: string): string {
	return join(workspaceRoot, repoPath)
}
