export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  type: 'banked' | 'applied';
  createdAt: Date;
}

export interface BankingResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

export function validateBankSurplus(cbGco2eq: number): void {
  if (cbGco2eq <= 0) {
    throw new Error('Cannot bank: Compliance Balance is zero or negative (deficit).');
  }
}

export function validateApplyBanked(
  requestedAmount: number,
  availableBanked: number,
  currentCb: number
): void {
  if (requestedAmount <= 0) {
    throw new Error('Amount to apply must be positive.');
  }
  if (requestedAmount > availableBanked) {
    throw new Error(
      `Cannot apply ${requestedAmount}: only ${availableBanked} available in bank.`
    );
  }
  if (currentCb >= 0) {
    throw new Error('No deficit to cover: current CB is non-negative.');
  }
}
