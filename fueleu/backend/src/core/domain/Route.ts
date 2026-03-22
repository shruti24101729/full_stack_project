export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;      // gCO2e/MJ
  fuelConsumption: number;   // tonnes
  distance: number;          // km
  totalEmissions: number;    // tonnes CO2e
  isBaseline: boolean;
  shipId: string;
  createdAt: Date;
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

export const TARGET_GHG_INTENSITY_2025 = 89.3368; // gCO2e/MJ
export const ENERGY_FACTOR_MJ_PER_TONNE = 41000;  // MJ per tonne of fuel

export function computeTotalEmissions(
  ghgIntensity: number,
  fuelConsumption: number
): number {
  const energyMJ = fuelConsumption * ENERGY_FACTOR_MJ_PER_TONNE;
  return (ghgIntensity * energyMJ) / 1_000_000; // convert to tonnes CO2e
}

export function computePercentDiff(
  baselineIntensity: number,
  comparisonIntensity: number
): number {
  return ((comparisonIntensity / baselineIntensity) - 1) * 100;
}

export function isCompliant(ghgIntensity: number): boolean {
  return ghgIntensity <= TARGET_GHG_INTENSITY_2025;
}
