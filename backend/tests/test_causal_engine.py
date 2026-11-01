"""
test_causal_engine.py - Unit tests for Causal Inference & Double ML Engine
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dataset_generator import generate_retail_dataset
from causal_engine import CausalEngine

@pytest.fixture
def sample_dataset():
    return generate_retail_dataset(n_samples=500, confounding_strength=0.8, random_seed=42)

def test_dataset_generation_properties(sample_dataset):
    assert len(sample_dataset) == 500
    expected_cols = [
        "customer_id", "annual_income_k", "loyalty_tier", "recency_days",
        "website_visits_30d", "treatment_discount", "treatment_binary",
        "baseline_prob", "conversion"
    ]
    for col in expected_cols:
        assert col in sample_dataset.columns
    # Ensure treatment is discrete and within expected domain
    assert set(sample_dataset["treatment_discount"].unique()).issubset({0, 10, 20})
    assert set(sample_dataset["treatment_binary"].unique()).issubset({0, 1})

def test_causal_dag_specification(sample_dataset):
    engine = CausalEngine(sample_dataset)
    dag_spec = engine.get_dag_specification()
    
    assert "dot_graph" in dag_spec
    assert len(dag_spec["nodes"]) >= 8
    assert len(dag_spec["confounders"]) >= 5
    assert dag_spec["treatment"] == "treatment_binary"
    assert dag_spec["outcome"] == "conversion"

def test_double_ml_training_convergence(sample_dataset):
    engine = CausalEngine(sample_dataset)
    res = engine.train_double_ml(base_estimator="lightgbm", n_splits=2)
    
    assert res["status"] == "success"
    assert res["average_treatment_effect_ate"] > 0.05
    assert "Persuadables" in res["segment_distribution"]
    assert "estimated_ite" in engine.df.columns
    assert len(engine.df["estimated_ite"]) == 500

def test_uplift_curves_calculation(sample_dataset):
    engine = CausalEngine(sample_dataset)
    engine.train_double_ml(base_estimator="lightgbm", n_splits=2)
    curves = engine.compute_uplift_curves(n_bins=10)
    
    assert "causal_dml" in curves
    assert "traditional_predictive_ml" in curves
    assert "random_rollout" in curves
    assert len(curves["percentiles"]) == 10
    assert curves["causal_dml"]["auuc"] > 0
    assert len(curves["causal_dml"]["qini"]) == 10
    assert len(curves["causal_dml"]["cumulative_uplift"]) == 10
