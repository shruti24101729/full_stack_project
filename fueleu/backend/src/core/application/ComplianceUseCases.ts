import { IComplianceRepository } from '../ports/IComplianceRepository';
import { ComplianceBalance, AdjustedComplianceBalance } from '../domain/Compliance';

export class ComputeComplianceBalance {
  constructor(private readonly complianceRepo: IComplianceRepository) {}

  async execute(shipId: string, year: number): Promise<ComplianceBalance> {
    if (!shipId || !year) {
      throw new Error('shipId and year are required.');
    }
    return this.complianceRepo.computeAndStore(shipId, year);
  }
}

export class GetAdjustedComplianceBalance {
  constructor(private readonly complianceRepo: IComplianceRepository) {}

  async execute(shipId: string, year: number): Promise<AdjustedComplianceBalance> {
    if (!shipId || !year) {
      throw new Error('shipId and year are required.');
    }
    return this.complianceRepo.getAdjustedCb(shipId, year);
  }
}
