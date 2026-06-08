# Notifications — Overview

## What This Folder Covers
The ambient notification strategy — when Brioela speaks and when it stays silent. Push notification setup, in-app ambient surfacing, notification permission timing, suppression rules, the "one thing" rule, priority levels (critical/high/medium/low), and quiet hours enforcement. Default is silence; interruption requires justification.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-priority-model.md` | critical/high/medium/low priority rules |
| `02-delivery-rules.md` | quiet hours, active sessions, daily caps, geo timing |
| `03-suppression-state.md` | dismissal suppression and Brain state |
| `04-surfaces.md` | push vs in-app ambient surfaces |
| `05-permission-timing.md` | when notification permission is requested |
| `06-data-model-and-tools.md` | notification tables, queueing, send/queue tools |

## Specs This Folder Draws From
- `brioela-specs/23-ambient-notification-strategy.md` — full strategy: priority levels, delivery rules, suppression, in-app ambient surfaces, the one-thing rule

## Key Decisions From Specs
- Critical (allergy/safety match): always delivered, no suppression, no quiet hours
- Max 1 push notification per day for medium priority
- No marketing push notifications — ever
- No push during active voice/cooking sessions — queue and deliver after
- Quiet hours: 11pm–7am local time (except critical safety alerts)
- Suppression: 2 dismissals of same type → 14-day auto-suppress; 3 dismissals → permanent suppress
- Permission request: NOT at install — after 3rd scan or contextual Ground Find moment
- In-app surfaces: Ground signals can appear near scan/map contexts automatically; map pre-filtered by constraints; no setup needed
- Each push carries ONE piece of information and ONE optional action — no multi-part messages

## Tools Built In This Feature
Under `tools/notifications/`:
- `send-push.ts` — push notification delivery via Brain DO (respects suppression state)
- `queue-notification.ts` — queue during active sessions

## What This Folder Depends On
- `05-brain` — suppression state stored in Brain DO; device token managed here
- `03-foundation` — OneSignal setup only; Brioela does not use other push providers directly

## What Depends On This Folder
Every feature that surfaces information to the user: recall alerts, illness detective, pantry nudges, weekly summary, Bela delivery updates, pre-trip intelligence.

## Product Rule

Brioela does not push notifications. Brioela surfaces moments.
