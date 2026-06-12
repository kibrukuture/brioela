# Gap target: `bun run verify` stub

**Pattern**: `13-file-name-enforcement.md` — `check:names` belongs in local verification and CI. `14-reading-gate.md` — `gate:check` joins `bun run verify`.

**Shipped** (`package.json` line 84):

```json
"verify": "echo 'verify: guards unwired (no gate daemon required)'"
```

**Intended verify** (not wired):

```bash
bun run name:check && bun run type:guard && bun run lexicon:guard && bun test
# future: && bun run gate:check
```

**Fix target**: Replace stub with real guard chain; document in CI workflow.

**Related**: G-enf-3 in `_features/00-patterns/status.md`
