import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { parseNamingScope } from '../_schema'
import type { NamingScope } from '../_types'
import type { WorkspaceEntry } from './walk.workspace.helper'

export type LoadedNamingScope = NamingScope & {
  directory: string
}

export async function loadNamingScopes(entries: WorkspaceEntry[]): Promise<LoadedNamingScope[]> {
  const scopeFiles = entries.filter((entry) => entry.kind === 'file' && entry.repoPath.endsWith('/naming.scope.json'))
  const scopes: LoadedNamingScope[] = []

  for (const scopeFile of scopeFiles) {
    const raw = await readFile(scopeFile.absolutePath, 'utf8')
    const parsed = parseNamingScope(JSON.parse(raw), scopeFile.repoPath)
    scopes.push({ ...parsed, directory: dirname(scopeFile.repoPath) })
  }

  return scopes.sort((a, b) => b.directory.length - a.directory.length)
}

export function findNearestNamingScope(repoPath: string, scopes: LoadedNamingScope[]): LoadedNamingScope | undefined {
  return scopes.find((scope) => repoPath === scope.directory || repoPath.startsWith(`${scope.directory}/`))
}
