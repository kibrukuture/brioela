 

DROP TRIGGER IF EXISTS on_deleted_user ON auth.users;
DROP FUNCTION IF EXISTS schnl.handle_deleted_user();

create or replace function schnl.handle_deleted_user()
returns trigger as $$
begin
  -- Convert the UUID to String for the delete operation
  delete from schnl.user where id = old.id::text;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_deleted_user
after delete on auth.users
for each row
execute procedure schnl.handle_deleted_user();

