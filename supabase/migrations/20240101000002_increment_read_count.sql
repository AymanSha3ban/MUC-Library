-- Function to increment read count safely
create or replace function increment_read_count(book_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.books
  set read_count = coalesce(read_count, 0) + 1
  where id = book_id;
end;
$$;
