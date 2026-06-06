# Notifications — Permission Timing

## What This File Covers

When the app asks for push notification permission.

## Source Specs

- `brioela-specs/23-ambient-notification-strategy.md`
- `brioela-specs/21-onboarding.md`

## Rule

Do not ask at install.

Do not ask during onboarding.

Ask only after the app has shown value.

## Valid Triggers

- after the user has received a useful scan result
- contextual Ground moment after scan
- after third scan session
- before enabling a feature that clearly needs timely alerts

## Invalid Triggers

- first app launch
- feature tour
- subscription pitch
- generic “stay updated” prompt

## Copy Direction

Permission prompt should explain the immediate value, not future marketing.

Example intent:

```text
People near you noticed something about this. Want alerts when that matters?
```
