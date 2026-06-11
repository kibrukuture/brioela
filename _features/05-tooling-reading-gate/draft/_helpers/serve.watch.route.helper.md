# Draft: _helpers/serve.watch.route.helper.ts

Target: `tools/brioela-reading-gate/_helpers/serve.watch.route.helper.ts`

```typescript
import { existsSync, readFileSync } from 'node:fs'
import { gateEventsLogPath } from './gate.config.helper'
import { addWatchStream, deleteWatchStream } from '../gate.state.store'

export function serveWatchRoute(): Response {
  let activeStream: ReadableStreamDefaultController<Uint8Array> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      activeStream = controller
      if (existsSync(gateEventsLogPath)) {
        const previousText = readFileSync(gateEventsLogPath, 'utf8').split('\n').slice(-40).join('\n')
        controller.enqueue(new TextEncoder().encode(`${previousText}\n`))
      }
      addWatchStream(controller)
    },
    cancel() {
      if (activeStream !== null) deleteWatchStream(activeStream)
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-gate-stream': 'live' },
  })
}
```
