import { resolve } from 'node:path'
import { cwd } from 'node:process'

export function resolveWorkspaceRoot(): string {
  const configuredRoot = process.env.BRIOELA_WORKSPACE_ROOT
  return configuredRoot ? resolve(configuredRoot) : cwd()
}
