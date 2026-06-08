import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceErrorBoundaryPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isThrowStatement(node) && node.expression && isVagueError(node.expression)) {
      violations.push(createViolation({
        rule: 'enforce-error-boundary',
        repoPath,
        sourceFile,
        node,
        message: 'Vague `throw new Error(...)` is illegal in Brioela application code.',
        suggestion: 'Throw a named domain error or return a typed error result.',
      }))
    }

    if (ts.isCatchClause(node)) {
      if (!node.variableDeclaration) {
        violations.push(createViolation({
          rule: 'enforce-error-boundary',
          repoPath,
          sourceFile,
          node,
          message: 'Bare `catch` clauses are illegal.',
          suggestion: 'Catch `error`, narrow it, and either rethrow a typed error or handle it explicitly.',
        }))
      }

      if (node.block.statements.length === 0) {
        violations.push(createViolation({
          rule: 'enforce-error-boundary',
          repoPath,
          sourceFile,
          node,
          message: 'Empty catch blocks are illegal.',
          suggestion: 'Handle the error, emit typed telemetry, or rethrow a domain error.',
        }))
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isVagueError(expression: ts.Expression): boolean {
  if (!ts.isNewExpression(expression)) return false
  if (!ts.isIdentifier(expression.expression)) return false
  return expression.expression.text === 'Error'
}
