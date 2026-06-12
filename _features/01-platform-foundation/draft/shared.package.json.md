# Draft: shared.package.json

Target: `shared/package.json`

```
{
  "name": "@brioela/shared",
  "module": "index.ts",
  "type": "module",
  "private": true,
  "scripts": {
    "db:gen": "drizzle-kit generate",
    "db:mig": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop",
    "db:check": "drizzle-kit check",
    "db:up": "drizzle-kit up",
    "db:mig:run": "tsx drizzle/migrate.ts"
  },
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "@tolbel/align": "^1.2.7",
    "@ts-rest/core": "^3.52.1",
    "drizzle-kit": "^0.31.8",
    "drizzle-orm": "^0.44.7",
    "ibantools": "^4.5.1",
    "nanoid": "^5.1.11",
    "validator": "^13.15.26",
    "zod": "^4.3.2"
  }
}
```
