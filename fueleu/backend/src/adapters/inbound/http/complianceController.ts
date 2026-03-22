import { Router, Request, Response } from 'express';
import { ComputeComplianceBalance, GetAdjustedComplianceBalance } from '../../../core/application/ComplianceUseCases';
import { IComplianceRepository } from '../../../core/ports/IComplianceRepository';

export function createComplianceRouter(complianceRepo: IComplianceRepository): Router {
  const router = Router();
  const computeCb = new ComputeComplianceBalance(complianceRepo);
  const getAdjustedCb = new GetAdjustedComplianceBalance(complianceRepo);

  // GET /compliance/cb?shipId=&year=
  router.get('/cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year query params required' });
      }
      const cb = await computeCb.execute(shipId as string, Number(year));
      return res.json({ data: cb });
    } catch (err) {
      const message = (err as Error).message;
      const status = message.includes('No route data') ? 404 : 500;
      return res.status(status).json({ error: message });
    }
  });

  // GET /compliance/adjusted-cb?shipId=&year=
  router.get('/adjusted-cb', async (req: Request, res: Response) => {
    try {
      const { shipId, year } = req.query;
      if (!shipId || !year) {
        return res.status(400).json({ error: 'shipId and year query params required' });
      }
      const adjustedCb = await getAdjustedCb.execute(shipId as string, Number(year));
      return res.json({ data: adjustedCb });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
