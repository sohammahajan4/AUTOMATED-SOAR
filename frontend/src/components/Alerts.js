import React, { useState } from 'react';

export default function Alerts({ alerts, onIngestAlert, onSimulate, onImportFile, onDeleteAlert }) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // New alert state
  const [formEventId, setFormEventId] = useState('');
  const [formSource, setFormSource] = useState('Splunk Enterprise Security');
  const [formCategory, setFormCategory] = useState('phishing');
  const [formSeverity, setFormSeverity] = useState('high');
  const [formSourceIP, setFormSourceIP] = useState('');
  const [formDestIP, setFormDestIP] = useState('');
  const [formUser, setFormUser] = useState('');
  const [formHost, setFormHost] = useState('');
  const [formRule, setFormRule] = useState('');
  const [formEvidence, setFormEvidence] = useState('{\n  "indicator": "malicious-site.cc",\n  "reputation": "malicious"\n}');

  const filtered = alerts.filter((a) => {
    if (severityFilter && a.severity !== severityFilter) return false;
    if (categoryFilter && !a.category?.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
    if (search) {
      const term = search.toLowerCase();
      const matchId = a.event_id?.toLowerCase().includes(term);
      const matchSrc = a.source_product?.toLowerCase().includes(term);
      const matchRule = a.detection_rule?.toLowerCase().includes(term);
      const matchIp = a.source_ip?.toLowerCase().includes(term) || a.destination_ip?.toLowerCase().includes(term);
      const matchUser = a.user?.toLowerCase().includes(term);
      const matchHost = a.hostname?.toLowerCase().includes(term);
      if (!matchId && !matchSrc && !matchRule && !matchIp && !matchUser && !matchHost) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    let parsedEvidence = null;
    try {
      if (formEvidence.trim()) {
        parsedEvidence = JSON.parse(formEvidence);
      }
    } catch {
      alert('Evidence must be valid JSON');
      return;
    }

    const eventId = formEventId.trim() || `EVT-MANUAL-${Math.floor(Math.random() * 90000 + 10000)}`;

    await onIngestAlert({
      event_id: eventId,
      source_product: formSource,
      category: formCategory,
      severity: formSeverity,
      source_ip: formSourceIP || null,
      destination_ip: formDestIP || null,
      user: formUser || null,
      hostname: formHost || null,
      detection_rule: formRule || null,
      evidence: parsedEvidence,
      correlation_id: `CORR-${Math.floor(Math.random() * 90000 + 10000)}`,
    });

    setShowIngestModal(false);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    try {
      await onImportFile(importFile);
      setShowImportModal(false);
      setImportFile(null);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Alert Ingestion Pipeline
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Multi-sensor normalization, IOC extraction, deduplication, and automated triage feed
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Import CSV/JSON</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowIngestModal(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Ingest Custom Alert</span>
          </button>
        </div>
      </div>

      {/* Simulator Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: 'rgba(6, 182, 212, 0.05)',
          borderColor: 'rgba(6, 182, 212, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>
          <span>⚡</span> Quick Threat Simulator:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'phishing', label: '🎣 Phishing' },
            { id: 'ransomware', label: '🛑 Ransomware' },
            { id: 'brute_force', label: '💥 Brute Force' },
            { id: 'impossible_travel', label: '✈️ Impossible Travel' },
            { id: 'c2', label: '📡 C2 Beaconing' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => onSimulate(s.id)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              + {s.label}
            </button>
          ))}
        </div>
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
            placeholder="🔍 Search alerts by Event ID, IP, Host, Rule, User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        <div style={{ width: 160 }}>
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Category: All</option>
            <option value="phishing">Phishing</option>
            <option value="malware">Malware</option>
            <option value="authentication">Authentication</option>
            <option value="identity">Identity</option>
            <option value="c2_network">C2 Network</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="soar-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Severity</th>
                <th>Source Sensor</th>
                <th>Category</th>
                <th>Detection Rule</th>
                <th>Source IP → Dest IP</th>
                <th>User / Host</th>
                <th>Triage</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38bdf8', cursor: 'pointer' }}
                    onClick={() => setSelectedAlert(a)}
                  >
                    {a.event_id}
                  </td>
                  <td>
                    <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{a.source_product}</td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.75rem' }}>
                      {a.category}
                    </span>
                  </td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.detection_rule || 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    {a.source_ip ? `${a.source_ip} → ${a.destination_ip || 'local'}` : '–'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {a.user || a.hostname || '–'}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: a.processed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: a.processed ? '#34d399' : '#fbbf24',
                        border: `1px solid ${a.processed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      }}
                    >
                      {a.processed ? 'Correlated' : 'New Alert'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedAlert(a)}
                        title="Inspect IOC Details"
                      >
                        Inspect
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onDeleteAlert(a.id)}
                        title="Delete Alert"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No alerts match current search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="modal-backdrop" onClick={() => setSelectedAlert(null)}>
          <div className="modal-card" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge badge-${selectedAlert.severity}`}>{selectedAlert.severity}</span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Alert Telemetry: {selectedAlert.event_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* IOC Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 14, background: '#090d16', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Source Product</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedAlert.source_product}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Category</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedAlert.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Timestamp</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(selectedAlert.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Source IP</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>{selectedAlert.source_ip || 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Destination IP</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>{selectedAlert.destination_ip || 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Host / Identity</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{selectedAlert.hostname || selectedAlert.user || 'None'}</div>
                </div>
              </div>

              {/* Rule */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Detection Rule</div>
                <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {selectedAlert.detection_rule || 'No rule specified'}
                </div>
              </div>

              {/* Raw Evidence JSON */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Raw Sensor Telemetry & Evidence (JSON)</div>
                <pre className="code-block" style={{ maxHeight: 220 }}>
                  {JSON.stringify(selectedAlert.evidence || { status: 'No raw payload attached' }, null, 2)}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAlert(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingest Custom Alert Modal */}
      {showIngestModal && (
        <div className="modal-backdrop" onClick={() => setShowIngestModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Ingest Security Alert</h3>
              <button
                onClick={() => setShowIngestModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Event ID (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="EVT-AUTO-..."
                      value={formEventId}
                      onChange={(e) => setFormEventId(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Source Product</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select
                      className="form-select"
                      value={formSeverity}
                      onChange={(e) => setFormSeverity(e.target.value)}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Source IP</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="185.220.101.5"
                      value={formSourceIP}
                      onChange={(e) => setFormSourceIP(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination IP</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="10.0.1.20"
                      value={formDestIP}
                      onChange={(e) => setFormDestIP(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">User Principal</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="analyst@company.com"
                      value={formUser}
                      onChange={(e) => setFormUser(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hostname</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="SRV-PROD-01"
                      value={formHost}
                      onChange={(e) => setFormHost(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Detection Rule</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SEC-RULE-101: Unauthorized API Token Generation"
                    value={formRule}
                    onChange={(e) => setFormRule(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Evidence (JSON)</label>
                  <textarea
                    className="form-textarea"
                    value={formEvidence}
                    onChange={(e) => setFormEvidence(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowIngestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Ingest Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Bulk Alert File Ingestion</h3>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleImportSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Upload a CSV or JSON file containing batches of security events. The platform will automatically normalize and ingest each record.
                </p>
                <div
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 10,
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    style={{ display: 'block', margin: '0 auto', fontSize: '0.85rem' }}
                  />
                </div>
                {importFile && (
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: 10 }}>
                    Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!importFile || importing}>
                  {importing ? 'Processing File...' : 'Upload & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
