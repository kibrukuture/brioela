# Draft: _helpers/read.current.epoch.ms.helper.ts

Target: `tools/brioela-reading-gate/_helpers/read.current.epoch.ms.helper.ts`

```typescript
import dayjs from 'dayjs'

export function readCurrentEpochMs(): number {
  return dayjs().valueOf()
}
```
