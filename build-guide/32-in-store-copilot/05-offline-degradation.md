# In-Store Co-Pilot — Offline Degradation

## What This File Covers

Dead-zone behavior. Grocery stores have notoriously bad signal.

## Source Specs

- `brioela-specs/45-in-store-copilot.md`
- `brioela-specs/24-technical-architecture-backbone.md` (offline queue contract)

## Degradation Ladder

1. **Full session** — live audio + live scan verdicts.
2. **Audio drops, scans work** — scans continue normally; session state held in the DO; Mira resumes on reconnect with state restored.
3. **No connectivity** — scans queue locally (standard offline queue: FIFO, original capture timestamps, never silently dropped). Barcode decode stays on-device. Cached verdicts for previously scanned products display instantly.

## Honesty Rule

Degraded mode is announced once, plainly: "I lost connection — your scans are saved, I'll catch up." No pretending. No spinner theater.

## Completion Without the Session

If the live session dies and never recovers, the visit record still completes from the receipt scan: list reconciliation, price events, pantry resets all run from receipt + queued scans. The co-pilot is an enhancement of the shop, never a dependency of the data loop.

## Rule

Nothing the user did in a dead zone is lost, and nothing requires them to redo anything when signal returns.
