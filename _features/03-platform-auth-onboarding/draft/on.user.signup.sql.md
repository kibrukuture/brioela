# Draft: on.user.signup.sql

Target: `shared/drizzle/migrations/0002_on_user_signup.sql`

```
-- Drop existing trigger and function before recreating to make this migration idempotent
-- (safe to run multiple times without errors)
DROP TRIGGER IF EXISTS on_new_user ON auth.users;
DROP FUNCTION IF EXISTS brioela.on_new_user();

-- Mirror every new Supabase auth user into brioela.users
-- Fires automatically after Supabase creates a row in auth.users on sign-up
-- security definer: runs with the privileges of the function owner (postgres),
-- not the calling role, so it can write to brioela.users regardless of RLS
create or replace function brioela.on_new_user()
returns trigger as $$
begin
  insert into brioela.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Attach the function to auth.users as an AFTER INSERT trigger
-- Runs once per row, so each new auth user gets exactly one brioela.users row
create trigger on_new_user
after insert on auth.users for each row
execute function brioela.on_new_user();
```
