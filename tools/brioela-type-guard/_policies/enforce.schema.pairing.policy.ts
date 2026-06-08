import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceSchemaPairingPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  if (requiresSchemaPair(repoPath) && !hasNearbySchemaFile(sourceFile.fileName)) {
    violations.push(createViolation({
      rule: 'enforce-schema-pairing',
      repoPath,
      sourceFile,
      node: sourceFile,
      message: 'Boundary files must have a nearby schema or contract file.',
      suggestion: 'Add a `.schema.ts` or `.contract.ts` file beside the boundary, or move the boundary into an existing contract folder.',
    }))
  }

  return violations
}

function requiresSchemaPair(repoPath: string): boolean {
  if (repoPath.startsWith('tools/')) return false
  return repoPath.endsWith('.handler.ts')
    || repoPath.endsWith('.rpc.ts')
    || repoPath.endsWith('.agent.ts')
    || repoPath.endsWith('.runtime.ts')
}

function hasNearbySchemaFile(absolutePath: string): boolean {
  const folder = dirname(absolutePath)
  return existsSync(join(folder, 'schema.ts'))
    || existsSync(join(folder, 'contract.ts'))
    || hasFileWithSuffix(folder, '.schema.ts')
    || hasFileWithSuffix(folder, '.contract.ts')
}

function hasFileWithSuffix(folder: string, suffix: string): boolean {
  try {
    return readdirSync(folder).some((file) => file.endsWith(suffix))
  } catch {
    return false
  }
}
