# Gap target: Bun vs Node backend runtime

**Pattern**: `CLAUDE.md` — use Bun APIs (`Bun.sql`, `Bun.serve`); ban `pg`, `dotenv`.

**Shipped**:

- `backend/package.json` — `"build": "bun build ... --target=node"`, `"engines": { "node": "24.x" }`
- `backend/src/instrument.ts` — `@sentry/node` preload
- `backend/core/database/client.ts` — `pg.Pool` + Drizzle
- Root `package.json` — `dotenv` dependency

**Enforcement**: None mechanical — package ban in `11-packages.md` not wired to dependency audit.

**Decision needed**: Dual-target (Fly Node + CF Workers) vs full Workers migration — owned by **01-platform-foundation** G2.
