import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const banNativeDatePolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (isNativeDateConstruction(node) || isNativeDateNow(node)) {
      violations.push(createViolation({
        rule: 'ban-native-date',
        repoPath,
        sourceFile,
        node,
        message: 'Native Date usage is illegal in Brioela runtime code.',
        suggestion: 'Use Dayjs through an approved clock helper instead of `new Date()` or `Date.now()`.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isNativeDateConstruction(node: ts.Node): boolean {
  return ts.isNewExpression(node)
    && ts.isIdentifier(node.expression)
    && node.expression.text === 'Date'
}

function isNativeDateNow(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false
  if (!ts.isPropertyAccessExpression(node.expression)) return false
  if (node.expression.name.text !== 'now') return false
  return ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'Date'
}
