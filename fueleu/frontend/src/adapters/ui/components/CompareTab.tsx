import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { RouteComparison, TARGET_GHG_INTENSITY } from '../../../core/domain/types';
import { IRouteApi } from '../../../core/ports/apiPorts';

interface CompareTabProps {
  routeApi: IRouteApi;
}

export function CompareTab({ routeApi }: CompareTabProps) {
  const [comparisons, setComparisons] = useState<RouteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComparisons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await routeApi.getComparison();
      setComparisons(res.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [routeApi]);

  useEffect(() => { void loadComparisons(); }, [loadComparisons]);

  const chartData = comparisons.flatMap((c) => [
    {
      name: `${c.baseline.routeId} (baseline)`,
      ghgIntensity: c.baseline.ghgIntensity,
      type: 'baseline',
    },
    {
      name: c.comparison.routeId,
      ghgIntensity: c.comparison.ghgIntensity,
      type: c.compliant ? 'compliant' : 'non-compliant',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="info-box">
        <span className="info-label">Target GHG Intensity (2025)</span>
        <span className="info-value">{TARGET_GHG_INTENSITY} gCO₂e/MJ</span>
        <span className="info-note">2% below 91.16 gCO₂e/MJ</span>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading comparison data...</div>
      ) : comparisons.length === 0 ? (
        <div className="empty-state">
          No comparison data. Set a baseline route in the Routes tab first.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="chart-card">
            <h3 className="chart-title">GHG Intensity Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={[80, 100]}
                  label={{ value: 'gCO₂e/MJ', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <ReferenceLine
                  y={TARGET_GHG_INTENSITY}
                  stroke="#f59e0b"
                  strokeDasharray="6 4"
                  label={{ value: 'Target', fill: '#f59e0b', fontSize: 11 }}
                />
                <Bar dataKey="ghgIntensity" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.type === 'baseline'
                          ? '#3b82f6'
                          : entry.type === 'compliant'
                          ? '#10b981'
                          : '#f43f5e'
                      }
                    />
                  ))}
                </Bar>
                <Legend
                  content={() => (
                    <div className="flex gap-4 justify-center mt-2">
                      {[
                        { color: '#3b82f6', label: 'Baseline' },
                        { color: '#10b981', label: 'Compliant' },
                        { color: '#f43f5e', label: 'Non-Compliant' },
                        { color: '#f59e0b', label: 'Target', dash: true },
                      ].map(({ color, label, dash }) => (
                        <span key={label} className="flex items-center gap-1 text-xs text-slate-400">
                          <span style={{
                            display: 'inline-block', width: 12, height: 3,
                            background: color,
                            borderTop: dash ? `2px dashed ${color}` : 'none',
                            borderRadius: 2,
                          }} />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Baseline Route</th>
                  <th>Baseline GHG<br /><span className="unit">gCO₂e/MJ</span></th>
                  <th>Comparison Route</th>
                  <th>Comparison GHG<br /><span className="unit">gCO₂e/MJ</span></th>
                  <th>% Difference</th>
                  <th>Compliant</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c, i) => (
                  <tr key={i}>
                    <td className="font-mono">{c.baseline.routeId}</td>
                    <td>{c.baseline.ghgIntensity.toFixed(2)}</td>
                    <td className="font-mono">{c.comparison.routeId}</td>
                    <td>{c.comparison.ghgIntensity.toFixed(2)}</td>
                    <td className={c.percentDiff < 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {c.percentDiff > 0 ? '+' : ''}{c.percentDiff.toFixed(2)}%
                    </td>
                    <td>{c.compliant ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
