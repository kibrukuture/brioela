# Recall Alerts — Critical Notification

## What This File Covers

How recall matches become user alerts.

## Source Specs

- `brioela-specs/26-personalized-recall-alerts.md`
- `build-guide/12-notifications/01-priority-model.md`
- `build-guide/12-notifications/02-delivery-rules.md`

## Priority

Confirmed dangerous recall = critical.

Rules:

- immediate delivery
- no quiet hours
- no suppression
- no daily cap

## Delivery Path

1. Match worker creates `recall_scan_match`.
2. User Orchestrator DO receives match event.
3. Orchestrator checks device token/current state.
4. Push is sent through notification delivery path.
5. Notification log is written.

## Copy Rules

Confirmed lot match:

```text
Recall: [Product Name]
A product you scanned on [date] has been recalled for [reason]. Check your fridge.
```

Broad/probable match:

```text
Recall: [Product Name]
You may have a recalled product you scanned on [date]. Check your fridge.
```

Never say “you have this” unless confirmed.
