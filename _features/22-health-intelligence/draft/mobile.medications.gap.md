# Draft: mobile medications UX (gap)

**Shipped stubs only:** `mobile/network/medications/medications.api.ts`, `use-medications.ts`

**Gap G13:** API calls unmounted `/v1/medications` — must switch to Brain-backed Worker routes or Brain RPC proxy.

## Intended screens

| Route | Purpose |
|---|---|
| `mobile/app/health/medications/index.tsx` | List active medications |
| `mobile/app/health/medications/add.tsx` | Photo / manual add |
| `mobile/app/health/medications/[id].tsx` | Edit reminder times, deactivate |
| `mobile/app/health/reminder-confirm.tsx` | Push deep link — `alarm_id` → confirm took med |

## Push confirm flow

From `02-medication-reminders.md`:

1. User taps `medication_reminder` push (`data.alarm_id`)
2. Screen loads alarm row via Brain API
3. User confirms → `action_outcome_status: confirmed`, `action_outcome_json.confirmed_at`

## API contract (intended)

Replace axios stubs with typed client:

```typescript
export const healthMedicationsApi = {
  list: () => api.get('/v1/brain/health/medications'),
  create: (body: CreateMedicationBody) => api.post('/v1/brain/health/medications', body),
  confirmReminder: (alarmId: string) => api.post(`/v1/brain/health/reminders/${alarmId}/confirm`),
}
```

Worker routes delegate to Brain DO `@callable()` methods — not legacy `MEDICATION_ROUTES`.

## Settings

Community contribution opt-in toggle → `agent_state` key `health_insight.community_contribution_opt_in` (**G24**).
