import { Router, Request, Response } from 'express';
import { CreatePool, GetAllPools } from '../../../core/application/PoolingUseCases';
import { IPoolRepository } from '../../../core/ports/IPoolRepository';

export function createPoolsRouter(poolRepo: IPoolRepository): Router {
  const router = Router();
  const createPool = new CreatePool(poolRepo);
  const getAllPools = new GetAllPools(poolRepo);

  // GET /pools
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const pools = await getAllPools.execute();
      return res.json({ data: pools, count: pools.length });
    } catch (err) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /pools  { year, members: [{ shipId, adjustedCb }] }
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { year, members } = req.body as {
        year: number;
        members: Array<{ shipId: string; adjustedCb: number }>;
      };

      if (!year || !members) {
        return res.status(400).json({ error: 'year and members are required' });
      }

      const result = await createPool.execute({ year: Number(year), members });
      return res.status(201).json({ data: result });
    } catch (err) {
      const message = (err as Error).message;
      const status = message.includes('Pool invalid') || message.includes('requires at least') ? 400 : 500;
      return res.status(status).json({ error: message });
    }
  });

  return router;
}
