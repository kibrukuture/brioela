import { relative } from 'node:path'

export function toRepoPath(workspaceRoot: string, absolutePath: string): string {
  return normalizePath(relative(workspaceRoot, absolutePath))
}

export function normalizePath(path: string): string {
  return path.replaceAll('\\', '/')
}

export function hasIgnoredPart(repoPath: string, ignoredPathParts: Set<string>): boolean {
  return repoPath.split('/').some((part) => ignoredPathParts.has(part))
}

export function isInsideCheckedRoot(repoPath: string, roots: readonly string[]): boolean {
  return roots.some((root) => repoPath === root || repoPath.startsWith(`${root}/`))
}
