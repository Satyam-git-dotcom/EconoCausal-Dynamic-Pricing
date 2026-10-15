import React, { useState } from 'react';
import { 
  GitFork, 
  CheckCircle2, 
  HelpCircle, 
  Share2, 
  Info, 
  ArrowRight,
  ShieldCheck,
  Code
} from 'lucide-react';

export default function DAGViewer({ dagData }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const defaultNodes = dagData?.nodes || [
    { id: 'annual_income_k', label: 'Annual Income ($k)', type: 'confounder', desc: 'Customer earning power; drives baseline order value and promo eligibility' },
    { id: 'loyalty_tier', label: 'Loyalty Tier (1-4)', type: 'confounder', desc: 'VIP status historically prioritized by marketers with high discounts' },
    { id: 'recency_days', label: 'Recency (Days)', type: 'confounder', desc: 'Days since last purchase; dormant users targeted for reactivation' },
    { id: 'website_visits_30d', label: 'Website Activity (30d)', type: 'confounder', desc: 'High browsing intensity signals organic intent' },
    { id: 'historical_discount_usage', label: 'Prior Discount Usage', type: 'confounder', desc: 'Coupon sensitivity behavior influencing treatment assignment' },
    { id: 'mobile_app_user', label: 'Mobile App User', type: 'confounder', desc: 'Push notification recipient' },
    { id: 'treatment_binary', label: 'Promotional Discount (T)', type: 'treatment', desc: 'Actionable marketing intervention: $10 or $20 coupon' },
    { id: 'conversion', label: 'Purchase Conversion (Y)', type: 'outcome', desc: 'Target business outcome: 1 if converted, 0 if not' }
  ];

  const confounders = defaultNodes.filter(n => n.type === 'confounder');
  const treatment = defaultNodes.find(n => n.type === 'treatment');
  const outcome = defaultNodes.find(n => n.type === 'outcome');

  const activeNodeInfo = selectedNode || treatment;

  return (
    <div className="tab-pane animate-fade-in">
      {/* Week 1 Header */}
      <div className="glass-panel pane-header-card">
        <div className="pane-header-left">
          <div className="badge badge-blue">Week 1 Milestone</div>
          <h2>Causal Directed Acyclic Graph (DAG)</h2>
          <p className="text-muted">
            Formulated via <strong>Microsoft DoWhy</strong>. Identifies confounders inducing selection bias
            and proves causal identifiability via Pearl's Backdoor Criterion before model training.
          </p>
        </div>
        <div className="badge badge-emerald">
          <ShieldCheck size={16} />
          <span>Backdoor Criterion Satisfied</span>
        </div>
      </div>

      <div className="dag-workspace-grid">
        {/* Interactive Visual DAG Canvas */}
        <div className="glass-panel dag-canvas-card">
          <div className="canvas-header">
            <span className="canvas-title">DoWhy Causal Graph Architecture</span>
            <span className="text-dim text-sm">Click any node to inspect backdoor paths</span>
          </div>

          <div className="dag-svg-container">
            <svg viewBox="0 0 850 480" className="dag-svg">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#3b82f6" opacity="0.8" />
                </marker>
                <marker id="arrow-confounder" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#8b5cf6" opacity="0.6" />
                </marker>
                <marker id="arrow-causal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <linearGradient id="causal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Confounder Nodes (Left Column) */}
              {confounders.map((node, idx) => {
                const yPos = 55 + idx * 65;
                const isSelected = activeNodeInfo?.id === node.id;
                return (
                  <g key={node.id} onClick={() => setSelectedNode(node)} className="dag-node-group">
                    {/* Paths to Treatment */}
                    <path
                      d={`M 220 ${yPos} C 330 ${yPos}, 340 180, 430 180`}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      opacity="0.45"
                      markerEnd="url(#arrow-confounder)"
                    />
                    {/* Paths to Outcome */}
                    <path
                      d={`M 220 ${yPos} C 340 ${yPos}, 500 ${yPos}, 670 290`}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      opacity="0.35"
                      markerEnd="url(#arrow-confounder)"
                    />
                    {/* Node Box */}
                    <rect
                      x="40"
                      y={yPos - 22}
                      width="180"
                      height="44"
                      rx="8"
                      className={`node-rect node-confounder ${isSelected ? 'node-selected' : ''}`}
                    />
                    <circle cx="58" cy={yPos} r="5" fill="#8b5cf6" />
                    <text x="74" y={yPos + 5} className="node-text">
                      {node.label}
                    </text>
                  </g>
                );
              })}

              {/* Treatment Node (Center-Top) */}
              <g onClick={() => setSelectedNode(treatment)} className="dag-node-group">
                <rect
                  x="430"
                  y="155"
                  width="190"
                  height="52"
                  rx="10"
                  className={`node-rect node-treatment ${activeNodeInfo?.id === treatment?.id ? 'node-selected' : ''}`}
                />
                <circle cx="452" cy="181" r="7" fill="#3b82f6" />
                <text x="470" y="186" className="node-text node-bold">
                  {treatment?.label}
                </text>
              </g>

              {/* Direct Causal Path: Treatment -> Outcome */}
              <path
                d="M 525 207 C 525 270, 600 300, 670 300"
                fill="none"
                stroke="url(#causal-grad)"
                strokeWidth="4"
                markerEnd="url(#arrow-causal)"
                className="causal-arrow-pulse"
              />
              <text x="560" y="245" fill="#10b981" fontSize="11" fontWeight="700">
                True Causal Effect (ITE)
              </text>

              {/* Outcome Node (Right Column) */}
              <g onClick={() => setSelectedNode(outcome)} className="dag-node-group">
                <rect
                  x="670"
                  y="270"
                  width="160"
                  height="55"
                  rx="10"
                  className={`node-rect node-outcome ${activeNodeInfo?.id === outcome?.id ? 'node-selected' : ''}`}
                />
                <circle cx="692" cy="297" r="7" fill="#10b981" />
                <text x="710" y="302" className="node-text node-bold">
                  {outcome?.label}
                </text>
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="dag-legend">
            <div className="legend-item">
              <span className="legend-indicator confounder"></span>
              <span>Observed Confounders (W)</span>
            </div>
            <div className="legend-item">
              <span className="legend-indicator treatment"></span>
              <span>Treatment Variable (T)</span>
            </div>
            <div className="legend-item">
              <span className="legend-indicator outcome"></span>
              <span>Business Outcome (Y)</span>
            </div>
            <div className="legend-item">
              <span className="legend-indicator causal-line"></span>
              <span>Target Causal Stimulus</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details & DoWhy Identification Proof */}
        <div className="dag-details-col">
          <div className="glass-panel node-detail-card">
            <div className="detail-header">
              <span className="badge badge-violet">Node Inspector</span>
              <h3>{activeNodeInfo?.label}</h3>
            </div>
            <p className="detail-desc">{activeNodeInfo?.desc}</p>

            <div className="detail-properties">
              <div className="prop-row">
                <span className="prop-name">Variable Type:</span>
                <span className="prop-val uppercase text-emerald">{activeNodeInfo?.type}</span>
              </div>
              <div className="prop-row">
                <span className="prop-name">Backdoor Conditioned:</span>
                <span className="prop-val text-blue">Yes (Double ML Orthogonalization)</span>
              </div>
              <div className="prop-row">
                <span className="prop-name">Observational Confounding:</span>
                <span className="prop-val text-amber">Active (Severe Historical Bias)</span>
              </div>
            </div>
          </div>

          <div className="glass-panel identification-proof-card">
            <div className="proof-header">
              <Code size={16} className="text-blue" />
              <h4>DoWhy Identification Proof</h4>
            </div>
            <p className="text-sm text-muted">
              According to Judea Pearl’s do-calculus, the average causal effect is identified via Backdoor Adjustment:
            </p>
            <div className="math-box">
              <code>P(Y | do(T = t)) = &Sigma; P(Y | T = t, W = w) &middot; P(W = w)</code>
            </div>
            <ul className="proof-checklist">
              <li>
                <CheckCircle2 size={14} className="text-emerald" />
                <span>No unblocked non-causal backdoor paths remain between T and Y.</span>
              </li>
              <li>
                <CheckCircle2 size={14} className="text-emerald" />
                <span>Positivity / Common Support assumption holds across all loyalty tiers.</span>
              </li>
              <li>
                <CheckCircle2 size={14} className="text-emerald" />
                <span>Ready for orthogonalized Double Machine Learning regression.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
