import { getPool, closePool } from './connection';

const seedRoutes = [
  {
    route_id: 'R001',
    ship_id: 'SHIP-001',
    vessel_type: 'Container',
    fuel_type: 'HFO',
    year: 2024,
    ghg_intensity: 91.0,
    fuel_consumption: 5000,
    distance: 12000,
    total_emissions: (91.0 * 5000 * 41000) / 1_000_000,
    is_baseline: true,
  },
  {
    route_id: 'R002',
    ship_id: 'SHIP-002',
    vessel_type: 'BulkCarrier',
    fuel_type: 'LNG',
    year: 2024,
    ghg_intensity: 88.0,
    fuel_consumption: 4800,
    distance: 11500,
    total_emissions: (88.0 * 4800 * 41000) / 1_000_000,
    is_baseline: false,
  },
  {
    route_id: 'R003',
    ship_id: 'SHIP-003',
    vessel_type: 'Tanker',
    fuel_type: 'MGO',
    year: 2024,
    ghg_intensity: 93.5,
    fuel_consumption: 5100,
    distance: 12500,
    total_emissions: (93.5 * 5100 * 41000) / 1_000_000,
    is_baseline: false,
  },
  {
    route_id: 'R004',
    ship_id: 'SHIP-004',
    vessel_type: 'RoRo',
    fuel_type: 'HFO',
    year: 2025,
    ghg_intensity: 89.2,
    fuel_consumption: 4900,
    distance: 11800,
    total_emissions: (89.2 * 4900 * 41000) / 1_000_000,
    is_baseline: false,
  },
  {
    route_id: 'R005',
    ship_id: 'SHIP-005',
    vessel_type: 'Container',
    fuel_type: 'LNG',
    year: 2025,
    ghg_intensity: 90.5,
    fuel_consumption: 4950,
    distance: 11900,
    total_emissions: (90.5 * 4950 * 41000) / 1_000_000,
    is_baseline: false,
  },
];

async function seed(): Promise<void> {
  const pool = getPool();
  console.log('Seeding database...');

  for (const route of seedRoutes) {
    await pool.query(
      `INSERT INTO routes (route_id, ship_id, vessel_type, fuel_type, year, ghg_intensity,
       fuel_consumption, distance, total_emissions, is_baseline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (route_id) DO NOTHING`,
      [
        route.route_id, route.ship_id, route.vessel_type, route.fuel_type,
        route.year, route.ghg_intensity, route.fuel_consumption,
        route.distance, route.total_emissions, route.is_baseline,
      ]
    );
  }

  console.log('Seed complete.');
  await closePool();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
