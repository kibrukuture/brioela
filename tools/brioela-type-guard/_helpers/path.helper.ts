import { relative, sep } from 'node:path'

export function toRepoPath(workspaceRoot: string, absolutePath: string): string {
  return relative(workspaceRoot, absolutePath).split(sep).join('/')
}

export function hasIgnoredPart(repoPath: string, ignoredPathParts: Set<string>): boolean {
  return repoPath.split('/').some((part) => ignoredPathParts.has(part))
}

export function isInsideCheckedRoot(repoPath: string, checkedRoots: readonly string[]): boolean {
  return checkedRoots.some((root) => repoPath === root || repoPath.startsWith(`${root}/`))
}
