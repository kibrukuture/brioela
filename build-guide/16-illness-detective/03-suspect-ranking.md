# Illness Detective — Suspect Ranking

## What This File Covers

Ranking likely food illness suspects.

## Source Specs

- `brioela-specs/30-food-illness-detective.md`
- `build-guide/15-recall-alerts/`

## Ranking Inputs

1. active recall match
2. community illness reports
3. known high-risk category
4. new product / first time consumed
5. outside food

## Output

Show top 3 suspects.

Each suspect includes:

- confidence
- short plain-language reason
- risk signal tags
- action suggestion

## Ranking Model

Use one structured LLM call with food history and recall/community context.

Target latency: under 2 seconds.

## Rule

Never claim diagnosis. Say likely suspect, not confirmed cause.
