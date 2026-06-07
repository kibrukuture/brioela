# Passport — Generation Flow

## What This File Covers

How Passport is generated from private Brioela context, which triggers are allowed, and how Brioela minimizes data before rendering.

---

## Trigger Rule

Passport is generated only after user action or explicit confirmation.

Allowed triggers:

- user taps "Create Passport"
- user says "make something I can show the waiter"
- user starts Bela order and asks for shopper rules
- user asks for travel translation
- user chooses caregiver/school handoff
- Brioela suggests Passport after a menu scan and user confirms

Blocked:

- automatic Passport generation without user confirmation
- background sharing
- push notification asking user to make a Passport

---

## Source Selection

Passport may read:

- confirmed user constraints
- active medical condition food rules
- active Mesa audience
- guest constraints
- menu scan waiter questions
- Bela order constraints
- travel language hints
- user-approved practitioner annotations

It should not include all available data. It should include only what the recipient needs.

---

## Minimization Flow

1. Determine recipient/context.
2. Determine food audience.
3. Collect relevant rules.
4. Remove unnecessary identity details.
5. Convert health details to food instructions where possible.
6. Generate instruction blocks.
7. Run privacy check.
8. Show preview.
9. User confirms display/share mode.

---

## Example Prompt

```text
Create a Passport I can show the waiter for this menu.
```

Output should focus on:

- avoid items
- ask questions
- preparation/cross-contact concerns

Not full profile.

---

## Preview Required

User sees Passport before sharing.

Preview actions:

- show on screen
- copy text
- save image/PDF
- create QR link
- translate
- edit/remove a line
- cancel
