import { normalizeAnswer, levenshtein, matchesRecall, gradeRecall, scoreToQuality, isDue } from '../loci';

describe('normalizeAnswer', () => {
  it('quita acentos, mayúsculas y signos', () => {
    expect(normalizeAnswer('  ¡Manzana! ')).toBe('manzana');
    expect(normalizeAnswer('Águila')).toBe('aguila');
  });
  it('colapsa espacios', () => {
    expect(normalizeAnswer('la   casa')).toBe('la casa');
  });
});

describe('levenshtein', () => {
  it('es 0 para cadenas iguales', () => expect(levenshtein('libro', 'libro')).toBe(0));
  it('cuenta una sustitución', () => expect(levenshtein('libro', 'libra')).toBe(1));
  it('maneja cadenas vacías', () => expect(levenshtein('', 'taza')).toBe(4));
});

describe('matchesRecall', () => {
  it('acepta igualdad exacta ignorando acentos/mayúsculas', () => {
    expect(matchesRecall('Reloj', 'reloj')).toBe(true);
  });
  it('acepta contención (artículos/plurales)', () => {
    expect(matchesRecall('la manzana', 'manzana')).toBe(true);
    expect(matchesRecall('libros', 'libro')).toBe(true);
  });
  it('tolera una errata pequeña', () => {
    expect(matchesRecall('guitara', 'guitarra')).toBe(true);
  });
  it('rechaza palabras claramente distintas', () => {
    expect(matchesRecall('mapa', 'taza')).toBe(false);
  });
  it('rechaza respuesta vacía', () => {
    expect(matchesRecall('', 'vela')).toBe(false);
  });
});

describe('gradeRecall — ordenado', () => {
  const targets = ['llave', 'manzana', 'libro'];

  it('puntúa 1.0 con todo correcto en orden (con erratas/acentos)', () => {
    const g = gradeRecall(['Llave', 'manzanas', 'libro'], targets, true);
    expect(g.score).toBe(1);
    expect(g.correct).toBe(3);
  });

  it('penaliza desorden cuando es ordenado', () => {
    const g = gradeRecall(['manzana', 'llave', 'libro'], targets, true);
    expect(g.correct).toBe(1); // solo "libro" cae en su posición
  });

  it('cuenta respuestas faltantes como fallo', () => {
    const g = gradeRecall(['llave'], targets, true);
    expect(g.correct).toBe(1);
    expect(g.total).toBe(3);
  });
});

describe('gradeRecall — no ordenado', () => {
  const targets = ['llave', 'manzana', 'libro'];

  it('acepta el orden arbitrario', () => {
    const g = gradeRecall(['manzana', 'libro', 'llave'], targets, false);
    expect(g.score).toBe(1);
  });

  it('no cuenta dos veces el mismo objetivo', () => {
    const g = gradeRecall(['llave', 'llave', 'llave'], targets, false);
    expect(g.correct).toBe(1);
  });
});

describe('scoreToQuality', () => {
  it('mapea recuerdo perfecto a 5', () => expect(scoreToQuality(1)).toBe(5));
  it('clampa por encima de 1', () => expect(scoreToQuality(1.5)).toBe(5));
  it('respeta los cortes intermedios', () => {
    expect(scoreToQuality(0.8)).toBe(4);
    expect(scoreToQuality(0.6)).toBe(3); // aprobado justo
    expect(scoreToQuality(0.59)).toBe(2); // suspende → reinicia intervalo
    expect(scoreToQuality(0.4)).toBe(2);
    expect(scoreToQuality(0.2)).toBe(1);
  });
  it('mapea blackout a 0', () => expect(scoreToQuality(0)).toBe(0));
});

describe('isDue', () => {
  const now = new Date('2026-06-23T12:00:00Z');
  it('está vencido cuando la fecha ya pasó', () => {
    expect(isDue('2026-06-20T12:00:00Z', now)).toBe(true);
  });
  it('no está vencido cuando la fecha es futura', () => {
    expect(isDue('2026-06-30T12:00:00Z', now)).toBe(false);
  });
  it('trata como vencido lo no programado o inválido', () => {
    expect(isDue(null, now)).toBe(true);
    expect(isDue(undefined, now)).toBe(true);
    expect(isDue('no-es-fecha', now)).toBe(true);
  });
  it('acepta objetos Date', () => {
    expect(isDue(new Date('2026-06-23T11:59:00Z'), now)).toBe(true);
  });
});
