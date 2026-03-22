import { Pool } from 'pg';
import { IComplianceRepository } from '../../../core/ports/IComplianceRepository';
import {
  ComplianceBalance,
  AdjustedComplianceBalance,
  computeComplianceBalance,
} from '../../../core/domain/Compliance';

function mapRow(row: Record<string, unknown>): ComplianceBalance {
  return {
    id: row.id as string,
    shipId: row.ship_id as string,
    year: Number(row.year),
    cbGco2eq: Number(row.cb_gco2eq),
    actualIntensity: Number(row.actual_intensity),
    targetIntensity: Number(row.target_intensity),
    energyInScope: Number(row.energy_in_scope),
    status: row.status as 'surplus' | 'deficit',
    createdAt: new Date(row.created_at as string),
  };
}

export class PostgresComplianceRepository implements IComplianceRepository {
  constructor(private readonly db: Pool) {}

  async computeAndStore(shipId: string, year: number): Promise<ComplianceBalance> {
    // Get latest route data for this ship/year
    const routeResult = await this.db.query(
      `SELECT AVG(ghg_intensity) as avg_intensity, SUM(fuel_consumption) as total_fuel
       FROM routes WHERE ship_id = $1 AND year = $2`,
      [shipId, year]
    );

    if (!routeResult.rows[0] || routeResult.rows[0].avg_intensity === null) {
      throw new Error(`No route data found for ship ${shipId} in year ${year}`);
    }

    const avgIntensity = Number(routeResult.rows[0].avg_intensity);
    const totalFuel = Number(routeResult.rows[0].total_fuel);

    const computed = computeComplianceBalance(shipId, year, avgIntensity, totalFuel);

    // Upsert compliance record
    const result = await this.db.query(
      `INSERT INTO ship_compliance (ship_id, year, cb_gco2eq, actual_intensity,
       target_intensity, energy_in_scope, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (ship_id, year)
       DO UPDATE SET cb_gco2eq = $3, actual_intensity = $4, target_intensity = $5,
       energy_in_scope = $6, status = $7, created_at = NOW()
       RETURNING *`,
      [
        computed.shipId, computed.year, computed.cbGco2eq,
        computed.actualIntensity, computed.targetIntensity,
        computed.energyInScope, computed.status,
      ]
    );

    return mapRow(result.rows[0]);
  }

  async findByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null> {
    const result = await this.db.query(
      'SELECT * FROM ship_compliance WHERE ship_id = $1 AND year = $2',
      [shipId, year]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async getAdjustedCb(shipId: string, year: number): Promise<AdjustedComplianceBalance> {
    const cb = await this.findByShipAndYear(shipId, year);
    if (!cb) {
      // Auto-compute if not found
      const computed = await this.computeAndStore(shipId, year);
      return this.buildAdjusted(computed, shipId, year);
    }
    return this.buildAdjusted(cb, shipId, year);
  }

  private async buildAdjusted(
    cb: ComplianceBalance,
    shipId: string,
    year: number
  ): Promise<AdjustedComplianceBalance> {
    // Sum all bank applications for this ship/year
    const bankResult = await this.db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'banked' THEN amount_gco2eq ELSE 0 END), 0) as total_banked,
        COALESCE(SUM(CASE WHEN type = 'applied' THEN amount_gco2eq ELSE 0 END), 0) as total_applied
       FROM bank_entries WHERE ship_id = $1 AND year = $2`,
      [shipId, year]
    );

    const bankedApplied = Number(bankResult.rows[0]?.total_applied ?? 0);
    const cbAfterBanking = cb.cbGco2eq + bankedApplied;

    return {
      ...cb,
      bankedApplied,
      cbAfterBanking,
    };
  }
}
