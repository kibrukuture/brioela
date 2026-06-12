# Draft: heirloom_succession Supabase migration (gap — file does not exist)

Target: `supabase/migrations/*_heirloom_succession.sql`

---

```sql
create table if not exists public.heirloom_succession (
  heirloom_id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  successor_user_id uuid not null references auth.users(id) on delete cascade,
  designated_at timestamptz not null default now(),
  executed_at timestamptz
);

create index heirloom_succession_owner_idx on public.heirloom_succession (owner_user_id);
create index heirloom_succession_successor_idx on public.heirloom_succession (successor_user_id);
```
