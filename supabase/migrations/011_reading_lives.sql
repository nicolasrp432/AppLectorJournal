-- 011_reading_lives.sql
-- Sistema de vidas/energía para ejercicios de lectura.
-- Las vidas se consumen al iniciar una lectura y se regeneran 1 cada 30 min (máx 5).
-- Si la comprensión es >= 80% se devuelve 1 vida (premio a la calidad).
-- Toda la lógica vive en RPCs SECURITY DEFINER (atómicas, anti-abuso), clonando el
-- patrón de 009_ai_rate_limit.sql.

-- --------------------------------------------------------------------------
-- Columnas de energía de lectura en profiles (idempotentes)
-- --------------------------------------------------------------------------
alter table public.profiles add column if not exists reading_lives int not null default 5
  check (reading_lives >= 0 and reading_lives <= 5);
alter table public.profiles add column if not exists reading_lives_updated_at timestamptz not null default now();

-- Parámetros: MAX = 5 vidas, REGEN = 30 minutos por vida. La regeneración se
-- calcula de forma perezosa en cada RPC anclando `reading_lives_updated_at`.

-- --------------------------------------------------------------------------
-- Lectura sin mutar: devuelve vidas regeneradas + cuándo toca la siguiente.
-- Usada por el cliente para pintar el estado (corazones + temporizador).
-- --------------------------------------------------------------------------
create or replace function public.get_reading_lives()
returns table (lives int, updated_at timestamptz, next_regen_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_lives int;
  v_upd   timestamptz;
  v_regen int;
begin
  if v_uid is null then
    return;
  end if;

  select reading_lives, reading_lives_updated_at into v_lives, v_upd
    from public.profiles where id = v_uid;
  if not found then
    return;
  end if;

  v_regen := floor(extract(epoch from (now() - v_upd)) / (30 * 60));
  lives := least(5, v_lives + v_regen);
  if lives >= 5 then
    updated_at := now();
    next_regen_at := null;
  else
    updated_at := v_upd + (v_regen * interval '30 minutes');
    next_regen_at := updated_at + interval '30 minutes';
  end if;
  return next;
end;
$$;

-- --------------------------------------------------------------------------
-- Consume 1 vida (regenera primero). Devuelve estado; ok=false si no hay vidas.
-- --------------------------------------------------------------------------
create or replace function public.consume_reading_life()
returns table (ok boolean, lives int, next_regen_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_lives int;
  v_upd   timestamptz;
  v_regen int;
  v_cur   int;
begin
  if v_uid is null then
    ok := false; lives := 0; next_regen_at := null;
    return next; return;
  end if;

  select reading_lives, reading_lives_updated_at into v_lives, v_upd
    from public.profiles where id = v_uid for update;
  if not found then
    ok := false; lives := 0; next_regen_at := null;
    return next; return;
  end if;

  v_regen := floor(extract(epoch from (now() - v_upd)) / (30 * 60));
  v_cur := least(5, v_lives + v_regen);
  -- Ancla el reloj: si quedó lleno, el contador arranca ahora; si no, conserva el resto.
  v_upd := case when v_cur >= 5 then now() else v_upd + (v_regen * interval '30 minutes') end;

  if v_cur < 1 then
    update public.profiles
      set reading_lives = v_cur, reading_lives_updated_at = v_upd
      where id = v_uid;
    ok := false; lives := v_cur;
  else
    -- Al gastar desde lleno, el temporizador de regeneración arranca ahora.
    if v_cur >= 5 then v_upd := now(); end if;
    v_cur := v_cur - 1;
    update public.profiles
      set reading_lives = v_cur, reading_lives_updated_at = v_upd
      where id = v_uid;
    ok := true; lives := v_cur;
  end if;

  next_regen_at := case when lives >= 5 then null else v_upd + interval '30 minutes' end;
  return next;
end;
$$;

-- --------------------------------------------------------------------------
-- Devuelve 1 vida (premio por calidad >= 80%). Tope en 5. Reusable por el
-- futuro power-up "Vida extra".
-- --------------------------------------------------------------------------
create or replace function public.refund_reading_life()
returns table (lives int, next_regen_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_lives int;
  v_upd   timestamptz;
  v_regen int;
  v_cur   int;
begin
  if v_uid is null then
    lives := 0; next_regen_at := null;
    return next; return;
  end if;

  select reading_lives, reading_lives_updated_at into v_lives, v_upd
    from public.profiles where id = v_uid for update;
  if not found then
    lives := 0; next_regen_at := null;
    return next; return;
  end if;

  v_regen := floor(extract(epoch from (now() - v_upd)) / (30 * 60));
  v_cur := least(5, v_lives + v_regen);
  v_upd := case when v_cur >= 5 then now() else v_upd + (v_regen * interval '30 minutes') end;
  v_cur := least(5, v_cur + 1);

  update public.profiles
    set reading_lives = v_cur, reading_lives_updated_at = v_upd
    where id = v_uid;

  lives := v_cur;
  next_regen_at := case when lives >= 5 then null else v_upd + interval '30 minutes' end;
  return next;
end;
$$;

revoke all on function public.get_reading_lives() from public;
revoke all on function public.consume_reading_life() from public;
revoke all on function public.refund_reading_life() from public;
grant execute on function public.get_reading_lives() to authenticated;
grant execute on function public.consume_reading_life() to authenticated;
grant execute on function public.refund_reading_life() to authenticated;

-- --------------------------------------------------------------------------
-- Desacoplar el límite de 3 sesiones/día de la lectura.
-- La familia lectura (reading / freereading / comprehension; reading_test se
-- guarda como 'reading') pasa a regirse por vidas, así que NO debe contar
-- contra el cupo diario del resto de ejercicios.
-- NOTA: el cuerpo original de get_user_daily_session_count no estaba en el repo
-- (creado vía dashboard). Esta versión conserva la firma que ya llama el store
-- y solo añade el filtro de lectura; pasa a ser la autoritativa.
-- --------------------------------------------------------------------------
create or replace function public.get_user_daily_session_count(p_user_id uuid, p_start_of_day timestamptz)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
    from public.sessions
    where user_id = p_user_id
      and finished_at >= p_start_of_day
      and exercise_id not in ('reading', 'freereading', 'comprehension');
$$;

revoke all on function public.get_user_daily_session_count(uuid, timestamptz) from public;
grant execute on function public.get_user_daily_session_count(uuid, timestamptz) to authenticated;
