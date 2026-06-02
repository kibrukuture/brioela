DROP TRIGGER IF EXISTS on_new_user ON auth.users;
DROP FUNCTION IF EXISTS schnl.handle_new_user();

create or replace function schnl.handle_new_user()
returns trigger as $$
begin
  insert into schnl.user (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_user
after insert on auth.users for each row
execute procedure schnl.handle_new_user ();



 

