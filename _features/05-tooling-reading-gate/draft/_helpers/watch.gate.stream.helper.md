# Draft: _helpers/watch.gate.stream.helper.ts

Target: `tools/brioela-reading-gate/_helpers/watch.gate.stream.helper.ts`

```typescript
import { exit, stdout } from 'node:process'
import { gateSocketPath } from './gate.config.helper'

export async function watchGateStream(): Promise<never> {
  console.log('')
  console.log('  ── live board — every change, every verdict, every violation streams here ──')
  console.log('     (ctrl-c leaves the stream; the daemon keeps running under launchd)')
  console.log('')

  while (true) {
    const gateCall = await fetch('http://gate/watch', { unix: gateSocketPath }).catch(() => null)

    if (gateCall === null) {
      console.error('  gate daemon not running — fail closed. Only the human starts it: sudo bun run gate:up')
      exit(1)
    }

    if (!gateCall.ok) {
      const errorText = await gateCall.text().catch(() => '')
      console.error(`  gate error: ${errorText.trim() || gateCall.statusText || gateCall.status}`)
      exit(1)
    }

    if (gateCall.body === null) {
      console.error('  gate stream body is null.')
      exit(1)
    }

    try {
      for await (const fileBytes of gateCall.body) {
        stdout.write(fileBytes)
      }
    } catch (watchError) {
      if (!(watchError instanceof Error)) throw watchError
    }

    console.error('  stream closed — reconnecting…')
    await Bun.sleep(1_000)
  }
}
```
