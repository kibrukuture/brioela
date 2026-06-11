import { realpathSync } from 'node:fs'
import { cwd, env } from 'node:process'

export function resolveWorkspaceRoot(): string {
  return realpathSync(env.BRIOELA_WORKSPACE_ROOT ?? cwd())
}
