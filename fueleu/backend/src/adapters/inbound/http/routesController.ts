import { Router, Request, Response } from 'express';
import { GetAllRoutes, SetRouteBaseline, GetRouteComparison } from '../../../core/application/RouteUseCases';
import { IRouteRepository } from '../../../core/ports/IRouteRepository';

export function createRoutesRouter(routeRepo: IRouteRepository): Router {
  const router = Router();
  const getAllRoutes = new GetAllRoutes(routeRepo);
  const setBaseline = new SetRouteBaseline(routeRepo);
  const getComparison = new GetRouteComparison(routeRepo);

  // GET /routes
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { vesselType, fuelType, year } = req.query;
      const routes = await getAllRoutes.execute({
        vesselType: vesselType as string | undefined,
        fuelType: fuelType as string | undefined,
        year: year ? Number(year) : undefined,
      });
      res.json({ data: routes, count: routes.length });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /routes/comparison
  router.get('/comparison', async (req: Request, res: Response) => {
    try {
      const { shipId } = req.query;
      const comparisons = await getComparison.execute(shipId as string | undefined);
      res.json({ data: comparisons, count: comparisons.length });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /routes/:id/baseline
  router.post('/:id/baseline', async (req: Request, res: Response) => {
    try {
      const route = await setBaseline.execute(req.params.id);
      res.json({ data: route, message: 'Baseline set successfully' });
    } catch (err) {
      const message = (err as Error).message;
      const status = message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: message });
    }
  });

  return router;
}
