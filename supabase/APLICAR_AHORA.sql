-- ============================================================================
--  APLICAR AHORA — LectorApp
-- ============================================================================
--  Copia TODO este archivo y pegalo en:
--      Supabase Dashboard -> SQL Editor -> New query -> Run
--
--  Es la union de las migraciones 012 y 013, en orden. Todo es idempotente:
--  puedes ejecutarlo mas de una vez sin romper nada.
--
--  QUE HACE
--  --------
--  012  Cierra el agujero por el que cualquier usuario podia concederse premium
--       y rellenarse las vidas usando la clave anon. Crea las columnas de
--       suscripcion (y avatar_url), que nunca existieron pese a que el cliente
--       las escribia desde el primer dia.
--  013  Crea la liga competitiva semanal real y la publica en Realtime.
--
--  DESPUES DE EJECUTAR ESTO faltan 3 pasos que NO son SQL:
--  -------------------------------------------------------
--  1) Desplegar el webhook de RevenueCat sin verificacion de JWT (RevenueCat no
--     envia un JWT de Supabase, asi que con la verificacion puesta lo rechaza):
--         supabase functions deploy revenuecat-webhook --no-verify-jwt
--
--  2) Fijar los secretos:
--         supabase secrets set REVENUECAT_WEBHOOK_SECRET="<cadena larga aleatoria>"
--     y en tu .env / EAS:
--         EXPO_PUBLIC_REVENUECAT_IOS_KEY=<clave iOS de RevenueCat>
--         EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=<clave Android de RevenueCat>
--         EXPO_PUBLIC_REVENUECAT_ENTITLEMENT=<id del entitlement, p.ej. premium>
--
--  3) En RevenueCat -> Project Settings -> Integrations -> Webhooks:
--         URL            https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook
--         Authorization  el MISMO valor que REVENUECAT_WEBHOOK_SECRET
--
--  COMPROBACION
--  ------------
--    select public.is_premium();           -- false en una cuenta gratuita
--    select * from public.get_entitlement();
--    select * from public.join_league();   -- te mete en la cohorte del ciclo actual
--    select * from public.get_league_standings();
--
--  Si el bloque de Realtime avisa de que falta la publicacion supabase_realtime,
--  activa Realtime en el panel de Supabase y vuelve a ejecutar ese ultimo bloque.
--
--  Hasta que no hagas los 3 pasos de arriba una compra NO concedera premium.
--  Es intencional: preferible no conceder a nadie que concederselo a cualquiera.
-- ============================================================================


-- ==========================================================================
--  BLOQUE 1 de 2 — 012_subscription_entitlements.sql
-- ==========================================================================

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

-- `avatar_url` tampoco la creaba ninguna migración, aunque `uploadAvatar()` la
-- escribe desde el primer día: mismo fallo silencioso que las columnas de
-- suscripción. Se declara aquí porque el GRANT de más abajo la nombra, y un
-- GRANT sobre una columna inexistente aborta el script entero.
alter table public.profiles add column if not exists avatar_url text;

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


-- ==========================================================================
--  BLOQUE 2 de 2 — 013_leagues.sql
-- ==========================================================================

-- 013_leagues.sql
-- Liga competitiva semanal real.
--
-- QUÉ SUSTITUYE
-- -------------
-- La liga existía solo como maqueta dentro de `perfil.tsx`: cuatro rivales con
-- XP escrito a mano, un temporizador fijo "3d 12h" y un tier derivado de
-- `profile.level` en lugar de derivado de competir. Nadie ascendía ni descendía.
--
-- MODELO
-- ------
-- Ciclo semanal en UTC (lunes 00:00 → domingo 23:59:59.999). Cada usuario entra
-- en una *cohorte* de su tier, con tope de 30. Al empezar un ciclo nuevo se
-- resuelve el anterior: los 5 primeros ascienden, los 5 últimos descienden.
--
-- La resolución es **perezosa**: ocurre la primera vez que el usuario pide su
-- liga en el ciclo nuevo, mirando su posición final en el ciclo anterior. Así no
-- hace falta un cron ni un job programado, que serían un punto de fallo extra
-- para algo que solo necesita ser correcto en el momento de consultarlo.
--
-- SEGURIDAD
-- ---------
-- Misma lección que 012: el cliente NO escribe nada. `weekly_xp` solo se mueve
-- por RPC SECURITY DEFINER. Si el usuario pudiera actualizar su propia fila, la
-- clasificación sería tan decorativa como la maqueta que sustituye.

-- --------------------------------------------------------------------------
-- 1. Tablas
-- --------------------------------------------------------------------------

create table if not exists public.league_cohorts (
  id         uuid primary key default gen_random_uuid(),
  tier       text not null check (tier in ('bronze','silver','gold','emerald','diamond')),
  -- Lunes del ciclo en formato 'YYYY-MM-DD'; espeja lib/league.ts cycleKey().
  cycle_key  date not null,
  created_at timestamptz not null default now()
);

create index if not exists league_cohorts_lookup_idx
  on public.league_cohorts (cycle_key, tier);

create table if not exists public.league_members (
  cohort_id  uuid not null references public.league_cohorts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  -- Copia del ciclo de la cohorte. Se denormaliza porque Postgres no admite
  -- subconsultas en expresiones de índice y necesitamos un índice único sobre
  -- (user_id, ciclo) para impedir que alguien acabe en dos cohortes a la vez.
  cycle_key  date not null,
  -- Nombre y avatar se copian al entrar en vez de unir contra `profiles`.
  -- La política de `profiles` es "owner read": unir obligaría a abrirla a
  -- terceros, filtrando el email y toda la fila. Un marcador solo necesita
  -- nombre y avatar, así que se denormalizan.
  display_name text not null default '',
  avatar       text not null default 'focus',
  avatar_url   text,
  weekly_xp    int  not null default 0 check (weekly_xp >= 0),
  joined_at    timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

-- Un usuario solo puede estar en una cohorte por ciclo. Sin esto, dos llamadas
-- concurrentes a join_league() podrían meterlo en dos cohortes distintas y
-- aparecería dos veces en la clasificación.
create unique index if not exists league_members_one_per_cycle_idx
  on public.league_members (user_id, cycle_key);

create index if not exists league_members_cohort_idx
  on public.league_members (cohort_id, weekly_xp desc);

-- --------------------------------------------------------------------------
-- 2. RLS: se lee la cohorte propia, no se escribe nada
-- --------------------------------------------------------------------------

alter table public.league_cohorts enable row level security;
alter table public.league_members enable row level security;

drop policy if exists "league_members: read own cohort" on public.league_members;
create policy "league_members: read own cohort"
  on public.league_members for select
  using (
    cohort_id in (
      select lm.cohort_id from public.league_members lm where lm.user_id = auth.uid()
    )
  );

drop policy if exists "league_cohorts: read own" on public.league_cohorts;
create policy "league_cohorts: read own"
  on public.league_cohorts for select
  using (
    id in (
      select lm.cohort_id from public.league_members lm where lm.user_id = auth.uid()
    )
  );

-- Ninguna política de INSERT/UPDATE/DELETE: todo pasa por los RPC de abajo.
revoke insert, update, delete on public.league_members from authenticated, anon;
revoke insert, update, delete on public.league_cohorts from authenticated, anon;

-- --------------------------------------------------------------------------
-- 3. Resolución del ciclo anterior (ascenso / descenso)
-- --------------------------------------------------------------------------

/**
 * Tier que le corresponde al usuario en el ciclo actual, resolviendo el
 * resultado del ciclo anterior. Si no jugó antes, empieza en bronce.
 *
 * Las zonas se recortan a un tercio de la cohorte, igual que zoneForPosition()
 * en lib/league.ts: en un grupo de 6 no pueden ascender 5 y descender 5.
 */
create or replace function public.resolve_league_tier(p_user_id uuid, p_cycle_key date)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_prev_cohort uuid;
  v_prev_tier   text;
  v_size        int;
  v_position    int;
  v_band        int;
  v_ranks       text[] := array['bronze','silver','gold','emerald','diamond'];
  v_idx         int;
begin
  -- Última cohorte del usuario anterior al ciclo pedido.
  select lm.cohort_id, c.tier
    into v_prev_cohort, v_prev_tier
    from public.league_members lm
    join public.league_cohorts c on c.id = lm.cohort_id
   where lm.user_id = p_user_id
     and lm.cycle_key < p_cycle_key
   order by lm.cycle_key desc
   limit 1;

  if v_prev_cohort is null then
    return 'bronze';
  end if;

  select count(*) into v_size
    from public.league_members where cohort_id = v_prev_cohort;

  -- Posición final: mismo desempate estable que rankCohort() en el cliente.
  select count(*) + 1 into v_position
    from public.league_members me
    join public.league_members other on other.cohort_id = me.cohort_id
   where me.user_id = p_user_id
     and me.cohort_id = v_prev_cohort
     and (other.weekly_xp > me.weekly_xp
          or (other.weekly_xp = me.weekly_xp and other.user_id < me.user_id));

  v_band := greatest(1, least(5, v_size / 3));
  v_idx  := array_position(v_ranks, v_prev_tier);

  if v_position <= v_band then
    v_idx := least(array_length(v_ranks, 1), v_idx + 1);
  elsif v_position > v_size - v_band then
    v_idx := greatest(1, v_idx - 1);
  end if;

  return v_ranks[v_idx];
end;
$$;

-- --------------------------------------------------------------------------
-- 4. Entrar en la liga del ciclo actual
-- --------------------------------------------------------------------------

create or replace function public.join_league()
returns table (
  cohort_id uuid,
  tier      text,
  cycle_key date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_key    date;
  v_tier   text;
  v_cohort uuid;
  v_name   text;
  v_avatar text;
  v_url    text;
begin
  if v_uid is null then
    return;
  end if;

  -- Lunes de la semana en curso, en UTC. date_trunc('week') de Postgres ya
  -- empieza en lunes, que es justo lo que espera lib/league.ts.
  v_key := (date_trunc('week', now() at time zone 'UTC'))::date;

  select lm.cohort_id, c.tier into v_cohort, v_tier
    from public.league_members lm
    join public.league_cohorts c on c.id = lm.cohort_id
   where lm.user_id = v_uid and c.cycle_key = v_key;

  if v_cohort is not null then
    cohort_id := v_cohort; tier := v_tier; cycle_key := v_key;
    return next;
    return;
  end if;

  v_tier := public.resolve_league_tier(v_uid, v_key);

  select name, avatar::text, avatar_url into v_name, v_avatar, v_url
    from public.profiles where id = v_uid;

  -- Primera cohorte del tier con hueco. El tope de 30 es blando: dos usuarios
  -- entrando a la vez pueden dejarla en 31. Serializarlo de verdad exigiría
  -- bloquear la cohorte en cada alta, y un participante de más no rompe nada
  -- (las zonas se calculan sobre el tamaño real).
  select c.id into v_cohort
    from public.league_cohorts c
   where c.cycle_key = v_key
     and c.tier = v_tier
     and (select count(*) from public.league_members m where m.cohort_id = c.id) < 30
   order by c.created_at
   limit 1;

  if v_cohort is null then
    insert into public.league_cohorts (tier, cycle_key)
      values (v_tier, v_key)
      returning id into v_cohort;
  end if;

  insert into public.league_members (cohort_id, user_id, cycle_key, display_name, avatar, avatar_url)
    values (v_cohort, v_uid, v_key, coalesce(v_name, ''), coalesce(v_avatar, 'focus'), v_url)
    on conflict (user_id, cycle_key) do nothing;

  -- Si otra petición concurrente ganó la carrera, nos quedamos con su cohorte.
  select lm.cohort_id into v_cohort
    from public.league_members lm
   where lm.user_id = v_uid and lm.cycle_key = v_key;

  cohort_id := v_cohort; tier := v_tier; cycle_key := v_key;
  return next;
end;
$$;

-- --------------------------------------------------------------------------
-- 5. Sumar XP semanal
--    Se llama desde el mismo sitio que concede XP. Es la ÚNICA vía de escritura.
-- --------------------------------------------------------------------------

create or replace function public.add_league_xp(p_amount int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_key date;
  v_new int;
begin
  if v_uid is null or p_amount is null or p_amount <= 0 then
    return 0;
  end if;

  -- Tope por llamada: una sesión no reparte miles de XP, así que un valor
  -- desmedido solo puede venir de un cliente manipulado.
  if p_amount > 1000 then
    p_amount := 1000;
  end if;

  v_key := (date_trunc('week', now() at time zone 'UTC'))::date;

  update public.league_members lm
     set weekly_xp = lm.weekly_xp + p_amount
   where lm.user_id = v_uid
     and lm.cycle_key = v_key
  returning lm.weekly_xp into v_new;

  return coalesce(v_new, 0);
end;
$$;

-- --------------------------------------------------------------------------
-- 6. Clasificación de la cohorte propia
-- --------------------------------------------------------------------------

create or replace function public.get_league_standings()
returns table (
  user_id      uuid,
  display_name text,
  avatar       text,
  avatar_url   text,
  weekly_xp    int,
  tier         text,
  cohort_id    uuid,
  cycle_key    date
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_key    date;
  v_cohort uuid;
begin
  if v_uid is null then
    return;
  end if;

  v_key := (date_trunc('week', now() at time zone 'UTC'))::date;

  select lm.cohort_id into v_cohort
    from public.league_members lm
   where lm.user_id = v_uid and lm.cycle_key = v_key;

  if v_cohort is null then
    return;
  end if;

  return query
    select lm.user_id, lm.display_name, lm.avatar, lm.avatar_url, lm.weekly_xp,
           c.tier, c.id, c.cycle_key
      from public.league_members lm
      join public.league_cohorts c on c.id = lm.cohort_id
     where lm.cohort_id = v_cohort
     order by lm.weekly_xp desc, lm.user_id asc;
end;
$$;

-- --------------------------------------------------------------------------
-- 7. Permisos y Realtime
-- --------------------------------------------------------------------------

grant execute on function public.join_league()            to authenticated;
grant execute on function public.add_league_xp(int)       to authenticated;
grant execute on function public.get_league_standings()   to authenticated;
grant execute on function public.resolve_league_tier(uuid, date) to authenticated;

-- Publica la tabla para que el cliente reciba los cambios de XP en vivo.
-- La RLS sigue aplicándose a Realtime: cada usuario solo recibe eventos de las
-- filas de su propia cohorte.
do $$
begin
  -- Se comprueba primero que la publicación exista: en un proyecto donde
  -- Realtime nunca se activó no está creada, y un ALTER PUBLICATION sobre algo
  -- inexistente abortaría el script entero.
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'La publicación supabase_realtime no existe: activa Realtime en el panel de Supabase y vuelve a ejecutar este bloque.';
  elsif not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'league_members'
  ) then
    alter publication supabase_realtime add table public.league_members;
  end if;
end $$;

-- Realtime necesita la fila completa en los UPDATE para poder filtrar por RLS.
alter table public.league_members replica identity full;


-- ============================================================================
--  FIN. Si no hubo errores, el SQL ya esta aplicado por completo.
-- ============================================================================
