import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const banExplicitUndefinedPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  if (repoPath.startsWith('backend/src/database/')) return []

  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (isUndefinedKeywordType(node) || isUndefinedValue(node)) {
      violations.push(createViolation({
        rule: 'ban-explicit-undefined',
        repoPath,
        sourceFile,
        node,
        message: 'Explicit `undefined` is illegal because it creates loose missing-state semantics.',
        suggestion: 'Use `null` for an intentional empty state, or model absence with a named union case.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isUndefinedKeywordType(node: ts.Node): boolean {
  return node.kind === ts.SyntaxKind.UndefinedKeyword
}

function isUndefinedValue(node: ts.Node): boolean {
  return ts.isIdentifier(node)
    && node.text === 'undefined'
    && !isPropertyName(node)
}

function isPropertyName(node: ts.Node): boolean {
  const parent = node.parent

  return ts.isPropertyAccessExpression(parent) && parent.name === node
}
