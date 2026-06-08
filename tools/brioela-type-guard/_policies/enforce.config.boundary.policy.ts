import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceConfigBoundaryPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isPropertyAccessExpression(node) && isProcessEnvAccess(node) && !isConfigBoundaryFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-config-boundary',
        repoPath,
        sourceFile,
        node,
        message: 'Raw `process.env` access is illegal outside config boundary files.',
        suggestion: 'Read env once in a `.config.ts` or runtime boundary, validate it, and pass typed config inward.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isProcessEnvAccess(node: ts.PropertyAccessExpression): boolean {
  if (node.name.text !== 'env') return false
  return ts.isIdentifier(node.expression) && node.expression.text === 'process'
}

function isConfigBoundaryFile(repoPath: string): boolean {
  return repoPath.startsWith('tools/')
    || repoPath.endsWith('.config.ts')
    || repoPath.endsWith('.runtime.ts')
    || repoPath.endsWith('.handler.ts')
}
