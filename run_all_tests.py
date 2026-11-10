#!/usr/bin/env python3
"""
EconoCausal - Master Test Suite Runner
Runs unit and integration tests across Causal ML, Prescriptive Optimization, and FastAPI endpoints.
"""

import sys
import os
import time

# Set MPLCONFIGDIR to avoid matplotlib font-cache warnings
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib_cache"
os.environ["TESTING"] = "1"
os.makedirs("/tmp/matplotlib_cache", exist_ok=True)

# Add backend directory
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
sys.path.insert(0, backend_dir)

def print_header(title):
    print("\n" + "=" * 65)
    print(f"  🚀 {title.upper()}")
    print("=" * 65)

def main():
    start_time = time.time()
    print_header("EconoCausal Production Test Suite")
    
    test_results = []
    
    # 1. Dataset & Causal Engine Tests
    print("\n[1/3] Running Causal Engine & EconML Double ML Tests...")
    try:
        from tests.test_causal_engine import (
            sample_dataset,
            test_dataset_generation_properties,
            test_causal_dag_specification,
            test_double_ml_training_convergence,
            test_uplift_curves_calculation
        )
        ds = sample_dataset()
        test_dataset_generation_properties(ds)
        print("   ✔ Synthetic Observational Dataset Confounding: PASSED")
        test_causal_dag_specification(ds)
        print("   ✔ Microsoft DoWhy DAG & Backdoor Identification: PASSED")
        test_double_ml_training_convergence(ds)
        print("   ✔ EconML LinearDML & Neyman Orthogonality: PASSED")
        test_uplift_curves_calculation(ds)
        print("   ✔ Qini & Cumulative Uplift AUUC Calculations: PASSED")
        test_results.append(("Causal Inference & Double ML Suite", "4/4 Tests Passed", "PASS"))
    except Exception as e:
        print(f"   ✖ Causal Engine Test Failed: {e}")
        test_results.append(("Causal Inference & Double ML Suite", str(e), "FAIL"))

    # 2. Optimizer & Marginal ROI Tests
    print("\n[2/3] Running Prescriptive SciPy Highs LP & Shadow Pricing Tests...")
    try:
        from tests.test_optimizer import (
            PrescriptiveOptimizer,
            test_budget_strict_adherence,
            test_prescriptive_roi_superiority,
            test_zero_or_low_budget_edge_case,
            test_marginal_roi_sensitivity
        )
        from causal_engine import CausalEngine
        from dataset_generator import generate_retail_dataset
        
        opt_ds = generate_retail_dataset(n_samples=300, confounding_strength=0.8, random_seed=42)
        eng = CausalEngine(opt_ds)
        eng.train_double_ml(base_estimator="lightgbm", n_splits=2)
        opt = PrescriptiveOptimizer(eng.df)
        
        test_budget_strict_adherence(opt)
        print("   ✔ Strict Budget Knapsack Constraint Adherence: PASSED")
        test_prescriptive_roi_superiority(opt)
        print("   ✔ Prescriptive ROI Superiority over Blanket Baseline: PASSED")
        test_zero_or_low_budget_edge_case(opt)
        print("   ✔ Low & Boundary Budget Edge Cases: PASSED")
        test_marginal_roi_sensitivity(opt)
        print("   ✔ Dual Simplex Shadow Pricing & Saturation Threshold: PASSED")
        test_results.append(("Prescriptive SciPy LP & Shadow Pricing", "4/4 Tests Passed", "PASS"))
    except Exception as e:
        print(f"   ✖ Optimizer Test Failed: {e}")
        test_results.append(("Prescriptive SciPy LP & Shadow Pricing", str(e), "FAIL"))

    # 3. FastAPI REST Integration Tests
    print("\n[3/3] Running FastAPI REST Endpoints & Data Drift Tests...")
    try:
        from tests.test_api import (
            test_health_check_endpoint,
            test_get_dataset_endpoint,
            test_get_dag_endpoint,
            test_dag_node_inspection_endpoint,
            test_upload_dataset_endpoint,
            test_optimize_budget_endpoint,
            test_customer_matrix_pagination,
            test_drift_evaluate_endpoint,
            test_executive_summary_report_endpoints
        )
        test_health_check_endpoint()
        print("   ✔ GET /api/health Service Status: PASSED")
        test_get_dataset_endpoint()
        print("   ✔ GET /api/dataset Observational Cohorts: PASSED")
        test_get_dag_endpoint()
        print("   ✔ GET /api/dag Graph Topology & Backdoor Nodes: PASSED")
        test_dag_node_inspection_endpoint()
        print("   ✔ GET /api/dag/inspect/{node} Conditional Independence & Backdoors: PASSED")
        test_upload_dataset_endpoint()
        print("   ✔ POST /api/dataset/upload Custom CSV Ingestion & DML Retraining: PASSED")
        test_optimize_budget_endpoint()
        print("   ✔ POST /api/optimize Multi-tier Knapsack LP: PASSED")
        test_customer_matrix_pagination()
        print("   ✔ GET /api/customers Prescription Matrix Pagination: PASSED")
        test_drift_evaluate_endpoint()
        print("   ✔ POST /api/drift/evaluate KS-Test & PSI Detector: PASSED")
        test_executive_summary_report_endpoints()
        print("   ✔ GET /api/summary & /download Audit Report Generation: PASSED")
        test_results.append(("FastAPI REST & Drift Detector Suite", "9/9 Tests Passed", "PASS"))
    except Exception as e:
        print(f"   ✖ REST API Integration Failed: {e}")
        test_results.append(("FastAPI REST & Drift Detector Suite", str(e), "FAIL"))

    # Summary
    elapsed = time.time() - start_time
    print_header("Test Execution Summary")
    for suite, details, status in test_results:
        status_color = "🟢 PASS" if status == "PASS" else "🔴 FAIL"
        print(f"  {status_color} | {suite:<42} | {details}")
    print("-" * 65)
    print(f"  Total Execution Time: {elapsed:.2f} seconds")
    all_passed = all(status == "PASS" for _, _, status in test_results)
    count_passed = sum(int(details.split("/")[0]) for _, details, status in test_results if status == "PASS")
    total_tests = sum(int(details.split("/")[1].split()[0]) for _, details, status in test_results if status == "PASS")
    print(f"  Status: {'ALL ' + str(total_tests) + ' TESTS PASSED (100% SUCCESS)' if all_passed else 'SOME TESTS FAILED'}\n")
    if not all_passed:
        sys.exit(1)

if __name__ == "__main__":
    main()
