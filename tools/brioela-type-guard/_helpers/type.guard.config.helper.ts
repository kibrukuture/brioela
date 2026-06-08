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
  'tools/brioela-name-guard/name.guard.baseline.json',
  'tools/brioela-type-guard/type.guard.baseline.json',
])
