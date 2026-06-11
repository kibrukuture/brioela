# Draft: brain.drizzle.config.ts

Target: `backend/brain.drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './src/agents/brain/_schemas/index.ts',
	out: './src/agents/brain/drizzle',
	dialect: 'sqlite',
	driver: 'durable-sqlite',
})
```
