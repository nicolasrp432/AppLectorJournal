import {
  READING_GOALS,
  getGoal,
  wpmForGoal,
  calibrate,
  DEFAULT_GOAL_ID,
} from '../readingGoals';

describe('getGoal', () => {
  it('devuelve el objetivo pedido', () => {
    expect(getGoal('gist').id).toBe('gist');
  });

  it('cae en estudio a fondo ante un id desconocido o nulo', () => {
    expect(getGoal(null).id).toBe('study');
    expect(getGoal(undefined).id).toBe(DEFAULT_GOAL_ID);
  });
});

describe('wpmForGoal', () => {
  it('acelera al barrer y frena al estudiar', () => {
    const gist  = wpmForGoal(300, 'gist');
    const study = wpmForGoal(300, 'study');
    expect(gist).toBeGreaterThan(300);
    // Estudiar debe ir más lento que la base: es el caso donde empujar el WPM
    // va en contra del objetivo del usuario.
    expect(study).toBeLessThan(300);
  });

  it('nunca supera 600 WPM, donde la comprensión se desploma', () => {
    expect(wpmForGoal(800, 'gist')).toBeLessThanOrEqual(600);
  });

  it('nunca baja de 120 WPM', () => {
    expect(wpmForGoal(50, 'study')).toBeGreaterThanOrEqual(120);
  });

  it('redondea a múltiplos de 10 para no mostrar cifras absurdas', () => {
    for (const g of READING_GOALS) {
      expect(wpmForGoal(287, g.id) % 10).toBe(0);
    }
  });
});

describe('calibrate', () => {
  it('confirma cuando se cumple el objetivo al ritmo previsto', () => {
    const c = calibrate('study', 0.9, 250, 260);
    expect(c.verdict).toBe('on_target');
    expect(c.met).toBe(true);
  });

  it('detecta exceso de confianza: rápido y sin comprender', () => {
    const c = calibrate('study', 0.4, 500, 260);
    expect(c.verdict).toBe('over_confident');
    expect(c.met).toBe(false);
    expect(c.message).toMatch(/baja el ritmo/i);
  });

  it('marca fallo de comprensión aunque el ritmo fuera correcto', () => {
    const c = calibrate('study', 0.5, 255, 260);
    expect(c.met).toBe(false);
    expect(c.verdict).toBe('over_confident');
  });

  it('sugiere subir el listón si cumplió yendo más rápido', () => {
    const c = calibrate('gist', 0.9, 500, 390);
    expect(c.verdict).toBe('under_confident');
    expect(c.met).toBe(true);
  });

  // Cada objetivo tiene su propio listón: barrer no debe exigir lo mismo que estudiar.
  it('aplica un listón distinto por objetivo', () => {
    expect(calibrate('gist',  0.65, 300, 390).met).toBe(true);
    expect(calibrate('study', 0.65, 220, 255).met).toBe(false);
  });
});
