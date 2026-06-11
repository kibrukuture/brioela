import { basename, dirname } from 'node:path'
import {
  allowedStandaloneFiles,
  allowedTypeScriptSuffixes,
  bannedNames,
  splitFileName,
  type WorkspaceEntry,
} from '../_helpers'
import type { NamingViolation } from '../_types'

const approvedRoleParts = new Set([
  'route',
  'controller',
  'handler',
	'helper',
	'repository',
	'rpc',
  'policy',
  'mapper',
  'prompt',
  'runtime',
  'middleware',
  'agent',
  'tool',
  'schema',
  'executable',
  'type',
  'event',
  'job',
  'routes',
  'lib',
  'constant',
  'store',
  'hook',
  'api',
  'client',
  'feature',
  'variants',
  'glsl',
  'test',
])

export function validateFileName(entry: WorkspaceEntry): NamingViolation[] {
  if (entry.kind !== 'file') return []

  const fileName = basename(entry.repoPath)
  const directory = dirname(entry.repoPath)
  const violations: NamingViolation[] = []

  if (fileName === '.DS_Store') {
    violations.push({
      rule: 'no-os-junk-files',
      path: entry.repoPath,
      message: 'macOS metadata files are not allowed in the Brioela repo.',
      suggestion: 'Delete this file.',
    })
    return violations
  }

  if (!isTypeScriptFile(fileName)) return violations

  if (fileName.includes('-')) {
    violations.push({
      rule: 'typescript-file-dot-case',
      path: entry.repoPath,
      message: 'TypeScript file names use dots, not hyphens.',
      suggestion: fileName.replaceAll('-', '.'),
    })
  }

  if (!allowedStandaloneFiles.has(fileName) && !allowedTypeScriptSuffixes.some((suffix) => fileName.endsWith(suffix))) {
    violations.push({
      rule: 'typescript-file-role-suffix',
      path: entry.repoPath,
      message: 'TypeScript files must end with an approved role suffix, or be index.ts/index.tsx.',
      suggestion: 'Use a suffix such as .handler.ts, .helper.ts, .rpc.ts, .policy.ts, .schema.ts, or .agent.ts.',
    })
  }

  if (fileName === 'index.ts' || fileName === 'index.tsx') return violations

  const { stem } = splitFileName(fileName)
  const parts = stem.split('.')

  for (const part of parts.filter((candidate) => !approvedRoleParts.has(candidate))) {
    if (bannedNames.has(part)) {
      violations.push({
        rule: 'banned-file-name-part',
        path: entry.repoPath,
        message: `File name contains banned generic part '${part}'.`,
        suggestion: 'Rename the file to describe exact ownership and responsibility.',
      })
    }
  }

  if (directory.endsWith('/_handlers') && !fileName.endsWith('.handler.ts') && !fileName.endsWith('.handler.test.ts') && !allowedStandaloneFiles.has(fileName)) {
    violations.push({
      rule: 'handler-folder-role-match',
      path: entry.repoPath,
      message: 'Files in _handlers must use the .handler.ts suffix.',
      suggestion: 'Rename this file to {action}.{subject}.handler.ts.',
    })
  }

	if (directory.endsWith('/_helpers') && !fileName.endsWith('.helper.ts') && !fileName.endsWith('.helper.test.ts') && !allowedStandaloneFiles.has(fileName)) {
    violations.push({
      rule: 'helper-folder-role-match',
      path: entry.repoPath,
      message: 'Files in _helpers must use the .helper.ts suffix.',
      suggestion: 'Rename this file to {verb}.{subject}.helper.ts.',
    })
	}

	if (directory.endsWith('/_repositories') && !fileName.endsWith('.repository.ts') && !fileName.endsWith('.repository.test.ts') && !allowedStandaloneFiles.has(fileName)) {
		violations.push({
			rule: 'repository-folder-role-match',
			path: entry.repoPath,
			message: 'Files in _repositories must use the .repository.ts suffix.',
			suggestion: 'Rename this file to {action}.{subject}.repository.ts.',
		})
	}

	if (directory.endsWith('/_database') && !fileName.endsWith('.database.ts') && !fileName.endsWith('.database.helper.ts') && !fileName.endsWith('.database.test.ts') && !fileName.endsWith('.database.helper.test.ts') && !allowedStandaloneFiles.has(fileName)) {
		violations.push({
			rule: 'database-folder-role-match',
			path: entry.repoPath,
			message: 'Files in _database must use a database role suffix.',
			suggestion: 'Rename this file to {subject}.database.ts or {action}.{subject}.database.helper.ts.',
		})
	}

	if (directory.endsWith('/_migrations') && !fileName.endsWith('.migration.ts') && !fileName.endsWith('.handler.ts') && !fileName.endsWith('.helper.ts') && !fileName.endsWith('.schema.ts') && !allowedStandaloneFiles.has(fileName)) {
		violations.push({
			rule: 'migration-folder-role-match',
			path: entry.repoPath,
			message: 'Files in _migrations must use migration, handler, helper, or schema role suffixes.',
			suggestion: 'Rename this file to {action}.{subject}.migration.ts, .handler.ts, .helper.ts, or .schema.ts.',
		})
	}

	if (directory.endsWith('/_policies') && !fileName.endsWith('.policy.ts') && !allowedStandaloneFiles.has(fileName)) {
    violations.push({
      rule: 'policy-folder-role-match',
      path: entry.repoPath,
      message: 'Files in _policies must use the .policy.ts suffix.',
      suggestion: 'Rename this file to {verb}.{subject}.policy.ts.',
    })
  }

  if (directory.endsWith('/_rpc') && !fileName.endsWith('.rpc.ts') && !allowedStandaloneFiles.has(fileName)) {
    violations.push({
      rule: 'rpc-folder-role-match',
      path: entry.repoPath,
      message: 'Files in _rpc must use the .rpc.ts suffix.',
      suggestion: 'Rename this file to {verb}.{subject}.rpc.ts.',
    })
  }

  if (directory.endsWith('/_schemas') && !fileName.endsWith('.schema.ts') && !allowedStandaloneFiles.has(fileName)) {
		violations.push({
			rule: 'schemas-folder-role-match',
			path: entry.repoPath,
			message: 'Files in _schemas must use the .schema.ts suffix.',
			suggestion: 'Rename this file to {subject}.schema.ts or {verb}.{subject}.schema.ts.',
		})
	}

	if (directory.endsWith('/_prompts') && !fileName.endsWith('.prompt.ts') && !allowedStandaloneFiles.has(fileName)) {
		violations.push({
			rule: 'prompts-folder-role-match',
			path: entry.repoPath,
			message: 'Files in _prompts must use the .prompt.ts suffix.',
			suggestion: 'Rename this file to {verb}.{subject}.prompt.ts.',
		})
	}

	if (directory.endsWith('/_executables') && !fileName.endsWith('.executable.ts') && !allowedStandaloneFiles.has(fileName)) {
		violations.push({
			rule: 'executables-folder-role-match',
			path: entry.repoPath,
			message: 'Files in _executables must use the .executable.ts suffix.',
			suggestion: 'Rename this file to {verb}.{subject}.executable.ts.',
		})
	}

  return violations
}

function isTypeScriptFile(fileName: string): boolean {
  return fileName.endsWith('.ts') || fileName.endsWith('.tsx')
}
