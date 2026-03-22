import { IRouteRepository, RouteFilters } from '../ports/IRouteRepository';
import { Route, RouteComparison } from '../domain/Route';

export class GetAllRoutes {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(filters?: RouteFilters): Promise<Route[]> {
    return this.routeRepo.findAll(filters);
  }
}

export class SetRouteBaseline {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(routeId: string): Promise<Route> {
    const route = await this.routeRepo.findById(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }
    return this.routeRepo.setBaseline(routeId);
  }
}

export class GetRouteComparison {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(shipId?: string): Promise<RouteComparison[]> {
    return this.routeRepo.getComparison(shipId);
  }
}
