import { TARGET_GHG_INTENSITY_2025, ENERGY_FACTOR_MJ_PER_TONNE } from './Route';

export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;       // Compliance Balance in gCO2e
  actualIntensity: number;
  targetIntensity: number;
  energyInScope: number;  // MJ
  status: 'surplus' | 'deficit';
  createdAt: Date;
}

export interface AdjustedComplianceBalance extends ComplianceBalance {
  bankedApplied: number;
  cbAfterBanking: number;
}

/**
 * CB = (Target - Actual) × Energy in scope
 * Positive = Surplus, Negative = Deficit
 */
export function computeComplianceBalance(
  shipId: string,
  year: number,
  actualGhgIntensity: number,
  fuelConsumptionTonnes: number
): Omit<ComplianceBalance, 'id' | 'createdAt'> {
  const energyInScope = fuelConsumptionTonnes * ENERGY_FACTOR_MJ_PER_TONNE;
  const cbGco2eq = (TARGET_GHG_INTENSITY_2025 - actualGhgIntensity) * energyInScope;

  return {
    shipId,
    year,
    cbGco2eq,
    actualIntensity: actualGhgIntensity,
    targetIntensity: TARGET_GHG_INTENSITY_2025,
    energyInScope,
    status: cbGco2eq >= 0 ? 'surplus' : 'deficit',
  };
}
