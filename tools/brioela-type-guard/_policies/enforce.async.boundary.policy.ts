import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceAsyncBoundaryPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && isPromiseChain(node) && !isAllowedAsyncBoundaryFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-async-boundary',
        repoPath,
        sourceFile,
        node,
        message: 'Promise chains are illegal in Brioela application code.',
        suggestion: 'Use `await`, `ctx.waitUntil(...)`, or `explicitlyDetached(...)` with a reason.',
      }))
    }

    if (ts.isVoidExpression(node) && ts.isCallExpression(node.expression) && !isExplicitDetachCall(node.expression)) {
      violations.push(createViolation({
        rule: 'enforce-async-boundary',
        repoPath,
        sourceFile,
        node,
        message: '`void promise()` fire-and-forget calls are illegal.',
        suggestion: 'Use `ctx.waitUntil(...)` in Workers or `explicitlyDetached(promise, reason)`.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isPromiseChain(node: ts.CallExpression): boolean {
  const expression = node.expression
  if (!ts.isPropertyAccessExpression(expression)) return false
  return expression.name.text === 'then' || expression.name.text === 'catch' || expression.name.text === 'finally'
}

function isExplicitDetachCall(node: ts.CallExpression): boolean {
  return ts.isIdentifier(node.expression) && node.expression.text === 'explicitlyDetached'
}

function isAllowedAsyncBoundaryFile(repoPath: string): boolean {
  return repoPath.startsWith('tools/') || repoPath.endsWith('.test.ts') || repoPath.endsWith('.test.tsx')
}
