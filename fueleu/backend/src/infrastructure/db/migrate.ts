import { getPool, closePool } from './connection';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id VARCHAR(50) UNIQUE NOT NULL,
    ship_id VARCHAR(100) NOT NULL,
    vessel_type VARCHAR(100) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    ghg_intensity DECIMAL(10,4) NOT NULL,
    fuel_consumption DECIMAL(10,2) NOT NULL,
    distance DECIMAL(10,2) NOT NULL,
    total_emissions DECIMAL(10,4) NOT NULL,
    is_baseline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS ship_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    cb_gco2eq DECIMAL(15,4) NOT NULL,
    actual_intensity DECIMAL(10,4) NOT NULL,
    target_intensity DECIMAL(10,4) NOT NULL,
    energy_in_scope DECIMAL(15,2) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('surplus', 'deficit')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ship_id, year)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS bank_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    amount_gco2eq DECIMAL(15,4) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('banked', 'applied')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    pool_sum DECIMAL(15,4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS pool_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    ship_id VARCHAR(100) NOT NULL,
    cb_before DECIMAL(15,4) NOT NULL,
    cb_after DECIMAL(15,4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  `,
];

async function migrate(): Promise<void> {
  const pool = getPool();
  console.log('Running migrations...');
  for (const sql of migrations) {
    await pool.query(sql);
  }
  console.log('Migrations complete.');
  await closePool();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
