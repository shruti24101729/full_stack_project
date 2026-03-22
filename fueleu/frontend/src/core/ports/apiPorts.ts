import {
  Route, RouteComparison, ComplianceBalance, AdjustedComplianceBalance,
  BankEntry, BankingResult, PoolAllocationResult, Pool,
} from '../domain/types';

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

export interface IRouteApi {
  getRoutes(filters?: RouteFilters): Promise<{ data: Route[]; count: number }>;
  setBaseline(routeId: string): Promise<{ data: Route; message: string }>;
  getComparison(shipId?: string): Promise<{ data: RouteComparison[]; count: number }>;
}

export interface IComplianceApi {
  getCb(shipId: string, year: number): Promise<{ data: ComplianceBalance }>;
  getAdjustedCb(shipId: string, year: number): Promise<{ data: AdjustedComplianceBalance }>;
}

export interface IBankingApi {
  getRecords(shipId: string, year: number): Promise<{ data: BankEntry[]; count: number }>;
  bankSurplus(shipId: string, year: number, amount?: number): Promise<{ data: BankingResult }>;
  applyBanked(shipId: string, year: number, amount: number): Promise<{ data: BankingResult }>;
}

export interface IPoolApi {
  getPools(): Promise<{ data: Pool[]; count: number }>;
  createPool(year: number, members: Array<{ shipId: string; adjustedCb: number }>): Promise<{ data: PoolAllocationResult }>;
}
