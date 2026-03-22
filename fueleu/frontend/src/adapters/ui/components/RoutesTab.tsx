import { useState, useEffect, useCallback } from 'react';
import { Route } from '../../../core/domain/types';
import { IRouteApi, RouteFilters } from '../../../core/ports/apiPorts';

interface RoutesTabProps {
  routeApi: IRouteApi;
}

export function RoutesTab({ routeApi }: RoutesTabProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baselineMsg, setBaselineMsg] = useState<string | null>(null);
  const [filters, setFilters] = useState<RouteFilters>({});

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await routeApi.getRoutes(filters);
      setRoutes(res.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [routeApi, filters]);

  useEffect(() => { void loadRoutes(); }, [loadRoutes]);

  const handleSetBaseline = async (routeId: string) => {
    try {
      const res = await routeApi.setBaseline(routeId);
      setBaselineMsg(res.message);
      void loadRoutes();
      setTimeout(() => setBaselineMsg(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const vesselTypes = [...new Set(routes.map((r) => r.vesselType))];
  const fuelTypes = [...new Set(routes.map((r) => r.fuelType))];
  const years = [...new Set(routes.map((r) => r.year))].sort();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="filter-select"
          value={filters.vesselType ?? ''}
          onChange={(e) => setFilters({ ...filters, vesselType: e.target.value || undefined })}
        >
          <option value="">All Vessel Types</option>
          {vesselTypes.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          className="filter-select"
          value={filters.fuelType ?? ''}
          onChange={(e) => setFilters({ ...filters, fuelType: e.target.value || undefined })}
        >
          <option value="">All Fuel Types</option>
          {fuelTypes.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          className="filter-select"
          value={filters.year ?? ''}
          onChange={(e) => setFilters({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn-secondary" onClick={loadRoutes}>Refresh</button>
      </div>

      {baselineMsg && (
        <div className="alert-success">{baselineMsg}</div>
      )}
      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading routes...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Vessel Type</th>
                <th>Fuel Type</th>
                <th>Year</th>
                <th>GHG Intensity<br /><span className="unit">gCO₂e/MJ</span></th>
                <th>Fuel Consumption<br /><span className="unit">tonnes</span></th>
                <th>Distance<br /><span className="unit">km</span></th>
                <th>Total Emissions<br /><span className="unit">t CO₂e</span></th>
                <th>Baseline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className={r.isBaseline ? 'baseline-row' : ''}>
                  <td className="font-mono font-medium">{r.routeId}</td>
                  <td>{r.vesselType}</td>
                  <td>
                    <span className="fuel-badge">{r.fuelType}</span>
                  </td>
                  <td>{r.year}</td>
                  <td className={r.ghgIntensity <= 89.3368 ? 'text-emerald-400' : 'text-rose-400'}>
                    {r.ghgIntensity.toFixed(1)}
                  </td>
                  <td>{r.fuelConsumption.toLocaleString()}</td>
                  <td>{r.distance.toLocaleString()}</td>
                  <td>{r.totalEmissions.toFixed(2)}</td>
                  <td>{r.isBaseline ? <span className="badge-green">✓ Baseline</span> : '—'}</td>
                  <td>
                    {!r.isBaseline && (
                      <button
                        className="btn-action"
                        onClick={() => void handleSetBaseline(r.routeId)}
                      >
                        Set Baseline
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
