import {
  resolveNodeDifficulty,
  boostLabel,
  MAX_BOOST_FIRST_PLAY,
  MAX_BOOST_REPLAY,
} from '../nodeDifficulty';

const base = { nodeLevel: 2, adaptiveLevel: 2, completed: false, maxLevel: 5 };

describe('resolveNodeDifficulty', () => {
  it('usa el nivel del nodo cuando el usuario va justo a ese nivel', () => {
    const d = resolveNodeDifficulty(base);
    expect(d.level).toBe(2);
    expect(d.boost).toBe(0);
  });

  // Regresión: antes el nodo fijaba el nivel y el motor adaptativo se ignoraba.
  it('sube el nivel si el usuario rinde por encima del nodo', () => {
    const d = resolveNodeDifficulty({ ...base, adaptiveLevel: 3 });
    expect(d.level).toBe(3);
    expect(d.boost).toBe(1);
  });

  it('nunca baja del nivel de diseño del nodo', () => {
    // Aunque el usuario haya bajado a nivel 1, el nodo enseña contenido de nivel 2.
    const d = resolveNodeDifficulty({ ...base, adaptiveLevel: 1 });
    expect(d.level).toBe(2);
    expect(d.boost).toBe(0);
  });

  it('limita el empuje a +1 la primera vez, para no crear un muro', () => {
    const d = resolveNodeDifficulty({ ...base, adaptiveLevel: 5 });
    expect(d.level).toBe(2 + MAX_BOOST_FIRST_PLAY);
    expect(d.cappedByBoost).toBe(true);
  });

  it('permite +2 al rejugar un nodo ya completado', () => {
    const d = resolveNodeDifficulty({ ...base, adaptiveLevel: 5, completed: true });
    expect(d.level).toBe(2 + MAX_BOOST_REPLAY);
    expect(d.boost).toBe(MAX_BOOST_REPLAY);
  });

  it('nunca supera el máximo disponible del ejercicio', () => {
    // comprehension solo tiene 3 niveles.
    const d = resolveNodeDifficulty({
      nodeLevel: 3, adaptiveLevel: 9, completed: true, maxLevel: 3,
    });
    expect(d.level).toBe(3);
    expect(d.boost).toBe(0);
  });

  it('no marca cappedByBoost si el techo lo puso el propio ejercicio', () => {
    const d = resolveNodeDifficulty({
      nodeLevel: 2, adaptiveLevel: 9, completed: true, maxLevel: 4,
    });
    expect(d.level).toBe(4);
    expect(d.cappedByBoost).toBe(false);
  });

  it('trata un nivel de nodo inválido como 1', () => {
    const d = resolveNodeDifficulty({ ...base, nodeLevel: 0, adaptiveLevel: 1 });
    expect(d.level).toBe(1);
  });
});

describe('boostLabel', () => {
  it('no etiqueta nada sin empuje', () => {
    expect(boostLabel({ level: 2, boost: 0, cappedByBoost: false })).toBeNull();
  });

  it('distingue empuje suave de reto reforzado', () => {
    expect(boostLabel({ level: 3, boost: 1, cappedByBoost: false })).toBe('Adaptado a tu nivel');
    expect(boostLabel({ level: 4, boost: 2, cappedByBoost: false })).toBe('Reto reforzado');
  });
});
