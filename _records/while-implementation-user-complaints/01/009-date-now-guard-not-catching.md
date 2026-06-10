# 009 — `Date.now()` Is Illegal But Guard Is Not Catching It

## Complaint
```typescript
const now = Date.now()
```
`Date.now()` is illegal in Brioela — the `ban-native-date` guard rule exists for exactly this. But the guard is NOT catching this call. This means either:
- The guard rule is not running on this file.
- The guard rule implementation is wrong (only bans `new Date()` but not `Date.now()`).
- The violation is suppressed in the baseline.

## What Needs to Happen
- Audit `ban.native.date.policy.ts` — does it catch `Date.now()` or only `new Date()`?
- If it only catches `new Date()`: fix it to also catch `Date.now()` (a static method call on the `Date` identifier).
- Verify the guard runs on `backend/src/agents/brain/` files.
- Remove any incorrect baseline suppression for `Date.now()` violations.

## Files Confirmed Containing the Violation
- `backend/src/agents/brain/_tools/_executables/read.user.memory.executable.ts`
- Likely others — do a full grep for `Date.now()` across the brain agent.

## Why
`Date.now()` is the same problem as `new Date()` — it reaches outside the time abstraction layer. The approved way is `readCurrentEpochMs()` from `@/time/_helpers`. The guard must catch both forms.

## Status
Open — guard bug not yet fixed.
