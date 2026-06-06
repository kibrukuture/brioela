# Recall Alerts — Detail And Resolution

## What This File Covers

Recall detail screen and user resolution flow.

## Source Specs

- `brioela-specs/26-personalized-recall-alerts.md`

## Detail Screen

Show:

- product name
- product photo from scan history
- recall source
- recall reason, verbatim
- affected lot numbers
- user's scanned lot/date if known
- action guidance
- official source link

## User Action

Primary action:

```text
I discarded it
```

This marks the match resolved.

## Retraction

If recall is retracted after alert:

- send follow-up
- mark recall entry retracted/cleared
- preserve history

## Old Scan Rule

Still notify if the scan is old. Some symptoms can appear later.
