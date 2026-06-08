import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'
import type { TypeViolation } from '../_types'

export const banInOperatorPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword) {
      violations.push(createViolation({
        rule: 'ban-in-operator',
        repoPath,
        sourceFile,
        node,
        message: '`in` checks are illegal in Brioela TypeScript because they usually hide weak object shapes.',
        suggestion: 'Use a typed discriminant, schema validation, or an explicit type guard with property checks.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}
