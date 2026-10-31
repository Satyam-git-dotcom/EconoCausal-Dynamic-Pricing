import React from 'react';
import { 
  GitFork, 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  Activity, 
  Layers, 
  UploadCloud, 
  RefreshCw, 
  DollarSign, 
  Compass,
  Cpu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenDataModal, onQuickOptimize, isOptimizing }) {
  const navItems = [
    { id: 'overview', label: 'Executive ROI', icon: TrendingUp, badge: 'Overview' },
    { id: 'dag', label: 'Causal DAG', icon: GitFork, badge: 'Week 1' },
    { id: 'uplift', label: 'Double ML & Uplift', icon: Compass, badge: 'Week 2' },
    { id: 'audit', label: 'Causal Audit', icon: ShieldCheck, badge: 'Mid-Review' },
    { id: 'matching', label: 'Propensity Matching', icon: Layers, badge: 'PSM' },
    { id: 'optimization', label: 'Prescriptive Allocation', icon: Sliders, badge: 'Week 3' },
    { id: 'drift', label: 'Drift Monitor', icon: Activity, badge: 'Week 4' }
  ];

  return (
    <header className="navbar-container">
      {/* Top Banner & Header */}
      <div className="navbar-top">
        <div className="navbar-brand">
          <div className="brand-logo-glow">
            <Cpu className="brand-icon" size={24} />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-name">EconoCausal</span>
              <span className="badge badge-emerald">DML v2.0</span>
            </div>
            <p className="brand-subtitle">Dynamic Pricing & Budget Allocation via Double Machine Learning</p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="navbar-actions">
          <div className="status-indicators">
            <span className="live-pulse-dot"></span>
            <span className="status-label">Causal Inference Engine Active</span>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={onOpenDataModal}
            title="Upload CSV or generate synthetic observational retail data"
          >
            <UploadCloud size={16} />
            <span>Dataset Controls</span>
          </button>

          <button 
            className="btn btn-emerald"
            onClick={onQuickOptimize}
            disabled={isOptimizing}
            title="Execute SciPy Linear Programming budget solver"
          >
            {isOptimizing ? <RefreshCw size={16} className="spin" /> : <DollarSign size={16} />}
            <span>{isOptimizing ? 'Optimizing...' : 'Run SciPy Solver'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="navbar-tabs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-tab-btn ${isActive ? 'nav-tab-active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              <span className={`tab-badge ${isActive ? 'tab-badge-active' : ''}`}>
                {item.badge}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
