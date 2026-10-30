import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingDown, 
  ShieldAlert, 
  Info,
  Sliders,
  Cpu
} from 'lucide-react';

export default function DataDriftAlerts({ driftData, onSimulateDrift, isSimulating }) {
  const [activeScenario, setActiveScenario] = useState('economic_downturn');

  const handleSimulate = (scenario) => {
    setActiveScenario(scenario);
    onSimulateDrift(scenario, 1500);
  };

  const status = driftData?.system_status || 'HEALTHY';
  const features = driftData?.features || [
    { feature: 'annual_income_k', ks_statistic: 0.024, p_value: 0.42, psi: 0.035, severity: 'STABLE', status_badge: 'Stable', baseline_mean: 65.4, current_mean: 65.1, mean_shift_pct: -0.5 },
    { feature: 'loyalty_tier', ks_statistic: 0.018, p_value: 0.68, psi: 0.022, severity: 'STABLE', status_badge: 'Stable', baseline_mean: 1.87, current_mean: 1.86, mean_shift_pct: -0.5 },
    { feature: 'recency_days', ks_statistic: 0.031, p_value: 0.28, psi: 0.041, severity: 'STABLE', status_badge: 'Stable', baseline_mean: 36.8, current_mean: 37.2, mean_shift_pct: 1.1 },
    { feature: 'website_visits_30d', ks_statistic: 0.027, p_value: 0.35, psi: 0.038, severity: 'STABLE', status_badge: 'Stable', baseline_mean: 6.7, current_mean: 6.6, mean_shift_pct: -1.5 },
    { feature: 'historical_discount_usage', ks_statistic: 0.022, p_value: 0.51, psi: 0.029, severity: 'STABLE', status_badge: 'Stable', baseline_mean: 0.44, current_mean: 0.44, mean_shift_pct: 0.0 }
  ];

  const getStatusBadge = (sev) => {
    if (sev === 'CRITICAL_DRIFT') return <span className="badge badge-rose">Critical Shift</span>;
    if (sev === 'MODERATE_DRIFT') return <span className="badge badge-amber">Moderate Shift</span>;
    return <span className="badge badge-emerald">Stable</span>;
  };

  return (
    <div className="tab-pane animate-fade-in">
      {/* Week 4 Header */}
      <div className="glass-panel pane-header-card">
        <div className="pane-header-left">
          <div className="badge badge-blue">Week 4 Milestone</div>
          <h2>Automated Customer Data Drift Detector</h2>
          <p className="text-muted">
            Monitors incoming customer traffic for behavioral distribution shifts via 
            <strong> Kolmogorov-Smirnov (KS) two-sample tests</strong> and <strong>Population Stability Index (PSI)</strong>. 
            Warns marketing teams when macro-environmental changes alter price elasticity.
          </p>
        </div>

        <div className={`badge ${status === 'HEALTHY' ? 'badge-emerald' : status === 'WARNING' ? 'badge-amber' : 'badge-rose'}`}>
          <Activity size={16} />
          <span>Status: {status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* System Status Alert Banner */}
      <div className={`glass-panel-glow drift-status-banner ${status === 'ACTION_REQUIRED' ? 'banner-critical' : status === 'WARNING' ? 'banner-warning' : 'banner-healthy'}`}>
        <div className="banner-status-icon">
          {status === 'ACTION_REQUIRED' ? (
            <ShieldAlert size={36} className="text-rose" />
          ) : status === 'WARNING' ? (
            <AlertTriangle size={36} className="text-amber" />
          ) : (
            <CheckCircle2 size={36} className="text-emerald" />
          )}
        </div>
        <div className="banner-status-content">
          <h3>
            {status === 'ACTION_REQUIRED'
              ? 'Severe Customer Distribution Drift Detected'
              : status === 'WARNING'
              ? 'Moderate Covariate Shift Observed'
              : 'All Covariate Distributions Stable (PSI < 0.10)'}
          </h3>
          <p className="text-sm text-muted">
            {driftData?.recommendation || 'Covariates match baseline training conditions. Prescriptive model remains valid.'}
          </p>
        </div>
      </div>

      {/* Live Simulation Trigger Controls */}
      <div className="glass-panel simulation-control-card">
        <div className="sim-header">
          <Sliders size={18} className="text-blue" />
          <h4>Live Behavioral Shift Simulation</h4>
          <span className="text-sm text-dim">Simulate real-world customer shifts to test automated alerting:</span>
        </div>

        <div className="sim-buttons-row">
          <button
            className={`btn ${activeScenario === 'economic_downturn' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSimulate('economic_downturn')}
            disabled={isSimulating}
          >
            {isSimulating && activeScenario === 'economic_downturn' ? <RefreshCw size={14} className="spin" /> : null}
            <span>Simulate Economic Downturn (Income &darr; Price Sensitivity &uarr;)</span>
          </button>

          <button
            className={`btn ${activeScenario === 'dormancy_spike' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSimulate('dormancy_spike')}
            disabled={isSimulating}
          >
            {isSimulating && activeScenario === 'dormancy_spike' ? <RefreshCw size={14} className="spin" /> : null}
            <span>Simulate Dormancy Spike (Recency &uarr; Activity &darr;)</span>
          </button>

          <button
            className={`btn ${activeScenario === 'normal_sample' ? 'btn-emerald' : 'btn-secondary'}`}
            onClick={() => handleSimulate('normal_sample')}
            disabled={isSimulating}
          >
            {isSimulating && activeScenario === 'normal_sample' ? <RefreshCw size={14} className="spin" /> : null}
            <span>Reset to Stable Sample</span>
          </button>
        </div>
      </div>

      {/* Monitored Features Drift Table */}
      <div className="glass-panel drift-table-card">
        <div className="card-header">
          <h3>Feature-by-Feature Distribution Metrics</h3>
          <span className="text-sm text-dim">
            Monitored Baseline: {driftData?.monitored_samples_baseline || 3000} profiles | Incoming Batch: {driftData?.monitored_samples_current || 1500} profiles
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature Monitored</th>
                <th>Baseline Mean</th>
                <th>Incoming Mean</th>
                <th>Shift %</th>
                <th>KS Statistic (D)</th>
                <th>p-value</th>
                <th>PSI Score</th>
                <th>Health Status</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.feature}>
                  <td className="font-semibold text-bright">{f.feature.replace(/_/g, ' ')}</td>
                  <td className="font-mono text-dim">{f.baseline_mean}</td>
                  <td className="font-mono text-bright">{f.current_mean}</td>
                  <td className={`font-mono font-bold ${Math.abs(f.mean_shift_pct) > 10 ? 'text-rose' : 'text-blue'}`}>
                    {f.mean_shift_pct > 0 ? `+${f.mean_shift_pct}%` : `${f.mean_shift_pct}%`}
                  </td>
                  <td className="font-mono">{f.ks_statistic}</td>
                  <td className={`font-mono ${f.p_value < 0.05 ? 'text-rose font-bold' : 'text-dim'}`}>
                    {f.p_value}
                  </td>
                  <td className={`font-mono font-bold ${f.psi >= 0.25 ? 'text-rose' : f.psi >= 0.10 ? 'text-amber' : 'text-emerald'}`}>
                    {f.psi}
                  </td>
                  <td>{getStatusBadge(f.severity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Callout */}
      <div className="glass-panel drift-footer-info">
        <Info size={18} className="text-blue" />
        <p className="text-sm text-muted">
          <strong>Why Drift Invalidates Causal Models:</strong> Predictive models only fail when relationships between X and Y break. 
          Causal models are even more sensitive: if the distribution of confounders W changes (e.g. population becomes more price-conscious), 
          the estimated treatment effect $\tau(X)$ changes magnitude, requiring a model re-fit to avoid misallocating promotional budget.
        </p>
      </div>
    </div>
  );
}
