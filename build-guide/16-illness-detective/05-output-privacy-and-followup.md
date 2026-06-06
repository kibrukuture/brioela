# Illness Detective — Output, Privacy, Follow-Up

## What This File Covers

Result screen, safety advice, privacy, and follow-up alarm.

## Source Specs

- `brioela-specs/30-food-illness-detective.md`
- `build-guide/12-notifications/`
- `build-guide/05-orchestrator/05-alarm-system.md`

## Result Screen

Show:

- top 3 suspects
- confidence per suspect
- reason for each
- active recall badge if relevant
- next steps

## Safety Copy

Must include severe symptom guidance:

```text
If symptoms are severe, see a doctor immediately.
```

## Follow-Up

Schedule `sickness_followup` after 24h through Orchestrator alarm system.

## Privacy

- individual illness report is private
- illness history deleted on request
- community signal is anonymized before write
- authority sharing requires opt-in

## Rule

No medical diagnosis. No overconfident causal language.
