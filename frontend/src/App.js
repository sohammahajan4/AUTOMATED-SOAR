import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import * as api from './api';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import Incidents from './components/Incidents';
import Alerts from './components/Alerts';
import Playbooks from './components/Playbooks';
import Executions from './components/Executions';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [toast, setToast] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    try {
      const [statsData, alertsData, incidentsData, playbooksData, executionsData, approvalsData] =
        await Promise.all([
          api.fetchStats().catch(() => null),
          api.fetchAlerts({ limit: 100 }).catch(() => []),
          api.fetchIncidents().catch(() => []),
          api.fetchPlaybooks().catch(() => []),
          api.fetchExecutions().catch(() => []),
          api.fetchPendingApprovals().catch(() => []),
        ]);

      if (statsData) setStats(statsData);
      if (alertsData) setAlerts(alertsData);
      if (incidentsData) setIncidents(incidentsData);
      if (playbooksData) setPlaybooks(playbooksData);
      if (executionsData) setExecutions(executionsData);
      if (approvalsData) setPendingApprovals(approvalsData);
    } catch (err) {
      console.error('Failed to load SOAR data:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Poll every 8 seconds for live SOC updates
    const interval = setInterval(loadAllData, 8000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // Handler for attack simulation
  const handleSimulate = async (scenario) => {
    try {
      const newAlert = await api.simulateAlert(scenario);
      showToast(`Synthetic ${scenario.toUpperCase()} alert ingested successfully! (ID: ${newAlert.event_id})`);
      await loadAllData();
    } catch (err) {
      showToast(`Simulation failed: ${err.message}`, 'error');
    }
  };

  // Incident handlers
  const handleCreateIncident = async (data) => {
    try {
      const newInc = await api.createIncident(data);
      showToast(`Incident #${newInc.id} created and triaged!`);
      await loadAllData();
    } catch (err) {
      showToast(`Error creating incident: ${err.message}`, 'error');
    }
  };

  const handleUpdateIncident = async (id, data) => {
    try {
      await api.updateIncident(id, data);
      showToast(`Incident #${id} updated.`);
      await loadAllData();
    } catch (err) {
      showToast(`Error updating incident: ${err.message}`, 'error');
    }
  };

  const handleDeleteIncident = async (id) => {
    try {
      await api.deleteIncident(id);
      showToast(`Incident #${id} removed.`);
      await loadAllData();
    } catch (err) {
      showToast(`Error deleting incident: ${err.message}`, 'error');
    }
  };

  const handleTriggerPlaybook = async (incidentId, playbookId) => {
    try {
      const exec = await api.triggerPlaybookForIncident(incidentId, playbookId);
      showToast(`Playbook execution #${exec.id} triggered!`);
      setActiveTab('executions');
      await loadAllData();
    } catch (err) {
      showToast(`Execution error: ${err.message}`, 'error');
    }
  };

  // Alert handlers
  const handleIngestAlert = async (data) => {
    try {
      const alertRec = await api.createAlert(data);
      showToast(`Alert ${alertRec.event_id} ingested!`);
      await loadAllData();
    } catch (err) {
      showToast(`Ingestion error: ${err.message}`, 'error');
    }
  };

  const handleImportFile = async (file) => {
    try {
      const imported = await api.importAlertsFile(file);
      showToast(`Bulk imported ${imported.length} security alerts!`);
      await loadAllData();
    } catch (err) {
      showToast(`Import error: ${err.message}`, 'error');
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await api.deleteAlert(id);
      showToast(`Alert #${id} deleted.`);
      await loadAllData();
    } catch (err) {
      showToast(`Error deleting alert: ${err.message}`, 'error');
    }
  };

  // Playbook handlers
  const handleCreatePlaybook = async (data) => {
    try {
      const pb = await api.createPlaybook(data);
      showToast(`Playbook '${pb.name}' designed and saved!`);
      await loadAllData();
    } catch (err) {
      showToast(`Error creating playbook: ${err.message}`, 'error');
    }
  };

  const handleUpdatePlaybook = async (id, data) => {
    try {
      await api.updatePlaybook(id, data);
      showToast(`Playbook updated.`);
      await loadAllData();
    } catch (err) {
      showToast(`Error updating playbook: ${err.message}`, 'error');
    }
  };

  const handleDeletePlaybook = async (id) => {
    try {
      await api.deletePlaybook(id);
      showToast(`Playbook removed.`);
      await loadAllData();
    } catch (err) {
      showToast(`Error deleting playbook: ${err.message}`, 'error');
    }
  };

  const handleRunPlaybook = async (id) => {
    try {
      const exec = await api.runPlaybook(id);
      showToast(`Execution #${exec.id} launched!`);
      setActiveTab('executions');
      await loadAllData();
    } catch (err) {
      showToast(`Failed to execute: ${err.message}`, 'error');
    }
  };

  // Approval handlers
  const handleApprove = async (id) => {
    try {
      await api.approveExecution(id);
      showToast(`Execution #${id} approved and resumed!`);
      await loadAllData();
    } catch (err) {
      showToast(`Approval error: ${err.message}`, 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectExecution(id);
      showToast(`Execution #${id} rejected and cancelled.`);
      await loadAllData();
    } catch (err) {
      showToast(`Rejection error: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 8,
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onSimulate={handleSimulate}
        pendingApprovalsCount={pendingApprovals.length}
        onNavigate={setActiveTab}
        activeTab={activeTab}
      />

      {/* Main Body */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingApprovalsCount={pendingApprovals.length}
          stats={stats}
        />

        {/* Content Area */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          {initialLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '70vh',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  border: '3px solid rgba(6, 182, 212, 0.2)',
                  borderTopColor: 'var(--accent-cyan)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                Connecting to Enterprise SOAR Core...
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <Overview
                  stats={stats}
                  alerts={alerts}
                  incidents={incidents}
                  executions={executions}
                  onSimulate={handleSimulate}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'incidents' && (
                <Incidents
                  incidents={incidents}
                  alerts={alerts}
                  playbooks={playbooks}
                  onCreateIncident={handleCreateIncident}
                  onUpdateIncident={handleUpdateIncident}
                  onDeleteIncident={handleDeleteIncident}
                  onTriggerPlaybook={handleTriggerPlaybook}
                />
              )}

              {activeTab === 'alerts' && (
                <Alerts
                  alerts={alerts}
                  onIngestAlert={handleIngestAlert}
                  onSimulate={handleSimulate}
                  onImportFile={handleImportFile}
                  onDeleteAlert={handleDeleteAlert}
                />
              )}

              {activeTab === 'playbooks' && (
                <Playbooks
                  playbooks={playbooks}
                  onCreatePlaybook={handleCreatePlaybook}
                  onUpdatePlaybook={handleUpdatePlaybook}
                  onDeletePlaybook={handleDeletePlaybook}
                  onRunPlaybook={handleRunPlaybook}
                />
              )}

              {activeTab === 'executions' && (
                <Executions
                  executions={executions}
                  pendingApprovals={pendingApprovals}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
