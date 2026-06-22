import { XP_PER_LEVEL, xpToLevel, levelProgress, xpForNextLevel } from '../xpEngine';

describe('xpEngine', () => {
  describe('xpToLevel', () => {
    it('starts at level 1 with 0 XP', () => {
      expect(xpToLevel(0)).toBe(1);
    });

    it('stays on level 1 until one full level of XP is earned', () => {
      expect(xpToLevel(XP_PER_LEVEL - 1)).toBe(1);
    });

    it('advances to level 2 at exactly one level of XP', () => {
      expect(xpToLevel(XP_PER_LEVEL)).toBe(2);
    });

    it('advances to level 3 at two levels of XP', () => {
      expect(xpToLevel(XP_PER_LEVEL * 2)).toBe(3);
    });
  });

  describe('levelProgress', () => {
    it('is 0 at the start of a level', () => {
      expect(levelProgress(XP_PER_LEVEL)).toBe(0);
    });

    it('is 0.5 at the midpoint of a level', () => {
      expect(levelProgress(XP_PER_LEVEL / 2)).toBe(0.5);
    });
  });

  describe('xpForNextLevel', () => {
    it('needs a full level of XP when freshly leveled up', () => {
      expect(xpForNextLevel(XP_PER_LEVEL)).toBe(XP_PER_LEVEL);
    });

    it('needs the remaining XP partway through a level', () => {
      expect(xpForNextLevel(XP_PER_LEVEL + 200)).toBe(XP_PER_LEVEL - 200);
    });
  });
});
