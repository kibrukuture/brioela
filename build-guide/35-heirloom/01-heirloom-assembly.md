# Heirloom — Heirloom Assembly

## What This File Covers

How an owner curates an Heirloom.

## Source Specs

- `brioela-specs/48-heirloom.md`

## What Can Be Included

- finalized heritage recipes (spec 13 schema) with their uncertainty markers and source-session refs
- the cook's style profile summary + attributes (spec 32)
- session photos already attached to those records
- owner-written context notes and a dedication ("she always made this for Meskel")

Nothing else. Scan history, memory, health data, personality — structurally excluded; the assembly UI cannot select them.

## Curation Flow

- Explicit, item by item. Nothing included by default.
- Voice-first like everything else: "add the doro wat and the bread, and write that she made the bread every Sunday" is a complete instruction.
- Cover: cook's name, relationship, optional photo, dedication text.

## Consent and Preview

- The preview shows exactly what a recipient will receive, item by item, before any invitation can be sent.
- The dedication screen restates that the cook's recipes and style are being shared and to whom (the capture consent from spec 13 covers family preservation; this screen is the reminder).
- If the captured cook is a living Brioela user, only content produced by the owner's sessions moves — the cook's own account is untouched.

## Data

`heirloom` + `heirloom_item` rows in the owner's Brain DO (role `owner`). Version starts at 1; every later push increments.

## Rule

Curation is the consent. No bulk "add everything" action exists.
