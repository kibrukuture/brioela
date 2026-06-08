import { resolve } from 'node:path'
import { cwd, env } from 'node:process'

export function readWorkspaceRoot(): string {
	return resolve(cwd(), env.BRIOELA_WORKSPACE_ROOT ?? '.')
}
