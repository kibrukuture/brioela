import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceContractImportPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue

    const source = statement.moduleSpecifier.text

    if (source === '@ts-rest/core' && !repoPath.startsWith('shared/contracts/')) {
      violations.push(createViolation({
        rule: 'enforce-contract-import',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Direct `@ts-rest/core` imports are illegal outside `shared/contracts/`.',
        suggestion: 'Import contract helpers from `@brioela/shared/contracts`.',
      }))
    }

    if (source === '@ts-rest/serverless/fetch' && !isBackendRouteMountingFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-contract-import',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Direct `@ts-rest/serverless/fetch` imports are only allowed in backend route-mounting files.',
        suggestion: 'Keep ts-rest serverless mounting at the backend HTTP adapter boundary.',
      }))
    }

    if (source === 'axios' && !repoPath.startsWith('mobile/network/core/')) {
      violations.push(createViolation({
        rule: 'enforce-contract-import',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Raw `axios` imports are illegal outside `mobile/network/core/`.',
        suggestion: 'Use contract-backed request helpers or generated ts-rest hooks.',
      }))
    }
  }

  return violations
}

function isBackendRouteMountingFile(repoPath: string): boolean {
  if (!repoPath.startsWith('backend/')) return false
  return repoPath.endsWith('.route.ts') || repoPath.endsWith('.routes.ts') || repoPath.endsWith('.handler.ts')
}
