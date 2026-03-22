import { useState, useCallback } from 'react';
import { ComplianceBalance, BankEntry, BankingResult } from '../../../core/domain/types';
import { IComplianceApi, IBankingApi } from '../../../core/ports/apiPorts';

interface BankingTabProps {
  complianceApi: IComplianceApi;
  bankingApi: IBankingApi;
}

export function BankingTab({ complianceApi, bankingApi }: BankingTabProps) {
  const [shipId, setShipId] = useState('SHIP-001');
  const [year, setYear] = useState(2025);
  const [cb, setCb] = useState<ComplianceBalance | null>(null);
  const [records, setRecords] = useState<BankEntry[]>([]);
  const [result, setResult] = useState<BankingResult | null>(null);
  const [applyAmount, setApplyAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const loadCb = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await complianceApi.getCb(shipId, year);
      setCb(res.data);
      const recRes = await bankingApi.getRecords(shipId, year);
      setRecords(recRes.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [complianceApi, bankingApi, shipId, year]);

  const handleBank = async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await bankingApi.bankSurplus(shipId, year);
      setResult(res.data);
      setSuccess(`Banked ${res.data.applied.toFixed(0)} gCO₂e surplus.`);
      void loadCb();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const amount = Number(applyAmount);
    if (!amount || amount <= 0) { setError('Enter a valid amount to apply.'); return; }
    setLoading(true);
    clearMessages();
    try {
      const res = await bankingApi.applyBanked(shipId, year, amount);
      setResult(res.data);
      setSuccess(`Applied ${res.data.applied.toFixed(0)} gCO₂e from bank. New CB: ${res.data.cbAfter.toFixed(0)}`);
      void loadCb();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const cbIsSurplus = cb && cb.cbGco2eq > 0;
  const cbIsDeficit = cb && cb.cbGco2eq < 0;

  return (
    <div className="space-y-6">
      {/* Ship / Year Selector */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2 items-center">
          <label className="input-label">Ship ID</label>
          <input
            className="filter-select w-32"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="input-label">Year</label>
          <select
            className="filter-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => void loadCb()} disabled={loading}>
          Load CB
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {cb && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <KpiCard
              label="Compliance Balance"
              value={cb.cbGco2eq.toFixed(0)}
              unit="gCO₂e"
              status={cbIsSurplus ? 'surplus' : 'deficit'}
            />
            <KpiCard
              label="Status"
              value={cb.status.toUpperCase()}
              status={cb.status as 'surplus' | 'deficit'}
            />
            <KpiCard
              label="Actual GHG Intensity"
              value={cb.actualIntensity.toFixed(2)}
              unit="gCO₂e/MJ"
            />
            <KpiCard
              label="Energy in Scope"
              value={(cb.energyInScope / 1_000_000).toFixed(1)}
              unit="TJ"
            />
          </div>

          {/* Actions */}
          <div className="action-panel">
            <h3 className="panel-title">Banking Actions</h3>
            <div className="flex gap-3 flex-wrap">
              <button
                className="btn-primary"
                onClick={() => void handleBank()}
                disabled={loading || !cbIsSurplus}
                title={!cbIsSurplus ? 'CB must be positive to bank surplus' : ''}
              >
                🏦 Bank Surplus
              </button>

              <div className="flex gap-2 items-center">
                <input
                  className="filter-select w-36"
                  type="number"
                  placeholder="Amount"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                />
                <button
                  className="btn-amber"
                  onClick={() => void handleApply()}
                  disabled={loading || !cbIsDeficit}
                  title={!cbIsDeficit ? 'CB must be negative to apply banked surplus' : ''}
                >
                  Apply Banked
                </button>
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="result-panel">
              <div className="grid grid-cols-3 gap-4">
                <KpiCard label="CB Before" value={result.cbBefore.toFixed(0)} unit="gCO₂e" />
                <KpiCard label="Applied" value={result.applied.toFixed(0)} unit="gCO₂e" />
                <KpiCard label="CB After" value={result.cbAfter.toFixed(0)} unit="gCO₂e" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Bank Records */}
      {records.length > 0 && (
        <div>
          <h3 className="panel-title mb-3">Banking History</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount (gCO₂e)</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={r.type === 'banked' ? 'badge-green' : 'badge-amber'}>
                        {r.type}
                      </span>
                    </td>
                    <td>{r.amountGco2eq.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label, value, unit, status,
}: { label: string; value: string; unit?: string; status?: 'surplus' | 'deficit' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${status === 'surplus' ? 'text-emerald-400' : status === 'deficit' ? 'text-rose-400' : ''}`}>
        {value}
        {unit && <span className="kpi-unit"> {unit}</span>}
      </div>
    </div>
  );
}
