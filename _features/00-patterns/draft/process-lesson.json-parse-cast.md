# Process lesson: `JSON.parse(x) as JsonValue`

**Source**: `_records/while-implementation-user-complaints/01-user-complaints/010-json-parse-cast-guard-not-catching.md`

**What happened**: Brain executables used type assertions on `JSON.parse` results. Violations existed in type-guard baseline.

**Pattern fix**:

```typescript
// banned
JSON.parse(entry.value) as JsonValue

// required
jsonValueSchema.parse(JSON.parse(entry.value))
// or z.record(z.string(), jsonValueSchema).parse(...)
```

**Enforcement**: `ban.json.parse.cast.policy.ts`, `ban.type.assertion.policy.ts` — active; check baselines before assuming clean.

**Status**: FIXED in `read.user.memory.executable.ts`, `write.user.memory.executable.ts`.
