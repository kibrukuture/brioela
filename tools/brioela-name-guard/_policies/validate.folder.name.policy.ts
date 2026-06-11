import { basename } from 'node:path'
import {
  allowedUnderscoreFolders,
  bannedNames,
  rootUnderscoreFolders,
  type WorkspaceEntry,
} from '../_helpers'
import type { NamingViolation } from '../_types'

const kebabCasePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const numberedDocFolderPattern = /^\d{2}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export function validateFolderName(entry: WorkspaceEntry): NamingViolation[] {
  if (entry.kind !== 'directory') return []

  const folderName = basename(entry.repoPath)
  const violations: NamingViolation[] = []

  if (folderName.startsWith('_')) {
    if (!allowedUnderscoreFolders.has(folderName) && !rootUnderscoreFolders.has(folderName)) {
      violations.push({
        rule: 'unknown-underscore-folder',
        path: entry.repoPath,
        message: `Unknown underscore folder '${folderName}'.`,
        suggestion: 'Use an allowed scoped folder such as _handlers, _helpers, _schema, _rpc, _policies, or _subagents.',
      })
    }
    return violations
  }

  if (!kebabCasePattern.test(folderName) && !isAllowedNumberedDocFolder(entry.repoPath, folderName)) {
    violations.push({
      rule: 'folder-kebab-case',
      path: entry.repoPath,
      message: 'Folder names must be kebab-case nouns.',
      suggestion: 'Use lowercase words separated by hyphens.',
    })
  }

  if (bannedNames.has(folderName)) {
    violations.push({
      rule: 'banned-folder-name',
      path: entry.repoPath,
      message: `Folder name '${folderName}' is banned because it is generic or temporary.`,
      suggestion: 'Rename the folder to the exact owned domain.',
    })
  }

  return violations
}

function isAllowedNumberedDocFolder(repoPath: string, folderName: string): boolean {
  return (
    (repoPath.startsWith('build-guide/') || repoPath.startsWith('brioela-specs/') || repoPath.startsWith('implementable-specs/') || repoPath.startsWith('_records/'))
    && numberedDocFolderPattern.test(folderName)
  )
}
