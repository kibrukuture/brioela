import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import {
  filterBaselineViolations,
  loadBaseline,
  walkTypeScriptFiles,
  writeBaseline,
} from './index'
import {
  banAnyPolicy,
  banDuplicateImportPolicy,
  banExplicitUndefinedPolicy,
  banInOperatorPolicy,
  banJsonParseCastPolicy,
  banNativeDatePolicy,
  banNonNullAssertionPolicy,
  banPaddedIdentifierPolicy,
  banRawDatabaseAccessPolicy,
  banTypeAssertionPolicy,
  banUnsafeCommentPolicy,
  enforceAbsoluteImportPolicy,
  enforceAsyncBoundaryPolicy,
  enforceDatabaseDrizzleSurfacePolicy,
  enforceConfigBoundaryPolicy,
  enforceContractBoundaryPolicy,
  enforceContractImportPolicy,
  enforceContractSpinePolicy,
  enforceErrorBoundaryPolicy,
  enforceImportDirectionPolicy,
  enforceMobileNetworkBoundaryPolicy,
  enforceReactEffectPolicy,
  enforceSchemaPairingPolicy,
  enforceSideEffectPlacementPolicy,
  enforceTypeImportPolicy,
  type TypePolicy,
} from '../_policies'
import type { TypeViolation } from '../_types'

export type TypeGuardMode = 'check' | 'update-baseline'

const policies: TypePolicy[] = [
  banAnyPolicy,
  banTypeAssertionPolicy,
  banExplicitUndefinedPolicy,
  banPaddedIdentifierPolicy,
  banJsonParseCastPolicy,
  banNativeDatePolicy,
  banRawDatabaseAccessPolicy,
  banNonNullAssertionPolicy,
  banInOperatorPolicy,
  banDuplicateImportPolicy,
  enforceTypeImportPolicy,
  enforceAbsoluteImportPolicy,
  enforceDatabaseDrizzleSurfacePolicy,
  enforceContractImportPolicy,
  enforceContractBoundaryPolicy,
  enforceContractSpinePolicy,
  enforceReactEffectPolicy,
  enforceMobileNetworkBoundaryPolicy,
  enforceSideEffectPlacementPolicy,
  enforceAsyncBoundaryPolicy,
  enforceErrorBoundaryPolicy,
  enforceConfigBoundaryPolicy,
  enforceImportDirectionPolicy,
  enforceSchemaPairingPolicy,
  banUnsafeCommentPolicy,
]

export async function runTypeGuard(workspaceRoot: string, mode: TypeGuardMode): Promise<TypeViolation[]> {
  const files = await walkTypeScriptFiles(workspaceRoot)
  const allViolations = []

  for (const file of files) {
    const text = await readFile(file.absolutePath, 'utf8')
    const sourceFile = ts.createSourceFile(file.absolutePath, text, ts.ScriptTarget.Latest, true, resolveScriptKindForPath(file.repoPath))

    for (const policy of policies) {
      allViolations.push(...policy({ repoPath: file.repoPath, sourceFile }))
    }
  }

  if (mode === 'update-baseline') {
    await writeBaseline(workspaceRoot, allViolations)
    return []
  }

  const baseline = await loadBaseline(workspaceRoot)
  return filterBaselineViolations(allViolations, baseline)
}

function resolveScriptKindForPath(path: string): ts.ScriptKind {
  return path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
}
