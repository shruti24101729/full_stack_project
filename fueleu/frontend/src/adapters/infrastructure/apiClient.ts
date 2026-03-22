import {
  IRouteApi, IComplianceApi, IBankingApi, IPoolApi, RouteFilters,
} from '../../core/ports/apiPorts';
import {
  Route, RouteComparison, ComplianceBalance, AdjustedComplianceBalance,
  BankEntry, BankingResult, PoolAllocationResult, Pool,
} from '../../core/domain/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const json = await res.json() as { error?: string } & T;
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return json;
}

export class RouteApiAdapter implements IRouteApi {
  async getRoutes(filters?: RouteFilters): Promise<{ data: Route[]; count: number }> {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.set('vesselType', filters.vesselType);
    if (filters?.fuelType) params.set('fuelType', filters.fuelType);
    if (filters?.year) params.set('year', String(filters.year));
    const qs = params.toString();
    return request(`/routes${qs ? `?${qs}` : ''}`);
  }

  async setBaseline(routeId: string): Promise<{ data: Route; message: string }> {
    return request(`/routes/${routeId}/baseline`, { method: 'POST' });
  }

  async getComparison(shipId?: string): Promise<{ data: RouteComparison[]; count: number }> {
    const qs = shipId ? `?shipId=${shipId}` : '';
    return request(`/routes/comparison${qs}`);
  }
}

export class ComplianceApiAdapter implements IComplianceApi {
  async getCb(shipId: string, year: number): Promise<{ data: ComplianceBalance }> {
    return request(`/compliance/cb?shipId=${shipId}&year=${year}`);
  }

  async getAdjustedCb(shipId: string, year: number): Promise<{ data: AdjustedComplianceBalance }> {
    return request(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
  }
}

export class BankingApiAdapter implements IBankingApi {
  async getRecords(shipId: string, year: number): Promise<{ data: BankEntry[]; count: number }> {
    return request(`/banking/records?shipId=${shipId}&year=${year}`);
  }

  async bankSurplus(shipId: string, year: number, amount?: number): Promise<{ data: BankingResult }> {
    return request('/banking/bank', {
      method: 'POST',
      body: JSON.stringify({ shipId, year, amount }),
    });
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<{ data: BankingResult }> {
    return request('/banking/apply', {
      method: 'POST',
      body: JSON.stringify({ shipId, year, amount }),
    });
  }
}

export class PoolApiAdapter implements IPoolApi {
  async getPools(): Promise<{ data: Pool[]; count: number }> {
    return request('/pools');
  }

  async createPool(
    year: number,
    members: Array<{ shipId: string; adjustedCb: number }>
  ): Promise<{ data: PoolAllocationResult }> {
    return request('/pools', {
      method: 'POST',
      body: JSON.stringify({ year, members }),
    });
  }
}
