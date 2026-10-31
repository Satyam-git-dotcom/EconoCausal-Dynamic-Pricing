import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ExecutiveSummary from './components/ExecutiveSummary';
import DAGViewer from './components/DAGViewer';
import UpliftCharts from './components/UpliftCharts';
import CausalAuditRefutation from './components/CausalAuditRefutation';
import PropensityMatchingView from './components/PropensityMatchingView';
import OptimizationMatrix from './components/OptimizationMatrix';
import DataDriftAlerts from './components/DataDriftAlerts';
import DataModal from './components/DataModal';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [summaryData, setSummaryData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [upliftData, setUpliftData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [dagData, setDagData] = useState(null);
  const [matchingData, setMatchingData] = useState(null);
  const [driftData, setDriftData] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);

  // Loading States
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isDataProcessing, setIsDataProcessing] = useState(false);

  // Modal State
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Initial Data Loading
  useEffect(() => {
    async function initDashboard() {
      try {
        const [sumRes, optRes, dagRes, upRes, dtRes] = await Promise.allSettled([
          fetch(`${API_BASE}/summary`).then(r => r.json()),
          fetch(`${API_BASE}/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ budget: 5000.0 })
          }).then(r => r.json()),
          fetch(`${API_BASE}/dag`).then(r => r.json()),
          fetch(`${API_BASE}/uplift`).then(r => r.json()),
          fetch(`${API_BASE}/dataset`).then(r => r.json())
        ]);

        if (sumRes.status === 'fulfilled') setSummaryData(sumRes.value);
        if (optRes.status === 'fulfilled') setOptimizationData(optRes.value);
        if (dagRes.status === 'fulfilled') setDagData(dagRes.value);
        if (upRes.status === 'fulfilled') setUpliftData(upRes.value);
        if (dtRes.status === 'fulfilled') setDatasetInfo(dtRes.value);

      } catch (err) {
        console.warn('Backend connecting or using initial values:', err);
      } finally {
        setIsInitialLoading(false);
      }
    }

    initDashboard();
  }, []);

  // API Actions
  const handleRunOptimization = async (budget, discountTiers = [0, 10, 20], costModel = 'expected_redemption') => {
    setIsOptimizing(true);
    try {
      const res = await fetch(`${API_BASE}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: Number(budget),
          discount_tiers: discountTiers,
          cost_model: costModel
        })
      });
      const data = await res.json();
      setOptimizationData(data);
      // Also refresh summary
      const sumRes = await fetch(`${API_BASE}/summary`).then(r => r.json());
      setSummaryData(sumRes);
    } catch (e) {
      console.error('Optimization error:', e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRetrainModel = async (estimator, splits) => {
    setIsTraining(true);
    try {
      const res = await fetch(`${API_BASE}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_estimator: estimator,
          n_splits: splits
        })
      });
      const data = await res.json();
      setTrainingData(data);
      // Refresh uplift & optimization
      const [upRes, optRes] = await Promise.all([
        fetch(`${API_BASE}/uplift`).then(r => r.json()),
        fetch(`${API_BASE}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: optimizationData?.budget || 5000.0 })
        }).then(r => r.json())
      ]);
      setUpliftData(upRes);
      setOptimizationData(optRes);
    } catch (e) {
      console.error('Retrain error:', e);
    } finally {
      setIsTraining(false);
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch(`${API_BASE}/audit`, { method: 'POST' });
      const data = await res.json();
      setAuditData(data);
    } catch (e) {
      console.error('Audit error:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  const fetchMatchingData = async () => {
    const res = await fetch(`${API_BASE}/matching`);
    const data = await res.json();
    setMatchingData(data);
    return data;
  };

  const fetchCustomers = async (params) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.page_size) query.set('page_size', params.page_size);
    if (params.segment) query.set('segment', params.segment);
    if (params.discount_tier !== null && params.discount_tier !== undefined) query.set('discount_tier', params.discount_tier);
    if (params.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/customers?${query.toString()}`);
    return await res.json();
  };

  const handleSimulateDrift = async (scenario, batchSize) => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/drift/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, batch_size: batchSize })
      });
      const data = await res.json();
      setDriftData(data);
    } catch (e) {
      console.error('Drift simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRegenerateDataset = async (config) => {
    setIsDataProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/dataset/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setTrainingData(data.training);

      // Refresh all state
      const [sumRes, optRes, upRes, dtRes] = await Promise.all([
        fetch(`${API_BASE}/summary`).then(r => r.json()),
        fetch(`${API_BASE}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: 5000.0 })
        }).then(r => r.json()),
        fetch(`${API_BASE}/uplift`).then(r => r.json()),
        fetch(`${API_BASE}/dataset`).then(r => r.json())
      ]);
      setSummaryData(sumRes);
      setOptimizationData(optRes);
      setUpliftData(upRes);
      setDatasetInfo(dtRes);
      setAuditData(null);
      setIsDataModalOpen(false);
    } catch (e) {
      console.error('Regenerate error:', e);
    } finally {
      setIsDataProcessing(false);
    }
  };

  const handleUploadDataset = async (file) => {
    setIsDataProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/dataset/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      // Refresh all state
      const [sumRes, optRes, upRes, dtRes] = await Promise.all([
        fetch(`${API_BASE}/summary`).then(r => r.json()),
        fetch(`${API_BASE}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: 5000.0 })
        }).then(r => r.json()),
        fetch(`${API_BASE}/uplift`).then(r => r.json()),
        fetch(`${API_BASE}/dataset`).then(r => r.json())
      ]);
      setSummaryData(sumRes);
      setOptimizationData(optRes);
      setUpliftData(upRes);
      setDatasetInfo(dtRes);
      setIsDataModalOpen(false);
    } catch (e) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setIsDataProcessing(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onQuickOptimize={() => handleRunOptimization(optimizationData?.budget || 5000)}
        isOptimizing={isOptimizing}
      />

      <main className="main-viewport">
        {activeTab === 'overview' && (
          <ExecutiveSummary
            summaryData={summaryData}
            optimizationData={optimizationData}
            trainingData={trainingData}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'dag' && (
          <DAGViewer dagData={dagData} />
        )}

        {activeTab === 'uplift' && (
          <UpliftCharts
            upliftData={upliftData}
            trainingData={trainingData}
            onRetrainModel={handleRetrainModel}
            isTraining={isTraining}
          />
        )}

        {activeTab === 'audit' && (
          <CausalAuditRefutation
            auditData={auditData}
            onRunAudit={handleRunAudit}
            isAuditing={isAuditing}
          />
        )}

        {activeTab === 'matching' && (
          <PropensityMatchingView
            matchingData={matchingData}
            onFetchMatching={fetchMatchingData}
          />
        )}

        {activeTab === 'optimization' && (
          <OptimizationMatrix
            optimizationData={optimizationData}
            onRunOptimization={handleRunOptimization}
            isOptimizing={isOptimizing}
            fetchCustomers={fetchCustomers}
          />
        )}

        {activeTab === 'drift' && (
          <DataDriftAlerts
            driftData={driftData}
            onSimulateDrift={handleSimulateDrift}
            isSimulating={isSimulating}
          />
        )}
      </main>

      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onRegenerate={handleRegenerateDataset}
        onUpload={handleUploadDataset}
        isProcessing={isDataProcessing}
        datasetInfo={datasetInfo}
      />
    </div>
  );
}
