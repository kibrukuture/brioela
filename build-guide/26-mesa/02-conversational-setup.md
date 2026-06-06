# Mesa — Conversational Setup

## What This File Covers

How users create and manage Mesa without forms: voice/chat member addition, constraint capture, confirmation, and low-friction corrections.

---

## Core Rule

Mesa setup is conversational.

No long forms. No family tree builder. No mandatory profile screens.

The user can say:

```text
Add my daughter to Mesa. She's 8 and allergic to peanuts.
```

Brioela creates the member and confirmed constraint after owner confirmation.

---

## Setup Entry Points

Mesa can start from:

- pricing upgrade moment
- scan result: "check for everyone at my table"
- meal plan: "plan for my family this week"
- cooking session: "I'm cooking for my kids too"
- menu scanning: "which dishes work for all of us?"
- settings: "start Mesa"

Even settings should open a conversational setup, not a form.

---

## First Conversation

Example:

```text
User: I want Brioela to help with food for my family.
Brioela: I can set up Mesa for the people you often feed. Who should I keep in mind first?
User: My son Noah. He is 10 and can't have peanuts.
Brioela: Got it. Add Noah, age 8-10, with a peanut allergy? I will treat peanuts as a hard safety rule for him.
User: Yes.
```

The confirmation is required before hard constraints are active.

---

## No-Form Member Creation

Use the agent to parse:

- label
- role
- age band if child
- stated constraints
- severity if obvious
- whether this is persistent Mesa or temporary guest

When uncertain, ask one short question.

Bad:

```text
Please fill out all household member fields.
```

Good:

```text
Is this someone you want me to remember for future meals, or just tonight?
```

---

## Confirmation Rules

Confirm before:

- creating first Mesa
- adding a member with a hard constraint
- changing a member's hard constraint
- archiving/removing a member
- inviting another account
- allowing another account to contribute to Mesa

Do not require confirmation for low-risk label cleanup, such as changing "my son" to "Noah" if the user just requested it.

---

## Correction Flow

Users can correct naturally:

```text
Actually, Maya is vegetarian, not vegan.
```

Brioela should:

1. identify the member
2. propose the change
3. confirm if it changes food filtering
4. update Mesa constraints
5. log a private event

---

## Language

Avoid "track" for people.

Use:

- "keep in mind"
- "remember food needs for"
- "check food for"
- "include at your table"
- "make meals work for"

Example:

```text
Want me to keep your kids' food needs in mind when you scan, cook, and plan groceries?
```
