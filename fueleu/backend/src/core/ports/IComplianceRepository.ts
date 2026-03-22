import { ComplianceBalance, AdjustedComplianceBalance } from '../domain/Compliance';

export interface IComplianceRepository {
  computeAndStore(shipId: string, year: number): Promise<ComplianceBalance>;
  findByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null>;
  getAdjustedCb(shipId: string, year: number): Promise<AdjustedComplianceBalance>;
}
