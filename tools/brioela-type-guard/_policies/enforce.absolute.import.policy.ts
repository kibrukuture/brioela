import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceAbsoluteImportPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  if (!isProductCode(repoPath)) return []

  const violations: TypeViolation[] = []

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      collectRelativeModuleViolation(violations, repoPath, sourceFile, statement.moduleSpecifier)
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      collectRelativeModuleViolation(violations, repoPath, sourceFile, statement.moduleSpecifier)
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const moduleSpecifier = node.arguments[0]
      if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        collectRelativeModuleViolation(violations, repoPath, sourceFile, moduleSpecifier)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function collectRelativeModuleViolation(
  violations: TypeViolation[],
  repoPath: string,
  sourceFile: ts.SourceFile,
  moduleSpecifier: ts.StringLiteral,
): void {
  if (!moduleSpecifier.text.startsWith('.')) return

  violations.push(createViolation({
    rule: 'enforce-absolute-import',
    repoPath,
    sourceFile,
    node: moduleSpecifier,
    message: 'Relative imports and exports are illegal in Brioela product code.',
    suggestion: 'Use the configured absolute alias, such as `@/agents/brain/...`, instead of `./` or `../`.',
  }))
}

function isProductCode(repoPath: string): boolean {
  return repoPath.startsWith('backend/src/')
    || repoPath.startsWith('shared/')
    || repoPath.startsWith('mobile/')
}
