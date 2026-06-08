import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

const approvedDatabaseDrizzleSurfaceFiles = new Set([
  'backend/src/database/drizzle/_database/drizzle.query.database.ts',
  'backend/src/database/sqlite/_database/durable.sqlite.database.ts',
  'backend/src/database/sqlite/_migrations/apply.durable.sqlite.migration.helper.ts',
  'backend/src/database/sqlite/_schema/sqlite.schema.ts',
])

export const enforceDatabaseDrizzleSurfacePolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  if (!repoPath.startsWith('backend/src/')) return []
  if (approvedDatabaseDrizzleSurfaceFiles.has(repoPath)) return []

  const violations: TypeViolation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    if (!statement.moduleSpecifier.text.startsWith('drizzle-orm')) continue

    violations.push(createViolation({
      rule: 'enforce-database-drizzle-surface',
      repoPath,
      sourceFile,
      node: statement.moduleSpecifier,
      message: 'Backend code must import Drizzle through Brioela database truth surfaces.',
      suggestion: 'Use `@/database/...` surfaces instead of importing `drizzle-orm` directly.',
    }))
  }

  return violations
}
