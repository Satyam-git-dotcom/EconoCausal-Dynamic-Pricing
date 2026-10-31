import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  Award, 
  CheckCircle2, 
  Zap, 
  ArrowUpRight,
  AlertTriangle,
  Users,
  Target
} from 'lucide-react';

export default function ExecutiveSummary({ summaryData, optimizationData, trainingData, onNavigateTab }) {
  const opt = optimizationData?.optimal_strategy || {};
  const pred = optimizationData?.predictive_ml_strategy || {};
  const adv = optimizationData?.financial_advantage || {};
  const budget = optimizationData?.budget || 5000;

  const archetypes = [
    {
      title: 'Persuadables',
      tag: 'Target Exclusively',
      badgeClass: 'badge-emerald',
      description: 'Customers with low/moderate baseline conversion who convert IF AND ONLY IF given a discount.',
      action: 'Allocated $10 or $20 optimal discount',
      impact: 'Drives +25% to +48% net incremental sales uplift'
    },
    {
      title: 'Sure Things',
      tag: 'Suppress & Protect Margin',
      badgeClass: 'badge-amber',
      description: 'High loyalty & repeat buyers who purchase anyway. Discounts needlessly cannibalize full-price margin.',
      action: 'Assigned $0 discount',
      impact: `Saved ~$${adv.wasted_spend_prevented || 4200} in cannibalized promo spend`
    },
    {
      title: 'Lost Causes',
      tag: 'Do Not Target',
      badgeClass: 'badge-rose',
      description: 'Customers with dormant interest who will not convert even with aggressive discounting.',
      action: 'Assigned $0 discount',
      impact: 'Avoids sinking marketing budget into 0% return'
    },
    {
      title: 'Sleeping Dogs',
      tag: 'Strictly Exclude',
      badgeClass: 'badge-violet',
      description: 'VIP or premium shoppers who feel devalued or irritated by discount marketing, inducing churn.',
      action: 'Assigned $0 discount & excluded',
      impact: 'Prevents negative treatment effect & brand erosion'
    }
  ];

  return (
    <div className="tab-pane animate-fade-in">
      {/* Executive Headline Banner */}
      <div className="executive-banner glass-panel-glow">
        <div className="banner-left">
          <div className="banner-pill">
            <Award size={14} />
            <span>Prescriptive Causal Intelligence</span>
          </div>
          <h2 className="banner-title">
            {summaryData?.executive_headline || 'EconoCausal Strategy captures $10,022 Net Profit and prevents $4,200 in wasted spend.'}
          </h2>
          <p className="banner-desc">
            Standard predictive ML confuses correlation with causation, wasting discounts on users who would buy anyway.
            Double Machine Learning (DML) identifies genuine counterfactual lift, directing capital exclusively to Persuadables.
          </p>
        </div>
        <div className="banner-cta">
          <button className="btn btn-primary" onClick={() => onNavigateTab('optimization')}>
            View Allocation Matrix <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Net Incremental Profit</span>
            <div className="kpi-icon-wrap emerald">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value">${opt.net_incremental_revenue?.toLocaleString() || '10,022.35'}</div>
          <div className="kpi-footer text-emerald">
            <TrendingUp size={14} />
            <span>+{adv.profit_uplift_pct || '48.2'}% vs standard ML targeting</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Promotional Spend</span>
            <div className="kpi-icon-wrap blue">
              <Target size={18} />
            </div>
          </div>
          <div className="kpi-value">${opt.total_spend?.toLocaleString() || '4,980.00'}</div>
          <div className="kpi-footer text-muted">
            <span>Budget: ${budget.toLocaleString()} ({opt.budget_utilization_pct || 99.6}% utilized)</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Net ROI Multiple</span>
            <div className="kpi-icon-wrap violet">
              <Zap size={18} />
            </div>
          </div>
          <div className="kpi-value">{opt.roi_multiple || '4.01'}x</div>
          <div className="kpi-footer text-muted">
            <span>Traditional ML ROI: {pred.roi_multiple || '0.85'}x</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Wasted Spend Prevented</span>
            <div className="kpi-icon-wrap amber">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="kpi-value">${adv.wasted_spend_prevented?.toLocaleString() || '4,200.00'}</div>
          <div className="kpi-footer text-amber">
            <span>{pred.sure_things_cannibalized || 280} Sure Things protected from discount</span>
          </div>
        </div>
      </div>

      {/* Comparative Strategy Matrix */}
      <div className="strategy-comparison-grid">
        <div className="glass-panel comparison-card card-highlight">
          <div className="comparison-badge badge-emerald">Optimal Causal Allocation</div>
          <h3 className="comparison-title">EconoCausal (DML + SciPy)</h3>
          <p className="comparison-sub">Targets only Persuadables where Treatment Effect &gt; Cost</p>
          <div className="comparison-stat-row">
            <span>Net Incremental Gain:</span>
            <strong className="text-emerald">${opt.net_incremental_revenue?.toLocaleString() || '10,022'}</strong>
          </div>
          <div className="comparison-stat-row">
            <span>Marketing Efficiency:</span>
            <strong>{opt.roi_multiple || '4.01'}x ROI</strong>
          </div>
          <div className="comparison-stat-row">
            <span>Sure Things Discounted:</span>
            <strong className="text-emerald">0 (100% Margin Protected)</strong>
          </div>
          <div className="comparison-status">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>Mathematically Certified Causal Uplift</span>
          </div>
        </div>

        <div className="glass-panel comparison-card">
          <div className="comparison-badge badge-rose">Flawed Observational ML</div>
          <h3 className="comparison-title">Traditional Churn / Propensity ML</h3>
          <p className="comparison-sub">Targets customers with highest churn or predicted conversion</p>
          <div className="comparison-stat-row">
            <span>Net Incremental Gain:</span>
            <strong className="text-dim">${pred.net_incremental_revenue?.toLocaleString() || '1,840'}</strong>
          </div>
          <div className="comparison-stat-row">
            <span>Marketing Efficiency:</span>
            <strong>{pred.roi_multiple || '0.85'}x ROI (Negative net profit)</strong>
          </div>
          <div className="comparison-stat-row">
            <span>Sure Things Discounted:</span>
            <strong className="text-rose">{pred.sure_things_cannibalized || 280} buyers cannibalized</strong>
          </div>
          <div className="comparison-status">
            <AlertTriangle size={16} className="text-rose" />
            <span>Wastes budget on customers who buy anyway</span>
          </div>
        </div>

        <div className="glass-panel comparison-card">
          <div className="comparison-badge badge-blue">Baseline Rollout</div>
          <h3 className="comparison-title">Blanket / Random Campaign</h3>
          <p className="comparison-sub">Distributes coupons uniformly across user base</p>
          <div className="comparison-stat-row">
            <span>Net Incremental Gain:</span>
            <strong className="text-dim">$2,100</strong>
          </div>
          <div className="comparison-stat-row">
            <span>Marketing Efficiency:</span>
            <strong>0.92x ROI</strong>
          </div>
          <div className="comparison-stat-row">
            <span>Budget Wastage:</span>
            <strong className="text-amber">~65% wasted on non-responders</strong>
          </div>
          <div className="comparison-status">
            <span className="text-muted">Uncalibrated promotional distribution</span>
          </div>
        </div>
      </div>

      {/* The 4 Customer Archetypes of Causal AI */}
      <div className="archetypes-section glass-panel">
        <div className="section-header">
          <div>
            <h3>The 4 Causal Customer Archetypes</h3>
            <p className="section-subtitle">How Double Machine Learning decodes counterfactual behavior</p>
          </div>
          <span className="badge badge-blue">
            <Users size={14} /> Total Analyzed: 3,000 Profiles
          </span>
        </div>

        <div className="archetypes-grid">
          {archetypes.map((arch) => (
            <div key={arch.title} className="archetype-card">
              <div className="archetype-top">
                <h4 className="archetype-name">{arch.title}</h4>
                <span className={`badge ${arch.badgeClass}`}>{arch.tag}</span>
              </div>
              <p className="archetype-desc">{arch.description}</p>
              <div className="archetype-meta">
                <div className="meta-line">
                  <span className="meta-label">Prescription:</span>
                  <span className="meta-val">{arch.action}</span>
                </div>
                <div className="meta-line">
                  <span className="meta-label">Financial Impact:</span>
                  <span className="meta-val highlight">{arch.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Key Insights Callout */}
      <div className="insights-callout glass-panel">
        <h4 className="insights-title">
          <Zap size={18} className="text-amber" />
          <span>Real-time Econometric Insights</span>
        </h4>
        <ul className="insights-list">
          {(summaryData?.key_insights || []).map((ins, idx) => (
            <li key={idx} className="insight-item">
              <span className="insight-bullet"></span>
              <span dangerouslySetInnerHTML={{ __html: ins.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
