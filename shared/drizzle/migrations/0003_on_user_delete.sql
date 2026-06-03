-- Drop existing trigger and function before recreating to make this migration idempotent
-- (safe to run multiple times without errors)
DROP TRIGGER IF EXISTS on_deleted_user ON auth.users;
DROP FUNCTION IF EXISTS brioela.on_deleted_user();

-- Remove the brioela.users row whenever a Supabase auth user is deleted
-- Fires automatically after Supabase deletes a row from auth.users
-- security definer: runs with the privileges of the function owner (postgres),
-- not the calling role, so it can delete from brioela.users regardless of RLS
create or replace function brioela.on_deleted_user()
returns trigger as $$
begin
  -- auth.users.id is uuid, brioela.users.id is text — cast required
  delete from brioela.users where id = old.id::text;
  return old;
end;
$$ language plpgsql security definer;

-- Attach the function to auth.users as an AFTER DELETE trigger
-- Runs once per row, keeping brioela.users in sync with auth.users deletions
create trigger on_deleted_user
after delete on auth.users
for each row
execute function brioela.on_deleted_user();
