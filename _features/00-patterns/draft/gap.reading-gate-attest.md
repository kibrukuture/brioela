# Gap target: reading gate attestation + pass records

**Pattern**: `14-reading-gate.md` — mandatory two-layer attestation (`gate:attest`), signed pass records, `gate:check` against staged diff, merge fortress.

**Shipped (slice 1 only)**:

- `tools/brioela-reading-gate/up.gate.handler.ts`
- `read.gate.handler.ts`, `status.gate.handler.ts`, `watch.gate.handler.ts`
- Manifest append helpers in `_helpers/`

**Missing**:

- `attest.gate.handler.ts` — not in repo (`rg attest tools/brioela-reading-gate` → zero)
- `_policies/attest.*.policy.ts` — not created
- `check.gate.handler.ts` — not created
- ed25519 signing, clean-room verify, merge executor per `15-agent-loop-orchestration.md`

**Ledger**: `_records/implementation-ledger/tooling/02-reading-gate/0001.design.docs.md` — "Not Implemented" section still accurate for slices 2–4.

**Risk**: Agents can commit without proving schema column knowledge — the failure mode that motivated the gate.
