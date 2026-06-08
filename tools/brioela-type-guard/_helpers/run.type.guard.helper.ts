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
  banInOperatorPolicy,
  banJsonParseCastPolicy,
  banNonNullAssertionPolicy,
  banTypeAssertionPolicy,
  banUnsafeCommentPolicy,
  enforceAsyncBoundaryPolicy,
  enforceConfigBoundaryPolicy,
  enforceContractBoundaryPolicy,
  enforceContractImportPolicy,
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
  banJsonParseCastPolicy,
  banNonNullAssertionPolicy,
  banInOperatorPolicy,
  banDuplicateImportPolicy,
  enforceTypeImportPolicy,
  enforceContractImportPolicy,
  enforceContractBoundaryPolicy,
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
    const sourceFile = ts.createSourceFile(file.absolutePath, text, ts.ScriptTarget.Latest, true, scriptKindForPath(file.repoPath))

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

function scriptKindForPath(path: string): ts.ScriptKind {
  return path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
}
