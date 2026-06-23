-- Rate limiting por usuario para las Edge Functions de IA.
-- Un contador por (usuario, función, ventana de tiempo). La cuota se consume de
-- forma atómica vía RPC SECURITY DEFINER, de modo que la tabla no es accesible
-- directamente por los clientes. Ver supabase/functions/_shared/guard.ts.

create table if not exists public.ai_usage_counters (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  fn           text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (user_id, fn, window_start)
);

alter table public.ai_usage_counters enable row level security;
-- Sin políticas a propósito: el acceso es exclusivamente vía consume_ai_quota().

create or replace function public.consume_ai_quota(p_fn text, p_limit int, p_window_sec int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_sec) * p_window_sec);
  v_count  int;
begin
  if v_uid is null then
    return false; -- sin usuario autenticado, no se concede cuota
  end if;

  insert into public.ai_usage_counters (user_id, fn, window_start, count)
  values (v_uid, p_fn, v_window, 1)
  on conflict (user_id, fn, window_start)
  do update set count = public.ai_usage_counters.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_ai_quota(text, int, int) from public;
grant execute on function public.consume_ai_quota(text, int, int) to authenticated;
