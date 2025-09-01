-- Prevent cancelling completed reservations at the DB level
create or replace function public.prevent_cancel_completed()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE' then
    if OLD.status = 'completed' and NEW.status = 'cancelled' then
      raise exception 'completed_reservation_cannot_be_cancelled';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_cancel_completed on public.reservations;
create trigger trg_prevent_cancel_completed
before update on public.reservations
for each row
execute function public.prevent_cancel_completed();
