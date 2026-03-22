import {
  computeComplianceBalance,
  TARGET_GHG_INTENSITY_2025,
  ENERGY_FACTOR_MJ_PER_TONNE,
} from '../../core/domain/Compliance';
import {
  computePercentDiff,
  isCompliant,
  computeTotalEmissions,
} from '../../core/domain/Route';
import {
  validateBankSurplus,
  validateApplyBanked,
} from '../../core/domain/Banking';
import { allocatePool, validatePoolRules } from '../../core/domain/Pooling';

// ─── ComputeComplianceBalance ────────────────────────────────────────────────
describe('ComputeComplianceBalance', () => {
  it('returns surplus when actual < target', () => {
    const result = computeComplianceBalance('SHIP-001', 2025, 88.0, 5000);
    const expectedEnergy = 5000 * ENERGY_FACTOR_MJ_PER_TONNE;
    const expectedCb = (TARGET_GHG_INTENSITY_2025 - 88.0) * expectedEnergy;
    expect(result.cbGco2eq).toBeCloseTo(expectedCb, 0);
    expect(result.status).toBe('surplus');
  });

  it('returns deficit when actual > target', () => {
    const result = computeComplianceBalance('SHIP-002', 2025, 93.5, 5100);
    expect(result.cbGco2eq).toBeLessThan(0);
    expect(result.status).toBe('deficit');
  });

  it('returns near-zero for exact target match', () => {
    const result = computeComplianceBalance('SHIP-003', 2025, TARGET_GHG_INTENSITY_2025, 5000);
    expect(result.cbGco2eq).toBeCloseTo(0, 0);
  });

  it('calculates energy in scope correctly', () => {
    const fuelConsumption = 4000;
    const result = computeComplianceBalance('SHIP-004', 2025, 88.0, fuelConsumption);
    expect(result.energyInScope).toBe(fuelConsumption * ENERGY_FACTOR_MJ_PER_TONNE);
  });
});

// ─── ComputeComparison ───────────────────────────────────────────────────────
describe('ComputeComparison', () => {
  it('calculates percent difference correctly', () => {
    const pct = computePercentDiff(91.0, 88.0);
    // ((88/91) - 1) * 100 ≈ -3.297
    expect(pct).toBeCloseTo(-3.297, 1);
  });

  it('isCompliant returns true when below target', () => {
    expect(isCompliant(88.0)).toBe(true);
    expect(isCompliant(89.3368)).toBe(true);
  });

  it('isCompliant returns false when above target', () => {
    expect(isCompliant(89.34)).toBe(false);
    expect(isCompliant(93.5)).toBe(false);
  });

  it('computes total emissions correctly', () => {
    const emissions = computeTotalEmissions(91.0, 5000);
    expect(emissions).toBeCloseTo((91.0 * 5000 * 41000) / 1_000_000, 2);
  });
});

// ─── BankSurplus ─────────────────────────────────────────────────────────────
describe('BankSurplus validation', () => {
  it('throws when CB is zero', () => {
    expect(() => validateBankSurplus(0)).toThrow('Cannot bank');
  });

  it('throws when CB is negative', () => {
    expect(() => validateBankSurplus(-500)).toThrow('Cannot bank');
  });

  it('does not throw when CB is positive', () => {
    expect(() => validateBankSurplus(1000)).not.toThrow();
  });
});

// ─── ApplyBanked ─────────────────────────────────────────────────────────────
describe('ApplyBanked validation', () => {
  it('throws when amount exceeds available banked', () => {
    expect(() => validateApplyBanked(1000, 500, -200)).toThrow('Cannot apply');
  });

  it('throws when amount is zero or negative', () => {
    expect(() => validateApplyBanked(0, 500, -200)).toThrow('Amount must be positive');
  });

  it('throws when current CB is non-negative', () => {
    expect(() => validateApplyBanked(100, 500, 0)).toThrow('No deficit');
  });

  it('does not throw for valid apply', () => {
    expect(() => validateApplyBanked(200, 500, -300)).not.toThrow();
  });
});

// ─── CreatePool ──────────────────────────────────────────────────────────────
describe('allocatePool', () => {
  it('throws when pool sum is negative', () => {
    expect(() =>
      allocatePool([
        { shipId: 'S1', adjustedCb: -500 },
        { shipId: 'S2', adjustedCb: -300 },
      ])
    ).toThrow('Pool invalid');
  });

  it('allocates surplus to deficit correctly', () => {
    const result = allocatePool([
      { shipId: 'S1', adjustedCb: 1000 },
      { shipId: 'S2', adjustedCb: -400 },
    ]);
    const s2 = result.find((m) => m.shipId === 'S2')!;
    expect(s2.cbAfter).toBeCloseTo(0, 0);
  });

  it('surplus ship does not go negative', () => {
    const result = allocatePool([
      { shipId: 'S1', adjustedCb: 300 },
      { shipId: 'S2', adjustedCb: -200 },
    ]);
    for (const m of result) {
      if (m.cbBefore > 0) {
        expect(m.cbAfter).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('deficit ship cannot exit worse', () => {
    const result = allocatePool([
      { shipId: 'S1', adjustedCb: 100 },
      { shipId: 'S2', adjustedCb: -500 },
    ]);
    const s2 = result.find((m) => m.shipId === 'S2')!;
    expect(s2.cbAfter).toBeGreaterThanOrEqual(s2.cbBefore);
  });

  it('passes with exactly zero pool sum', () => {
    const result = allocatePool([
      { shipId: 'S1', adjustedCb: 500 },
      { shipId: 'S2', adjustedCb: -500 },
    ]);
    expect(result).toHaveLength(2);
  });
});

// ─── validatePoolRules ───────────────────────────────────────────────────────
describe('validatePoolRules', () => {
  it('throws for negative pool sum', () => {
    expect(() =>
      validatePoolRules([
        { shipId: 'S1', adjustedCb: -100 },
        { shipId: 'S2', adjustedCb: -200 },
      ])
    ).toThrow('Pool invalid');
  });

  it('passes for positive pool sum', () => {
    expect(() =>
      validatePoolRules([
        { shipId: 'S1', adjustedCb: 500 },
        { shipId: 'S2', adjustedCb: -200 },
      ])
    ).not.toThrow();
  });
});
