import { Pool } from 'pg';
import { IRouteRepository, RouteFilters } from '../../../core/ports/IRouteRepository';
import { Route, RouteComparison, computePercentDiff, isCompliant } from '../../../core/domain/Route';

function mapRow(row: Record<string, unknown>): Route {
  return {
    id: row.id as string,
    routeId: row.route_id as string,
    shipId: row.ship_id as string,
    vesselType: row.vessel_type as string,
    fuelType: row.fuel_type as string,
    year: Number(row.year),
    ghgIntensity: Number(row.ghg_intensity),
    fuelConsumption: Number(row.fuel_consumption),
    distance: Number(row.distance),
    totalEmissions: Number(row.total_emissions),
    isBaseline: Boolean(row.is_baseline),
    createdAt: new Date(row.created_at as string),
  };
}

export class PostgresRouteRepository implements IRouteRepository {
  constructor(private readonly db: Pool) {}

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters?.vesselType) {
      conditions.push(`vessel_type = $${idx++}`);
      values.push(filters.vesselType);
    }
    if (filters?.fuelType) {
      conditions.push(`fuel_type = $${idx++}`);
      values.push(filters.fuelType);
    }
    if (filters?.year) {
      conditions.push(`year = $${idx++}`);
      values.push(filters.year);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.db.query(
      `SELECT * FROM routes ${where} ORDER BY created_at DESC`,
      values
    );
    return result.rows.map(mapRow);
  }

  async findById(id: string): Promise<Route | null> {
    const result = await this.db.query(
      'SELECT * FROM routes WHERE id = $1 OR route_id = $1',
      [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findBaseline(shipId: string): Promise<Route | null> {
    const result = await this.db.query(
      'SELECT * FROM routes WHERE ship_id = $1 AND is_baseline = TRUE LIMIT 1',
      [shipId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async setBaseline(routeId: string): Promise<Route> {
    // Find the route first to get its ship_id
    const routeResult = await this.db.query(
      'SELECT * FROM routes WHERE id = $1 OR route_id = $1',
      [routeId]
    );
    if (!routeResult.rows[0]) {
      throw new Error(`Route not found: ${routeId}`);
    }
    const shipId = routeResult.rows[0].ship_id;

    // Clear existing baselines for this ship
    await this.db.query(
      'UPDATE routes SET is_baseline = FALSE WHERE ship_id = $1',
      [shipId]
    );

    // Set new baseline
    const result = await this.db.query(
      'UPDATE routes SET is_baseline = TRUE WHERE id = $1 OR route_id = $1 RETURNING *',
      [routeId]
    );
    return mapRow(result.rows[0]);
  }

  async getComparison(shipId?: string): Promise<RouteComparison[]> {
    let baselineQuery = 'SELECT * FROM routes WHERE is_baseline = TRUE';
    const params: unknown[] = [];

    if (shipId) {
      baselineQuery += ' AND ship_id = $1';
      params.push(shipId);
    }

    const baselines = await this.db.query(baselineQuery, params);
    if (baselines.rows.length === 0) return [];

    const comparisons: RouteComparison[] = [];

    for (const baseRow of baselines.rows) {
      const baseline = mapRow(baseRow);
      const others = await this.db.query(
        'SELECT * FROM routes WHERE ship_id = $1 AND is_baseline = FALSE',
        [baseline.shipId]
      );

      for (const compRow of others.rows) {
        const comparison = mapRow(compRow);
        const percentDiff = computePercentDiff(
          baseline.ghgIntensity,
          comparison.ghgIntensity
        );
        comparisons.push({
          baseline,
          comparison,
          percentDiff,
          compliant: isCompliant(comparison.ghgIntensity),
        });
      }
    }

    return comparisons;
  }

  async create(route: Omit<Route, 'id' | 'createdAt'>): Promise<Route> {
    const result = await this.db.query(
      `INSERT INTO routes (route_id, ship_id, vessel_type, fuel_type, year,
       ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        route.routeId, route.shipId, route.vesselType, route.fuelType,
        route.year, route.ghgIntensity, route.fuelConsumption,
        route.distance, route.totalEmissions, route.isBaseline,
      ]
    );
    return mapRow(result.rows[0]);
  }
}
