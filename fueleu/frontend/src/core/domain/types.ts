// ── Route ──────────────────────────────────────────────────────────────────
export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
  shipId: string;
  createdAt: string;
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

export const TARGET_GHG_INTENSITY = 89.3368;

// ── Compliance ─────────────────────────────────────────────────────────────
export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;
  actualIntensity: number;
  targetIntensity: number;
  energyInScope: number;
  status: 'surplus' | 'deficit';
  createdAt: string;
}

export interface AdjustedComplianceBalance extends ComplianceBalance {
  bankedApplied: number;
  cbAfterBanking: number;
}

// ── Banking ────────────────────────────────────────────────────────────────
export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  type: 'banked' | 'applied';
  createdAt: string;
}

export interface BankingResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

// ── Pooling ────────────────────────────────────────────────────────────────
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
  createdAt: string;
}

export interface PoolAllocationResult {
  poolId: string;
  year: number;
  poolSum: number;
  members: PoolMember[];
}

// ── API Response wrapper ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  count?: number;
  message?: string;
  error?: string;
}
