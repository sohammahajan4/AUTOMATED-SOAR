import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_get_playbook():
    pb_name = f"test-playbook-{uuid.uuid4().hex[:8]}"
    pb_payload = {
        "name": pb_name,
        "description": "A unit test playbook",
        "definition": {"steps": [{"type": "validate", "name": "step1"}]},
        "enabled": True,
    }
    response = client.post("/api/v1/playbooks", json=pb_payload)
    assert response.status_code == 201
    pb = response.json()
    assert pb["name"] == pb_name

    get_resp = client.get(f"/api/v1/playbooks/{pb['id']}")
    assert get_resp.status_code == 200
    fetched = get_resp.json()
    assert fetched["id"] == pb["id"]


def test_execute_playbook_and_approval_flow():
    pb_name = f"approval-playbook-{uuid.uuid4().hex[:8]}"
    pb_payload = {
        "name": pb_name,
        "description": "Playbook requiring approval",
        "definition": {
            "steps": [
                {"type": "validate", "name": "step1"},
                {"type": "wait_approval", "name": "approval_gate", "pending_action": "Quarantine"},
                {"type": "notify", "name": "step3"},
            ]
        },
        "enabled": True,
    }
    create_resp = client.post("/api/v1/playbooks", json=pb_payload)
    assert create_resp.status_code == 201
    pb = create_resp.json()

    exec_resp = client.post(f"/api/v1/playbooks/{pb['id']}/execute")
    assert exec_resp.status_code == 202
    exec_data = exec_resp.json()
    assert exec_data["status"] == "waiting_approval"

    # Verify pending approvals listing
    pending_resp = client.get("/api/v1/approvals/pending")
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()
    assert any(item["id"] == exec_data["id"] for item in pending_list)

    # Approve execution
    approve_resp = client.post(f"/api/v1/executions/{exec_data['id']}/approve")
    assert approve_resp.status_code == 200
    approved = approve_resp.json()
    assert approved["status"] == "completed"


def test_alerts_and_incident_flow():
    # Simulate an alert
    sim_resp = client.post("/api/v1/alerts/simulate?scenario=phishing")
    assert sim_resp.status_code == 201
    alert_data = sim_resp.json()
    assert "event_id" in alert_data

    # Create an incident linking the alert
    inc_payload = {
        "title": f"Phishing Incident {uuid.uuid4().hex[:6]}",
        "description": "Automated incident for unit test",
        "severity": "high",
        "category": "phishing",
        "risk_score": 75.0,
        "alert_ids": [alert_data["id"]],
    }
    inc_resp = client.post("/api/v1/incidents", json=inc_payload)
    assert inc_resp.status_code == 201
    inc_data = inc_resp.json()
    assert inc_data["severity"] == "high"
    assert len(inc_data["alerts"]) >= 1

    # Fetch stats
    stats_resp = client.get("/api/v1/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_alerts"] >= 1
    assert stats["total_incidents"] >= 1
