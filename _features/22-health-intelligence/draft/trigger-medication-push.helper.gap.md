# Draft: trigger-medication-push.helper.ts (gap — owned by 21, invoked by 22)

Target: `backend/src/core/notifications/trigger-medication-push.helper.ts`

**Owner split:** **22** invokes from reminder handler; **21** owns `sendPlatformPush` implementation.

Canonical gap draft lives in `_features/21-platform-notifications/draft/trigger-medication-push.helper.gap.md`.

Summary:

- `type: 'medication_reminder'`, `priority: 'high'`
- `idempotencyKey` / `collapseId` = alarm row id
- `ttlSeconds: 3600`
- `data: { type, drug_name, alarm_id }`
- **Do not** duplicate raw OneSignal fetch from `02-medication-reminders.md` build guide

Cross-ref **21** G8, **22** G15.
