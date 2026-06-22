import { calculateSM2 } from '../sm2';

describe('calculateSM2', () => {
  it('schedules a 1-day interval on the first correct review', () => {
    const r = calculateSM2(5, 0, 0, 2.5);
    expect(r.interval).toBe(1);
    expect(r.repetitions).toBe(1);
  });

  it('schedules a 6-day interval on the second correct review', () => {
    const r = calculateSM2(4, 1, 1, 2.5);
    expect(r.interval).toBe(6);
    expect(r.repetitions).toBe(2);
  });

  it('multiplies the previous interval by the ease factor from the third review on', () => {
    const r = calculateSM2(5, 6, 2, 2.5);
    // round(6 * 2.5) = 15
    expect(r.interval).toBe(15);
    expect(r.repetitions).toBe(3);
  });

  it('resets repetitions and interval on a failed review (quality < 3)', () => {
    const r = calculateSM2(1, 15, 3, 2.5);
    expect(r.interval).toBe(1);
    expect(r.repetitions).toBe(0);
  });

  it('never lets the ease factor drop below 1.3', () => {
    let ef = 2.5;
    // Repeatedly failing should clamp EF at the 1.3 floor, not below.
    for (let i = 0; i < 10; i++) {
      ef = calculateSM2(0, 1, 0, ef).easeFactor;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it('returns a nextDue date "interval" days in the future', () => {
    const r = calculateSM2(5, 6, 2, 2.5);
    const expected = new Date();
    expected.setDate(expected.getDate() + r.interval);
    // Compare calendar day to avoid millisecond flakiness.
    expect(r.nextDue.toDateString()).toBe(expected.toDateString());
  });
});
