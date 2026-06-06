# Notifications — Priority Model

## What This File Covers

Notification priority levels and what each level can do.

## Source Specs

- `brioela-specs/23-ambient-notification-strategy.md`

## Core Rule

Default is silence.

Interruption requires justification.

## Critical

Always delivered immediately.

Examples:

- active allergy/safety match
- hard allergen in active cooking ingredient
- confirmed recall for product user likely has

Rules:

- no suppression
- no quiet hours
- interrupt current context

## High

Delivered when contextually appropriate.

Examples:

- cooking invite
- pre-trip food intel ready
- recipe captured after session
- first confirmed constraint
- Bela delivery confirmation window

## Medium

Batched. Max one push per day.

Examples:

- weekly food summary
- relevant price alert
- relevant Ground moment
- nearby healthy food map opportunity

## Low

In-app only.

Examples:

- recipe suggestions
- discovery content
- feature announcements
- subscription prompts
- food pattern stats
