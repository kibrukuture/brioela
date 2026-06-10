import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const banDrizzleSelectGetPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  if (!repoPath.includes('/_repositories/') && !repoPath.includes('/_executables/')) return []

  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'get' &&
      node.arguments.length === 0
    ) {
      violations.push(createViolation({
        rule: 'ban-drizzle-raw-get',
        repoPath,
        sourceFile,
        node,
        message: 'Direct `.get()` is banned. Use `getOne()` for SELECT queries or `getReturned()` for INSERT/UPDATE with .returning().',
        suggestion: 'Import `getOne` or `getReturned` from `@/database/drizzle/_database` and wrap the query.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}
