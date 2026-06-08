import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceMobileNetworkBoundaryPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  if (!repoPath.startsWith('mobile/')) return []

  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'fetch') {
      violations.push(createViolation({
        rule: 'enforce-mobile-network-boundary',
        repoPath,
        sourceFile,
        node,
        message: 'Direct `fetch` calls are illegal in mobile code.',
        suggestion: 'Use ts-rest generated hooks or a contract-backed network boundary.',
      }))
    }

    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'api') {
      violations.push(createViolation({
        rule: 'enforce-mobile-network-boundary',
        repoPath,
        sourceFile,
        node,
        message: 'Direct `api.*` calls are illegal in mobile feature code.',
        suggestion: 'Use a feature hook wrapping a generated ts-rest hook.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}
