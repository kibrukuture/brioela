import { relative, sep } from 'node:path'

export function toRepoPath(workspaceRoot: string, absolutePath: string): string {
  return relative(workspaceRoot, absolutePath).split(sep).join('/')
}

export function hasIgnoredPart(repoPath: string, ignoredParts: Set<string>): boolean {
  return repoPath.split('/').some((part) => ignoredParts.has(part))
}

export function isInsideCheckedRoot(repoPath: string, roots: readonly string[]): boolean {
  const firstPart = repoPath.split('/')[0]
  return roots.includes(firstPart ?? '')
}

export function splitFileName(fileName: string): { stem: string; extension: string } {
  if (fileName.endsWith('.tsx')) return { stem: fileName.slice(0, -4), extension: 'tsx' }
  if (fileName.endsWith('.ts')) return { stem: fileName.slice(0, -3), extension: 'ts' }
  return { stem: fileName, extension: '' }
}
