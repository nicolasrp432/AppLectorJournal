-- ============================================================================
--  VERIFICAR — comprueba que 012 y 013 se aplicaron bien
-- ============================================================================
--  Pega este archivo en Supabase Dashboard -> SQL Editor -> Run.
--  Es de SOLO LECTURA: no modifica nada.
--
--  Devuelve una fila por comprobacion con estado OK o FALLO, los FALLO primero.
--  Las cuatro marcadas [CRITICO] son las que cierran el agujero por el que
--  cualquier usuario podia concederse premium y rellenarse las vidas.
--
--  Todas las comprobaciones estan escritas para NO lanzar error si al objeto le
--  falta algo: se apoyan en to_regclass / to_regprocedure y en subconsultas
--  guardadas, porque un script de verificacion que revienta cuando las cosas
--  estan rotas es inutil justo cuando hace falta.
-- ============================================================================

with checks as (

  -- ── Columnas que el cliente escribia pero no existian ────────────────────
  select 1 as ord,
         'Columnas de suscripcion en profiles' as comprobacion,
         (count(*) = 4) as ok,
         coalesce(string_agg(column_name, ', ' order by column_name),
                  'no se encontro ninguna') as detalle
    from information_schema.columns
   where table_schema = 'public' and table_name = 'profiles'
     and column_name in ('subscription_tier','subscription_status',
                         'subscription_expires_at','rc_app_user_id')

  union all
  select 2, 'Columna avatar_url en profiles',
         exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='profiles'
                    and column_name='avatar_url'),
         'la escribe uploadAvatar() desde el primer dia'

  -- ── [CRITICO] El cliente ya NO puede tocar dinero ni economia ────────────
  -- La columna debe existir Y no tener UPDATE para authenticated. Si la columna
  -- faltara, coalesce deja el check en FALLO en vez de dar un falso OK.
  union all
  select 3, '[CRITICO] authenticated NO puede escribir subscription_tier',
         coalesce((
           select not has_column_privilege('authenticated','public.profiles','subscription_tier','UPDATE')
            where exists (select 1 from information_schema.columns
                           where table_schema='public' and table_name='profiles'
                             and column_name='subscription_tier')
         ), false),
         'si sale FALLO, cualquier usuario puede concederse premium'

  union all
  select 4, '[CRITICO] authenticated NO puede escribir subscription_status',
         coalesce((
           select not has_column_privilege('authenticated','public.profiles','subscription_status','UPDATE')
            where exists (select 1 from information_schema.columns
                           where table_schema='public' and table_name='profiles'
                             and column_name='subscription_status')
         ), false),
         'la otra mitad del entitlement'

  union all
  select 5, '[CRITICO] authenticated NO puede escribir reading_lives',
         coalesce((
           select not has_column_privilege('authenticated','public.profiles','reading_lives','UPDATE')
            where exists (select 1 from information_schema.columns
                           where table_schema='public' and table_name='profiles'
                             and column_name='reading_lives')
         ), false),
         'si sale FALLO, cualquier usuario se rellena las vidas'

  union all
  select 6, '[CRITICO] set_entitlement NO ejecutable por authenticated',
         coalesce((
           select not has_function_privilege('authenticated', p.oid, 'EXECUTE')
             from pg_proc p
            where p.oid = to_regprocedure('public.set_entitlement(uuid,text,text,timestamptz,text)')
         ), false),
         'solo la debe poder llamar el webhook con service_role'

  -- ── Lo que el cliente SI debe poder seguir escribiendo ───────────────────
  union all
  select 7, 'authenticated SI puede escribir su perfil (nombre/avatar/xp)',
         coalesce((
           select has_column_privilege('authenticated','public.profiles','name','UPDATE')
              and has_column_privilege('authenticated','public.profiles','avatar_url','UPDATE')
              and has_column_privilege('authenticated','public.profiles','xp','UPDATE')
            where exists (select 1 from information_schema.columns
                           where table_schema='public' and table_name='profiles'
                             and column_name='avatar_url')
         ), false),
         'si sale FALLO, guardar el perfil dejaria de funcionar'

  -- ── Funciones ────────────────────────────────────────────────────────────
  union all
  select 8, 'Funciones de entitlement y liga creadas (7)',
         (count(*) = 7),
         coalesce(string_agg(p.proname, ', ' order by p.proname), 'ninguna')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('is_premium','get_entitlement','set_entitlement',
                       'join_league','add_league_xp','get_league_standings',
                       'resolve_league_tier')

  union all
  select 9, 'consume_reading_life comprueba premium en el servidor',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                  where n.nspname='public' and p.proname='consume_reading_life'
                    and pg_get_functiondef(p.oid) like '%is_premium%'),
         'antes solo se comprobaba en el cliente'

  -- ── Tablas de liga ───────────────────────────────────────────────────────
  union all
  select 10, 'Tablas de liga creadas con RLS activa',
         (count(*) = 2 and coalesce(bool_and(c.relrowsecurity), false)),
         coalesce(string_agg(c.relname, ', ' order by c.relname), 'ninguna')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('league_cohorts','league_members')

  union all
  select 11, 'Indice unico (user_id, cycle_key)',
         exists (select 1 from pg_indexes
                  where schemaname='public' and tablename='league_members'
                    and indexname='league_members_one_per_cycle_idx'),
         'impide acabar en dos cohortes del mismo ciclo'

  union all
  select 12, '[CRITICO] authenticated NO puede escribir league_members',
         coalesce((
           select not has_table_privilege('authenticated', c.oid, 'UPDATE')
              and not has_table_privilege('authenticated', c.oid, 'INSERT')
             from pg_class c
            where c.oid = to_regclass('public.league_members')
         ), false),
         'si sale FALLO, la clasificacion es manipulable'

  -- ── Realtime ─────────────────────────────────────────────────────────────
  union all
  select 13, 'league_members publicada en Realtime',
         exists (select 1 from pg_publication_tables
                  where pubname='supabase_realtime' and schemaname='public'
                    and tablename='league_members'),
         'sin esto la clasificacion no se actualiza en vivo'

  union all
  select 14, 'replica identity FULL en league_members',
         coalesce((
           select c.relreplident = 'f' from pg_class c
            where c.oid = to_regclass('public.league_members')
         ), false),
         'Realtime la necesita para filtrar los UPDATE por RLS'
)
select
  case when ok then 'OK' else '>>> FALLO' end as estado,
  comprobacion,
  detalle
from checks
order by ok, ord;

-- ============================================================================
--  Si las 14 filas dicen OK, el SQL esta aplicado por completo.
--
--  Prueba funcional (con una sesion de usuario real, no como postgres, porque
--  estas funciones dependen de auth.uid() y como postgres devuelve NULL):
--     select * from public.join_league();
--     select * from public.get_league_standings();
--     select public.is_premium();      -- false en una cuenta gratuita
-- ============================================================================
