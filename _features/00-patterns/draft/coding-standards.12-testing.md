# Draft: build-guide/02-coding-standards/12-testing-standards.md

Target: `build-guide/02-coding-standards/12-testing-standards.md`

```
# Testing Standards

## Test Runner

`bun test` — built into Bun. No Jest, no Vitest, no separate test runner installation.

```bash
bun test                          # run all tests
bun test --watch                  # watch mode
bun test src/lib/scan             # run tests in a specific folder
bun test --coverage               # coverage report
```

---

## What Gets Tested

### Must Test

| Layer | What to test |
|---|---|
| Shared schemas | Every Zod schema — valid inputs pass, invalid inputs fail with correct error |
| Branded types | Constructor functions produce correct branded output |
| Tool functions | Every AI-callable tool — correct output for valid input, correct error for invalid |
| Business logic | Functions in `backend/src/lib/` — pure input/output, no network |
| Utility functions | `mobile/lib/` — pure functions, no UI |
| Error factories | `AppError` factories produce correct codes and status codes |

### Test When Practical

| Layer | What to test |
|---|---|
| Hono routes | Integration tests with `hono/testing` — request → response shape |
| Drizzle queries | Query result shape validation against schemas |

### Do Not Test

| Layer | Why |
|---|---|
| React components | Snapshot tests are fragile; behavior tests require significant setup for marginal value |
| Design tokens | Constants — reading them back from the file is not a test |
| Expo Router screens | Thin wrappers — the feature components they render are tested |
| Reanimated animations | Cannot meaningfully test GPU/worklet animations in a test runner |
| Skia shaders | GPU code — not runnable in bun test |

---

## Test File Location

Test files live next to the file they test. Naming convention: `{filename}.test.ts` or `{filename}.test.tsx`.

```
backend/src/api/scan/_helpers/
├── build.verdict.helper.ts
├── build.verdict.helper.test.ts    ← test for the helper
└── index.ts

shared/validator/scan/
├── scan.schema.ts
├── scan.schema.test.ts             ← schema tests
└── index.ts

mobile/lib/
├── cn.ts
├── cn.test.ts
└── format.ts
```

No separate `__tests__/` folder. No `tests/` folder at the root. Tests live with the code they test.

---

## Test Pattern

```ts
// shared/validator/scan/scan.schema.test.ts
import { describe, test, expect } from 'bun:test'
import { ScanEventSchema, VerdictLevelSchema } from './scan.schema'

describe('VerdictLevelSchema', () => {
  test('accepts valid verdict levels', () => {
    expect(VerdictLevelSchema.parse('safe')).toBe('safe')
    expect(VerdictLevelSchema.parse('caution')).toBe('caution')
    expect(VerdictLevelSchema.parse('danger')).toBe('danger')
  })

  test('rejects invalid verdict levels', () => {
    expect(() => VerdictLevelSchema.parse('unknown_value')).toThrow()
    expect(() => VerdictLevelSchema.parse('')).toThrow()
    expect(() => VerdictLevelSchema.parse(null)).toThrow()
  })
})

describe('ScanEventSchema', () => {
  const validScanEvent = {
    id:        '550e8400-e29b-41d4-a716-446655440000',
    userId:    '550e8400-e29b-41d4-a716-446655440001',
    upc:       '012345678901',
    verdict:   { level: 'safe', reason: 'No allergens', violations: [], confidence: 0.95 },
    scannedAt: new Date().toISOString(),
  }

  test('parses a valid scan event', () => {
    const result = ScanEventSchema.parse(validScanEvent)
    expect(result.verdict.level).toBe('safe')
    expect(typeof result.userId).toBe('string')
  })

  test('rejects scan event with invalid UPC', () => {
    expect(() => ScanEventSchema.parse({ ...validScanEvent, upc: '' })).toThrow()
    expect(() => ScanEventSchema.parse({ ...validScanEvent, upc: 'x'.repeat(15) })).toThrow()
  })

  test('rejects scan event with missing verdict', () => {
    const { verdict: _, ...withoutVerdict } = validScanEvent
    expect(() => ScanEventSchema.parse(withoutVerdict)).toThrow()
  })
})
```

---

## Tool Function Tests

Tool functions are the most important to test — they are the AI's interface with user data.

```ts
// backend/src/tools/memory/write.user.memory.tool.test.ts
import { describe, test, expect, beforeEach } from 'bun:test'
import { writeUserMemory, WriteUserMemoryInputSchema } from './write.user.memory.tool'

describe('WriteUserMemoryInputSchema', () => {
  test('accepts valid input', () => {
    const result = WriteUserMemoryInputSchema.parse({ key: 'dietary_identity', value: { type: 'vegan' } })
    expect(result.key).toBe('dietary_identity')
  })

  test('rejects empty key', () => {
    expect(() => WriteUserMemoryInputSchema.parse({ key: '', value: {} })).toThrow()
  })
})

// For functions that hit the DB, use a mock DB or an in-memory SQLite:
describe('writeUserMemory', () => {
  // setup mock db...
  test('inserts new memory entry', async () => {
    const result = await writeUserMemory(mockDb, { key: 'test_key', value: 'test_value' })
    expect(result.success).toBe(true)
  })

  test('upserts existing key', async () => {
    await writeUserMemory(mockDb, { key: 'test_key', value: 'first' })
    await writeUserMemory(mockDb, { key: 'test_key', value: 'second' })
    const stored = await mockDb.query.userMemory.findFirst({ where: eq(userMemory.key, 'test_key') })
    expect(JSON.parse(stored!.value)).toBe('second')
  })
})
```

---

## Hono Route Integration Tests

```ts
// backend/src/api/scan/scan.route.test.ts
import { describe, test, expect } from 'bun:test'
import app from '@/index'

describe('POST /api/scan', () => {
  test('returns 422 for missing UPC', async () => {
    const response = await app.request('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({}),
    })
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })
})
```

---

## Rules

- Test file name must match the file being tested exactly: `build.verdict.helper.ts` → `build.verdict.helper.test.ts`
- No test file imports from another test file.
- Tests are independent — each test sets up its own state, tears down after itself.
- No `describe` nesting beyond two levels.
- Test names describe behavior in plain English: `'rejects scan event with invalid UPC'` not `'test 3'`.
- Mock external services (Upstash, Supabase, Gemini) in tests — never make real network calls in unit tests.
- `bun test` must pass with zero failures before any commit that touches the tested code.
```
