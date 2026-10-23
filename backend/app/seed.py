from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Alert, Incident, Playbook, User, IncidentStatus, IncidentPriority
from .security import get_password_hash


def seed_database():
    db: Session = SessionLocal()
    try:
        # 1. Seed Admin User
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()

        # 2. Seed Default Enterprise Playbooks
        if db.query(Playbook).count() == 0:
            playbooks = [
                {
                    "name": "Phishing Triage & Mailbox Quarantine",
                    "description": "Validates suspicious email headers, enriches IOCs, pauses for human approval, blocks sender at perimeter, and quarantines target mailbox.",
                    "definition": {
                        "trigger": "phishing_alert",
                        "steps": [
                            {"type": "validate", "name": "Validate Email Headers & SPF/DKIM"},
                            {"type": "enrich", "name": "Threat Intel Lookup (VirusTotal & URLScan)"},
                            {"type": "wait_approval", "name": "SOC Lead Approval for Mailbox Purge", "pending_action": "Mailbox Purge & Sender Blacklist"},
                            {"type": "block_ip", "name": "Block Sender IP on Perimeter Firewall"},
                            {"type": "notify", "name": "Notify User & Dispatch Alert to Slack #soc-war-room", "channel": "Slack #soc-war-room"},
                        ],
                    },
                    "enabled": True,
                },
                {
                    "name": "Ransomware Rapid Host Containment",
                    "description": "Detects high-volume encryption patterns, isolates compromised workstation via EDR, blocks active C2 outbound communication, and creates P1 incident ticket.",
                    "definition": {
                        "trigger": "ransomware_alert",
                        "steps": [
                            {"type": "validate", "name": "Verify EDR File Encryption Pattern"},
                            {"type": "enrich", "name": "IOC Hash Lookup on Threat Cloud"},
                            {"type": "contain", "name": "Isolate Host via CrowdStrike Falcon EDR", "target": "endpoint"},
                            {"type": "block_ip", "name": "Block Malicious C2 IP on Perimeter Gateway"},
                            {"type": "create_ticket", "name": "Create P1 ServiceNow Security Incident"},
                            {"type": "notify", "name": "Urgent Alert to Incident Response War Room", "channel": "Slack #incident-response"},
                        ],
                    },
                    "enabled": True,
                },
                {
                    "name": "Brute Force Active Directory Defense",
                    "description": "Detects high-rate failed logons against domain controllers, validates anomaly, blocks attacker IP in edge ACL, and temporarily locks target identity.",
                    "definition": {
                        "trigger": "brute_force_alert",
                        "steps": [
                            {"type": "validate", "name": "Verify Failed Logon Rate Threshold (400+ attempts)"},
                            {"type": "enrich", "name": "AbuseIPDB Reputation & Tor Exit Node Check"},
                            {"type": "block_ip", "name": "Add Attacker IP to Drop List on Firewall"},
                            {"type": "disable_user", "name": "Lock Target Active Directory Account"},
                            {"type": "notify", "name": "Send Push Notification to Security Operations", "channel": "PagerDuty / SMS"},
                        ],
                    },
                    "enabled": True,
                },
                {
                    "name": "Impossible Travel Anomaly Response",
                    "description": "Analyzes concurrent logins from disparate geographical regions, verifies velocity, requests SOC approval, and revokes active identity sessions.",
                    "definition": {
                        "trigger": "impossible_travel_alert",
                        "steps": [
                            {"type": "validate", "name": "Calculate Distance and Velocity Anomaly"},
                            {"type": "enrich", "name": "Query Okta Identity Risk & VPN Datacenter ASN"},
                            {"type": "wait_approval", "name": "SOC Tier-2 Authorization to Revoke Tokens", "pending_action": "Revoke All OAuth/SAML Active Sessions"},
                            {"type": "disable_user", "name": "Revoke User Active Identity Sessions"},
                            {"type": "notify", "name": "Inform User via Secondary Contact & Manager", "channel": "Email / Out-of-Band"},
                        ],
                    },
                    "enabled": True,
                },
            ]
            for pb_data in playbooks:
                pb = Playbook(**pb_data)
                db.add(pb)
            db.commit()

        # 3. Seed Sample Security Alerts
        if db.query(Alert).count() == 0:
            now = datetime.now(timezone.utc)
            alerts = [
                Alert(
                    event_id="EVT-PHISH-001",
                    timestamp=now - timedelta(minutes=45),
                    source_product="Proofpoint Email Protection",
                    category="phishing",
                    severity="high",
                    source_ip="185.220.101.5",
                    destination_ip="10.0.4.12",
                    user="finance-lead@company.com",
                    hostname="FIN-LAPTOP-04",
                    detection_rule="SEC-RULE-904: Urgent Wire Transfer Credential Harvester",
                    evidence={"subject": "URGENT: Executive Wire Transfer Authorization", "url": "https://secure-intuit-update.cc"},
                    correlation_id="CORR-INC-01",
                    meta={"simulated": True},
                    processed=True,
                ),
                Alert(
                    event_id="EVT-RANSOM-002",
                    timestamp=now - timedelta(minutes=25),
                    source_product="CrowdStrike Falcon EDR",
                    category="malware",
                    severity="critical",
                    source_ip="192.168.1.105",
                    destination_ip="45.133.1.20",
                    user="soham.dev",
                    hostname="ENG-WORKSTATION-01",
                    detection_rule="EDR-BEHAVIOR: Shadow Copy Deletion & Mass File Encryption Pattern",
                    evidence={"process": "vssadmin.exe delete shadows /all /quiet", "file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
                    correlation_id="CORR-INC-02",
                    meta={"simulated": True},
                    processed=True,
                ),
                Alert(
                    event_id="EVT-BRUTE-003",
                    timestamp=now - timedelta(minutes=10),
                    source_product="Active Directory DC",
                    category="authentication",
                    severity="medium",
                    source_ip="194.26.29.112",
                    destination_ip="10.0.0.1",
                    user="administrator",
                    hostname="DC-PRIMARY-01",
                    detection_rule="AD-AUDIT-4625: 450 Failed Kerberos Logons within 60 Seconds",
                    evidence={"failed_count": 450, "protocol": "Kerberos"},
                    correlation_id="CORR-INC-03",
                    meta={"simulated": True},
                    processed=False,
                ),
                Alert(
                    event_id="EVT-TRAVEL-004",
                    timestamp=now - timedelta(minutes=5),
                    source_product="Okta Identity Cloud",
                    category="identity",
                    severity="high",
                    source_ip="91.240.118.23",
                    destination_ip="10.0.1.50",
                    user="ciso@company.com",
                    hostname="OKTA-AUTH-GATEWAY",
                    detection_rule="IAM-GEO-ANOMALY: Concurrent Sign-Ins New York (US) & St. Petersburg (RU)",
                    evidence={"velocity_kmh": 52500, "loc1": "New York", "loc2": "St. Petersburg"},
                    correlation_id="CORR-INC-04",
                    meta={"simulated": True},
                    processed=False,
                ),
                Alert(
                    event_id="EVT-C2-005",
                    timestamp=now - timedelta(minutes=2),
                    source_product="Suricata Network IDS",
                    category="c2_network",
                    severity="critical",
                    source_ip="10.0.2.88",
                    destination_ip="185.193.61.155",
                    user="svc-backup",
                    hostname="SRV-FILE-STORAGE",
                    detection_rule="ET MALWARE CobaltStrike Beaconing Heartbeat Observed over HTTPS",
                    evidence={"ja3": "a0e9f5d64349fb13191bc781f81f42e1", "beacon_interval": "60s"},
                    correlation_id="CORR-INC-05",
                    meta={"simulated": True},
                    processed=False,
                ),
            ]
            for a in alerts:
                db.add(a)
            db.commit()

        # 4. Seed Sample Incidents
        if db.query(Incident).count() == 0:
            now = datetime.now(timezone.utc)
            inc1 = Incident(
                title="Critical Ransomware Outbreak on Engineering Workstation",
                description="EDR alert triggered on host ENG-WORKSTATION-01 detecting shadow copy wipe and rapid document encryption activity.",
                severity="critical",
                risk_score=92.5,
                category="malware",
                status=IncidentStatus.investigating,
                priority=IncidentPriority.critical,
                created_at=now - timedelta(minutes=24),
            )
            ransom_alert = db.query(Alert).filter(Alert.event_id == "EVT-RANSOM-002").first()
            if ransom_alert:
                inc1.alerts = [ransom_alert]
            db.add(inc1)

            inc2 = Incident(
                title="Spear Phishing Campaign Targeting Corporate Finance",
                description="Suspicious email with urgent wire transfer invoice domain bypassed initial filter. Potential credential harvesting.",
                severity="high",
                risk_score=76.0,
                category="phishing",
                status=IncidentStatus.contained,
                priority=IncidentPriority.high,
                created_at=now - timedelta(minutes=40),
            )
            phish_alert = db.query(Alert).filter(Alert.event_id == "EVT-PHISH-001").first()
            if phish_alert:
                inc2.alerts = [phish_alert]
            db.add(inc2)

            db.commit()
    finally:
        db.close()
