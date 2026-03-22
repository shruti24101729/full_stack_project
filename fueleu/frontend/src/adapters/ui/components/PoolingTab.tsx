import { useState } from 'react';
import { AdjustedComplianceBalance, PoolAllocationResult, PoolMember } from '../../../core/domain/types';
import { IComplianceApi, IPoolApi } from '../../../core/ports/apiPorts';

interface PoolingTabProps {
  complianceApi: IComplianceApi;
  poolApi: IPoolApi;
}

interface MemberInput {
  shipId: string;
  year: string;
  adjustedCb?: number;
  loading: boolean;
}

export function PoolingTab({ complianceApi, poolApi }: PoolingTabProps) {
  const [year, setYear] = useState(2025);
  const [members, setMembers] = useState<MemberInput[]>([
    { shipId: 'SHIP-001', year: '2025', loading: false },
    { shipId: 'SHIP-002', year: '2025', loading: false },
  ]);
  const [result, setResult] = useState<PoolAllocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const poolSum = members.reduce((s, m) => s + (m.adjustedCb ?? 0), 0);
  const poolValid = poolSum >= 0 && members.every((m) => m.adjustedCb !== undefined);

  const fetchMemberCb = async (idx: number) => {
    const m = members[idx];
    if (!m.shipId) return;
    const updated = [...members];
    updated[idx] = { ...updated[idx], loading: true };
    setMembers(updated);
    try {
      const res = await complianceApi.getAdjustedCb(m.shipId, Number(m.year));
      const done = [...members];
      done[idx] = { ...done[idx], adjustedCb: res.data.cbAfterBanking, loading: false };
      setMembers(done);
    } catch (e) {
      const done = [...members];
      done[idx] = { ...done[idx], loading: false };
      setMembers(done);
      setError(`Could not load CB for ${m.shipId}: ${(e as Error).message}`);
    }
  };

  const addMember = () => {
    setMembers([...members, { shipId: '', year: String(year), loading: false }]);
  };

  const removeMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleCreatePool = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const poolMembers = members.map((m) => ({
        shipId: m.shipId,
        adjustedCb: m.adjustedCb ?? 0,
      }));
      const res = await poolApi.createPool(year, poolMembers);
      setResult(res.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="info-box">
        <span className="info-label">FuelEU Article 21 – Pooling</span>
        <span className="info-note">Pool sum must be ≥ 0. Surplus ships cannot exit negative. Deficit ships cannot exit worse.</span>
      </div>

      {/* Year selector */}
      <div className="flex gap-3 items-center">
        <label className="input-label">Pool Year</label>
        <select
          className="filter-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
        </select>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="panel-title">Pool Members</h3>
          <button className="btn-secondary text-sm" onClick={addMember}>+ Add Member</button>
        </div>

        {members.map((m, idx) => (
          <div key={idx} className="member-row">
            <input
              className="filter-select flex-1"
              placeholder="Ship ID"
              value={m.shipId}
              onChange={(e) => {
                const updated = [...members];
                updated[idx] = { ...updated[idx], shipId: e.target.value, adjustedCb: undefined };
                setMembers(updated);
              }}
            />
            <button
              className="btn-secondary text-sm"
              onClick={() => void fetchMemberCb(idx)}
              disabled={m.loading || !m.shipId}
            >
              {m.loading ? '...' : 'Load CB'}
            </button>
            <div className={`cb-badge ${m.adjustedCb === undefined ? 'cb-unknown' : m.adjustedCb >= 0 ? 'cb-surplus' : 'cb-deficit'}`}>
              {m.adjustedCb !== undefined
                ? `${m.adjustedCb >= 0 ? '+' : ''}${m.adjustedCb.toFixed(0)} gCO₂e`
                : '—'}
            </div>
            <button
              className="btn-danger-sm"
              onClick={() => removeMember(idx)}
              disabled={members.length <= 2}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Pool Sum Indicator */}
      <div className={`pool-sum-indicator ${poolSum >= 0 ? 'pool-valid' : 'pool-invalid'}`}>
        Pool Sum: {poolSum >= 0 ? '+' : ''}{poolSum.toFixed(0)} gCO₂e
        {poolSum >= 0 ? ' ✅ Valid' : ' ❌ Invalid (sum must be ≥ 0)'}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <button
        className="btn-primary"
        onClick={() => void handleCreatePool()}
        disabled={!poolValid || submitting}
      >
        {submitting ? 'Creating Pool...' : 'Create Pool'}
      </button>

      {/* Result */}
      {result && (
        <div className="result-panel space-y-3">
          <h3 className="panel-title">Pool Created — Allocation Results</h3>
          <div className="text-sm text-slate-400 font-mono">Pool ID: {result.poolId}</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ship ID</th>
                  <th>CB Before</th>
                  <th>CB After</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {result.members.map((m: PoolMember) => {
                  const change = m.cbAfter - m.cbBefore;
                  return (
                    <tr key={m.shipId}>
                      <td className="font-mono">{m.shipId}</td>
                      <td className={m.cbBefore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.cbBefore.toFixed(0)}
                      </td>
                      <td className={m.cbAfter >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.cbAfter.toFixed(0)}
                      </td>
                      <td className={change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {change >= 0 ? '+' : ''}{change.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
