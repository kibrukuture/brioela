# Passport — Data Model

## What This File Covers

Passport records, instruction blocks, expiration, revocation, and audit state.

---

## Storage Rule

Passport records live in the user's Brain DO SQLite.

Passport links may use server routes for QR/link display, but the source data remains private and scoped.

---

## Tables

```sql
CREATE TABLE passport (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  kind            TEXT NOT NULL,
  audience        TEXT NOT NULL,
  title           TEXT NOT NULL,
  language        TEXT NOT NULL,
  share_mode      TEXT NOT NULL,
  sensitivity     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active', -- active | expired | revoked
  expires_at      INTEGER NOT NULL,
  revoked_at      INTEGER,
  created_at      INTEGER NOT NULL
);

CREATE TABLE passport_instruction_block (
  id              TEXT PRIMARY KEY,
  passport_id     TEXT NOT NULL,
  sort_order      INTEGER NOT NULL,
  heading         TEXT NOT NULL,
  lines_json      TEXT NOT NULL,
  severity        TEXT NOT NULL -- info | ask | avoid | critical
);

CREATE TABLE passport_audit_event (
  id              TEXT PRIMARY KEY,
  passport_id     TEXT NOT NULL,
  event_type      TEXT NOT NULL, -- created | viewed | shared | revoked | expired
  created_at      INTEGER NOT NULL,
  metadata_json   TEXT NOT NULL DEFAULT '{}'
);
```

---

## Passport Shape

```typescript
type Passport = {
  passportId: string
  userId: string
  kind: PassportKind
  audience: "self" | "mesa" | "selected_members" | "guest_session"
  title: string
  instructionBlocks: PassportInstructionBlock[]
  language: string
  expiresAt: number
  revokedAt: number | null
  shareMode: "show_on_screen" | "image" | "pdf" | "qr_link" | "text"
  sensitivity: "public_safe" | "limited_sensitive" | "blocked"
  createdAt: number
}
```

---

## Expiration Defaults

- restaurant/menu: same day
- Mesa table: same day or meal session
- Bela shopper: order completion
- travel translation: trip context or user-selected duration
- caregiver/school: user-selected duration
- practitioner guidance: until revoked or underlying note changes

Every Passport expires. No permanent public links.

---

## Revocation

User can revoke any active Passport.

Revocation:

- marks `passport.status = revoked`
- sets `revoked_at`
- invalidates QR/link route
- preserves private audit event
- does not delete underlying constraints or Mesa data
