"""
test_api.py - Integration tests for FastAPI REST Endpoints
"""

try:
    import pytest
except Exception:
    class MockPytest:
        def fixture(self, fn):
            return fn
    pytest = MockPytest()
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "EconoCausal"

def test_get_dataset_endpoint():
    response = client.get("/api/dataset")
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert "columns" in data
    assert data["total_records"] > 0

def test_get_dag_endpoint():
    response = client.get("/api/dag")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert "dot_graph" in data

def test_optimize_budget_endpoint():
    payload = {
        "budget": 4000.0,
        "discount_tiers": [0, 10, 20],
        "cost_model": "expected_redemption"
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "optimal_strategy" in data
    assert data["optimal_strategy"]["total_spend"] <= 4000.0

def test_customer_matrix_pagination():
    response = client.get("/api/customers?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["records"]) == 10
    assert "customer_id" in data["records"][0]

def test_drift_evaluate_endpoint():
    payload = {
        "scenario": "economic_downturn",
        "batch_size": 500
    }
    response = client.post("/api/drift/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "system_status" in data
    assert "features" in data
    assert len(data["features"]) >= 4

def test_executive_summary_report_endpoints():
    r_json = client.get("/api/summary")
    assert r_json.status_code == 200
    data = r_json.json()
    assert "markdown_report" in data
    assert "metrics" in data
    assert "archetypes" in data

    r_md = client.get("/api/summary?format=markdown")
    assert r_md.status_code == 200
    assert "EconoCausal" in r_md.text

    r_dl = client.get("/api/summary/download?format=markdown")
    assert r_dl.status_code == 200
    assert "attachment" in r_dl.headers.get("content-disposition", "")

def test_dag_node_inspection_endpoint():
    # Test Confounder Node inspection
    r_conf = client.get("/api/dag/inspect/annual_income_k")
    assert r_conf.status_code == 200
    data_conf = r_conf.json()
    assert data_conf["role"] == "Confounder (Observed)"
    assert data_conf["backdoor_status"] == "BLOCKED"
    assert "independence_test" in data_conf
    assert "confounding_bias_removed" in data_conf["independence_test"]

    # Test Treatment Node inspection
    r_treat = client.get("/api/dag/inspect/treatment_binary")
    assert r_treat.status_code == 200
    data_treat = r_treat.json()
    assert "Treatment" in data_treat["role"]
    assert "causal_dml_ate" in data_treat["independence_test"]

    # Test Outcome Node inspection
    r_out = client.get("/api/dag/inspect/conversion")
    assert r_out.status_code == 200
    data_out = r_out.json()
    assert "Outcome" in data_out["role"]

def test_upload_dataset_endpoint():
    # Construct a sample CSV with custom column aliases
    csv_data = (
        "income,tier,recency,visits,discounts,app,discount,converted\n"
        + "\n".join([f"{50 + (i % 30)},{1 + (i % 4)},{10 + (i % 60)},{5 + (i % 15)},0.25,{i % 2},{10 if i % 2 == 1 else 0},{1 if i % 3 == 0 else 0}" for i in range(120)])
    )
    files = {"file": ("test_custom_customers.csv", csv_data.encode("utf-8"), "text/csv")}
    r_upload = client.post("/api/dataset/upload", files=files)
    assert r_upload.status_code == 200
    data = r_upload.json()
    assert data["status"] == "uploaded_and_trained"
    assert data["records"] == 120
    assert "training" in data
    assert "optimal_strategy" in data

if __name__ == "__main__":
    print("Testing FastAPI Endpoints...")
    test_health_check_endpoint()
    print("  [✓] Health check endpoint passed")
    test_get_dataset_endpoint()
    print("  [✓] Dataset endpoint passed")
    test_get_dag_endpoint()
    print("  [✓] DAG endpoint passed")
    test_dag_node_inspection_endpoint()
    print("  [✓] DAG node inspection endpoint passed")
    test_upload_dataset_endpoint()
    print("  [✓] CSV upload & retraining endpoint passed")
    test_optimize_budget_endpoint()
    print("  [✓] Optimize budget endpoint passed")
    test_customer_matrix_pagination()
    print("  [✓] Customer matrix pagination passed")
    test_drift_evaluate_endpoint()
    print("  [✓] Drift evaluate endpoint passed")
    test_executive_summary_report_endpoints()
    print("  [✓] Executive audit report export endpoints passed")
    print("ALL REST API INTEGRATION TESTS PASSED!")
