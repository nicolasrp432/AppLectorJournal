import { normalizeAnswer, levenshtein, matchesRecall, gradeRecall } from '../loci';

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
