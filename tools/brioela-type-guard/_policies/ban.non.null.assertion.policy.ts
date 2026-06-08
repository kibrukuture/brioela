import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'
import type { TypeViolation } from '../_types'

export const banNonNullAssertionPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isNonNullExpression(node)) {
      violations.push(createViolation({
        rule: 'ban-non-null-assertion',
        repoPath,
        sourceFile,
        node,
        message: 'Non-null assertion `!` is illegal because it bypasses null safety.',
        suggestion: 'Handle the missing case explicitly or narrow before use.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}
