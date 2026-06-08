import { basename } from 'node:path'
import { readFileSync } from 'node:fs'
import type { WorkspaceEntry } from '../_helpers'
import type { NamingViolation } from '../_types'

export function validateCallableRpc(entry: WorkspaceEntry): NamingViolation[] {
  if (entry.kind !== 'file') return []
  if (!entry.repoPath.endsWith('.ts') && !entry.repoPath.endsWith('.tsx')) return []

  const content = readFileSync(entry.absolutePath, 'utf8')
  if (!hasCallableDecorator(content)) return []

  const fileName = basename(entry.repoPath)
  const violations: NamingViolation[] = []

  if (!fileName.endsWith('.agent.ts')) {
    violations.push({
      rule: 'callable-only-in-agent-file',
      path: entry.repoPath,
      message: '@callable() may only appear in .agent.ts files.',
      suggestion: 'Move the callable method onto the Agent class and delegate to an _rpc file.',
    })
  }

  if (!content.includes('from \'./_rpc\'') && !content.includes('from "./_rpc"') && !content.includes('from \'../_rpc\'') && !content.includes('from "../_rpc"')) {
    violations.push({
      rule: 'callable-delegates-to-rpc',
      path: entry.repoPath,
      message: '@callable() methods must delegate to a typed _rpc module.',
      suggestion: 'Import the implementation from ./_rpc and keep the Agent method thin.',
    })
  }

  if (/this\.sql|ctx\.storage\.sql|\.select\(|\.insert\(|\.update\(|\.delete\(/.test(content)) {
    violations.push({
      rule: 'callable-no-inline-sql',
      path: entry.repoPath,
      message: '@callable() Agent files must not contain inline SQL/query logic.',
      suggestion: 'Move database logic into the matching _rpc or _handlers file and enforce policy there.',
    })
  }

  return violations
}

function hasCallableDecorator(content: string): boolean {
  return content
    .split('\n')
    .some((line) => /^\s*@callable\s*\(/.test(line))
}
