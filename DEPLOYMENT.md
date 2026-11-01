# EconoCausal: Production Deployment & Containerization Guide

This guide details the procedures for deploying the **EconoCausal Causal AI & Prescriptive Optimization** platform in local containerized environments and cloud infrastructure.

---

## 1. Quick Local Deployment via Docker Compose

### Prerequisites
- Docker Engine $\ge 24.0$
- Docker Compose v2

### Single-Command Start
Run from the repository root:
```bash
docker compose up --build -d
```

### Verification
- **Frontend Dashboard:** [http://localhost](http://localhost)
- **FastAPI REST API:** [http://localhost:8000](http://localhost:8000)
- **API Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Stopping Services
```bash
docker compose down
```

---

## 2. Container Architecture

```
                                  [ User Browser ]
                                         │
                                         ▼ (Port 80)
                       ┌───────────────────────────────────┐
                       │   Frontend Container (Nginx)      │
                       │   - Serves React SPA static assets│
                       │   - Gzip compression & asset cache│
                       └─────────────────┬─────────────────┘
                                         │ Reverse Proxy (/api/*)
                                         ▼ (Port 8000)
                       ┌───────────────────────────────────┐
                       │   Backend Container (FastAPI)     │
                       │   - Python 3.12 Slim              │
                       │   - EconML / DoWhy Engine         │
                       │   - SciPy Highs LP Solver         │
                       └───────────────────────────────────┘
```

---

## 3. Production Cloud Deployment Options

### Option A: AWS Elastic Container Service (ECS) with Fargate
1. Build and tag images:
   ```bash
   docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/econocausal-backend:latest ./backend
   docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/econocausal-frontend:latest ./frontend
   ```
2. Push to AWS Elastic Container Registry (ECR).
3. Create an ECS Task Definition defining both containers within the same task or behind an Application Load Balancer (ALB).

### Option B: Render / Fly.io / Railway
- **Backend Service:**
  - Runtime: Docker or Python 3.12
  - Root directory: `backend/`
  - Start command: `uvicorn app:app --host 0.0.0.0 --port 8000`
- **Frontend Service:**
  - Build command: `npm install && npm run build`
  - Publish directory: `frontend/dist`

---

## 4. Automated Testing & Continuous Integration (CI)

Every commit to `main` triggers our GitHub Actions pipeline (`.github/workflows/ci.yml`):
- Runs `pytest backend/tests -v`
- Compiles the frontend React production bundle with zero warnings.
