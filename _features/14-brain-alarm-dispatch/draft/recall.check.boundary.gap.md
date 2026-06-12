# Draft: recall_check boundary (gap — documented conflict)

**Not a production file.** Documents why `recall_check` is **not** a `dispatchAlarm` case in feature **14**.

---

## Authoritative: Path B (event-based)

From `implementable-specs/10-scheduled-alarms.md`:

> A product recall notification fires the moment the condition is detected — not at a scheduled future time. This flows through Upstash Workflow (Path B), creates a `background` session directly, and never touches this table.

**Owner:** **31-recall-alerts**

---

## Obsolete: Path A (scheduled)

From `build-guide/05-brain/05-alarm-system.md`:

| Type | Trigger | What runs |
|---|---|---|
| `recall_check` | Every 6h | Poll FDA/EFSA recall feeds, match against scan history |

Includes first-boot seed in `brioela.brain.agent.ts` init block (lines 193–199).

**Do not implement** in **14** unless product explicitly reverses and updates `10-scheduled-alarms.md`.

---

## Session `alarm_type` column note

`implementable-specs/07-sessions.md` lists `recall_check` as a possible `sessions.alarm_type` value for alarm sessions. Path B may still set this on a `background` session created via HTTP — that is **31** session creation, not **14** scheduled dispatch.

---

## If product moves recall to Path A later

1. Add `recall_check` to **14** `dispatchAlarm` switch.
2. Implement `handleRecallCheck` + `scheduleNextRecallCheck` per build-guide.
3. Add first-boot seed (conflicts with current **10** — update implementable spec first).
4. Update **09** alarm type table and **31** status.
