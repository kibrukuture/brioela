import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'
import type { TypeViolation } from '../_types'

export const banTypeAssertionPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isAsExpression(node) && !isConstAssertion(node)) {
      violations.push(createViolation({
        rule: 'ban-type-assertion',
        repoPath,
        sourceFile,
        node,
        message: '`as` type assertions are illegal because they can lie to the compiler.',
        suggestion: 'Use `satisfies`, a schema parser, or a real narrowing function. `as const` is allowed.',
      }))
    }

    if (ts.isTypeAssertionExpression(node)) {
      violations.push(createViolation({
        rule: 'ban-type-assertion',
        repoPath,
        sourceFile,
        node,
        message: 'Angle-bracket type assertions are illegal because they can lie to the compiler.',
        suggestion: 'Use a schema parser or narrowing function instead.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isConstAssertion(node: ts.AsExpression): boolean {
  return node.type.getText(node.getSourceFile()) === 'const'
}
