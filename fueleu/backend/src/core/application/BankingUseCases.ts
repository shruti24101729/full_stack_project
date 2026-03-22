import { IBankingRepository } from '../ports/IBankingRepository';
import { BankEntry, BankingResult } from '../domain/Banking';

export class GetBankingRecords {
  constructor(private readonly bankingRepo: IBankingRepository) {}

  async execute(shipId: string, year: number): Promise<BankEntry[]> {
    return this.bankingRepo.getRecords(shipId, year);
  }
}

export class BankSurplus {
  constructor(private readonly bankingRepo: IBankingRepository) {}

  async execute(shipId: string, year: number, amount?: number): Promise<BankingResult> {
    if (!shipId || !year) {
      throw new Error('shipId and year are required.');
    }
    return this.bankingRepo.bankSurplus(shipId, year, amount ?? 0);
  }
}

export class ApplyBanked {
  constructor(private readonly bankingRepo: IBankingRepository) {}

  async execute(shipId: string, year: number, amount: number): Promise<BankingResult> {
    if (!shipId || !year) {
      throw new Error('shipId and year are required.');
    }
    if (!amount || amount <= 0) {
      throw new Error('Amount must be a positive number.');
    }
    return this.bankingRepo.applyBanked(shipId, year, amount);
  }
}
