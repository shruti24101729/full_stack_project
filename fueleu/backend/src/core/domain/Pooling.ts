export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  members: PoolMember[];
  poolSum: number;
  createdAt: Date;
}

export interface CreatePoolInput {
  year: number;
  members: Array<{ shipId: string; adjustedCb: number }>;
}

export interface PoolAllocationResult {
  poolId: string;
  year: number;
  poolSum: number;
  members: PoolMember[];
}

/**
 * FuelEU Article 21 – Pooling rules:
 * 1. Sum(adjustedCB) >= 0
 * 2. Deficit ship cannot exit worse than entered
 * 3. Surplus ship cannot exit with negative CB
 * Greedy allocation: sort desc by CB, transfer surplus to deficits
 */
export function validatePoolRules(
  members: Array<{ shipId: string; adjustedCb: number }>
): void {
  const poolSum = members.reduce((sum, m) => sum + m.adjustedCb, 0);
  if (poolSum < 0) {
    throw new Error(
      `Pool invalid: sum of adjusted CB (${poolSum.toFixed(2)}) must be >= 0.`
    );
  }
}

export function allocatePool(
  members: Array<{ shipId: string; adjustedCb: number }>
): PoolMember[] {
  validatePoolRules(members);

  // Work on mutable copy
  const working = members.map((m) => ({
    shipId: m.shipId,
    cbBefore: m.adjustedCb,
    cbAfter: m.adjustedCb,
  }));

  // Sort desc by CB: surplus ships first
  working.sort((a, b) => b.cbBefore - a.cbBefore);

  // Greedy: transfer surplus to fill deficits
  for (let i = 0; i < working.length; i++) {
    for (let j = working.length - 1; j > i; j--) {
      if (working[j].cbAfter >= 0) break; // no more deficits
      if (working[i].cbAfter <= 0) break; // no more surplus

      const deficit = Math.abs(working[j].cbAfter);
      const available = working[i].cbAfter;
      const transfer = Math.min(deficit, available);

      // Rule: surplus ship cannot exit negative
      const actualTransfer = Math.min(transfer, working[i].cbAfter);

      working[i].cbAfter -= actualTransfer;
      working[j].cbAfter += actualTransfer;
    }
  }

  // Validate post-allocation rules
  for (const m of working) {
    // Surplus ship cannot exit negative
    if (m.cbBefore > 0 && m.cbAfter < 0) {
      throw new Error(
        `Pool invalid: surplus ship ${m.shipId} would exit with negative CB.`
      );
    }
    // Deficit ship cannot exit worse
    if (m.cbBefore < 0 && m.cbAfter < m.cbBefore) {
      throw new Error(
        `Pool invalid: deficit ship ${m.shipId} would exit worse than entered.`
      );
    }
  }

  return working;
}
