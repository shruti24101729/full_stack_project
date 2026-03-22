import { Router, Request, Response } from 'express';
import { GetBankingRecords, BankSurplus, ApplyBanked } from '../../../core/application/BankingUseCases';
import { IBankingRepository } from '../../../core/ports/IBankingRepository';

export function createBankingRouter(bankingRepo: IBankingRepository): Router {
  const router = Router();
  const getRecords = new GetBankingRecords(bankingRepo);
  const bankSurplus = new BankSurplus(bankingRepo);
  const applyBanked = new ApplyBanked(bankingRepo);

  // GET /banking/records?shipId=&year=
  router.get('/records', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }
      const records = await getRecords.execute(shipId as string, Number(year));
      return res.json({ data: records, count: records.length });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /banking/bank  { shipId, year, amount? }
  router.post('/bank', async (req: Request, res: Response) => {
    try {
      const { shipId, year, amount } = req.body as { shipId: string; year: number; amount?: number };
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year are required' });
      }
      const result = await bankSurplus.execute(shipId, Number(year), amount);
      return res.json({ data: result });
    } catch (err) {
      const message = (err as Error).message;
      const status = message.includes('Cannot bank') ? 400 : 500;
      return res.status(status).json({ error: message });
    }
  });

  // POST /banking/apply  { shipId, year, amount }
  router.post('/apply', async (req: Request, res: Response) => {
    try {
      const { shipId, year, amount } = req.body as { shipId: string; year: number; amount: number };
      if (!shipId || !year || !amount) {
        return res.status(400).json({ error: 'shipId, year, and amount are required' });
      }
      const result = await applyBanked.execute(shipId, Number(year), Number(amount));
      return res.json({ data: result });
    } catch (err) {
      const message = (err as Error).message;
      const status = message.includes('Cannot apply') || message.includes('No deficit') ? 400 : 500;
      return res.status(status).json({ error: message });
    }
  });

  return router;
}
