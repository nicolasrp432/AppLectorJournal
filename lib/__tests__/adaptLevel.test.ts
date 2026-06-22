import { adaptLevel } from '../adaptLevel';
import type { ExerciseId } from '../../types/db';

const SCHULTE = 'schulte' as ExerciseId;
const LOCI = 'loci' as ExerciseId;

describe('adaptLevel — confirmación / histéresis', () => {
  it('NO sube de nivel con un único intento bueno (sin confirmación ni confianza)', () => {
    const r = adaptLevel(SCHULTE, 0.9, 1, 0, 0);
    expect(r.reason).toBe('hold');
    expect(r.newLevel).toBe(1);
  });

  it('sube tras DOS intentos buenos consecutivos', () => {
    const r = adaptLevel(SCHULTE, 0.9, 1, 0, 0.9);
    expect(r.reason).toBe('up');
    expect(r.newLevel).toBe(2);
  });

  it('sube con un único intento bueno si el mastery ya es alto (confianza)', () => {
    const r = adaptLevel(SCHULTE, 0.9, 1, 0.6, 0);
    expect(r.reason).toBe('up');
    expect(r.newLevel).toBe(2);
  });

  it('NO baja con un único intento pobre (no castiga un mal día)', () => {
    const r = adaptLevel(SCHULTE, 0.3, 3, 0.2, 0.9);
    expect(r.reason).toBe('hold');
    expect(r.newLevel).toBe(3);
  });

  it('baja tras DOS intentos pobres consecutivos', () => {
    const r = adaptLevel(SCHULTE, 0.3, 3, 0.2, 0.3);
    expect(r.reason).toBe('down');
    expect(r.newLevel).toBe(2);
  });
});

describe('adaptLevel — límites (clamping)', () => {
  it('no sube por encima del nivel máximo del ejercicio', () => {
    // schulte tiene 5 niveles
    const r = adaptLevel(SCHULTE, 0.95, 5, 0.9, 0.95);
    expect(r.reason).toBe('hold');
    expect(r.newLevel).toBe(5);
  });

  it('no baja por debajo del nivel 1', () => {
    const r = adaptLevel(SCHULTE, 0.1, 1, 0, 0.1);
    expect(r.reason).toBe('hold');
    expect(r.newLevel).toBe(1);
  });
});

describe('adaptLevel — mastery', () => {
  it('acumula mastery al mantener nivel con buen score', () => {
    const r = adaptLevel(SCHULTE, 0.9, 2, 0.3, 0); // bueno pero sin confirmar -> hold
    expect(r.reason).toBe('hold');
    expect(r.newMastery).toBeCloseTo(0.45); // 0.3 + 0.15
  });

  it('resetea el mastery al subir de nivel', () => {
    const r = adaptLevel(SCHULTE, 0.9, 1, 0.9, 0.9);
    expect(r.reason).toBe('up');
    expect(r.newMastery).toBeLessThan(0.3); // empieza fresco en el nuevo nivel
  });

  it('mantiene el mastery en [0,1]', () => {
    const r = adaptLevel(SCHULTE, 1, 2, 0.95, 0); // hold, +0.15 pero clamp a 1
    expect(r.newMastery).toBeLessThanOrEqual(1);
    expect(r.newMastery).toBeGreaterThanOrEqual(0);
  });
});

describe('adaptLevel — umbrales por ejercicio', () => {
  it('loci usa umbral de subida 0.80: 0.82 dos veces sube (bajo el 0.85 por defecto)', () => {
    const r = adaptLevel(LOCI, 0.82, 1, 0, 0.82);
    expect(r.reason).toBe('up');
  });
});

describe('adaptLevel — casos especiales', () => {
  it('flashcards siempre mantiene nivel 1', () => {
    const r = adaptLevel('flashcards' as ExerciseId, 0.95, 1, 0.9, 0.95);
    expect(r.reason).toBe('hold');
    expect(r.newLevel).toBe(1);
  });

  it('clampa scores fuera de rango', () => {
    const r = adaptLevel(SCHULTE, 1.5, 1, 0, 1.2);
    expect(r.reason).toBe('up'); // ambos tratados como 1.0 (>= up)
  });

  it('sin historial (prevScore null) no sube con un solo intento', () => {
    const r = adaptLevel(SCHULTE, 0.95, 1, 0, null);
    expect(r.reason).toBe('hold');
  });
});
