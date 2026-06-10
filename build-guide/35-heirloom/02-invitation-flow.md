# Heirloom — Invitation Flow

## What This File Covers

Inviting recipients, including non-users.

## Source Specs

- `brioela-specs/48-heirloom.md`
- `brioela-specs/21-onboarding.md`

## Invitations

- Per-recipient link or QR. Single-recipient, 30-day expiry.
- Invitee contact stored hashed in `heirloom_invitation` (Supabase) — used only for matching at acceptance.
- States: sent → accepted | declined | expired. Declines are silent to the recipient's experience and visible to the owner without drama.

## Non-User Landing

A recipient without Brioela hits a dedicated landing: Heirloom cover, cook's name, who invited them.

- Accepting requires the standard account creation (Apple/Google sign-in only) and nothing else. No questions, no setup.
- First experience after sign-in: the Heirloom opens. Not the scanner, not onboarding screens. The spec 21 cold-start rules apply afterward as normal.

## Measurement

Inheritance-entry users are tagged as their own acquisition channel: activation and 90-day retention tracked against scan-entry users (the channel hypothesis from the spec).

## Rule

The invitation contains no recipe content — only the cover metadata needed to render the landing. Content moves only at acceptance, DO-to-DO.
