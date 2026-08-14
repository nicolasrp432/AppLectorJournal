-- 012_subscription_entitlements.sql
-- Formaliza la suscripción premium como estado *autoritativo del servidor* y
-- cierra el agujero que permitía a cualquier usuario auto-otorgarse premium.
--
-- CONTEXTO DEL FALLO
-- ------------------
-- 001_initial_schema.sql creó:
--     CREATE POLICY "profiles: owner update" ON profiles FOR UPDATE USING (auth.uid() = id);
-- ...sin WITH CHECK y, sobre todo, sin restringir *qué columnas* puede tocar el
-- usuario. Como Supabase concede por defecto `GRANT ALL ON profiles TO authenticated`,
-- cualquiera con la clave anon (que viaja dentro del bundle de la app) podía hacer:
--     supabase.from('profiles').update({ subscription_tier: 'premium' }).eq('id', uid)
--     supabase.from('profiles').update({ reading_lives: 5 }).eq('id', uid)
-- concediéndose premium gratis y recargando vidas a voluntad, saltándose por
-- completo los RPC de 011_reading_lives.sql.
--
-- ARREGLO
-- -------
-- Postgres no tiene RLS por columna, pero sí GRANT por columna, y PostgREST lo
-- respeta. Revocamos el UPDATE global y lo reconcedemos solo sobre las columnas
-- de perfil que el usuario legítimamente edita. Las columnas de dinero y de
-- economía (subscription_*, reading_lives*) quedan fuera: solo las escriben los
-- RPC SECURITY DEFINER y el webhook de RevenueCat (service_role).

-- --------------------------------------------------------------------------
-- 1. Columnas de suscripción (idempotentes)
--    El cliente ya las escribía vía updateProfile() pero NUNCA existieron en
--    ninguna migración: en un proyecto recreado desde cero esos writes fallaban
--    en silencio y premium solo vivía en AsyncStorage.
-- --------------------------------------------------------------------------
alter table public.profiles add column if not exists subscription_tier text not null default 'free'
  check (subscription_tier in ('free', 'premium'));
alter table public.profiles add column if not exists subscription_status text not null default 'inactive'
  check (subscription_status in ('inactive', 'active', 'cancelled', 'in_grace', 'expired'));
alter table public.profiles add column if not exists subscription_expires_at timestamptz;
-- Id de RevenueCat para conciliar el webhook con el usuario de Supabase.
alter table public.profiles add column if not exists rc_app_user_id text;

create index if not exists profiles_rc_app_user_id_idx on public.profiles (rc_app_user_id);

-- --------------------------------------------------------------------------
-- 2. Bloquear la escritura de columnas sensibles desde el cliente
-- --------------------------------------------------------------------------

-- WITH CHECK impide además mover la fila a otro id.
drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated;

-- Reconcedemos solo lo que el usuario edita de verdad desde la app.
-- Deliberadamente EXCLUIDAS: subscription_tier, subscription_status,
-- subscription_expires_at, rc_app_user_id, reading_lives, reading_lives_updated_at.
grant update (
  name,
  email,
  avatar,
  avatar_url,
  bio,
  level,
  xp,
  streak,
  last_active
) on public.profiles to authenticated;

-- --------------------------------------------------------------------------
-- 3. Fuente de verdad del entitlement
--    Una suscripción cuenta como activa si el estado lo dice Y no ha caducado.
--    Un `expires_at` en el pasado degrada automáticamente, sin necesidad de que
--    corra ningún job: antes, un 'active' obsoleto era premium para siempre.
-- --------------------------------------------------------------------------
create or replace function public.is_premium(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.subscription_tier = 'premium'
         and p.subscription_status in ('active', 'in_grace')
         and (p.subscription_expires_at is null or p.subscription_expires_at > now())
        from public.profiles p
       where p.id = p_user_id
    ),
    false
  );
$$;

-- Lectura del entitlement para el cliente: nunca confía en lo que el cliente
-- tenga cacheado, siempre pregunta al servidor.
create or replace function public.get_entitlement()
returns table (
  is_premium  boolean,
  tier        text,
  status      text,
  expires_at  timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  select public.is_premium(v_uid),
         p.subscription_tier,
         p.subscription_status,
         p.subscription_expires_at
    into is_premium, tier, status, expires_at
    from public.profiles p
   where p.id = v_uid;

  if not found then
    return;
  end if;
  return next;
end;
$$;

-- --------------------------------------------------------------------------
-- 4. Escritura del entitlement — SOLO service_role
--    La llama el webhook de RevenueCat (Edge Function con la service key).
--    `security definer` + revoke a authenticated/anon = el cliente no puede
--    invocarla ni aunque conozca el nombre.
-- --------------------------------------------------------------------------
create or replace function public.set_entitlement(
  p_user_id    uuid,
  p_tier       text,
  p_status     text,
  p_expires_at timestamptz default null,
  p_rc_user_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set subscription_tier       = p_tier,
         subscription_status     = p_status,
         subscription_expires_at = p_expires_at,
         rc_app_user_id          = coalesce(p_rc_user_id, rc_app_user_id)
   where id = p_user_id;
end;
$$;

revoke all on function public.set_entitlement(uuid, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.set_entitlement(uuid, text, text, timestamptz, text) to service_role;

grant execute on function public.is_premium(uuid)  to authenticated;
grant execute on function public.get_entitlement() to authenticated;

-- --------------------------------------------------------------------------
-- 5. Las vidas dejan de gastarse para premium en el propio servidor
--    Antes esto solo se comprobaba en el cliente (useProfileStore.isPremium()),
--    así que un cliente manipulado consumía/refundía vidas igualmente.
-- --------------------------------------------------------------------------
create or replace function public.consume_reading_life()
returns table (ok boolean, lives int, updated_at timestamptz, next_regen_at timestamptz)
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
    return;
  end if;

  -- Premium no gasta vidas: se responde "lleno" sin tocar el contador.
  if public.is_premium(v_uid) then
    ok := true; lives := 5; updated_at := now(); next_regen_at := null;
    return next;
    return;
  end if;

  select reading_lives, reading_lives_updated_at into v_lives, v_upd
    from public.profiles where id = v_uid for update;
  if not found then
    return;
  end if;

  v_regen := floor(extract(epoch from (now() - v_upd)) / (30 * 60));
  v_cur   := least(5, v_lives + greatest(0, v_regen));

  if v_cur < 1 then
    ok := false;
    lives := v_cur;
    updated_at := v_upd + (greatest(0, v_regen) * interval '30 minutes');
    next_regen_at := updated_at + interval '30 minutes';
    return next;
    return;
  end if;

  -- Al bajar desde el tope, el reloj de regeneración arranca ahora.
  if v_cur >= 5 then
    v_upd := now();
  else
    v_upd := v_upd + (greatest(0, v_regen) * interval '30 minutes');
  end if;

  v_cur := v_cur - 1;

  update public.profiles
     set reading_lives = v_cur,
         reading_lives_updated_at = v_upd
   where id = v_uid;

  ok := true;
  lives := v_cur;
  updated_at := v_upd;
  next_regen_at := v_upd + interval '30 minutes';
  return next;
end;
$$;
