"""
propensity_matching.py - EconoCausal Propensity Score Matching (PSM) Engine
Simulates a randomized A/B test from historical observational campaign data
by balancing confounders across treated and control cohorts.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors

class PropensityMatcher:
    def __init__(self, df: pd.DataFrame, treatment_col: str = "treatment_binary"):
        self.df = df.copy()
        self.treatment_col = treatment_col
        self.covariates = [
            "annual_income_k",
            "loyalty_tier",
            "recency_days",
            "website_visits_30d",
            "historical_discount_usage",
            "mobile_app_user"
        ]
        self.matched_df = None
        self.propensity_scores = None

    def fit_and_match(self, caliper: float = 0.05) -> Dict[str, Any]:
        """
        Calculates propensity score e(X) and performs 1:1 nearest neighbor matching.
        Returns pre- and post-matching covariate balance diagnostics (SMD)
        and common support distribution.
        """
        X = self.df[self.covariates]
        T = self.df[self.treatment_col]
        
        # 1. Estimate Propensity Scores via Logistic Regression
        ps_model = LogisticRegression(max_iter=500, random_state=42)
        ps_model.fit(X, T)
        self.propensity_scores = ps_model.predict_proba(X)[:, 1]
        self.df["propensity_score"] = self.propensity_scores.round(4)
        
        treated_df = self.df[self.df[self.treatment_col] == 1].copy()
        control_df = self.df[self.df[self.treatment_col] == 0].copy()
        
        # 2. 1:1 Nearest Neighbor Matching with Caliper
        nn = NearestNeighbors(n_neighbors=1, metric="euclidean")
        nn.fit(control_df[["propensity_score"]])
        
        distances, indices = nn.kneighbors(treated_df[["propensity_score"]])
        
        matched_treated_indices = []
        matched_control_indices = []
        
        treated_idx_list = treated_df.index.tolist()
        control_idx_list = control_df.index.tolist()
        
        used_ctrl = set()
        for i, (dist, idx) in enumerate(zip(distances, indices)):
            ctrl_real_idx = control_idx_list[idx[0]]
            if dist[0] <= caliper and ctrl_real_idx not in used_ctrl:
                used_ctrl.add(ctrl_real_idx)
                matched_treated_indices.append(treated_idx_list[i])
                matched_control_indices.append(ctrl_real_idx)
                
        self.matched_df = pd.concat([
            self.df.loc[matched_treated_indices],
            self.df.loc[matched_control_indices]
        ])
        
        # 3. Calculate Covariate Balance (Standardized Mean Difference)
        balance_metrics = []
        for cov in self.covariates:
            # Pre-matching SMD
            t_pre = treated_df[cov]
            c_pre = control_df[cov]
            pooled_std_pre = np.sqrt((t_pre.var() + c_pre.var()) / 2.0)
            smd_pre = abs(t_pre.mean() - c_pre.mean()) / (pooled_std_pre + 1e-8)
            
            # Post-matching SMD
            matched_treat = self.df.loc[matched_treated_indices, cov]
            matched_ctrl = self.df.loc[matched_control_indices, cov]
            pooled_std_post = np.sqrt((matched_treat.var() + matched_ctrl.var()) / 2.0)
            smd_post = abs(matched_treat.mean() - matched_ctrl.mean()) / (pooled_std_post + 1e-8)
            
            balance_metrics.append({
                "covariate": cov,
                "smd_pre_matching": round(float(smd_pre), 3),
                "smd_post_matching": round(float(smd_post), 3),
                "balanced": smd_post < 0.10,
                "improvement_pct": round(float(max(0, (smd_pre - smd_post) / max(smd_pre, 1e-6)) * 100), 1)
            })
            
        # 4. Propensity distribution histograms for visual overlap
        bins = np.linspace(0, 1, 21)
        treat_hist, _ = np.histogram(treated_df["propensity_score"], bins=bins)
        ctrl_hist, _ = np.histogram(control_df["propensity_score"], bins=bins)
        
        bin_centers = [(bins[i] + bins[i+1]) / 2 for i in range(len(bins)-1)]
        
        return {
            "total_samples": len(self.df),
            "treated_samples": len(treated_df),
            "control_samples": len(control_df),
            "matched_pairs": len(matched_treated_indices),
            "caliper": caliper,
            "covariate_balance": balance_metrics,
            "overall_balance_achieved": all(b["balanced"] for b in balance_metrics),
            "propensity_overlap": {
                "bins": [round(b, 2) for b in bin_centers],
                "treated_counts": treat_hist.tolist(),
                "control_counts": ctrl_hist.tolist()
            }
        }
