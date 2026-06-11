import { chmodSync, existsSync, unlinkSync } from 'node:fs'
import { gateSocketPath } from './gate.config.helper'
import { serveReadRoute } from './serve.read.route.helper'
import { serveStatusRoute } from './serve.status.route.helper'

export function serveGateSocket(workspaceRoot: string): ReturnType<typeof Bun.serve> {
  if (existsSync(gateSocketPath)) unlinkSync(gateSocketPath)

  const gateSocket = Bun.serve({
    unix: gateSocketPath,
    fetch: async (call) => {
      const url = new URL(call.url)

      if (url.pathname === '/read') {
        return serveReadRoute(workspaceRoot, url.searchParams.get('file'))
      }

      if (url.pathname === '/status') {
        return serveStatusRoute(workspaceRoot)
      }

      if (url.pathname === '/check') {
        return new Response('ok\n', { status: 200 })
      }

      return new Response(`Unknown gate route: ${url.pathname}\n`, { status: 404 })
    },
  })

  chmodSync(gateSocketPath, 0o666)
  return gateSocket
}
