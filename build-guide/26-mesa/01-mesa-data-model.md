# Mesa — Data Model

## What This File Covers

The private Orchestrator SQLite schema for Mesa: Mesa records, members, constraints, active food audiences, compatibility events, potential members, invites, and contribution logs.

---

## Storage Rule

Mesa lives in the Mesa owner's Orchestrator DO SQLite.

Mesa is private by default. It is not Supabase community data. It is not Ground. It is not a public family graph.

---

## Tables

Add these tables to the Orchestrator schema when implementing Mesa:

```sql
CREATE TABLE mesa (
  id              TEXT PRIMARY KEY,
  owner_user_id   TEXT NOT NULL,
  display_name    TEXT,
  status          TEXT NOT NULL DEFAULT 'active', -- active | archived
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE mesa_member (
  id              TEXT PRIMARY KEY,
  mesa_id         TEXT NOT NULL,
  label           TEXT NOT NULL,
  role            TEXT NOT NULL, -- self | partner | child | elder | guest | caregiver | other
  age_band        TEXT,          -- child_5_7 | child_8_10 | child_11_12 | teen | adult | elder | null
  linked_user_id  TEXT,          -- nullable; another Brioela account if invited/accepted
  status          TEXT NOT NULL DEFAULT 'active', -- active | archived | pending_invite
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE mesa_constraint (
  id              TEXT PRIMARY KEY,
  mesa_id         TEXT NOT NULL,
  member_id       TEXT NOT NULL,
  constraint_type TEXT NOT NULL, -- hard_allergy | intolerance | dietary_identity | dislike | medical_watchlist | boycott
  entity_kind     TEXT NOT NULL, -- ingredient | category | brand | condition | other
  entity_value    TEXT NOT NULL,
  severity        TEXT NOT NULL, -- hard | soft
  source          TEXT NOT NULL, -- owner_stated | member_stated | imported | inferred_candidate
  confirmed_by_owner INTEGER NOT NULL DEFAULT 0,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE mesa_food_audience (
  id              TEXT PRIMARY KEY,
  mesa_id         TEXT,
  mode            TEXT NOT NULL, -- just_me | mesa | selected_members | guest_session
  member_ids_json TEXT NOT NULL,
  source          TEXT NOT NULL, -- explicit | inferred | session_default
  expires_at      INTEGER,
  created_at      INTEGER NOT NULL
);

CREATE TABLE mesa_potential_member (
  id              TEXT PRIMARY KEY,
  mesa_id         TEXT NOT NULL,
  suggested_label TEXT NOT NULL,
  role_guess      TEXT,
  evidence_json   TEXT NOT NULL,
  confidence      REAL NOT NULL,
  status          TEXT NOT NULL DEFAULT 'candidate', -- candidate | prompted | accepted | dismissed | expired
  first_seen_at   INTEGER NOT NULL,
  last_seen_at    INTEGER NOT NULL
);

CREATE TABLE mesa_invite (
  id              TEXT PRIMARY KEY,
  mesa_id         TEXT NOT NULL,
  inviter_user_id TEXT NOT NULL,
  invitee_user_id TEXT,
  invitee_contact_hash TEXT,
  role            TEXT NOT NULL, -- adult_member | caregiver | guest_contributor
  scopes_json     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | revoked | expired
  created_at      INTEGER NOT NULL,
  responded_at    INTEGER
);

CREATE TABLE mesa_contribution_event (
  id              TEXT PRIMARY KEY,
  mesa_id         TEXT NOT NULL,
  contributor_user_id TEXT,
  entity_kind     TEXT NOT NULL, -- scan | receipt | recipe | pantry_item | menu | note
  entity_id       TEXT,
  payload_json    TEXT NOT NULL,
  accepted_by_owner INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL
);
```

---

## Member Labels

Labels can be conversational and lightweight:

- "my son"
- "Amina"
- "grandma"
- "my partner"
- "the kids"

Do not require legal names. Do not require birthdays. Do not require photos.

---

## Relationship To Existing Tables

- `constraints` remains the signed-in user's personal constraints.
- `mesa_constraint` is per-member and only active when the Food Audience includes that member.
- `guest_session` remains temporary.
- recurring guest patterns can become Mesa suggestions, not automatic Mesa members.

---

## Indexes

Minimum indexes:

```sql
CREATE INDEX idx_mesa_owner ON mesa(owner_user_id, status);
CREATE INDEX idx_mesa_member_mesa ON mesa_member(mesa_id, status);
CREATE INDEX idx_mesa_constraint_member ON mesa_constraint(member_id, active);
CREATE INDEX idx_mesa_potential_status ON mesa_potential_member(mesa_id, status, confidence);
CREATE INDEX idx_mesa_invite_mesa ON mesa_invite(mesa_id, status);
```
