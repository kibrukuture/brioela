import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { realpathSync } from 'node:fs'

export function resolveWorkspaceRoot(): string {
  const configuredRoot = process.env.BRIOELA_WORKSPACE_ROOT
  return realpathSync(configuredRoot ? resolve(configuredRoot) : cwd())
}
