# Draft: heirloom_invitation Supabase migration (gap — file does not exist)

Target: `supabase/migrations/*_heirloom_invitation.sql`

**Rule:** Routing metadata only — no recipe content (spec **48**).

---

```sql
create table if not exists public.heirloom_invitation (
  invitation_id uuid primary key default gen_random_uuid(),
  heirloom_id text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_contact_hash text not null,
  status text not null check (status in ('sent', 'accepted', 'declined', 'expired')),
  version_at_invite integer not null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index heirloom_invitation_owner_idx on public.heirloom_invitation (owner_user_id);
create index heirloom_invitation_heirloom_idx on public.heirloom_invitation (heirloom_id);
create index heirloom_invitation_hash_idx on public.heirloom_invitation (invitee_contact_hash);
```
