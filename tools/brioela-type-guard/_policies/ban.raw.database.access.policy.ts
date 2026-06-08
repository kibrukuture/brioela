import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

const directDatabaseModules = new Set([
  'postgres',
  'pg',
  'mysql2',
  'better-sqlite3',
  'sqlite3',
])

const rawDatabaseMethods = new Set(['execute', 'run', 'all', 'values'])

export const banRawDatabaseAccessPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  if (isAllowedDatabaseBoundary(repoPath)) return []

  const violations: TypeViolation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue

    const source = statement.moduleSpecifier.text

    if (source === '@supabase/supabase-js' && !isTypeOnlyImport(statement) && !isAllowedSupabaseAuthBoundary(repoPath)) {
      violations.push(createViolation({
        rule: 'ban-raw-database-access',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Supabase client imports are only allowed in auth boundary files.',
        suggestion: 'Use Supabase for auth only. Data access must go through Drizzle-backed repositories/stores.',
      }))
    }

    if (directDatabaseModules.has(source)) {
      violations.push(createViolation({
        rule: 'ban-raw-database-access',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Direct database client imports are illegal in production code.',
        suggestion: 'Access Supabase Postgres or DO SQLite through Drizzle-backed repositories/stores only.',
      }))
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isPropertyAccessExpression(node) && isStorageSqlAccess(node)) {
      violations.push(createViolation({
        rule: 'ban-raw-database-access',
        repoPath,
        sourceFile,
        node,
        message: 'Raw Durable Object SQLite access is illegal in production code.',
        suggestion: 'Wire DO storage to Drizzle in the approved database adapter, then query through repositories/stores.',
      }))
    }

    if (ts.isCallExpression(node) && isRawDatabaseCall(node)) {
      violations.push(createViolation({
        rule: 'ban-raw-database-access',
        repoPath,
        sourceFile,
        node,
        message: 'Raw database calls are illegal in production code.',
        suggestion: 'Use Drizzle query builder through a repository/store. Generated migrations are the schema mutation boundary.',
      }))
    }

    if (ts.isTaggedTemplateExpression(node) && isRawSqlTag(node.tag)) {
      violations.push(createViolation({
        rule: 'ban-raw-database-access',
        repoPath,
        sourceFile,
        node,
        message: 'Raw SQL template tags are illegal in production runtime code.',
        suggestion: 'Use Drizzle query builder. Keep SQL in Drizzle-generated migrations or approved schema definitions only.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isAllowedDatabaseBoundary(repoPath: string): boolean {
  return repoPath.startsWith('tools/')
    || repoPath.includes('/drizzle/')
    || repoPath.includes('/_schema/')
    || repoPath.includes('/_database/')
    || repoPath.endsWith('drizzle.config.ts')
    || repoPath.endsWith('.schema.ts')
    || repoPath.endsWith('.migration.ts')
    || repoPath.endsWith('.database.ts')
    || repoPath.endsWith('.database.helper.ts')
}

function isAllowedSupabaseAuthBoundary(repoPath: string): boolean {
  return repoPath.includes('/auth/')
    || repoPath.includes('/middleware/auth')
    || repoPath.endsWith('supabase-admin-client.ts')
    || repoPath.endsWith('supabase.ts')
    || repoPath.endsWith('use-auth-store.ts')
}

function isTypeOnlyImport(statement: ts.ImportDeclaration): boolean {
  if (statement.importClause?.isTypeOnly) return true
  const namedBindings = statement.importClause?.namedBindings
  if (!namedBindings || !ts.isNamedImports(namedBindings)) return false
  return namedBindings.elements.every((element) => element.isTypeOnly)
}

function isStorageSqlAccess(node: ts.PropertyAccessExpression): boolean {
  if (node.name.text !== 'sql') return false
  const expression = node.expression
  return ts.isPropertyAccessExpression(expression) && expression.name.text === 'storage'
}

function isRawDatabaseCall(node: ts.CallExpression): boolean {
  const expression = node.expression
  if (!ts.isPropertyAccessExpression(expression)) return false

  if (rawDatabaseMethods.has(expression.name.text) && isLikelyDatabaseReceiver(expression.expression)) return true
  return expression.name.text === 'from' && isLikelySupabaseReceiver(expression.expression)
}

function isRawSqlTag(tag: ts.Expression): boolean {
  return ts.isIdentifier(tag) && tag.text === 'sql'
}

function isLikelyDatabaseReceiver(expression: ts.Expression): boolean {
  return ts.isIdentifier(expression) && expression.text === 'db'
}

function isLikelySupabaseReceiver(expression: ts.Expression): boolean {
  return ts.isIdentifier(expression) && expression.text.toLowerCase().includes('supabase')
}
