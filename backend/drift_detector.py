"""
drift_detector.py - EconoCausal Automated Customer Data Drift Detector
Monitors covariate distributions between baseline training data and new incoming traffic
using Kolmogorov-Smirnov (KS) two-sample tests and Population Stability Index (PSI).
Warns marketers and data scientists if behavioral shifts invalidate causal estimates.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from scipy.stats import ks_2samp

class DataDriftDetector:
    def __init__(self, baseline_df: pd.DataFrame):
        self.baseline_df = baseline_df.copy()
        self.features_to_monitor = [
            "annual_income_k",
            "loyalty_tier",
            "recency_days",
            "website_visits_30d",
            "historical_discount_usage"
        ]

    def compute_psi(self, expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
        """
        Calculates Population Stability Index (PSI) between baseline (expected) and new (actual).
        PSI = Sum (Actual% - Expected%) * ln(Actual% / Expected%)
        """
        # Define quantiles from baseline
        quantiles = np.linspace(0, 100, num_buckets + 1)
        bins = np.percentile(expected, quantiles)
        bins[0] = -np.inf
        bins[-1] = np.inf
        
        # Avoid duplicate bin edges in discrete data
        bins = np.unique(bins)
        if len(bins) < 3:
            return 0.0
            
        expected_counts, _ = np.histogram(expected, bins=bins)
        actual_counts, _ = np.histogram(actual, bins=bins)
        
        # Normalize to fractions with epsilon smoothing to prevent div by zero
        eps = 1e-4
        expected_pct = (expected_counts + eps) / (len(expected) + eps * len(bins))
        actual_pct = (actual_counts + eps) / (len(actual) + eps * len(bins))
        
        psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(np.round(psi_value, 4))

    def evaluate_drift(self, current_df: pd.DataFrame) -> Dict[str, Any]:
        """
        Runs KS tests and PSI across all monitored features.
        Returns drift alerts and overall drift health index.
        """
        results = []
        drift_flags = 0
        moderate_flags = 0
        
        for feature in self.features_to_monitor:
            if feature not in current_df.columns or feature not in self.baseline_df.columns:
                continue
                
            base_vals = self.baseline_df[feature].dropna().values
            curr_vals = current_df[feature].dropna().values
            
            # 1. Kolmogorov-Smirnov Test
            ks_res = ks_2samp(base_vals, curr_vals)
            ks_stat = float(np.round(ks_res.statistic, 4))
            p_val = float(np.round(ks_res.pvalue, 4))
            
            # 2. Population Stability Index (PSI)
            psi_val = self.compute_psi(base_vals, curr_vals)
            
            # Classification
            if psi_val >= 0.20 or p_val < 0.001:
                severity = "CRITICAL_DRIFT"
                badge = "Critical Shift"
                drift_flags += 1
            elif psi_val >= 0.10 or p_val < 0.05:
                severity = "MODERATE_DRIFT"
                badge = "Moderate Shift"
                moderate_flags += 1
            else:
                severity = "STABLE"
                badge = "Stable"
                
            results.append({
                "feature": feature,
                "ks_statistic": ks_stat,
                "p_value": p_val,
                "psi": psi_val,
                "severity": severity,
                "status_badge": badge,
                "baseline_mean": round(float(np.mean(base_vals)), 2),
                "current_mean": round(float(np.mean(curr_vals)), 2),
                "mean_shift_pct": round(float(((np.mean(curr_vals) - np.mean(base_vals)) / (np.mean(base_vals) + 1e-6)) * 100), 1)
            })
            
        # Overall status
        if drift_flags >= 2 or any(r["psi"] >= 0.25 for r in results):
            system_status = "ACTION_REQUIRED"
            recommendation = "Severe behavioral drift detected in multiple covariates. Retrain Double ML model immediately before deploying discount campaigns."
        elif drift_flags == 1 or moderate_flags >= 2:
            system_status = "WARNING"
            recommendation = "Moderate distribution shifts observed. Monitor uplift performance and consider re-evaluating causal DAG bounds."
        else:
            system_status = "HEALTHY"
            recommendation = "Covariate distributions are aligned with the causal training baseline (PSI < 0.10). Model prescriptions remain valid."
            
        return {
            "system_status": system_status,
            "monitored_samples_baseline": len(self.baseline_df),
            "monitored_samples_current": len(current_df),
            "critical_drift_count": drift_flags,
            "moderate_drift_count": moderate_flags,
            "recommendation": recommendation,
            "features": results
        }

    def simulate_shifted_batch(self, shift_type: str = "economic_downturn", size: int = 1500) -> pd.DataFrame:
        """
        Simulates an incoming customer batch with synthetic behavioral drift:
        - 'economic_downturn': Income drops 18%, price sensitivity spikes, discount usage increases
        - 'dormancy_spike': Recency jumps (holiday hangover), website activity drops
        - 'normal_sample': No drift, fresh random sample
        """
        rng = np.random.RandomState(99)
        shifted = self.baseline_df.sample(n=min(size, len(self.baseline_df)), replace=True, random_state=99).copy()
        
        if shift_type == "economic_downturn":
            shifted["annual_income_k"] = np.clip(shifted["annual_income_k"] * 0.78 + rng.normal(0, 5, size=len(shifted)), 15, 200).round(1)
            shifted["historical_discount_usage"] = np.clip(shifted["historical_discount_usage"] * 1.35 + 0.1, 0, 1.0).round(3)
            shifted["website_visits_30d"] = np.clip(shifted["website_visits_30d"] - 2, 0, 40)
        elif shift_type == "dormancy_spike":
            shifted["recency_days"] = np.clip(shifted["recency_days"] * 1.6 + 15, 1, 180).astype(int)
            shifted["website_visits_30d"] = np.clip(shifted["website_visits_30d"] * 0.5, 0, 40).astype(int)
            
        return shifted
