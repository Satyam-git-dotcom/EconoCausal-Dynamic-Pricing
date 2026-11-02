"""
test_optimizer.py - Unit tests for Prescriptive SciPy Optimization Solver
"""

try:
    import pytest
except ImportError:
    class DummyPytest:
        @staticmethod
        def fixture(fn):
            return fn
    pytest = DummyPytest()
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dataset_generator import generate_retail_dataset
from causal_engine import CausalEngine
from optimization_solver import PrescriptiveOptimizer

@pytest.fixture
def trained_optimizer():
    df = generate_retail_dataset(n_samples=400, random_seed=42)
    engine = CausalEngine(df)
    engine.train_double_ml(base_estimator="lightgbm", n_splits=2)
    return PrescriptiveOptimizer(engine.df)

def test_budget_strict_adherence(trained_optimizer):
    test_budget = 2500.0
    res = trained_optimizer.solve_allocation(budget=test_budget)
    
    total_spend = res["optimal_strategy"]["total_spend"]
    assert total_spend <= test_budget
    assert res["optimal_strategy"]["net_incremental_revenue"] > 0
    assert "0" in res["optimal_strategy"]["tier_breakdown"]
    assert "10" in res["optimal_strategy"]["tier_breakdown"]
    assert "20" in res["optimal_strategy"]["tier_breakdown"]

def test_prescriptive_roi_superiority(trained_optimizer):
    res = trained_optimizer.solve_allocation(budget=3000.0)
    
    opt_roi = res["optimal_strategy"]["roi_multiple"]
    ml_roi = res["predictive_ml_strategy"]["roi_multiple"]
    
    # Prescriptive causal allocation must outperform flawed predictive ML targeting
    assert opt_roi > ml_roi
    assert res["financial_advantage"]["wasted_spend_prevented"] >= 0

def test_zero_or_low_budget_edge_case(trained_optimizer):
    res = trained_optimizer.solve_allocation(budget=100.0)
    assert res["optimal_strategy"]["total_spend"] <= 100.0

def test_marginal_roi_sensitivity(trained_optimizer):
    curve = trained_optimizer.compute_marginal_roi_curve(budget_min=1000.0, budget_max=8000.0, steps=5)
    assert len(curve["budgets"]) == 5
    assert len(curve["marginal_rois"]) == 5
    assert len(curve["net_profits"]) == 5
    # Total profits should be non-decreasing with budget
    assert curve["net_profits"][-1] >= curve["net_profits"][0]
    assert curve["saturation_budget"] > 0
    assert "cfo_recommendation" in curve

if __name__ == "__main__":
    df = generate_retail_dataset(n_samples=300, random_seed=42)
    eng = CausalEngine(df)
    eng.train_double_ml(base_estimator="lightgbm", n_splits=2)
    opt = PrescriptiveOptimizer(eng.df)
    test_budget_strict_adherence(opt)
    test_prescriptive_roi_superiority(opt)
    test_zero_or_low_budget_edge_case(opt)
    test_marginal_roi_sensitivity(opt)
    print("ALL OPTIMIZER AND MARGINAL ROI TESTS PASSED!")
