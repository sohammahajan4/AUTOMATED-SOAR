import React, { useState } from 'react';

export default function Incidents({
  incidents,
  alerts,
  playbooks,
  onCreateIncident,
  onUpdateIncident,
  onDeleteIncident,
  onTriggerPlaybook,
}) {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState('');
  const [triggering, setTriggering] = useState(false);

  // New incident form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState('high');
  const [newPriority, setNewPriority] = useState('high');
  const [newCategory, setNewCategory] = useState('malware');
  const [newRiskScore, setNewRiskScore] = useState(70);
  const [selectedAlertIds, setSelectedAlertIds] = useState([]);

  const filtered = incidents.filter((inc) => {
    if (statusFilter && inc.status !== statusFilter) return false;
    if (severityFilter && inc.severity !== severityFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const matchTitle = inc.title?.toLowerCase().includes(term);
      const matchDesc = inc.description?.toLowerCase().includes(term);
      const matchCat = inc.category?.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onCreateIncident({
      title: newTitle,
      description: newDesc,
      severity: newSeverity,
      priority: newPriority,
      category: newCategory,
      risk_score: parseFloat(newRiskScore),
      alert_ids: selectedAlertIds,
    });
    setNewTitle('');
    setNewDesc('');
    setSelectedAlertIds([]);
    setShowCreateModal(false);
  };

  const handleTrigger = async () => {
    if (!selectedIncident || !selectedPlaybookId) return;
    setTriggering(true);
    try {
      await onTriggerPlaybook(selectedIncident.id, parseInt(selectedPlaybookId, 10));
    } finally {
      setTriggering(false);
    }
  };

  const handleStatusChange = async (incId, newStatus) => {
    await onUpdateIncident(incId, { status: newStatus });
    if (selectedIncident && selectedIncident.id === incId) {
      setSelectedIncident((prev) => ({ ...prev, status: newStatus }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 32px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Incident War Room
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Triaged security incidents, risk correlation, containment workflows, and remediation
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create Incident</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          background: 'rgba(15, 23, 42, 0.7)',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search incidents by title, category, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: 160 }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status: All</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="contained">Contained</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div style={{ width: 160 }}>
          <select
            className="form-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">Severity: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="soar-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Case #</th>
                <th>Incident Details</th>
                <th>Severity</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Alerts</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => {
                const riskPct = Math.min(100, Math.max(0, inc.risk_score || 0));
                const riskColor =
                  riskPct >= 80 ? 'var(--severity-critical)' : riskPct >= 50 ? 'var(--severity-high)' : 'var(--accent-cyan)';
                return (
                  <tr key={inc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      #{inc.id}
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                        onClick={() => setSelectedIncident(inc)}
                      >
                        {inc.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Category: {inc.category || 'General'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${inc.severity}`}>{inc.severity}</span>
                    </td>
                    <td style={{ width: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${riskPct}%`, height: '100%', background: riskColor }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: riskColor }}>
                          {riskPct}
                        </span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={inc.status}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 6,
                          color: 'var(--text-primary)',
                          fontSize: '0.75rem',
                          padding: '3px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="new">new</option>
                        <option value="investigating">investigating</option>
                        <option value="contained">contained</option>
                        <option value="resolved">resolved</option>
                        <option value="closed">closed</option>
                      </select>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {inc.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.06)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {inc.alerts?.length || 0}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedIncident(inc)}
                          title="View Case Details"
                        >
                          Details
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteIncident(inc.id)}
                          title="Delete Case"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No matching incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="modal-backdrop" onClick={() => setSelectedIncident(null)}>
          <div className="modal-card" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge badge-${selectedIncident.severity}`}>{selectedIncident.severity}</span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Case #{selectedIncident.id}: {selectedIncident.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Meta strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Status</div>
                  <div style={{ fontWeight: 700, color: '#38bdf8', textTransform: 'capitalize' }}>{selectedIncident.status}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Risk Score</div>
                  <div style={{ fontWeight: 700, color: 'var(--severity-critical)' }}>{selectedIncident.risk_score} / 100</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Priority</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selectedIncident.priority}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Category</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedIncident.category || 'N/A'}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Incident Narrative & Forensics Summary
                </div>
                <div style={{ padding: '12px', background: '#090d16', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {selectedIncident.description || 'No description provided.'}
                </div>
              </div>

              {/* Automated Playbook Execution Trigger */}
              <div
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 10,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#38bdf8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚡</span> Dispatch Automated Containment Playbook
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Executes the selected multi-stage SOAR playbook against this incident and its linked IOCs.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    className="form-select"
                    style={{ flex: 1 }}
                    value={selectedPlaybookId}
                    onChange={(e) => setSelectedPlaybookId(e.target.value)}
                  >
                    <option value="">-- Choose Automated Playbook --</option>
                    {playbooks.filter((p) => p.enabled).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    disabled={!selectedPlaybookId || triggering}
                    onClick={handleTrigger}
                  >
                    {triggering ? 'Executing...' : 'Run Playbook'}
                  </button>
                </div>
              </div>

              {/* Associated Alerts */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Correlated Security Alerts ({selectedIncident.alerts?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedIncident.alerts?.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', marginRight: 10 }}>{a.event_id}</span>
                        <span style={{ fontWeight: 600 }}>{a.source_product}</span>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{a.detection_rule}</div>
                      </div>
                      <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                    </div>
                  ))}
                  {(!selectedIncident.alerts || selectedIncident.alerts.length === 0) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      No alerts linked directly to this case.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedIncident(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Initiate New Incident Case</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Incident Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. CobaltStrike C2 Beaconing Detected on Critical Database Server"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select
                      className="form-select"
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value)}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="critical">P1 - Critical</option>
                      <option value="high">P2 - High</option>
                      <option value="medium">P3 - Medium</option>
                      <option value="low">P4 - Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Risk Score: {newRiskScore}/100</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newRiskScore}
                    onChange={(e) => setNewRiskScore(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Incident Narrative / Analysis</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Detail the scope, affected assets, and analyst hypotheses..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Link Ingested Alerts</label>
                  <div style={{ maxHeight: 120, overflowY: 'auto', background: '#090d16', padding: 8, borderRadius: 6 }}>
                    {alerts.map((a) => (
                      <label
                        key={a.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAlertIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAlertIds([...selectedAlertIds, a.id]);
                            } else {
                              setSelectedAlertIds(selectedAlertIds.filter((id) => id !== a.id));
                            }
                          }}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{a.event_id}</span>
                        <span>{a.source_product}</span>
                        <span className={`badge badge-${a.severity}`} style={{ fontSize: '0.65rem' }}>{a.severity}</span>
                      </label>
                    ))}
                    {alerts.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No alerts available.</span>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
