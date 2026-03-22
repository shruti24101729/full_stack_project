import { describe, it, expect } from 'vitest';
import { TARGET_GHG_INTENSITY } from '../core/domain/types';

// ── Domain logic mirrored from backend ─────────────────────────────────────
function computePercentDiff(baseline: number, comparison: number): number {
  return ((comparison / baseline) - 1) * 100;
}

function isCompliant(ghg: number): boolean {
  return ghg <= TARGET_GHG_INTENSITY;
}

function computeCb(actualGhg: number, fuelConsumption: number): number {
  const TARGET = 89.3368;
  const energyMJ = fuelConsumption * 41000;
  return (TARGET - actualGhg) * energyMJ;
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('TARGET_GHG_INTENSITY', () => {
  it('equals 89.3368 (2% below 91.16)', () => {
    expect(TARGET_GHG_INTENSITY).toBe(89.3368);
    expect(TARGET_GHG_INTENSITY).toBeLessThan(91.16);
  });
});

describe('computePercentDiff', () => {
  it('returns negative when comparison is below baseline', () => {
    const pct = computePercentDiff(91.0, 88.0);
    expect(pct).toBeCloseTo(-3.297, 1);
  });

  it('returns positive when comparison is above baseline', () => {
    const pct = computePercentDiff(88.0, 91.0);
    expect(pct).toBeCloseTo(3.409, 1);
  });

  it('returns 0 for equal values', () => {
    expect(computePercentDiff(90.0, 90.0)).toBe(0);
  });
});

describe('isCompliant', () => {
  it('compliant at exactly target', () => {
    expect(isCompliant(89.3368)).toBe(true);
  });
  it('compliant below target', () => {
    expect(isCompliant(85.0)).toBe(true);
  });
  it('non-compliant above target', () => {
    expect(isCompliant(89.34)).toBe(false);
    expect(isCompliant(93.5)).toBe(false);
  });
});

describe('computeCb', () => {
  it('positive CB for compliant ship', () => {
    const cb = computeCb(88.0, 5000);
    expect(cb).toBeGreaterThan(0);
  });

  it('negative CB for non-compliant ship', () => {
    const cb = computeCb(93.5, 5100);
    expect(cb).toBeLessThan(0);
  });

  it('uses correct formula: (target - actual) × energy', () => {
    const actual = 88.0;
    const fuel = 4000;
    const target = 89.3368;
    const energy = fuel * 41000;
    const expected = (target - actual) * energy;
    expect(computeCb(actual, fuel)).toBeCloseTo(expected, 0);
  });
});
