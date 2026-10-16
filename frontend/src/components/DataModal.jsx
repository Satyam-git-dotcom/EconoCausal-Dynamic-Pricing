import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  RefreshCw, 
  Database, 
  Sliders, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function DataModal({ isOpen, onClose, onRegenerate, onUpload, isProcessing, datasetInfo }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('generate');
  const [nSamples, setNSamples] = useState(3000);
  const [confoundingStrength, setConfoundingStrength] = useState(0.8);
  const [randomSeed, setRandomSeed] = useState(42);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleRegenerateSubmit = (e) => {
    e.preventDefault();
    onRegenerate({
      n_samples: Number(nSamples),
      confounding_strength: Number(confoundingStrength),
      random_seed: Number(randomSeed)
    });
  };

  const handleFileUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a CSV file first.');
      return;
    }
    setUploadError(null);
    onUpload(selectedFile);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container glass-panel-glow">
        <div className="modal-header">
          <div className="modal-title-row">
            <Database size={20} className="text-blue" />
            <h3>Dataset &amp; Campaign Controls</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'generate' ? 'modal-tab-active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate Synthetic Campaign
          </button>
          <button
            className={`modal-tab ${activeTab === 'upload' ? 'modal-tab-active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Custom CSV
          </button>
          <button
            className={`modal-tab ${activeTab === 'stats' ? 'modal-tab-active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Current Dataset Info
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'generate' && (
            <form onSubmit={handleRegenerateSubmit} className="modal-form">
              <p className="text-sm text-muted mb-4">
                Generates a realistic retail marketing dataset with embedded selection bias, true counterfactuals,
                and latent customer response segments.
              </p>

              <div className="form-group">
                <label className="form-label">
                  <span>Customer Sample Size:</span>
                  <strong className="text-bright">{nSamples.toLocaleString()} profiles</strong>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={nSamples}
                  onChange={(e) => setNSamples(Number(e.target.value))}
                  className="range-slider"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Observational Confounding Strength:</span>
                  <strong className="text-amber">{(confoundingStrength * 100).toFixed(0)}% Bias</strong>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={confoundingStrength}
                  onChange={(e) => setConfoundingStrength(Number(e.target.value))}
                  className="range-slider"
                />
                <span className="text-xs text-dim">
                  High values simulate historical bias where high-loyalty customers received higher discounts.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Random Seed</label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(Number(e.target.value))}
                  className="input-text"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald" disabled={isProcessing}>
                  {isProcessing ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}
                  <span>{isProcessing ? 'Generating & Fitting...' : 'Generate & Train DML'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'upload' && (
            <form onSubmit={handleFileUploadSubmit} className="modal-form">
              <p className="text-sm text-muted mb-4">
                Upload historical marketing campaign logs in CSV format. 
                Columns expected: <code>annual_income_k</code>, <code>loyalty_tier</code>, <code>recency_days</code>, <code>treatment_discount</code>, <code>conversion</code>.
              </p>

              <div className="file-drop-area">
                <UploadCloud size={36} className="text-blue mb-2" />
                <p className="text-sm text-bright font-medium">Click to select CSV campaign data</p>
                <p className="text-xs text-dim">Max 50MB</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="file-input-hidden"
                />
              </div>

              {selectedFile && (
                <div className="selected-file-badge">
                  <CheckCircle2 size={14} className="text-emerald" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              {uploadError && (
                <div className="error-alert">
                  <AlertCircle size={14} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isProcessing || !selectedFile}>
                  {isProcessing ? <RefreshCw size={16} className="spin" /> : <UploadCloud size={16} />}
                  <span>{isProcessing ? 'Processing CSV...' : 'Upload & Train'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'stats' && (
            <div className="dataset-stats-view">
              <div className="stats-kpi-grid">
                <div className="stat-pill">
                  <span className="stat-label">Active Profiles</span>
                  <span className="stat-num">{datasetInfo?.total_records?.toLocaleString() || '3,000'}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">Overall Conversion</span>
                  <span className="stat-num text-emerald">{datasetInfo?.conversion_rate || '34.2'}%</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-label">Avg Order Value</span>
                  <span className="stat-num text-blue">${datasetInfo?.avg_purchase_amount || '74.50'}</span>
                </div>
              </div>

              <h4 className="mt-4 mb-2 text-sm font-semibold">Causal Archetypes Distribution:</h4>
              <div className="archetype-count-row">
                {Object.entries(datasetInfo?.segments || { 'Persuadables': 2118, 'Sure Things': 802, 'Lost Causes': 80 }).map(([seg, count]) => (
                  <div key={seg} className="arch-count-badge">
                    <span>{seg}:</span>
                    <strong>{count.toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div className="modal-actions mt-6">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
