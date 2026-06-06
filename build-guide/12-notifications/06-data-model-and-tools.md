# Notifications — Data Model And Tools

## What This File Covers

Notification tables, queueing, and feature tools.

## Source Specs

- `brioela-specs/23-ambient-notification-strategy.md`

## Orchestrator DO Tables

### `notification_log`

Fields:

- `user_id`
- `type`
- `priority`
- `content_ref`
- `delivered_at`
- `opened_at`
- `dismissed_at`

### `notification_suppression`

Fields:

- `user_id`
- `notification_type`
- `suppressed_until`
- `permanent`

### `notification_queue`

Fields:

- `user_id`
- `type`
- `priority`
- `payload_json`
- `earliest_deliver_at`
- `expires_at`

## Tools Built In This Feature

Under `tools/notifications/` later:

- `send-push.ts`
- `queue-notification.ts`

## Execution Rule

All delivery checks run through Orchestrator DO so suppression and active-session state are respected.
