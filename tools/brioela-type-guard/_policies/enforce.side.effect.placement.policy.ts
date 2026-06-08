import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

const filesystemModules = new Set(['node:fs', 'node:fs/promises', 'fs', 'fs/promises'])
const processModules = new Set(['node:process', 'process'])
const childProcessModules = new Set(['node:child_process', 'child_process'])

export const enforceSideEffectPlacementPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue

    const source = statement.moduleSpecifier.text

    if (filesystemModules.has(source) && !isToolFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-side-effect-placement',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Filesystem imports are illegal outside tooling code.',
        suggestion: 'Keep filesystem access in `tools/` or an explicitly approved adapter boundary.',
      }))
    }

    if ((processModules.has(source) || childProcessModules.has(source)) && !isToolFile(repoPath) && !isRuntimeBoundaryFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-side-effect-placement',
        repoPath,
        sourceFile,
        node: statement,
        message: 'Process-level imports are illegal outside tools or runtime boundary files.',
        suggestion: 'Pass typed config/env into domain code instead of reading process state directly.',
      }))
    }

    if (isAiSdkImport(source) && !isAiBoundaryFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-side-effect-placement',
        repoPath,
        sourceFile,
        node: statement,
        message: 'AI SDK imports are only allowed in agent/runtime/tool boundary files.',
        suggestion: 'Keep AI calls inside `.agent.ts`, `.runtime.ts`, `.tool.ts`, or `_agents/_runtime/_tools` folders.',
      }))
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && isDbMutationCall(node) && !isDbWriteBoundaryFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-side-effect-placement',
        repoPath,
        sourceFile,
        node,
        message: 'Database writes are only allowed in write boundary files.',
        suggestion: 'Move DB writes to `.handler.ts`, `.repository.ts`, `.store.ts`, `.rpc.ts`, or `.job.ts` files.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isToolFile(repoPath: string): boolean {
  return repoPath.startsWith('tools/')
}

function isRuntimeBoundaryFile(repoPath: string): boolean {
  return repoPath.endsWith('.runtime.ts') || repoPath.endsWith('.config.ts') || repoPath.endsWith('.handler.ts')
}

function isAiBoundaryFile(repoPath: string): boolean {
  return repoPath.endsWith('.agent.ts')
    || repoPath.endsWith('.runtime.ts')
    || repoPath.endsWith('.tool.ts')
    || repoPath.includes('/_agents/')
    || repoPath.includes('/_runtime/')
    || repoPath.includes('/_tools/')
}

function isAiSdkImport(source: string): boolean {
  return source === 'ai'
    || source.startsWith('@ai-sdk/')
    || source.includes('openai')
    || source.includes('anthropic')
    || source.includes('gemini')
}

function isDbMutationCall(node: ts.CallExpression): boolean {
  const expression = node.expression
  if (!ts.isPropertyAccessExpression(expression)) return false
  const methodName = expression.name.text
  return methodName === 'insert'
    || methodName === 'update'
    || methodName === 'delete'
}

function isDbWriteBoundaryFile(repoPath: string): boolean {
  return repoPath.endsWith('.handler.ts')
    || repoPath.endsWith('.repository.ts')
    || repoPath.endsWith('.store.ts')
    || repoPath.endsWith('.rpc.ts')
    || repoPath.endsWith('.job.ts')
    || repoPath.endsWith('.migration.ts')
}
