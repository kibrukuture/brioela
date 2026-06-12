# Draft: shared/_ids/create.id.helper.ts

Target: `shared/_ids/create.id.helper.ts`

```
import { nanoid } from 'nanoid'

export function createId(): string {
	return nanoid(24)
}
```
