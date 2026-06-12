# Brain Agent Identity — Build

Feature **10**. Production path: `backend/src/agents/brain/identity-prompt.ts` (not shipped).

---

## Shipped today

| Area | Status |
|---|---|
| `identity-prompt.ts` with `BrioelaIdentity` export | ✗ |
| Token budget verification (≤ 800) | ✗ |
| Import by system prompt builder | ✗ (**15** — builder also missing) |
| Mira runtime imports canonical identity | ✗ (inline stubs in specs only) |
| Tests for identity constant | ✗ |

**No partial production file exists.** `backend/src/agents/brain/` has no `identity-prompt.ts`, no identity-related prompt module, and no grep hits for `BrioelaIdentity` in `backend/`.

`brioela.brain.agent.ts` does not reference identity — expected until **15** / **20** wire session chat.

---

## File manifest

### Identity constant (this feature)

| File | Role |
|---|---|
| `identity-prompt.ts` | Export `BrioelaIdentity` — single template literal, trimmed, no dynamic content |

Optional (recommended):

| File | Role |
|---|---|
| `identity-prompt.test.ts` | Assert export non-empty; token estimate ≤ 800 (or documented trim) |

### Consumers (not built in 10 — verify import when shipping)

| File | Role |
|---|---|
| `_handlers/build.system.prompt.handler.ts` | Block 1: `blocks.push(BrioelaIdentity)` — **15** |
| `_handlers/session.handler.ts` | Calls builder on `openSession` — **11** |
| Mira session system-instruction builder | Prefix anchor: import `BrioelaIdentity` before scene lines — **20** / **29** |

### Not in scope (do not add in 10)

| Path | Why excluded |
|---|---|
| `_schemas/user.personality.schema.ts` | Per-user traits — **05** |
| `_tools/*` | No identity tools |
| SQLite migrations | Identity is not a table |

---

## Implementation contract

### `identity-prompt.ts`

```typescript
export const BrioelaIdentity = `
...canonical text from spec.md...
`.trim()
```

Requirements:

1. **One export** — `BrioelaIdentity` only (no factory, no `getIdentityForUser`).
2. **Static string** — no env vars, no locale branching, no session-kind variants in this file.
3. **Trimmed** — `.trim()` on the template literal to avoid leading newline waste in Block 1.
4. **Exact content** — match `16-agent-identity.md` unless an approved trim satisfies token cap.
5. **800-token cap** — measure with chosen tokenizer or agreed estimate; fail CI if over.

Scene-specific instructions (cooking camera, voice-only, user name) belong in **Mira scene builders**, appended **after** `BrioelaIdentity`, not merged into this file.

---

## Acceptance criteria

1. `backend/src/agents/brain/identity-prompt.ts` exists and exports `BrioelaIdentity`.
2. `BrioelaIdentity` is a `const` string — no function wrapper.
3. Content matches canonical spec text (or documented trim list if cap enforced).
4. Token count ≤ 800 per ledger verification rule.
5. No per-user or per-session branching in the module.
6. `bun run verify` passes after add (typecheck + tests).
7. `build.system.prompt.handler.ts` (**15**) can import `from '../identity-prompt'` or `from '@/agents/brain/identity-prompt'` per repo import conventions.

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/identity-prompt.test.ts  # when test added
```

Manual: paste `BrioelaIdentity` into token counter; confirm ≤ 800.

---

## 10 vs 15 build split

| Build in **10** | Build in **15** |
|---|---|
| Create `identity-prompt.ts` | Create `build.system.prompt.handler.ts` |
| Token cap test | Repository reads for blocks 2–6 |
| Document trim if cap forces edit | `format*` helpers + `getRelevantNamespaces` |
| Export for import | `openSession` integration (**11**) |

---

## Blocked by

- **04-brain-foundation** — Brain package path exists (shipped)

## Blocks

- **15-brain-system-prompt** — Block 1 import
- **11-brain-sessions-lifecycle** — `openSession` needs builder
- **20-brain-chat-runtime** — chat handler system prompt
- **29-cooking-session** / **30-mira-speech-engine** — Mira should reuse constant

---

## Sources

- `implementable-specs/16-agent-identity.md`
- `build-guide/05-brain/06-agent-identity.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `_records/implementation-ledger/brain/04-agent-identity/0001.identity-prompt.md`
