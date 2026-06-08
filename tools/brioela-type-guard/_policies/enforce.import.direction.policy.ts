import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceImportDirectionPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue

    const source = statement.moduleSpecifier.text

    if (repoPath.startsWith('shared/') && importsBackendOrMobile(source)) {
      violations.push(createViolation({
        rule: 'enforce-import-direction',
        repoPath,
        sourceFile,
        node: statement,
        message: '`shared/` must not import backend or mobile code.',
        suggestion: 'Move shared contracts, schemas, and primitives into `shared/`; keep runtime code downstream.',
      }))
    }

    if (repoPath.startsWith('mobile/') && importsBackendOrDatabase(source)) {
      violations.push(createViolation({
        rule: 'enforce-import-direction',
        repoPath,
        sourceFile,
        node: statement,
        message: '`mobile/` must not import backend, database, or server runtime code.',
        suggestion: 'Use shared contracts and generated ts-rest hooks instead.',
      }))
    }

    if (repoPath.startsWith('backend/') && importsMobile(source)) {
      violations.push(createViolation({
        rule: 'enforce-import-direction',
        repoPath,
        sourceFile,
        node: statement,
        message: '`backend/` must not import mobile code.',
        suggestion: 'Move shared types/schemas into `shared/`.',
      }))
    }

    if (repoPath.startsWith('backend/src/agents/') && importsUiRuntime(source)) {
      violations.push(createViolation({
        rule: 'enforce-import-direction',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Agent runtime code must not import UI runtime libraries.',
        suggestion: 'Agents produce typed contracts/events; UI renders them separately.',
      }))
    }
  }

  return violations
}

function importsBackendOrMobile(source: string): boolean {
  return source.startsWith('backend/') || source.startsWith('../backend') || importsMobile(source)
}

function importsMobile(source: string): boolean {
  return source.startsWith('mobile/') || source.startsWith('../mobile') || source === 'react-native'
}

function importsBackendOrDatabase(source: string): boolean {
  return source.startsWith('backend/')
    || source.startsWith('../backend')
    || source.includes('/drizzle')
    || source.includes('/database')
    || source === 'drizzle-orm'
}

function importsUiRuntime(source: string): boolean {
  return source === 'react'
    || source === 'react-native'
    || source.startsWith('@react-navigation/')
    || source.startsWith('expo-')
}
