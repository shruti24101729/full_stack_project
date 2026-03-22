import { BankEntry, BankingResult } from '../domain/Banking';

export interface IBankingRepository {
  getRecords(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  bankSurplus(shipId: string, year: number, amount: number): Promise<BankingResult>;
  applyBanked(shipId: string, year: number, amount: number): Promise<BankingResult>;
}
