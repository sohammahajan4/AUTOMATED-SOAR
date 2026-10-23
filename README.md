# Automated SOAR – Enterprise Incident Response & Playbook Engine

A full-stack, enterprise-grade **Security Orchestration, Automation and Response (SOAR)** platform built for modern Security Operations Centers (SOCs).

---

## 📌 Project Submission & Key Information

| Submission Requirement | Specified Filename | Submitted File Location |
|---|---|---|
| **Code File (.ipynb / .py)** | `YourName_ProjectName.ipynb` | [`SohamMahajan_AutomatedSOAR.ipynb`](file:///c:/Users/soham/.gemini/antigravity/scratch/AutomatedSOAR/SohamMahajan_AutomatedSOAR.ipynb) *(mirrored as `YourName_ProjectName.ipynb`)* |
| **Requirements File (.txt)** | `requirements.txt` | [`requirements.txt`](file:///c:/Users/soham/.gemini/antigravity/scratch/AutomatedSOAR/requirements.txt) |
| **Project Report (.docx)** | `YourName_ProjectReport.docx` | [`SohamMahajan_ProjectReport.docx`](file:///c:/Users/soham/.gemini/antigravity/scratch/AutomatedSOAR/SohamMahajan_ProjectReport.docx) *(mirrored as `YourName_ProjectReport.docx`)* |
| **README File (.md)** | `README.md` | [`README.md`](file:///c:/Users/soham/.gemini/antigravity/scratch/AutomatedSOAR/README.md) |

* **Author / Candidate**: Soham Mahajan
* **Project Name**: Automated SOAR (Security Orchestration, Automation and Response)
* **Architecture**: Full-Stack Distributed Cyber SOC Platform (FastAPI + React 18 + SQLAlchemy 2.0 ORM + SQLite/PostgreSQL)
* **Release Version**: 1.0.0 Production Enterprise Edition
* **Date**: October 2026

---

## 📊 Dataset & Threat Telemetry Links

The Automated SOAR platform processes standardized cybersecurity telemetry across EDR, SIEM, Firewalls, and Identity Providers. The platform is designed to ingest and validate the following live and benchmark datasets:

1. **Benchmark Cyber Intrusion Detection Datasets**:
   * **CIC-IDS (Canadian Institute for Cybersecurity)**: [UNB CIC-IDS2017 & CSE-CIC-IDS2018 Intrusion Datasets](https://www.unb.ca/cic/datasets/ids-2018.html) — Realistic network traffic capturing Brute Force, Botnet, DoS, and Infiltration attacks.
   * **Kaggle Cybersecurity & Network Threat Corpus**: [Kaggle Network Intrusion Detection Dataset](https://www.kaggle.com/datasets/sampadab17/network-intrusion-detection) — Labeled network connection vectors for anomaly triaging.
   * **AbuseIPDB Threat Intelligence Feed**: [AbuseIPDB IP Reputation Blacklist](https://www.abuseipdb.com/) — Community-driven malicious IP blacklist used for IP reputation scoring.

2. **Built-In Synthetic Multi-Vector Telemetry Generator**:
   The engine includes a native multi-vector telemetry simulator providing 5 real-world attack scenarios accessible via the `/api/v1/alerts/simulate` endpoint and UI:
   * **🎣 Phishing Campaign**: Proofpoint Email Gateway telemetry with credential harvesting URLs and malicious attachment hashes.
   * **🛑 Critical Ransomware Outbreak**: CrowdStrike Falcon EDR telemetry detecting `vssadmin` shadow copy destruction and rapid file system encryption.
   * **💥 Kerberos Brute Force Storm**: Active Directory Domain Controller Event ID 4771/4625 logs (450+ failed logons within 60s).
   * **✈️ Impossible Travel Anomaly**: Okta Cloud Identity telemetry with concurrent multi-geographical logins (USA & Russia within 8 minutes).
   * **📡 CobaltStrike C2 Beaconing**: Suricata Network IDS flow telemetry identifying periodic encrypted HTTPS beacons.

3. **Bulk Ingestion via CSV & JSON**:
   * Analysts can import external datasets into the SOAR platform using the bulk import endpoint: `POST /api/v1/alerts/import`.
   * Standard schema columns: `event_id`, `timestamp`, `source_product`, `category`, `severity`, `source_ip`, `destination_ip`, `user`, `hostname`, `detection_rule`, and raw `evidence` JSON.

---

## ⚡ Direct Quick Links (Live Services)

When the application is running, click these links to access the platform directly:

* **SOC Dashboard (Frontend)**: Open [http://localhost:3000](http://localhost:3000/) in your browser.
* **Interactive API Documentation (Swagger)**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser.
* **API Health Check**: Open [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) in your browser.
* **Default Admin Credentials**:
  * **Username**: `admin`
  * **Password**: `admin123`

---

## 🚀 How to Run the Project (Step-by-Step)

### Prerequisites

* **Python >=3.11** (Python 3.12, 3.13, 3.14 supported)
* **Node.js >=18** with `npm`

---

### Method 1: Standard Full-Stack Run (Recommended)

Open **two separate terminal windows**:

#### Terminal 1 — Backend (FastAPI API Server)
```powershell
# 1. Open the AutomatedSOAR project root directory
cd AutomatedSOAR

# 2. Activate the virtual environment
.\backend\.venv\Scripts\activate       # On Windows
# source backend/.venv/bin/activate    # On Linux/macOS

# 3. If running for the first time, install requirements:
pip install -r requirements.txt

# 4. Start the FastAPI Uvicorn server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
> The backend will initialize SQLite (`data.db`), auto-seed default enterprise playbooks, sample incidents, alerts, and admin credentials, and listen at **`http://127.0.0.1:8000`**.

#### Terminal 2 — Frontend (React SOC Dashboard)
```powershell
# 1. Navigate to the frontend directory
cd AutomatedSOAR\frontend

# 2. If running for the first time, install dependencies:
npm install

# 3. Start the React development server
npm start
```
> The dashboard will compile and open automatically in your browser at **`http://localhost:3000`**.

---

### Method 2: Single Jupyter Notebook Execution

If reviewing or executing the complete project within Jupyter or Google Colab:
```powershell
cd AutomatedSOAR
.\backend\.venv\Scripts\activate
jupyter notebook SohamMahajan_AutomatedSOAR.ipynb
```
> The notebook executes the entire database setup, models, schemas, state machine engine, API endpoints, attack simulations, human-in-the-loop approvals, and KPI reports with pre-rendered live outputs.

---

### Method 3: Single Standalone Python Script

If you want to run the complete backend API, database, and automation engine from a **single self-contained Python file**:

```powershell
cd AutomatedSOAR
.\backend\.venv\Scripts\activate
python backend/app/standalone_soar.py
```
> This starts the entire SOAR API engine on `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

---

### Method 4: Running with Docker Compose

If you have Docker Desktop installed and want to run backend, frontend, and PostgreSQL in containers:

```powershell
cd AutomatedSOAR
docker-compose up --build
```
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:8000`
* **PostgreSQL Database**: Port `5432`

---

### Method 5: Running the Automated Test Suite

To run all automated unit and integration tests (tests API endpoints, alert ingestion, playbook state machine, and human approval gates):

```powershell
cd AutomatedSOAR
.\backend\.venv\Scripts\activate
pytest backend/tests/ -v
```
All test suites will execute and display passing status:
```text
backend/tests/test_playbook_engine.py::test_health_check PASSED
backend/tests/test_playbook_engine.py::test_create_and_get_playbook PASSED
backend/tests/test_playbook_engine.py::test_execute_playbook_and_approval_flow PASSED
backend/tests/test_playbook_engine.py::test_alerts_and_incident_flow PASSED
```

---

## 🎯 Dashboard Features & How to Test

Once `http://localhost:3000` is open:

1. **⚡ Test Attack Simulation**:
   * Click **"⚡ Simulate Attack"** in the top navigation or quick action bar.
   * Choose any attack scenario:
     * 🎣 *Phishing Campaign* (Proofpoint Email Harvester)
     * 🛑 *Ransomware Attack* (CrowdStrike Shadow Copy Wipe)
     * 💥 *Brute Force Storm* (Active Directory 450+ Failed Kerberos Logons)
     * ✈️ *Impossible Travel* (Okta Concurrent Multi-Geo Sign-in)
     * 📡 *CobaltStrike C2* (Suricata Periodic HTTPS Beaconing)
   * A toast notification will pop up and the alert will appear in the live feed.

2. **🚨 Triage Incidents & Run Playbooks**:
   * Go to **"Incident War Room"** in the sidebar.
   * Click **"Details"** on any case (e.g. *Critical Ransomware Outbreak*).
   * Review correlated alerts, risk score meter (0–100), and narrative.
   * Under **"Dispatch Automated Containment Playbook"**, select a playbook and click **"Run Playbook"**.

3. **⚠️ Human-in-the-Loop Approvals**:
   * If a playbook contains a `wait_approval` safety gate, it pauses and displays a glowing badge.
   * Go to **"Approvals & Audit Trail"** in the sidebar.
   * Review the paused execution card and click:
     * **"✓ Authorize & Resume"** to approve and automatically continue execution.
     * **"✕ Reject & Abort"** to cancel.
   * Click **"Inspect Audit Logs"** to view real-time timestamped step console logs.

4. **🔄 Custom Playbook Designer**:
   * Go to **"Playbook Designer"** to inspect interactive visual workflow nodes (*Validate ➔ Threat Intel Enrich ➔ Approval Gate ➔ Action ➔ Notify*).
   * Click **"+ Design Playbook"** to build custom step sequences.

---

## 🏛️ System Architecture

- **Backend**: Python 3.11+, FastAPI (high-concurrency ASGI), Pydantic v2, SQLAlchemy 2.0 ORM, JWT/OAuth2 Authentication.
- **Frontend**: React 18, HTML5, Vanilla CSS Cyber SOC Glassmorphism theme, real-time polling telemetry.
- **Playbook Engine**: State machine execution engine with human-in-the-loop approval gates, step-by-step audit logging, and automated containment actions.
- **Attack Simulator**: Multi-vector synthetic security alert generator.

---

## 📋 API Reference (Summary)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status |
| `POST` | `/api/v1/token` | OAuth2 JWT authentication token |
| `GET` | `/api/v1/stats` | High-level SOC metrics and severity stats |
| `POST` | `/api/v1/alerts` | Ingest and deduplicate security alert |
| `GET` | `/api/v1/alerts` | Paginated and filtered alert list |
| `POST` | `/api/v1/alerts/simulate` | Ingest synthetic attack scenarios |
| `POST` | `/api/v1/alerts/import` | Bulk upload CSV or JSON alerts |
| `POST` | `/api/v1/webhook` | Inbound SIEM/EDR HMAC-SHA256 webhook |
| `POST` | `/api/v1/incidents` | Create triaged incident case |
| `GET` | `/api/v1/incidents` | List incidents with status & severity filters |
| `POST` | `/api/v1/incidents/{id}/trigger_playbook` | Execute playbook on incident |
| `POST` | `/api/v1/playbooks` | Create new orchestration playbook |
| `GET` | `/api/v1/playbooks` | List playbooks |
| `POST` | `/api/v1/playbooks/{id}/execute` | Run playbook execution |
| `GET` | `/api/v1/executions` | List execution history and audit logs |
| `GET` | `/api/v1/approvals/pending` | List executions paused for human approval |
| `POST` | `/api/v1/executions/{id}/approve` | Approve and resume execution |
| `POST` | `/api/v1/executions/{id}/reject` | Reject and cancel execution |
