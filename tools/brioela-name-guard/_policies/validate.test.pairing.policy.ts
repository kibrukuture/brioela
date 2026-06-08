import { basename, dirname } from 'node:path'
import type { WorkspaceEntry } from '../_helpers'
import type { NamingViolation } from '../_types'

export function validateTestPairing(entry: WorkspaceEntry, allEntries: WorkspaceEntry[]): NamingViolation[] {
  if (entry.kind !== 'file') return []

  const fileName = basename(entry.repoPath)
  if (!fileName.endsWith('.test.ts') && !fileName.endsWith('.test.tsx')) return []

  const extension = fileName.endsWith('.test.tsx') ? '.test.tsx' : '.test.ts'
  const testedFileName = `${fileName.slice(0, -extension.length)}${extension === '.test.tsx' ? '.tsx' : '.ts'}`
  const testedPath = `${dirname(entry.repoPath)}/${testedFileName}`

  const hasTestedFile = allEntries.some((candidate) => candidate.kind === 'file' && candidate.repoPath === testedPath)

  if (hasTestedFile) return []

  return [{
    rule: 'test-file-pairing',
    path: entry.repoPath,
    message: 'Test file must sit next to the exact file it tests.',
    suggestion: `Create or rename the tested file to ${testedPath}.`,
  }]
}
