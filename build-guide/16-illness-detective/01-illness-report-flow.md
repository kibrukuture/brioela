# Illness Detective — Report Flow

## What This File Covers

How a user starts an illness investigation.

## Source Specs

- `brioela-specs/30-food-illness-detective.md`

## Entry Point

User says or taps:

```text
I feel sick, I think it was something I ate.
```

## Only Required Question

```text
When did symptoms start?
```

Follow-up questions are optional and limited.

## Data Model

### `illness_report`

- `report_id`
- `user_id`
- `symptom_onset_time`
- `reported_at`
- `window_start`
- `window_end`
- `status`

## Status

- `open`
- `resolved`
- `dismissed`

## Rule

Start fast. Do not turn illness reporting into a medical questionnaire.
