import { Pool } from 'pg';
import { IBankingRepository } from '../../../core/ports/IBankingRepository';
import { BankEntry, BankingResult, validateBankSurplus, validateApplyBanked } from '../../../core/domain/Banking';

function mapRow(row: Record<string, unknown>): BankEntry {
  return {
    id: row.id as string,
    shipId: row.ship_id as string,
    year: Number(row.year),
    amountGco2eq: Number(row.amount_gco2eq),
    type: row.type as 'banked' | 'applied',
    createdAt: new Date(row.created_at as string),
  };
}

export class PostgresBankingRepository implements IBankingRepository {
  constructor(private readonly db: Pool) {}

  async getRecords(shipId: string, year: number): Promise<BankEntry[]> {
    const result = await this.db.query(
      'SELECT * FROM bank_entries WHERE ship_id = $1 AND year = $2 ORDER BY created_at DESC',
      [shipId, year]
    );
    return result.rows.map(mapRow);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const result = await this.db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'banked' THEN amount_gco2eq ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'applied' THEN amount_gco2eq ELSE 0 END), 0) as net_banked
       FROM bank_entries WHERE ship_id = $1 AND year = $2`,
      [shipId, year]
    );
    return Number(result.rows[0]?.net_banked ?? 0);
  }

  async bankSurplus(shipId: string, year: number, _amount: number): Promise<BankingResult> {
    // Get current CB
    const cbResult = await this.db.query(
      'SELECT cb_gco2eq FROM ship_compliance WHERE ship_id = $1 AND year = $2',
      [shipId, year]
    );

    if (!cbResult.rows[0]) {
      throw new Error(`No compliance record found for ship ${shipId} year ${year}. Compute CB first.`);
    }

    const cbGco2eq = Number(cbResult.rows[0].cb_gco2eq);
    validateBankSurplus(cbGco2eq);

    // Bank the full surplus
    const amountToBank = cbGco2eq;

    await this.db.query(
      `INSERT INTO bank_entries (ship_id, year, amount_gco2eq, type)
       VALUES ($1, $2, $3, 'banked')`,
      [shipId, year, amountToBank]
    );

    return {
      cbBefore: cbGco2eq,
      applied: amountToBank,
      cbAfter: 0, // fully banked
    };
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<BankingResult> {
    // Get current CB
    const cbResult = await this.db.query(
      'SELECT cb_gco2eq FROM ship_compliance WHERE ship_id = $1 AND year = $2',
      [shipId, year]
    );

    if (!cbResult.rows[0]) {
      throw new Error(`No compliance record found for ship ${shipId} year ${year}. Compute CB first.`);
    }

    const currentCb = Number(cbResult.rows[0].cb_gco2eq);
    const availableBanked = await this.getTotalBanked(shipId, year);

    validateApplyBanked(amount, availableBanked, currentCb);

    await this.db.query(
      `INSERT INTO bank_entries (ship_id, year, amount_gco2eq, type)
       VALUES ($1, $2, $3, 'applied')`,
      [shipId, year, amount]
    );

    const cbAfter = currentCb + amount;

    return {
      cbBefore: currentCb,
      applied: amount,
      cbAfter,
    };
  }
}
