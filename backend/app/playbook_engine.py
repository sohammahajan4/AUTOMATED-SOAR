import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from .models import PlaybookExecution, PlaybookStatus, Playbook, Incident, Alert


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat() + "Z"


def _add_log(exec_rec: PlaybookExecution, step_name: str, message: str, level: str = "INFO", details: dict = None):
    current_logs = list(exec_rec.logs or [])
    entry = {
        "timestamp": utc_now_iso(),
        "step": step_name,
        "level": level,
        "message": message,
    }
    if details:
        entry["details"] = details
    current_logs.append(entry)
    exec_rec.logs = current_logs
    flag_modified(exec_rec, "logs")


def _handle_validate(step, exec_rec, db: Session):
    step_name = step.get("name", "validate")
    _add_log(exec_rec, step_name, f"Validating incident telemetry & IOC indicators for step '{step_name}'")


def _handle_enrich(step, exec_rec, db: Session):
    step_name = step.get("name", "enrich")
    incident = exec_rec.incident
    details = {
        "virustotal_score": "78/90 (Malicious)",
        "abuseipdb_confidence": "95%",
        "asn": "AS13335 Cloudflare / Bulletproof Host",
        "geo": "Bucharest, Romania",
        "threat_actor": "APT-29 / CozyBear Pattern",
    }
    _add_log(
        exec_rec,
        step_name,
        f"Enriched IOC intelligence: IP reputation high risk (Confidence: 95%, Geo: Romania)",
        details=details,
    )
    if incident:
        incident.risk_score = min(100.0, (incident.risk_score or 50.0) + 25.0)
        db.add(incident)


def _handle_contain(step, exec_rec, db: Session):
    step_name = step.get("name", "contain")
    _add_log(
        exec_rec,
        step_name,
        f"EDR Host Isolation applied to target host/endpoint. Network quarantined via CrowdStrike Falcon API simulation.",
        details={"action": "host_isolate", "status": "quarantined", "network_policy": "restricted_dhcp"},
    )
    if exec_rec.incident:
        exec_rec.incident.status = "contained"
        db.add(exec_rec.incident)


def _handle_block_ip(step, exec_rec, db: Session):
    step_name = step.get("name", "block_ip")
    _add_log(
        exec_rec,
        step_name,
        f"Palo Alto / AWS WAF Perimeter Rule deployed: Malicious IP blacklisted in edge firewall ACL.",
        details={"firewall": "PaloAlto-Edge-01", "rule_id": "DENY-SOAR-AUTO-9821", "action": "DROP"},
    )


def _handle_disable_user(step, exec_rec, db: Session):
    step_name = step.get("name", "disable_user")
    _add_log(
        exec_rec,
        step_name,
        f"Active Directory & Okta session revoked: User credentials invalidated and MFA tokens revoked.",
        details={"iam_action": "revoke_refresh_tokens", "account_status": "disabled"},
    )


def _handle_notify(step, exec_rec, db: Session):
    step_name = step.get("name", "notify")
    channel = step.get("channel", "Slack #soc-incident-war-room")
    _add_log(
        exec_rec,
        step_name,
        f"Automated notification dispatched to {channel} and SOC Tier-2 On-Call PagerDuty.",
        details={"channel": channel, "urgency": "high"},
    )


def _handle_create_ticket(step, exec_rec, db: Session):
    step_name = step.get("name", "create_ticket")
    _add_log(
        exec_rec,
        step_name,
        f"ServiceNow Security Incident ticket generated: INC0928371 (Assigned to Tier-2 SOC).",
        details={"ticket_id": "INC0928371", "priority": "P1-Urgent"},
    )


def _handle_wait_approval(step, exec_rec, db: Session):
    step_name = step.get("name", "wait_approval")
    # If previously approved, pass through
    if exec_rec.approved is True:
        _add_log(exec_rec, step_name, f"Approval gate passed for step '{step_name}'")
        return

    exec_rec.status = PlaybookStatus.waiting_approval
    _add_log(
        exec_rec,
        step_name,
        f"CRITICAL ACTION PAUSED: Step '{step_name}' requires SOC Lead / Manager authorization to proceed.",
        level="WARN",
        details={"required_role": "SOC_MANAGER", "action_pending": step.get("pending_action", "Containment")},
    )
    # Increment current_step so resume proceeds to next step
    exec_rec.current_step = (exec_rec.current_step or 0) + 1
    db.commit()
    # Raise StopIteration to pause execution loop
    raise StopIteration


STEP_HANDLERS = {
    "validate": _handle_validate,
    "enrich": _handle_enrich,
    "notify": _handle_notify,
    "contain": _handle_contain,
    "isolate": _handle_contain,
    "block_ip": _handle_block_ip,
    "disable_user": _handle_disable_user,
    "create_ticket": _handle_create_ticket,
    "wait_approval": _handle_wait_approval,
}


def execute_playbook(execution_id: int, db: Session):
    """Run a playbook execution synchronously (or from a BackgroundTask)."""
    exec_rec = db.query(PlaybookExecution).filter(PlaybookExecution.id == execution_id).first()
    if not exec_rec:
        return

    playbook = db.query(Playbook).filter(Playbook.id == exec_rec.playbook_id).first()
    if not playbook:
        exec_rec.status = PlaybookStatus.failed
        _add_log(exec_rec, "init", "Playbook definition not found in database", level="ERROR")
        db.commit()
        return

    definition = playbook.definition or {}
    steps = definition.get("steps", [])
    start_idx = exec_rec.current_step or 0

    if exec_rec.status != PlaybookStatus.running:
        exec_rec.status = PlaybookStatus.running
        if not exec_rec.start_time:
            exec_rec.start_time = datetime.now(timezone.utc)
        _add_log(exec_rec, "orchestration", f"Playbook '{playbook.name}' execution active at step {start_idx + 1}/{len(steps)}")
        db.commit()

    try:
        for idx in range(start_idx, len(steps)):
            step = steps[idx]
            step_type = step.get("type", "validate")
            handler = STEP_HANDLERS.get(step_type)

            if handler:
                handler(step, exec_rec, db)
            else:
                _add_log(exec_rec, step.get("name", "step"), f"Unknown step type '{step_type}' - executed default pass-through", level="WARN")

            exec_rec.current_step = idx + 1
            db.commit()
            time.sleep(0.02)
    except StopIteration:
        # Paused awaiting human approval
        return
    except Exception as e:
        exec_rec.status = PlaybookStatus.failed
        _add_log(exec_rec, "execution_error", f"Step failed with error: {str(e)}", level="ERROR")
        db.commit()
        return

    # All steps finished successfully
    exec_rec.status = PlaybookStatus.completed
    exec_rec.end_time = datetime.now(timezone.utc)
    _add_log(exec_rec, "completion", f"Playbook '{playbook.name}' execution completed successfully")
    db.commit()
