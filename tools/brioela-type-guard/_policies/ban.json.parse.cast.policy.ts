import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'
import type { TypeViolation } from '../_types'

export const banJsonParseCastPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isAsExpression(node) && isJsonParseCall(skipParentheses(node.expression))) {
      violations.push(createViolation({
        rule: 'ban-json-parse-cast',
        repoPath,
        sourceFile,
        node,
        message: '`JSON.parse(...) as Type` is illegal because parsed data is untrusted.',
        suggestion: 'Parse to unknown, then validate through a schema or boundary decoder.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function skipParentheses(node: ts.Expression): ts.Expression {
  let current = node
  while (ts.isParenthesizedExpression(current)) current = current.expression
  return current
}

function isJsonParseCall(node: ts.Expression): boolean {
  if (!ts.isCallExpression(node)) return false
  const expression = node.expression
  if (!ts.isPropertyAccessExpression(expression)) return false
  return expression.name.text === 'parse'
    && ts.isIdentifier(expression.expression)
    && expression.expression.text === 'JSON'
}
