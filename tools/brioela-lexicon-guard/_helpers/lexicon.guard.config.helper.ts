export const checkedRoots = [
  'backend',
  'shared',
  'mobile',
  'tools',
] as const

export const ignoredPathParts = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.wrangler',
  '.expo',
  '.turbo',
  'coverage',
  'Pods',
  'DerivedData',
  'xcuserdata',
])

export const checkedExtensions = ['.ts', '.tsx'] as const

export const ignoredRepoPaths = new Set([
  'tools/brioela-lexicon-guard/lexicon.guard.baseline.json',
  'backend/worker-configuration.d.ts',
  'backend/src/agents/brain/_migrations/brain.migration.ts',
])
