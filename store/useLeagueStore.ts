import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  LeagueMember, LeagueTierId, RankedMember,
  rankCohort, userPosition, xpToClimb, FIRST_TIER,
} from '../lib/league';

/**
 * Estado de la liga competitiva, con clasificación en vivo.
 *
 * Es la primera suscripción de Supabase Realtime del proyecto: hasta ahora no
 * había ninguna y todo se refrescaba con fetch manual. Una clasificación que
 * solo se actualiza al recargar la pantalla no es una clasificación, es una
 * foto — y el sentido de competir es ver moverse a los demás.
 *
 * No se persiste en AsyncStorage a propósito: son datos de otros usuarios que
 * cambian por minuto, y una versión guardada solo serviría para mostrar
 * posiciones falsas al abrir la app.
 */

interface LeagueState {
  tier: LeagueTierId;
  cohortId: string | null;
  cycleKey: string | null;
  members: LeagueMember[];
  isLoading: boolean;
  /** true mientras el canal de Realtime está conectado. */
  isLive: boolean;
  error: string | null;

  /** Entra en la cohorte del ciclo actual y carga la clasificación. */
  join: () => Promise<void>;
  /** Relee la clasificación sin volver a entrar. */
  refresh: () => Promise<void>;
  /** Suscribe a los cambios de XP de la cohorte. Devuelve la función de baja. */
  subscribeLive: () => () => void;
  /** Suma XP semanal en el servidor tras terminar una sesión. */
  addXp: (amount: number) => Promise<void>;
  reset: () => void;

  // Selectores derivados
  ranked: (userId: string | null) => RankedMember[];
  position: (userId: string | null) => number | null;
  xpGap: (userId: string | null) => number | null;
}

interface StandingRow {
  user_id: string;
  display_name: string;
  avatar: string;
  avatar_url: string | null;
  weekly_xp: number;
  tier: string;
  cohort_id: string;
  cycle_key: string;
}

function toMember(row: StandingRow): LeagueMember {
  return {
    userId: row.user_id,
    name: row.display_name || 'Lector',
    avatar: row.avatar || 'focus',
    avatarUrl: row.avatar_url,
    weeklyXp: Number(row.weekly_xp) || 0,
  };
}

/** Canal activo. Fuera del store: es un recurso, no estado renderizable. */
let channel: ReturnType<typeof supabase.channel> | null = null;

export const useLeagueStore = create<LeagueState>()((set, get) => ({
  tier: FIRST_TIER,
  cohortId: null,
  cycleKey: null,
  members: [],
  isLoading: false,
  isLive: false,
  error: null,

  join: async () => {
    set({ isLoading: true, error: null });
    try {
      // join_league() resuelve el ciclo anterior (ascenso/descenso) de forma
      // perezosa, así que llamarla es lo que materializa la promoción.
      const { error: joinErr } = await supabase.rpc('join_league');
      if (joinErr) throw joinErr;
      await get().refresh();
    } catch (e) {
      console.warn('[LeagueStore] No se pudo entrar en la liga:', e);
      set({ error: 'No se pudo cargar la liga' });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    try {
      const { data, error } = await supabase.rpc('get_league_standings');
      if (error) throw error;

      const rows = (data ?? []) as StandingRow[];
      if (rows.length === 0) {
        set({ members: [], cohortId: null });
        return;
      }

      set({
        members: rows.map(toMember),
        tier: (rows[0].tier as LeagueTierId) ?? FIRST_TIER,
        cohortId: rows[0].cohort_id,
        cycleKey: rows[0].cycle_key,
        error: null,
      });
    } catch (e) {
      console.warn('[LeagueStore] Error leyendo la clasificación:', e);
      set({ error: 'No se pudo cargar la clasificación' });
    }
  },

  subscribeLive: () => {
    const { cohortId } = get();
    if (!cohortId) return () => {};

    // Un canal a la vez: al cambiar de cohorte (ciclo nuevo) hay que soltar el
    // anterior o se acumularían suscripciones muertas recibiendo eventos.
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }

    channel = supabase
      .channel(`league:${cohortId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_members',
          filter: `cohort_id=eq.${cohortId}`,
        },
        payload => {
          // Se aplica el cambio en local en vez de re-consultar: el evento ya
          // trae la fila (replica identity full) y una consulta por cada XP
          // ajeno multiplicaría el tráfico por el tamaño de la cohorte.
          const row = payload.new as StandingRow | undefined;
          if (!row?.user_id) return;

          set(state => {
            const next = [...state.members];
            const i = next.findIndex(m => m.userId === row.user_id);
            if (i >= 0) next[i] = { ...next[i], weeklyXp: Number(row.weekly_xp) || 0 };
            else next.push(toMember(row));
            return { members: next };
          });
        },
      )
      .subscribe(status => {
        set({ isLive: status === 'SUBSCRIBED' });
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      set({ isLive: false });
    };
  },

  addXp: async (amount: number) => {
    if (!amount || amount <= 0) return;
    try {
      const { error } = await supabase.rpc('add_league_xp', { p_amount: Math.round(amount) });
      if (error) throw error;
      // No se actualiza el estado local: el evento de Realtime devuelve el valor
      // autoritativo del servidor y evita que la UI y la base de datos discrepen.
    } catch (e) {
      console.warn('[LeagueStore] No se pudo sumar XP de liga:', e);
    }
  },

  reset: () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    set({
      tier: FIRST_TIER, cohortId: null, cycleKey: null,
      members: [], isLoading: false, isLive: false, error: null,
    });
  },

  ranked: (userId: string | null) => rankCohort(get().members, userId, get().tier),
  position: (userId: string | null) => userPosition(get().ranked(userId)),
  xpGap: (userId: string | null) => xpToClimb(get().ranked(userId)),
}));
