import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'

export const banDuplicateImportPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const importsBySource = new Map<string, ts.ImportDeclaration[]>()

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue

    const source = statement.moduleSpecifier.text
    importsBySource.set(source, [...(importsBySource.get(source) ?? []), statement])
  }

  return [...importsBySource.entries()].flatMap(([source, declarations]) => {
    if (declarations.length <= 1) return []

    return declarations.slice(1).map((declaration) => createViolation({
      rule: 'ban-duplicate-import',
      repoPath,
      sourceFile,
      node: declaration,
      message: `Duplicate imports from \`${source}\` are illegal.`,
      suggestion: 'Merge imports from the same module into one declaration, using `type` specifiers where needed.',
    }))
  })
}
