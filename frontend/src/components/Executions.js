import React, { useState } from 'react';

export default function Executions({
  executions,
  pendingApprovals,
  onApprove,
  onReject,
}) {
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await onApprove(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await onReject(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          SOC Approvals & Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Human-in-the-loop authorization gates, execution state machine, and real-time step telemetry
        </p>
      </div>

      {/* Pending Approvals Queue (High Priority) */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: pendingApprovals.length > 0 ? 'rgba(236, 72, 153, 0.05)' : 'var(--bg-card)',
          borderColor: pendingApprovals.length > 0 ? 'rgba(236, 72, 153, 0.4)' : 'var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pending SOC Approvals Queue ({pendingApprovals.length})
            </h2>
          </div>
          {pendingApprovals.length > 0 && (
            <span className="badge badge-status-waiting">Action Required</span>
          )}
        </div>

        {pendingApprovals.length === 0 ? (
          <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No executions currently paused for human approval. All active playbooks are proceeding autonomously.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Execution #{item.id}: {item.playbook_name || `Playbook ID ${item.playbook_id}`}
                    </span>
                    <span className="badge badge-status-waiting" style={{ fontSize: '0.65rem' }}>
                      PAUSED AT APPROVAL GATE
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Action pending authorization: <strong>Host Network Quarantine & User Account Revocation</strong>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Triggered at {new Date(item.start_time).toLocaleTimeString()} • Current Step: #{item.current_step}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedExecution(item)}
                  >
                    View Logs
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={processingId === item.id}
                    onClick={() => handleReject(item.id)}
                  >
                    ✕ Reject & Abort
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    disabled={processingId === item.id}
                    onClick={() => handleApprove(item.id)}
                  >
                    ✓ Authorize & Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution History Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Orchestration Execution Logs</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing {executions.length} recent executions
          </span>
        </div>

        <div className="table-container">
          <table className="soar-table">
            <thead>
              <tr>
                <th>Exec ID</th>
                <th>Playbook Name</th>
                <th>Status</th>
                <th>Incident Case</th>
                <th>Steps</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th style={{ textAlign: 'right' }}>Audit Logs</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((ex) => {
                let badgeClass = 'badge-low';
                if (ex.status === 'completed') badgeClass = 'badge-status-resolved';
                else if (ex.status === 'waiting_approval') badgeClass = 'badge-status-waiting';
                else if (ex.status === 'running') badgeClass = 'badge-status-new';
                else if (ex.status === 'failed') badgeClass = 'badge-critical';
                else if (ex.status === 'cancelled') badgeClass = 'badge-medium';

                return (
                  <tr key={ex.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                      #{ex.id}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ex.playbook_name || `Playbook #${ex.playbook_id}`}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{ex.status}</span>
                    </td>
                    <td>
                      {ex.incident_id ? (
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.8rem' }}>
                          Case #{ex.incident_id}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Standalone Run</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Step #{ex.current_step || 0}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(ex.start_time).toLocaleTimeString()}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ex.end_time ? new Date(ex.end_time).toLocaleTimeString() : 'In Progress'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedExecution(ex)}
                      >
                        Inspect Audit Logs
                      </button>
                    </td>
                  </tr>
                );
              })}
              {executions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No playbook execution runs logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Audit Console Modal */}
      {selectedExecution && (
        <div className="modal-backdrop" onClick={() => setSelectedExecution(null)}>
          <div className="modal-card" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Audit Console: Execution #{selectedExecution.id} ({selectedExecution.playbook_name || 'Playbook'})
                </span>
                <span className={`badge ${selectedExecution.status === 'completed' ? 'badge-status-resolved' : 'badge-status-waiting'}`}>
                  {selectedExecution.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Started: {new Date(selectedExecution.start_time).toLocaleString()}
                {selectedExecution.end_time && ` • Finished: ${new Date(selectedExecution.end_time).toLocaleString()}`}
              </div>

              {/* Console window */}
              <div
                style={{
                  background: '#040711',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  maxHeight: 380,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {selectedExecution.logs?.map((entry, idx) => {
                  let levelColor = '#38bdf8';
                  if (entry.level === 'WARN') levelColor = '#fbbf24';
                  if (entry.level === 'ERROR') levelColor = '#f87171';

                  return (
                    <div
                      key={idx}
                      style={{
                        paddingBottom: 8,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          [{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'LOG'}]
                        </span>
                        <span style={{ color: levelColor, fontWeight: 700 }}>
                          [{entry.level || 'INFO'}]
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {entry.step ? `step:${entry.step}` : 'engine'}
                        </span>
                      </div>
                      <div style={{ color: '#e2e8f0', paddingLeft: 4 }}>
                        {entry.message}
                      </div>
                      {entry.details && (
                        <pre
                          style={{
                            marginTop: 6,
                            padding: '6px 10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: 4,
                            fontSize: '0.725rem',
                            color: '#94a3b8',
                            overflowX: 'auto',
                          }}
                        >
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
                {(!selectedExecution.logs || selectedExecution.logs.length === 0) && (
                  <div style={{ color: 'var(--text-muted)' }}>No execution steps logged.</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedExecution.status === 'waiting_approval' && (
                <>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      await handleReject(selectedExecution.id);
                      setSelectedExecution(null);
                    }}
                  >
                    Reject Execution
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={async () => {
                      await handleApprove(selectedExecution.id);
                      setSelectedExecution(null);
                    }}
                  >
                    Approve Execution
                  </button>
                </>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedExecution(null)}>
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
