import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPool } from '../db/connection';
import { PostgresRouteRepository } from '../../adapters/outbound/postgres/RouteRepository';
import { PostgresComplianceRepository } from '../../adapters/outbound/postgres/ComplianceRepository';
import { PostgresBankingRepository } from '../../adapters/outbound/postgres/BankingRepository';
import { PostgresPoolRepository } from '../../adapters/outbound/postgres/PoolRepository';
import { createRoutesRouter } from '../../adapters/inbound/http/routesController';
import { createComplianceRouter } from '../../adapters/inbound/http/complianceController';
import { createBankingRouter } from '../../adapters/inbound/http/bankingController';
import { createPoolsRouter } from '../../adapters/inbound/http/poolsController';

dotenv.config();

export function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Dependency injection
  const db = getPool();
  const routeRepo = new PostgresRouteRepository(db);
  const complianceRepo = new PostgresComplianceRepository(db);
  const bankingRepo = new PostgresBankingRepository(db);
  const poolRepo = new PostgresPoolRepository(db);

  // Routes
  app.use('/routes', createRoutesRouter(routeRepo));
  app.use('/compliance', createComplianceRouter(complianceRepo));
  app.use('/banking', createBankingRouter(bankingRepo));
  app.use('/pools', createPoolsRouter(poolRepo));

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
