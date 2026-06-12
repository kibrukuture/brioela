# Draft: shared.drizzle.config

Target: `shared/drizzle.config.ts`

```
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
    ssl: true,
  },
  schemaFilter: [ "brioela"],
  verbose: true,
  strict: true,
});
```
