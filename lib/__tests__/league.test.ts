import {
  LEAGUE_TIERS, getTier, tierByRank,
  cycleStart, cycleEnd, cycleKey, msToCycleEnd, formatTimeLeft,
  zoneForPosition, nextTierFor, zoneCopy,
  rankCohort, userPosition, xpToClimb,
  COHORT_SIZE,
} from '../league';

describe('tiers', () => {
  it('cae en la liga más baja ante un id desconocido', () => {
    expect(getTier(null).id).toBe('bronze');
    expect(getTier('inexistente' as never).id).toBe('bronze');
  });

  it('acota el rango en lugar de devolver undefined', () => {
    expect(tierByRank(-5).id).toBe('bronze');
    expect(tierByRank(99).id).toBe('diamond');
  });

  it('mantiene los rangos consecutivos y sin huecos', () => {
    LEAGUE_TIERS.forEach((t, i) => expect(t.rank).toBe(i));
  });
});

describe('ciclo semanal', () => {
  it('empieza el lunes a medianoche UTC', () => {
    // Miércoles 2026-08-12.
    const start = cycleStart(new Date('2026-08-12T15:30:00Z'));
    expect(start.toISOString()).toBe('2026-08-10T00:00:00.000Z');
    expect(start.getUTCDay()).toBe(1);
  });

  // getUTCDay() da 0 el domingo: sin corregirlo, el domingo saltaría al lunes
  // siguiente y cerraría el ciclo un día antes de tiempo.
  it('cuenta el domingo dentro de la semana que ya empezó', () => {
    const start = cycleStart(new Date('2026-08-16T23:00:00Z'));
    expect(start.toISOString()).toBe('2026-08-10T00:00:00.000Z');
  });

  it('el lunes a las 00:00 pertenece a su propio ciclo', () => {
    const start = cycleStart(new Date('2026-08-10T00:00:00Z'));
    expect(start.toISOString()).toBe('2026-08-10T00:00:00.000Z');
  });

  it('termina justo antes del lunes siguiente', () => {
    const end = cycleEnd(new Date('2026-08-12T15:30:00Z'));
    expect(end.toISOString()).toBe('2026-08-16T23:59:59.999Z');
  });

  it('da la misma clave para cualquier momento de la semana', () => {
    expect(cycleKey(new Date('2026-08-10T00:00:00Z')))
      .toBe(cycleKey(new Date('2026-08-16T23:59:00Z')));
  });

  it('da claves distintas en semanas distintas', () => {
    expect(cycleKey(new Date('2026-08-16T23:59:00Z')))
      .not.toBe(cycleKey(new Date('2026-08-17T00:01:00Z')));
  });

  it('nunca devuelve un tiempo restante negativo', () => {
    expect(msToCycleEnd(new Date('2026-08-16T23:59:59.999Z'))).toBeGreaterThanOrEqual(0);
  });
});

describe('formatTimeLeft', () => {
  it('usa días y horas cuando queda más de un día', () => {
    expect(formatTimeLeft(3 * 86_400_000 + 12 * 3_600_000)).toBe('3d 12h');
  });

  it('pasa a horas y minutos por debajo de un día', () => {
    expect(formatTimeLeft(12 * 3_600_000 + 30 * 60_000)).toBe('12h 30m');
  });

  it('deja solo minutos en la última hora', () => {
    expect(formatTimeLeft(45 * 60_000)).toBe('45m');
  });

  it('avisa del cierre en lugar de mostrar un negativo', () => {
    expect(formatTimeLeft(0)).toBe('Cerrando…');
    expect(formatTimeLeft(-1000)).toBe('Cerrando…');
  });
});

describe('zoneForPosition', () => {
  it('reparte ascenso, permanencia y descenso en una cohorte llena', () => {
    expect(zoneForPosition(1, COHORT_SIZE)).toBe('promotion');
    expect(zoneForPosition(5, COHORT_SIZE)).toBe('promotion');
    expect(zoneForPosition(6, COHORT_SIZE)).toBe('safe');
    expect(zoneForPosition(26, COHORT_SIZE)).toBe('demotion');
    expect(zoneForPosition(30, COHORT_SIZE)).toBe('demotion');
  });

  // Sin recortar, en una cohorte de 6 ascenderían 5 y descenderían 5: todos
  // estarían en las dos zonas a la vez y nadie mantendría.
  it('recorta las zonas en cohortes pequeñas para que exista permanencia', () => {
    const zones = [1, 2, 3, 4, 5, 6].map(p => zoneForPosition(p, 6));
    expect(zones).toContain('safe');
    expect(zones.filter(z => z === 'promotion').length).toBeLessThan(6);
  });

  it('no deja a nadie en ascenso y descenso simultáneamente', () => {
    for (let size = 2; size <= 30; size++) {
      for (let pos = 1; pos <= size; pos++) {
        expect(['promotion', 'safe', 'demotion']).toContain(zoneForPosition(pos, size));
      }
    }
  });
});

describe('nextTierFor', () => {
  it('sube y baja un escalón', () => {
    expect(nextTierFor('gold', 'promotion')).toBe('emerald');
    expect(nextTierFor('gold', 'demotion')).toBe('silver');
    expect(nextTierFor('gold', 'safe')).toBe('gold');
  });

  it('no asciende por encima de diamante ni desciende por debajo de bronce', () => {
    expect(nextTierFor('diamond', 'promotion')).toBe('diamond');
    expect(nextTierFor('bronze', 'demotion')).toBe('bronze');
  });
});

describe('zoneCopy', () => {
  it('explica que en diamante no se asciende más', () => {
    expect(zoneCopy('promotion', 'diamond').detail).toMatch(/liga más alta/i);
  });

  it('explica que en bronce no se desciende', () => {
    expect(zoneCopy('demotion', 'bronze').detail).toMatch(/no puedes descender/i);
  });

  it('nombra la liga destino en un tier intermedio', () => {
    expect(zoneCopy('promotion', 'silver').detail).toContain('Liga Oro');
    expect(zoneCopy('demotion', 'silver').detail).toContain('Liga Bronce');
  });
});

describe('rankCohort', () => {
  const members = [
    { userId: 'c', name: 'Carla', avatar: 'loci',  weeklyXp: 300 },
    { userId: 'a', name: 'Ana',   avatar: 'focus', weeklyXp: 500 },
    { userId: 'b', name: 'Beto',  avatar: 'swift', weeklyXp: 400 },
  ];

  it('ordena por XP descendente', () => {
    const r = rankCohort(members, 'b');
    expect(r.map(m => m.userId)).toEqual(['a', 'b', 'c']);
    expect(r[0].position).toBe(1);
  });

  it('marca al usuario actual', () => {
    const r = rankCohort(members, 'b');
    expect(r.find(m => m.isUser)?.userId).toBe('b');
  });

  it('no marca a nadie si el usuario no está en la cohorte', () => {
    expect(rankCohort(members, 'zzz').some(m => m.isUser)).toBe(false);
  });

  // Con Realtime las filas llegan en orden arbitrario; sin desempate estable
  // dos usuarios empatados se intercambiarían el puesto en cada actualización.
  it('desempata de forma estable ante XP idéntico', () => {
    const tied = [
      { userId: 'z', name: 'Z', avatar: 'focus', weeklyXp: 100 },
      { userId: 'a', name: 'A', avatar: 'focus', weeklyXp: 100 },
    ];
    const first  = rankCohort(tied, null).map(m => m.userId);
    const second = rankCohort([...tied].reverse(), null).map(m => m.userId);
    expect(first).toEqual(second);
  });

  it('no muta el array recibido', () => {
    const copy = [...members];
    rankCohort(members, 'a');
    expect(members).toEqual(copy);
  });

  it('aguanta una cohorte vacía', () => {
    const r = rankCohort([], 'a');
    expect(r).toEqual([]);
    expect(userPosition(r)).toBeNull();
  });
});

describe('xpToClimb', () => {
  const members = [
    { userId: 'a', name: 'Ana',  avatar: 'focus', weeklyXp: 500 },
    { userId: 'b', name: 'Beto', avatar: 'swift', weeklyXp: 400 },
  ];

  it('calcula el XP necesario para adelantar al de arriba', () => {
    expect(xpToClimb(rankCohort(members, 'b'))).toBe(101);
  });

  it('devuelve null si ya va primero', () => {
    expect(xpToClimb(rankCohort(members, 'a'))).toBeNull();
  });

  it('devuelve null si el usuario no está en la cohorte', () => {
    expect(xpToClimb(rankCohort(members, 'x'))).toBeNull();
  });
});
