import { Route, RouteComparison } from '../domain/Route';

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

export interface IRouteRepository {
  findAll(filters?: RouteFilters): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findBaseline(shipId: string): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(shipId?: string): Promise<RouteComparison[]>;
  create(route: Omit<Route, 'id' | 'createdAt'>): Promise<Route>;
}
