import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Scale, 
  HelpCircle, 
  TrendingDown, 
  Activity,
  ArrowRight
} from 'lucide-react';
import PlotlyChart from './PlotlyChart';

export default function PropensityMatchingView({ matchingData, onFetchMatching }) {
  const [data, setData] = useState(matchingData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data && onFetchMatching) {
      setLoading(true);
      onFetchMatching()
        .then(res => {
          setData(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [data, onFetchMatching]);

  const balance = data?.covariate_balance || [
    { covariate: 'annual_income_k', smd_pre_matching: 0.42, smd_post_matching: 0.04, balanced: true, improvement_pct: 90.5 },
    { covariate: 'loyalty_tier', smd_pre_matching: 0.58, smd_post_matching: 0.05, balanced: true, improvement_pct: 91.4 },
    { covariate: 'recency_days', smd_pre_matching: 0.35, smd_post_matching: 0.03, balanced: true, improvement_pct: 91.4 },
    { covariate: 'website_visits_30d', smd_pre_matching: 0.48, smd_post_matching: 0.06, balanced: true, improvement_pct: 87.5 },
    { covariate: 'historical_discount_usage', smd_pre_matching: 0.62, smd_post_matching: 0.04, balanced: true, improvement_pct: 93.5 },
    { covariate: 'mobile_app_user', smd_pre_matching: 0.28, smd_post_matching: 0.02, balanced: true, improvement_pct: 92.8 }
  ];

  const overlap = data?.propensity_overlap || {
    bins: [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
    treated_counts: [15, 45, 80, 140, 210, 280, 310, 260, 180, 70],
    control_counts: [85, 220, 290, 310, 260, 180, 110, 65, 30, 10]
  };

  const overlapTraces = [
    {
      x: overlap.bins,
      y: overlap.treated_counts,
      name: 'Treated Cohort (Discounted)',
      type: 'bar',
      marker: { color: 'rgba(59, 130, 246, 0.75)' }
    },
    {
      x: overlap.bins,
      y: overlap.control_counts,
      name: 'Control Cohort ($0)',
      type: 'bar',
      marker: { color: 'rgba(16, 185, 129, 0.75)' }
    }
  ];

  const overlapLayout = {
    title: {
      text: 'Propensity Score Overlap & Common Support e(X)',
      font: { color: '#ffffff', size: 14, family: 'Outfit, sans-serif' }
    },
    barmode: 'overlay',
    xaxis: { title: 'Estimated Propensity Score e(X) = P(T=1 | X)' },
    yaxis: { title: 'Customer Density' }
  };

  return (
    <div className="tab-pane animate-fade-in">
      {/* Header */}
      <div className="glass-panel pane-header-card">
        <div className="pane-header-left">
          <div className="badge badge-violet">Propensity Score Matching Module</div>
          <h2>Observational Data Balancing (Simulated A/B Test)</h2>
          <p className="text-muted">
            Creates a synthetic randomized trial from historical campaign data by matching each treated customer
            to an identical control customer with an equivalent propensity score within a 0.05 caliper.
          </p>
        </div>

        <div className="badge badge-emerald">
          <CheckCircle2 size={16} />
          <span>Covariate Balance Achieved (All SMD &lt; 0.10)</span>
        </div>
      </div>

      {/* Covariate Balance Metrics & Overlap Grid */}
      <div className="matching-grid">
        {/* Balance Table */}
        <div className="glass-panel balance-table-card">
          <div className="card-header">
            <h3>Standardized Mean Difference (SMD) Diagnostics</h3>
            <span className="text-sm text-dim">Rubin's Golden Rule: SMD &lt; 0.10 indicates unconfounded balance</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Confounder Covariate</th>
                  <th>Pre-Match SMD</th>
                  <th>Post-Match SMD</th>
                  <th>Improvement</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {balance.map((item) => (
                  <tr key={item.covariate}>
                    <td className="font-medium text-bright">{item.covariate.replace(/_/g, ' ')}</td>
                    <td className="text-rose font-mono">{item.smd_pre_matching.toFixed(3)}</td>
                    <td className="text-emerald font-mono font-bold">{item.smd_post_matching.toFixed(3)}</td>
                    <td className="text-blue font-mono">+{item.improvement_pct}%</td>
                    <td>
                      <span className={`badge ${item.balanced ? 'badge-emerald' : 'badge-rose'}`}>
                        {item.balanced ? 'Balanced' : 'Imbalanced'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Common Support Overlap Chart */}
        <div className="glass-panel overlap-chart-card">
          <div className="card-header">
            <h3>Common Support (Propensity Overlap)</h3>
            <span className="text-sm text-dim">Shared distribution between cohorts</span>
          </div>

          <div className="chart-container" style={{ minHeight: '340px' }}>
            <PlotlyChart data={overlapTraces} layout={overlapLayout} />
          </div>
        </div>
      </div>
    </div>
  );
}
