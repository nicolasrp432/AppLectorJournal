import { regenerate, msToNextLife, formatCountdown } from '../lives';
import { MAX_READING_LIVES, LIFE_REGEN_MINUTES } from '../../constants/lives';

const MIN = 60 * 1000;
const REGEN_MS = LIFE_REGEN_MINUTES * MIN;
const T0 = new Date('2026-06-23T12:00:00.000Z');

describe('regenerate', () => {
  it('no añade vidas antes de un intervalo completo', () => {
    const now = new Date(T0.getTime() + REGEN_MS - MIN); // 29 min después
    const r = regenerate(2, T0.toISOString(), now);
    expect(r.lives).toBe(2);
  });

  it('añade 1 vida tras un intervalo y ancla el reloj conservando el resto', () => {
    const now = new Date(T0.getTime() + REGEN_MS + 10 * MIN); // 40 min después
    const r = regenerate(2, T0.toISOString(), now);
    expect(r.lives).toBe(3);
    // El ancla avanza solo 1 intervalo (no consume los 10 min sobrantes)
    expect(new Date(r.updatedAt).getTime()).toBe(T0.getTime() + REGEN_MS);
    expect(r.nextRegenAt).not.toBeNull();
  });

  it('topa en MAX y deja nextRegenAt en null', () => {
    const now = new Date(T0.getTime() + 100 * REGEN_MS);
    const r = regenerate(1, T0.toISOString(), now);
    expect(r.lives).toBe(MAX_READING_LIVES);
    expect(r.nextRegenAt).toBeNull();
  });

  it('si ya está lleno, queda lleno y sin temporizador', () => {
    const r = regenerate(MAX_READING_LIVES, T0.toISOString(), T0);
    expect(r.lives).toBe(MAX_READING_LIVES);
    expect(r.nextRegenAt).toBeNull();
  });
});

describe('msToNextLife', () => {
  it('es 0 cuando está lleno (null)', () => {
    expect(msToNextLife(null, T0)).toBe(0);
  });
  it('devuelve el tiempo restante hasta la próxima vida', () => {
    const next = new Date(T0.getTime() + 5 * MIN).toISOString();
    expect(msToNextLife(next, T0)).toBe(5 * MIN);
  });
  it('nunca es negativo', () => {
    const past = new Date(T0.getTime() - MIN).toISOString();
    expect(msToNextLife(past, T0)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formatea mm:ss con relleno', () => {
    expect(formatCountdown(5 * MIN)).toBe('5:00');
    expect(formatCountdown(65 * 1000)).toBe('1:05');
    expect(formatCountdown(9 * 1000)).toBe('0:09');
  });
});
