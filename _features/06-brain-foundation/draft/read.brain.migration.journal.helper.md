# Draft: read.brain.migration.journal.helper.ts

Target: `tools/brioela-brain-migration-manifest/_helpers/read.brain.migration.journal.helper.ts`

```ts
import { readFile } from 'node:fs/promises'
import { InvalidBrainMigrationJournalError } from '../_types'
import { resolveWorkspacePath, brainMigrationJournalPath } from './brain.migration.manifest.paths.helper'

interface BrainMigrationJournalEntry {
	idx: number
	tag: string
}

interface BrainMigrationJournal {
	entries: BrainMigrationJournalEntry[]
}

export async function readBrainMigrationJournal(workspaceRoot: string): Promise<BrainMigrationJournal> {
	const journalText = await readFile(resolveWorkspacePath(workspaceRoot, brainMigrationJournalPath), 'utf8')
	const journal = JSON.parse(journalText)

	if (!isBrainMigrationJournal(journal)) {
		throw new InvalidBrainMigrationJournalError()
	}

	return journal
}

function isBrainMigrationJournal(journal: unknown): journal is BrainMigrationJournal {
	if (typeof journal !== 'object' || journal === null) return false
	if (!hasOwn(journal, 'entries') || !Array.isArray(journal.entries)) return false

	return journal.entries.every((entry) => {
		if (typeof entry !== 'object' || entry === null) return false
		if (!hasOwn(entry, 'idx') || typeof entry.idx !== 'number') return false
		if (!hasOwn(entry, 'tag') || typeof entry.tag !== 'string') return false
		return true
	})
}

function hasOwn<T extends string>(entity: object, property: T): entity is Record<T, unknown> {
	return Object.prototype.hasOwnProperty.call(entity, property)
}
```
