import {
  filterBaselineViolations,
  findNearestNamingScope,
  loadBaseline,
  loadNamingScopes,
  walkWorkspace,
  writeBaseline,
} from './index'
import {
  validateCallableRpc,
  validateFileName,
  validateFolderName,
  validateIndexBarrel,
  validateScopeSubject,
  validateTestPairing,
  validateUnderscoreFolder,
} from '../_policies'
import type { NamingViolation } from '../_types'

export type NameGuardMode = 'check' | 'update-baseline'

export async function runNameGuard(workspaceRoot: string, mode: NameGuardMode): Promise<NamingViolation[]> {
  const entries = await walkWorkspace(workspaceRoot)
  const scopes = await loadNamingScopes(entries)

  const allViolations = entries.flatMap((entry) => {
    const scope = findNearestNamingScope(entry.repoPath, scopes)

    return [
      ...validateFolderName(entry),
      ...validateFileName(entry),
      ...validateUnderscoreFolder(entry, entries),
      ...validateIndexBarrel(entry),
      ...validateTestPairing(entry, entries),
      ...validateScopeSubject(entry, scope),
      ...validateCallableRpc(entry),
    ]
  })

  if (mode === 'update-baseline') {
    await writeBaseline(workspaceRoot, allViolations)
    return []
  }

  const baseline = await loadBaseline(workspaceRoot)
  return filterBaselineViolations(allViolations, baseline)
}
