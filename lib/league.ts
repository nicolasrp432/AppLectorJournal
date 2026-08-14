/**
 * Liga competitiva semanal — lógica pura.
 *
 * QUÉ HABÍA ANTES
 * ---------------
 * La liga vivía entera dentro de `perfil.tsx` y era decorativa:
 *   - Cuatro rivales con XP constante escrito a mano (Camila 750, Carlos 620…).
 *   - Un temporizador fijo, "3d 12h", que nunca corría.
 *   - El tier salía de `profile.level`, no de competir: subir de nivel te
 *     "ascendía" de liga aunque no hubieras entrenado esa semana.
 *   - El indicador de ascenso/descenso no ascendía ni descendía a nadie.
 *
 * MODELO
 * ------
 * Ciclo semanal fijo en UTC (lunes 00:00 → domingo 23:59:59.999). Cada usuario
 * pertenece a una *cohorte* de su tier con un tope de participantes. Al cerrar
 * el ciclo, los primeros ascienden y los últimos descienden; el resto mantiene.
 *
 * El cálculo del ciclo se hace en UTC a propósito: usar la hora local haría que
 * el ciclo cerrase a horas distintas para cada usuario de la misma cohorte, y
 * dos personas compitiendo con relojes distintos es una fuente de agravios.
 */

export type LeagueTierId = 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond';

export interface LeagueTier {
  id: LeagueTierId;
  name: string;
  /** Orden ascendente: 0 = más baja. */
  rank: number;
  icon: string;
  color: string;
}

export const LEAGUE_TIERS: LeagueTier[] = [
  { id: 'bronze',  name: 'Liga Bronce',    rank: 0, icon: 'trophy',            color: '#B45309' },
  { id: 'silver',  name: 'Liga Plata',     rank: 1, icon: 'shield',            color: '#94A3B8' },
  { id: 'gold',    name: 'Liga Oro',       rank: 2, icon: 'ribbon',            color: '#EAB308' },
  { id: 'emerald', name: 'Liga Esmeralda', rank: 3, icon: 'shield-checkmark',  color: '#10B981' },
  { id: 'diamond', name: 'Liga Diamante',  rank: 4, icon: 'diamond',           color: '#06B6D4' },
];

export const FIRST_TIER: LeagueTierId = 'bronze';

/** Participantes máximos por cohorte. */
export const COHORT_SIZE = 30;

/** Cuántos ascienden y cuántos descienden al cerrar el ciclo. */
export const PROMOTE_COUNT = 5;
export const DEMOTE_COUNT  = 5;

export function getTier(id: LeagueTierId | null | undefined): LeagueTier {
  return LEAGUE_TIERS.find(t => t.id === id) ?? LEAGUE_TIERS[0];
}

export function tierByRank(rank: number): LeagueTier {
  const clamped = Math.max(0, Math.min(LEAGUE_TIERS.length - 1, rank));
  return LEAGUE_TIERS[clamped];
}

// ─── Ciclo semanal ───────────────────────────────────────────────────────────

/**
 * Inicio del ciclo (lunes 00:00:00 UTC) que contiene a `now`.
 *
 * `getUTCDay()` devuelve 0 para domingo, así que el domingo pertenece a la
 * semana que empezó *seis días antes*, no a la que empieza al día siguiente.
 */
export function cycleStart(now: Date = new Date()): Date {
  const d = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0,
  ));
  const dow = d.getUTCDay();
  const daysSinceMonday = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

/** Fin del ciclo: el instante justo antes del siguiente lunes. */
export function cycleEnd(now: Date = new Date()): Date {
  const start = cycleStart(now);
  return new Date(start.getTime() + 7 * 86_400_000 - 1);
}

/** Identificador estable del ciclo, 'YYYY-MM-DD' del lunes. Sirve de clave. */
export function cycleKey(now: Date = new Date()): string {
  return cycleStart(now).toISOString().slice(0, 10);
}

/** Milisegundos que faltan para cerrar el ciclo. */
export function msToCycleEnd(now: Date = new Date()): number {
  return Math.max(0, cycleEnd(now).getTime() - now.getTime());
}

/**
 * Cuenta atrás legible: "3d 12h", "12h 30m", "45m".
 *
 * Sustituye al literal "3d 12h" que estaba escrito a mano en la UI.
 */
export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Cerrando…';
  const totalMin = Math.floor(ms / 60_000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Zonas y resultado del ciclo ─────────────────────────────────────────────

export type LeagueZone = 'promotion' | 'safe' | 'demotion';

/**
 * Zona en la que cae una posición.
 *
 * Los recuentos se recortan al tamaño real de la cohorte: en un grupo de 6 no
 * pueden ascender 5 y descender 5 a la vez, y sin recorte todos estarían en
 * ambas zonas. Con cohortes pequeñas se prioriza que exista zona de permanencia.
 */
export function zoneForPosition(
  position: number,
  cohortSize: number,
  opts: { promote?: number; demote?: number } = {},
): LeagueZone {
  const promote = opts.promote ?? PROMOTE_COUNT;
  const demote  = opts.demote  ?? DEMOTE_COUNT;

  // Reparte como mucho un tercio de la cohorte a cada zona.
  const maxPerZone = Math.max(1, Math.floor(cohortSize / 3));
  const p = Math.min(promote, maxPerZone);
  const d = Math.min(demote,  maxPerZone);

  if (position <= p) return 'promotion';
  if (position > cohortSize - d) return 'demotion';
  return 'safe';
}

/** La liga más alta no asciende y la más baja no desciende. */
export function nextTierFor(current: LeagueTierId, zone: LeagueZone): LeagueTierId {
  const tier = getTier(current);
  if (zone === 'promotion') return tierByRank(tier.rank + 1).id;
  if (zone === 'demotion')  return tierByRank(tier.rank - 1).id;
  return tier.id;
}

export interface ZoneCopy {
  title: string;
  detail: string;
}

export function zoneCopy(zone: LeagueZone, tier: LeagueTierId): ZoneCopy {
  const t = getTier(tier);
  const isTop    = t.rank === LEAGUE_TIERS.length - 1;
  const isBottom = t.rank === 0;

  if (zone === 'promotion') {
    return isTop
      ? { title: 'Cima de la clasificación', detail: 'Ya estás en la liga más alta. Defiende el puesto.' }
      : { title: 'Zona de ascenso', detail: `Si el ciclo cerrara ahora, subirías a ${tierByRank(t.rank + 1).name}.` };
  }
  if (zone === 'demotion') {
    return isBottom
      ? { title: 'Últimos puestos', detail: 'No hay liga por debajo: no puedes descender, pero puedes remontar.' }
      : { title: 'Zona de descenso', detail: `Si el ciclo cerrara ahora, bajarías a ${tierByRank(t.rank - 1).name}.` };
  }
  return { title: 'Zona de permanencia', detail: 'Mantienes tu puesto. Suma XP para entrar en ascenso.' };
}

// ─── Clasificación ───────────────────────────────────────────────────────────

export interface LeagueMember {
  userId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
  weeklyXp: number;
}

export interface RankedMember extends LeagueMember {
  position: number;
  zone: LeagueZone;
  isUser: boolean;
}

/**
 * Ordena una cohorte y asigna posición y zona.
 *
 * El desempate es por userId y no por orden de llegada del array: con Realtime
 * las filas llegan en orden arbitrario, y sin un criterio estable dos usuarios
 * con el mismo XP se intercambiarían de puesto en cada actualización.
 */
export function rankCohort(
  members: LeagueMember[],
  currentUserId: string | null,
  tier: LeagueTierId = FIRST_TIER,
): RankedMember[] {
  const sorted = [...members].sort((a, b) => {
    if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
    return a.userId.localeCompare(b.userId);
  });

  return sorted.map((m, i) => ({
    ...m,
    position: i + 1,
    zone: zoneForPosition(i + 1, sorted.length),
    isUser: m.userId === currentUserId,
  }));
}

/** Posición del usuario, o null si no está en la cohorte. */
export function userPosition(ranked: RankedMember[]): number | null {
  const me = ranked.find(r => r.isUser);
  return me ? me.position : null;
}

/** XP que falta para alcanzar al de arriba. null si va primero o no está. */
export function xpToClimb(ranked: RankedMember[]): number | null {
  const idx = ranked.findIndex(r => r.isUser);
  if (idx <= 0) return null;
  return Math.max(0, ranked[idx - 1].weeklyXp - ranked[idx].weeklyXp + 1);
}
