import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  DollarSign, 
  Zap, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Percent, 
  TrendingUp, 
  UserCheck,
  Activity,
  BarChart3,
  HelpCircle,
  Award
} from 'lucide-react';
import PlotlyChart from './PlotlyChart';

export default function OptimizationMatrix({ 
  optimizationData, 
  onRunOptimization, 
  isOptimizing,
  fetchCustomers
}) {
  const [budget, setBudget] = useState(optimizationData?.budget || 5000);
  const [costModel, setCostModel] = useState('expected_redemption');
  const [selectedSegment, setSelectedSegment] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'sensitivity'
  const [sensitivityData, setSensitivityData] = useState(null);
  const [loadingSensitivity, setLoadingSensitivity] = useState(false);
  
  // Table state
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [segmentCounts, setSegmentCounts] = useState({});
  const [loadingTable, setLoadingTable] = useState(false);

  const loadSensitivity = async () => {
    setLoadingSensitivity(true);
    try {
      const res = await fetch('http://localhost:8000/api/optimize/marginal-roi?budget_min=1000&budget_max=15000&steps=10');
      const data = await res.json();
      setSensitivityData(data);
    } catch (err) {
      console.error('Sensitivity error:', err);
    } finally {
      setLoadingSensitivity(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'sensitivity' && !sensitivityData) {
      loadSensitivity();
    }
  }, [viewMode]);

  // Load customer prescriptions
  const loadCustomers = async () => {
    setLoadingTable(true);
    try {
      const res = await fetchCustomers({
        page,
        page_size: 20,
        segment: selectedSegment !== 'All' ? selectedSegment : null,
        discount_tier: selectedTier !== 'All' ? Number(selectedTier) : null,
        search: searchQuery || null
      });
      if (res) {
        setCustomers(res.records || []);
        setTotalPages(res.total_pages || 1);
        setTotalRecords(res.total_records || 0);
        setSegmentCounts(res.segment_counts || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, selectedSegment, selectedTier, searchQuery, optimizationData]);

  const handleOptimizationSubmit = (e) => {
    e.preventDefault();
    onRunOptimization(budget, [0, 10, 20], costModel);
  };

  const opt = optimizationData?.optimal_strategy || {};
  const adv = optimizationData?.financial_advantage || {};
  const tiers = opt?.tier_breakdown || { '0': 2100, '10': 540, '20': 360 };

  const getSegmentBadge = (seg) => {
    const s = String(seg).toLowerCase();
    if (s.includes('persuadable')) return <span className="badge badge-emerald">Persuadable</span>;
    if (s.includes('sure')) return <span className="badge badge-amber">Sure Thing</span>;
    if (s.includes('lost')) return <span className="badge badge-rose">Lost Cause</span>;
    if (s.includes('sleeping')) return <span className="badge badge-violet">Sleeping Dog</span>;
    return <span className="badge badge-blue">{seg}</span>;
  };

  const getDiscountBadge = (d) => {
    if (d === 20) return <span className="tier-badge tier-20">$20 Discount</span>;
    if (d === 10) return <span className="tier-badge tier-10">$10 Discount</span>;
    return <span className="tier-badge tier-0">$0 (Protected)</span>;
  };

  // Export current table view as CSV
  const handleExportCSV = () => {
    if (!customers.length) return;
    const headers = Object.keys(customers[0]).join(',');
    const rows = customers.map(c => Object.values(c).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `econocausal_prescriptions_budget_${budget}.csv`;
    a.click();
  };

  return (
    <div className="tab-pane animate-fade-in">
      {/* Week 3 Header */}
      <div className="glass-panel pane-header-card">
        <div className="pane-header-left">
          <div className="badge badge-emerald">Week 3 Milestone</div>
          <h2>Prescriptive Optimization &amp; Allocation Matrix</h2>
          <p className="text-muted">
            Solves the linear programming knapsack problem using <strong>SciPy (scipy.optimize.linprog)</strong>. 
            Maximizes expected net incremental profit under strict marketing capital constraints, 
            prescribing the optimal personalized discount tier ($0, $10, $20) for every customer.
          </p>
        </div>

        <div className="badge badge-blue">
          <ShieldCheck size={16} />
          <span>SciPy Highs Simplex Solver</span>
        </div>
      </div>

      {/* Solver Controls Panel */}
      <div className="glass-panel solver-controls-card">
        <form onSubmit={handleOptimizationSubmit} className="solver-form">
          <div className="budget-slider-box">
            <div className="slider-header">
              <label className="slider-label">
                <DollarSign size={16} className="text-emerald" />
                <span>Marketing Promotional Budget:</span>
              </label>
              <span className="budget-display-val">${Number(budget).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="500"
              max="25000"
              step="500"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="range-slider"
            />
            <div className="slider-ticks">
              <span>$500</span>
              <span>$5,000 (Default)</span>
              <span>$10,000</span>
              <span>$25,000</span>
            </div>
          </div>

          <div className="cost-model-box">
            <label className="text-sm font-semibold text-muted">Cost Accounting Model</label>
            <div className="radio-pill-group">
              <button
                type="button"
                className={`radio-pill ${costModel === 'expected_redemption' ? 'radio-pill-active' : ''}`}
                onClick={() => setCostModel('expected_redemption')}
              >
                Expected Redemption Cost (P &middot; D)
              </button>
              <button
                type="button"
                className={`radio-pill ${costModel === 'face_value' ? 'radio-pill-active' : ''}`}
                onClick={() => setCostModel('face_value')}
              >
                Face Value Commitment (D)
              </button>
            </div>
          </div>

          <div className="solver-action-box">
            <button
              type="submit"
              className="btn btn-emerald btn-solve"
              disabled={isOptimizing}
            >
              {isOptimizing ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
              <span>{isOptimizing ? 'Solving LP...' : 'Re-Solve Optimization'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Optimization Realization Stats */}
      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Optimal Net Profit</span>
            <DollarSign size={18} className="text-emerald" />
          </div>
          <div className="kpi-value text-emerald">
            ${opt.net_incremental_revenue?.toLocaleString() || '10,022.35'}
          </div>
          <div className="kpi-footer text-emerald">
            <span>+{adv.profit_uplift_pct || '48.2'}% over predictive ML</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Capital Deployed</span>
            <Percent size={18} className="text-blue" />
          </div>
          <div className="kpi-value">
            ${opt.total_spend?.toLocaleString() || '4,980.00'}
          </div>
          <div className="kpi-footer text-muted">
            <span>{opt.budget_utilization_pct || 99.6}% of ${budget.toLocaleString()} budget</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Realized ROI</span>
            <TrendingUp size={18} className="text-violet" />
          </div>
          <div className="kpi-value text-violet">
            {opt.roi_multiple || '4.01'}x
          </div>
          <div className="kpi-footer text-muted">
            <span>Net profit per dollar spent</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-header">
            <span className="kpi-label">Tier Allocation Breakdown</span>
            <UserCheck size={18} className="text-amber" />
          </div>
          <div className="tier-pill-row">
            <span className="mini-pill tier-0-bg"><strong>{tiers['0'] || 2100}</strong> $0</span>
            <span className="mini-pill tier-10-bg"><strong>{tiers['10'] || 540}</strong> $10</span>
            <span className="mini-pill tier-20-bg"><strong>{tiers['20'] || 360}</strong> $20</span>
          </div>
          <div className="kpi-footer text-muted">
            <span>Persuadables funded: {opt.persuadables_funded_count || 900}</span>
          </div>
        </div>
      </div>

      {/* Prescriptions & Sensitivity Tabs */}
      <div className="glass-panel prescription-table-card">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="tab-pill-group">
              <button 
                type="button"
                className={`tab-pill ${viewMode === 'table' ? 'tab-pill-active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                Customer Prescriptions Matrix
              </button>
              <button 
                type="button"
                className={`tab-pill ${viewMode === 'sensitivity' ? 'tab-pill-active' : ''}`}
                onClick={() => setViewMode('sensitivity')}
              >
                Dual Simplex Sensitivity &amp; Saturation
              </button>
            </div>
            <span className="text-dim text-sm ml-2">
              {viewMode === 'table' ? `Showing ${totalRecords.toLocaleString()} individual profiles` : 'Shadow price & marginal ROI analytics'}
            </span>
          </div>

          {viewMode === 'table' ? (
            <div className="toolbar-filters">
              {/* Search */}
              <div className="search-input-wrap">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search CUST-..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="search-input"
                />
              </div>

              {/* Segment Filter */}
              <div className="filter-select-wrap">
                <Filter size={14} className="filter-icon" />
                <select
                  value={selectedSegment}
                  onChange={(e) => {
                    setSelectedSegment(e.target.value);
                    setPage(1);
                  }}
                  className="select-input select-sm"
                >
                  <option value="All">All Archetypes</option>
                  <option value="Persuadables">Persuadables</option>
                  <option value="Sure Things">Sure Things</option>
                  <option value="Lost Causes">Lost Causes</option>
                  <option value="Sleeping Dogs">Sleeping Dogs</option>
                </select>
              </div>

              {/* Tier Filter */}
              <div className="filter-select-wrap">
                <select
                  value={selectedTier}
                  onChange={(e) => {
                    setSelectedTier(e.target.value);
                    setPage(1);
                  }}
                  className="select-input select-sm"
                >
                  <option value="All">All Discount Tiers</option>
                  <option value="0">$0 (No Promo)</option>
                  <option value="10">$10 Promo</option>
                  <option value="20">$20 Promo</option>
                </select>
              </div>

              {/* Export CSV */}
              <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={loadSensitivity} disabled={loadingSensitivity}>
              <RefreshCw size={14} className={loadingSensitivity ? "spin" : ""} />
              <span>Refresh Sensitivity</span>
            </button>
          )}
        </div>

        {viewMode === 'sensitivity' ? (
          <div className="sensitivity-view-container animate-fade-in p-4">
            {loadingSensitivity ? (
              <div className="text-center py-12">
                <RefreshCw size={28} className="spin text-blue mx-auto mb-2" />
                <span className="text-muted">Computing Dual Simplex sensitivity curve across budget trajectory...</span>
              </div>
            ) : sensitivityData ? (
              <div>
                <div className="glass-panel p-4 mb-4" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={18} className="text-emerald" />
                    <h4 className="font-semibold text-bright">CFO Executive Recommendation</h4>
                  </div>
                  <p className="text-sm text-muted">{sensitivityData.cfo_recommendation}</p>
                </div>

                <div className="chart-container" style={{ minHeight: '380px' }}>
                  <PlotlyChart
                    data={[
                      {
                        x: sensitivityData.budgets,
                        y: sensitivityData.net_profits,
                        name: 'Net Incremental Profit ($)',
                        type: 'scatter',
                        mode: 'lines+markers',
                        fill: 'tozeroy',
                        fillcolor: 'rgba(16, 185, 129, 0.1)',
                        line: { color: '#10b981', width: 3 },
                        marker: { size: 6, color: '#10b981' },
                        yaxis: 'y1'
                      },
                      {
                        x: sensitivityData.budgets,
                        y: sensitivityData.marginal_rois,
                        name: 'Marginal ROI (λ* = dProfit / dSpend)',
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: { color: '#38bdf8', width: 2.5, dash: 'dot' },
                        marker: { size: 7, color: '#38bdf8', symbol: 'diamond' },
                        yaxis: 'y2'
                      }
                    ]}
                    layout={{
                      title: {
                        text: 'Dual Simplex Budget Sensitivity & Law of Diminishing Marginal Returns',
                        font: { color: '#ffffff', size: 14 }
                      },
                      xaxis: { title: 'Marketing Promotional Budget ($)', tickprefix: '$' },
                      yaxis: {
                        title: 'Total Incremental Profit ($)',
                        titlefont: { color: '#10b981' },
                        tickfont: { color: '#10b981' }
                      },
                      yaxis2: {
                        title: 'Marginal ROI Rate (λ*)',
                        titlefont: { color: '#38bdf8' },
                        tickfont: { color: '#38bdf8' },
                        overlaying: 'y',
                        side: 'right',
                        range: [0, Math.max(...sensitivityData.marginal_rois) * 1.25]
                      },
                      legend: { x: 0.05, y: 0.95, bgcolor: 'rgba(15, 23, 42, 0.85)' }
                    }}
                  />
                </div>

                <div className="mt-4 p-3 bg-slate-900/60 rounded text-xs text-muted flex items-start gap-2">
                  <HelpCircle size={14} className="text-blue mt-0.5 shrink-0" />
                  <span>
                    <strong>Economic Interpretation:</strong> As promotional budget expands, the solver first exhausts high-uplift Persuadables (high shadow price λ*). When the budget surpasses the saturation point (${sensitivityData.saturation_budget.toLocaleString()}), the marginal return falls below $1.00 per dollar spent, meaning additional discounts would subsidize non-incremental conversions.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {/* Table Content */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Tier</th>
                    <th>Income</th>
                    <th>Recency</th>
                    <th>Baseline Conv.</th>
                    <th>Estimated ITE</th>
                    <th>Causal Segment</th>
                    <th>Optimal Prescription</th>
                    <th>Net Incremental Gain</th>
                    <th>Cost to Serve</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTable ? (
                    <tr>
                      <td colSpan={10} className="text-center py-6">
                        <RefreshCw size={24} className="spin text-blue mx-auto mb-2" />
                        <span className="text-muted">Loading customer records...</span>
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-6 text-muted">
                        No customers match the active filters.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.customer_id}>
                        <td className="font-mono text-bright">{c.customer_id}</td>
                        <td>{c.loyalty_name || `Tier ${c.loyalty_tier}`}</td>
                        <td>${c.annual_income_k}k</td>
                        <td>{c.recency_days}d</td>
                        <td className="font-mono">{(c.baseline_prob * 100).toFixed(1)}%</td>
                        <td className="font-mono text-emerald font-semibold">
                          +{((c.estimated_ite || 0) * 100).toFixed(1)}%
                        </td>
                        <td>{getSegmentBadge(c.predicted_segment || c.true_segment)}</td>
                        <td>{getDiscountBadge(c.optimal_discount)}</td>
                        <td className="font-mono text-emerald font-bold">
                          {c.net_incremental_gain > 0 ? `+$${c.net_incremental_gain}` : `$${c.net_incremental_gain}`}
                        </td>
                        <td className="font-mono text-dim">${c.cost_to_serve || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            <div className="table-pagination">
              <span className="text-sm text-dim">
                Page {page} of {totalPages}
              </span>
              <div className="pagination-buttons">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
