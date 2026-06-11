import { existsSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { appendGateEvent } from './append.gate.event.helper'
import { manifestPath } from './gate.config.helper'
import { readCurrentEpochMs } from './read.current.epoch.ms.helper'
import { appendReadEntry } from './append.read.entry.helper'
import { createContentHash } from './create.content.hash.helper'

export async function serveReadRoute(workspaceRoot: string, filePath: string | null): Promise<Response> {
  if (filePath === null || filePath.length === 0) {
    return new Response('gate:read needs a file. Run: bun gate:read <file>\n', { status: 400 })
  }

  if (filePath.includes('\t') || filePath.includes('\n')) {
    return new Response('File paths with tab or newline are rejected by the gate.\n', { status: 400 })
  }

  const absolutePath = isAbsolute(filePath) ? filePath : join(workspaceRoot, filePath)

  if (!existsSync(absolutePath)) {
    return new Response(`File does not exist: ${filePath}\n`, { status: 404 })
  }

  const checkedPath = realpathSync(absolutePath)

  if (!checkedPath.startsWith(`${workspaceRoot}/`)) {
    return new Response(`File is outside the workspace and cannot earn read credit: ${filePath}\n`, { status: 403 })
  }

  const fileBytes = await Bun.file(checkedPath).arrayBuffer()
  const hash = createContentHash(fileBytes)
  const file = relative(workspaceRoot, checkedPath)

  appendReadEntry(manifestPath, {
    file,
    hash,
    bytes: fileBytes.byteLength,
    readAtMs: readCurrentEpochMs(),
    workspaceRoot,
  })

  appendGateEvent(`read ${file} sha256 ${hash.slice(0, 8)} ${fileBytes.byteLength} bytes`)

  return new Response(fileBytes, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-gate-file': file,
      'x-gate-hash': hash,
      'x-gate-bytes': String(fileBytes.byteLength),
    },
  })
}
