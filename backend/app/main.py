from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .seed import seed_database
from .routers import alert, incident, playbook, auth, approval, alert_import, webhook

# Create all DB tables
Base.metadata.create_all(bind=engine)

# Seed default data on startup
try:
    seed_database()
except Exception as e:
    print(f"Warning: database seed error: {e}")

app = FastAPI(
    title="Automated SOAR Backend",
    description="Enterprise Security Orchestration, Automation, and Response Platform API",
    version="1.0.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(alert.router, prefix="/api/v1", tags=["Alerts & Metrics"])
app.include_router(incident.router, prefix="/api/v1", tags=["Incidents"])
app.include_router(playbook.router, prefix="/api/v1", tags=["Playbooks & Executions"])
app.include_router(approval.router, prefix="/api/v1", tags=["SOC Approvals"])
app.include_router(alert_import.router, prefix="/api/v1", tags=["Alert Ingestion & Import"])
app.include_router(webhook.router, prefix="/api/v1", tags=["Webhooks"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "AutomatedSOAR",
        "version": "1.0.0",
    }
