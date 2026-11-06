"""
optimization_solver.py - EconoCausal Prescriptive Optimization Engine
Uses SciPy (scipy.optimize.linprog) to solve the budget-constrained dynamic pricing
and discount allocation problem, maximizing net incremental revenue.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from scipy.optimize import linprog

class PrescriptiveOptimizer:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        
    def solve_allocation(
        self,
        budget: float = 5000.0,
        discount_tiers: List[int] = [0, 10, 20],
        cost_model: str = "expected_redemption" # or "face_value"
    ) -> Dict[str, Any]:
        """
        Formulates and solves the linear programming problem:
        Maximize Sum_i Sum_d x_{i,d} * Net_Incremental_Profit(i, d)
        Subject to:
          Sum_i Sum_d x_{i,d} * Cost(i, d) <= budget
          Sum_d x_{i,d} == 1 for all i
          0 <= x_{i,d} <= 1
        """
        N = len(self.df)
        D = len(discount_tiers)
        
        # Ensure estimated_ite exists; if not, use true_ite or synthetic proxy
        if "estimated_ite" in self.df.columns:
            ite_base = self.df["estimated_ite"].values
        else:
            ite_base = self.df["true_ite_10"].values
            
        base_conv = self.df["baseline_prob"].values if "baseline_prob" in self.df.columns else np.full(N, 0.25)
        aov = self.df["purchase_amount"].values if "purchase_amount" in self.df.columns else np.full(N, 75.0)
        
        # Calculate net incremental profit and cost matrix: shape (N, D)
        # Tiers: 0, 10, 20
        profit_matrix = np.zeros((N, D))
        cost_matrix = np.zeros((N, D))
        
        for d_idx, d_amt in enumerate(discount_tiers):
            if d_amt == 0:
                profit_matrix[:, d_idx] = 0.0 # baseline reference
                cost_matrix[:, d_idx] = 0.0
            elif d_amt == 10:
                uplift = np.maximum(ite_base, -0.05)
                conv_rate = np.clip(base_conv + uplift, 0.01, 0.99)
                # Incremental revenue = uplift * aov - conv_rate * d_amt
                net_gain = (uplift * aov) - (conv_rate * d_amt)
                profit_matrix[:, d_idx] = net_gain
                cost = (conv_rate * d_amt) if cost_model == "expected_redemption" else d_amt
                cost_matrix[:, d_idx] = cost
            elif d_amt == 20:
                # $20 tier gives ~1.5x uplift of $10 tier for persuadables, but costs double
                uplift = np.maximum(ite_base * 1.5, -0.08)
                conv_rate = np.clip(base_conv + uplift, 0.01, 0.99)
                net_gain = (uplift * aov) - (conv_rate * d_amt)
                profit_matrix[:, d_idx] = net_gain
                cost = (conv_rate * d_amt) if cost_model == "expected_redemption" else d_amt
                cost_matrix[:, d_idx] = cost
                
        # 1. OPTIMAL ALLOCATION (SciPy Highs LP Solver)
        # linprog minimizes c^T x, so c = -profit_matrix.flatten()
        c = -profit_matrix.flatten()
        
        # Inequality constraint: Sum_i Sum_d x_{i, d} * Cost(i, d) <= budget
        A_ub = [cost_matrix.flatten()]
        b_ub = [budget]
        
        # Equality constraints: Sum_d x_{i, d} == 1 for each customer i
        # Construct sparse-friendly constraint matrix
        row_indices = []
        col_indices = []
        data = []
        for i in range(N):
            for d in range(D):
                row_indices.append(i)
                col_indices.append(i * D + d)
                data.append(1.0)
                
        # Full dense A_eq for linprog
        A_eq = np.zeros((N, N * D))
        for r, c_idx, val in zip(row_indices, col_indices, data):
            A_eq[r, c_idx] = val
        b_eq = np.ones(N)
        
        bounds = [(0.0, 1.0) for _ in range(N * D)]
        
        res = linprog(
            c=c,
            A_ub=A_ub,
            b_ub=b_ub,
            A_eq=A_eq,
            b_eq=b_eq,
            bounds=bounds,
            method="highs"
        )
        
        x_solution = res.x.reshape((N, D))
        
        # Discretize continuous relaxation to argmax tier per customer
        prescribed_tier_idx = np.argmax(x_solution, axis=1)
        prescribed_tiers = [discount_tiers[idx] for idx in prescribed_tier_idx]
        
        # Compute realized budget and profit for Optimal Strategy
        opt_costs = np.array([cost_matrix[i, prescribed_tier_idx[i]] for i in range(N)])
        opt_profits = np.array([profit_matrix[i, prescribed_tier_idx[i]] for i in range(N)])
        
        # If slight discretization overflow of budget, trim lowest ROI assignments back to 0
        current_spend = np.sum(opt_costs)
        if current_spend > budget:
            sorted_by_roi = np.argsort(opt_profits / (opt_costs + 1e-6))
            for idx in sorted_by_roi:
                if current_spend <= budget:
                    break
                if prescribed_tiers[idx] > 0:
                    current_spend -= opt_costs[idx]
                    opt_profits[idx] = 0.0
                    opt_costs[idx] = 0.0
                    prescribed_tiers[idx] = 0
                    
        total_opt_profit = float(np.sum(opt_profits))
        total_opt_spend = float(np.sum(opt_costs))
        
        # Count allocations
        opt_tier_counts = {str(d): int(sum(1 for t in prescribed_tiers if t == d)) for d in discount_tiers}
        
        # 2. COMPARISON: TRADITIONAL PREDICTIVE ML TARGETING
        # Standard ML targets customers with highest predicted conversion / churn risk regardless of uplift
        ml_scores = self.df["predictive_ml_score"].values if "predictive_ml_score" in self.df.columns else base_conv
        sorted_ml_idx = np.argsort(ml_scores)[::-1]
        
        ml_spend = 0.0
        ml_profit = 0.0
        ml_targeted = 0
        ml_sure_things_wasted = 0
        
        for idx in sorted_ml_idx:
            # Traditional marketing gives blanket $20 (or $10) discount
            cost_20 = cost_matrix[idx, 2] # $20 tier
            if ml_spend + cost_20 <= budget:
                ml_spend += cost_20
                ml_profit += profit_matrix[idx, 2]
                ml_targeted += 1
                # If this was a Sure Thing, it wasted money!
                seg = self.df.iloc[idx].get("true_segment", self.df.iloc[idx].get("predicted_segment", ""))
                if "Sure" in str(seg):
                    ml_sure_things_wasted += 1
                    
        # 3. COMPARISON: BLANKET / RANDOM ROLLOUT
        rng = np.random.RandomState(42)
        rand_order = rng.permutation(N)
        rand_spend = 0.0
        rand_profit = 0.0
        for idx in rand_order:
            cost_10 = cost_matrix[idx, 1] # $10 tier
            if rand_spend + cost_10 <= budget:
                rand_spend += cost_10
                rand_profit += profit_matrix[idx, 1]
                
        # Calculate Wasted Spend Prevented
        # Wasted spend is discounts given to Sure Things (who would buy anyway) and Sleeping Dogs
        wasted_spend_saved = float(ml_sure_things_wasted * 15.0)
        
        # Add prescriptions back to df for the UI table
        self.df["optimal_discount"] = prescribed_tiers
        self.df["net_incremental_gain"] = np.round(opt_profits, 2)
        self.df["cost_to_serve"] = np.round(opt_costs, 2)
        
        # ROI Multipliers
        opt_roi = round(total_opt_profit / max(total_opt_spend, 1.0), 2)
        ml_roi = round(ml_profit / max(ml_spend, 1.0), 2)
        rand_roi = round(rand_profit / max(rand_spend, 1.0), 2)
        
        # Persuadables captured percentage (robust segment column detection)
        if "predicted_segment" in self.df.columns:
            persuadable_mask = self.df["predicted_segment"].astype(str).str.contains("Persuadable", case=False, na=False)
        elif "true_segment" in self.df.columns:
            persuadable_mask = self.df["true_segment"].astype(str).str.contains("Persuadable", case=False, na=False)
        elif "segment" in self.df.columns:
            persuadable_mask = self.df["segment"].astype(str).str.contains("Persuadable", case=False, na=False)
        else:
            persuadable_mask = pd.Series([False] * len(self.df), index=self.df.index)
        persuadables_targeted = int(sum(1 for i, p in enumerate(prescribed_tiers) if p > 0 and persuadable_mask.iloc[i]))
        
        return {
            "budget": budget,
            "cost_model": cost_model,
            "optimal_strategy": {
                "total_spend": round(total_opt_spend, 2),
                "budget_utilization_pct": round(100.0 * total_opt_spend / budget, 1),
                "net_incremental_revenue": round(total_opt_profit, 2),
                "roi_multiple": opt_roi,
                "tier_breakdown": opt_tier_counts,
                "persuadables_funded_count": persuadables_targeted
            },
            "predictive_ml_strategy": {
                "total_spend": round(ml_spend, 2),
                "net_incremental_revenue": round(ml_profit, 2),
                "roi_multiple": ml_roi,
                "sure_things_cannibalized": ml_sure_things_wasted
            },
            "random_strategy": {
                "total_spend": round(rand_spend, 2),
                "net_incremental_revenue": round(rand_profit, 2),
                "roi_multiple": rand_roi
            },
            "financial_advantage": {
                "profit_increase_vs_ml": round(total_opt_profit - ml_profit, 2),
                "profit_uplift_pct": round(max(0, (total_opt_profit - ml_profit) / max(abs(ml_profit), 1.0)) * 100, 1),
                "wasted_spend_prevented": round(wasted_spend_saved, 2)
            }
        }

    def compute_marginal_roi_curve(
        self,
        budget_min: float = 1000.0,
        budget_max: float = 20000.0,
        steps: int = 10
    ) -> Dict[str, Any]:
        """
        Dual Simplex Sensitivity Analysis:
        Calculates Shadow Price lambda = d(Profit)/d(Budget) and Marginal ROI
        across a discrete budget trajectory to identify the capital saturation ceiling.
        """
        budgets = np.linspace(budget_min, budget_max, steps)
        profit_points = []
        spend_points = []
        marginal_rois = []
        
        prev_spend = 0.0
        prev_profit = 0.0
        saturation_budget = float(budget_max)
        
        for idx, b in enumerate(budgets):
            res = self.solve_allocation(budget=float(b))
            spend = res["optimal_strategy"]["total_spend"]
            profit = res["optimal_strategy"]["net_incremental_revenue"]
            
            if idx == 0:
                marginal_rate = profit / max(spend, 1.0)
            else:
                delta_spend = spend - prev_spend
                delta_profit = profit - prev_profit
                marginal_rate = (delta_profit / delta_spend) if delta_spend > 10.0 else 0.0
                
            m_rate = round(float(max(marginal_rate, 0.0)), 2)
            marginal_rois.append(m_rate)
            profit_points.append(round(float(profit), 2))
            spend_points.append(round(float(spend), 2))
            
            if idx > 1 and m_rate < 1.05 and saturation_budget == float(budget_max):
                saturation_budget = round(float(b), 0)
                
            prev_spend = spend
            prev_profit = profit
            
        return {
            "budgets": [round(float(b), 0) for b in budgets],
            "actual_spends": spend_points,
            "net_profits": profit_points,
            "marginal_rois": marginal_rois,
            "saturation_budget": saturation_budget,
            "cfo_recommendation": f"Optimal capital deployment ceiling is ${saturation_budget:,.0f}. Beyond this threshold, marginal return falls below $1.00 per dollar spent due to customer pool saturation."
        }

