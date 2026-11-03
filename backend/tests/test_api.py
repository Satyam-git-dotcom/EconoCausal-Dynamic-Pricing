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

if __name__ == "__main__":
    print("Testing FastAPI Endpoints...")
    test_health_check_endpoint()
    print("  [✓] Health check endpoint passed")
    test_get_dataset_endpoint()
    print("  [✓] Dataset endpoint passed")
    test_get_dag_endpoint()
    print("  [✓] DAG endpoint passed")
    test_optimize_budget_endpoint()
    print("  [✓] Optimize budget endpoint passed")
    test_customer_matrix_pagination()
    print("  [✓] Customer matrix pagination passed")
    test_drift_evaluate_endpoint()
    print("  [✓] Drift evaluate endpoint passed")
    print("ALL REST API INTEGRATION TESTS PASSED!")
