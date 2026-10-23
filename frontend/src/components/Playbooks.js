import React, { useState } from 'react';

const STEP_COLORS = {
  validate: { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', text: '#22d3ee', icon: '🔍' },
  enrich: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)', text: '#a78bfa', icon: '🧠' },
  wait_approval: { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 0.6)', text: '#f472b6', icon: '⚠️' },
  contain: { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', text: '#fb7185', icon: '🛑' },
  isolate: { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', text: '#fb7185', icon: '🛑' },
  block_ip: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)', text: '#fb923c', icon: '🛡️' },
  disable_user: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.4)', text: '#facc15', icon: '🔒' },
  create_ticket: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa', icon: '🎫' },
  notify: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399', icon: '📢' },
};

export default function Playbooks({ playbooks, onCreatePlaybook, onUpdatePlaybook, onDeletePlaybook, onRunPlaybook }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [runningId, setRunningId] = useState(null);

  // New playbook form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([
    { type: 'validate', name: 'Validate Incident IOCs' },
    { type: 'enrich', name: 'Query Threat Intel' },
    { type: 'wait_approval', name: 'SOC Lead Authorization', pending_action: 'Quarantine' },
    { type: 'notify', name: 'Dispatch Slack Alert', channel: 'Slack #soc-war-room' },
  ]);

  const handleAddStep = () => {
    setSteps([...steps, { type: 'enrich', name: 'New Automation Step' }]);
  };

  const handleRemoveStep = (idx) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx, field, val) => {
    const updated = [...steps];
    updated[idx][field] = val;
    setSteps(updated);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onCreatePlaybook({
      name,
      description,
      definition: {
        trigger: 'alert_ingestion',
        steps,
      },
      enabled: true,
    });

    setName('');
    setDescription('');
    setShowCreateModal(false);
  };

  const handleToggleEnable = async (pb) => {
    await onUpdatePlaybook(pb.id, { enabled: !pb.enabled });
  };

  const handleRun = async (pbId) => {
    setRunningId(pbId);
    try {
      await onRunPlaybook(pbId);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Playbook Automation Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configurable multi-stage orchestration workflows, conditional branching, and approval checkpoints
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Design Playbook</span>
        </button>
      </div>

      {/* Playbook List / Diagram Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {playbooks.map((pb) => {
          const pbSteps = pb.definition?.steps || [];
          return (
            <div
              key={pb.id}
              className="glass-panel"
              style={{
                padding: '24px',
                borderLeft: pb.enabled ? '4px solid var(--accent-cyan)' : '4px solid var(--text-muted)',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {pb.name}
                    </h3>
                    <span
                      className={`badge ${pb.enabled ? 'badge-status-resolved' : 'badge-low'}`}
                      style={{ fontSize: '0.675rem' }}
                    >
                      {pb.enabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 800 }}>
                    {pb.description || 'Configurable multi-step incident response automation.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleToggleEnable(pb)}
                  >
                    {pb.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!pb.enabled || runningId === pb.id}
                    onClick={() => handleRun(pb.id)}
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                    <span>{runningId === pb.id ? 'Running...' : '⚡ Test Execute'}</span>
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDeletePlaybook(pb.id)}
                    title="Delete Playbook"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Visual Pipeline Node Flow */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Execution Pipeline ({pbSteps.length} Steps)
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    paddingBottom: 8,
                  }}
                >
                  {/* Trigger Node */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trigger</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Incoming Alert Event
                    </div>
                  </div>

                  {pbSteps.map((step, idx) => {
                    const style = STEP_COLORS[step.type] || STEP_COLORS.validate;
                    const isApproval = step.type === 'wait_approval';
                    return (
                      <React.Fragment key={idx}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>→</div>
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: style.bg,
                            border: `1px solid ${style.border}`,
                            flexShrink: 0,
                            minWidth: 140,
                            boxShadow: isApproval ? '0 0 12px rgba(236, 72, 153, 0.25)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: style.text, fontWeight: 700 }}>
                              Step {idx + 1}: {step.type}
                            </span>
                            <span style={{ fontSize: '0.8rem' }}>{style.icon}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {step.name}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {playbooks.length === 0 && (
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No playbooks found. Click "Design Playbook" to create your first automation workflow!
          </div>
        )}
      </div>

      {/* Create Playbook Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Design Orchestration Playbook</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Playbook Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. CobaltStrike C2 Host Quarantine & Perimeter Drop"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Specify the objective, targeted alert categories, and response SOPs..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Steps Builder */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label className="form-label" style={{ margin: 0 }}>Workflow Steps ({steps.length})</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddStep}>
                      + Add Step
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
                    {steps.map((st, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', width: 20 }}>
                          #{i + 1}
                        </span>
                        <select
                          className="form-select"
                          style={{ width: 180 }}
                          value={st.type}
                          onChange={(e) => handleStepChange(i, 'type', e.target.value)}
                        >
                          <option value="validate">Validate Payload</option>
                          <option value="enrich">Enrich Threat Intel</option>
                          <option value="wait_approval">Wait for Approval</option>
                          <option value="contain">Isolate Host (EDR)</option>
                          <option value="block_ip">Block Malicious IP</option>
                          <option value="disable_user">Lock User Account</option>
                          <option value="create_ticket">Create Ticket</option>
                          <option value="notify">Dispatch Notification</option>
                        </select>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          placeholder="Step Name..."
                          value={st.name}
                          onChange={(e) => handleStepChange(i, 'name', e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveStep(i)}
                          title="Remove Step"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Enable Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
