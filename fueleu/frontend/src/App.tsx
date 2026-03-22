import { useState } from 'react';
import { RoutesTab } from './adapters/ui/components/RoutesTab';
import { CompareTab } from './adapters/ui/components/CompareTab';
import { BankingTab } from './adapters/ui/components/BankingTab';
import { PoolingTab } from './adapters/ui/components/PoolingTab';
import {
  RouteApiAdapter,
  ComplianceApiAdapter,
  BankingApiAdapter,
  PoolApiAdapter,
} from './adapters/infrastructure/apiClient';

const routeApi = new RouteApiAdapter();
const complianceApi = new ComplianceApiAdapter();
const bankingApi = new BankingApiAdapter();
const poolApi = new PoolApiAdapter();

type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'routes', label: 'Routes', icon: '⚓' },
  { id: 'compare', label: 'Compare', icon: '📊' },
  { id: 'banking', label: 'Banking', icon: '🏦' },
  { id: 'pooling', label: 'Pooling', icon: '🌊' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">🚢</span>
            <div>
              <h1 className="brand-title">FuelEU Maritime</h1>
              <p className="brand-subtitle">Compliance Dashboard — Regulation (EU) 2023/1805</p>
            </div>
          </div>
          <div className="header-meta">
            <span className="meta-badge">Target 2025</span>
            <span className="meta-value">89.3368 gCO₂e/MJ</span>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="tab-content">
        {activeTab === 'routes' && <RoutesTab routeApi={routeApi} />}
        {activeTab === 'compare' && <CompareTab routeApi={routeApi} />}
        {activeTab === 'banking' && (
          <BankingTab complianceApi={complianceApi} bankingApi={bankingApi} />
        )}
        {activeTab === 'pooling' && (
          <PoolingTab complianceApi={complianceApi} poolApi={poolApi} />
        )}
      </main>

      <footer className="app-footer">
        FuelEU Maritime Compliance Platform · EU Regulation 2023/1805 · Annex IV &amp; Articles 20–21
      </footer>
    </div>
  );
}
