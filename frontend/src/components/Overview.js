import React from 'react';

export default function Overview({ stats, alerts, incidents, executions, onSimulate, onNavigate }) {
  const severityBreakdown = stats?.severity_breakdown || { critical: 0, high: 0, medium: 0, low: 0 };
  const totalAlertsCount = stats?.total_alerts || 1;

  const kpis = [
    {
      title: 'Active Incidents',
      value: stats?.active_incidents ?? 0,
      sub: `${stats?.total_incidents ?? 0} Total Tracked`,
      color: '#f43f5e',
      bgGlow: 'rgba(244, 63, 94, 0.15)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      action: () => onNavigate('incidents'),
    },
    {
      title: 'Total Ingested Alerts',
      value: stats?.total_alerts ?? 0,
      sub: `${stats?.unprocessed_alerts ?? 0} Unprocessed`,
      color: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.15)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      action: () => onNavigate('alerts'),
    },
    {
      title: 'Active Playbooks',
      value: stats?.total_playbooks ?? 0,
      sub: 'Engine Ready',
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      action: () => onNavigate('playbooks'),
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending_approvals ?? 0,
      sub: 'Action Required',
      color: '#ec4899',
      bgGlow: 'rgba(236, 72, 153, 0.15)',
      isWarning: (stats?.pending_approvals ?? 0) > 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      action: () => onNavigate('executions'),
    },
    {
      title: 'Autonomous MTTR',
      value: '< 1.4s',
      sub: '99.8% Faster vs Manual',
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 32px' }}>
      {/* Page Title & Simulator Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            SOC Command Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time Threat Correlation, Orchestration Telemetry & Automated Containment
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        {kpis.map((k, i) => (
          <div
            key={i}
            className="glass-panel"
            onClick={k.action}
            style={{
              padding: '20px',
              cursor: k.action ? 'pointer' : 'default',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 90,
                height: 90,
                background: k.bgGlow,
                borderRadius: '50%',
                filter: 'blur(35px)',
                zIndex: 0,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{k.title}</span>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(255, 255, 255, 0.04)' }}>{k.icon}</div>
            </div>
            <div style={{ zIndex: 1 }}>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Attack Simulator Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8' }}>Synthetic Attack Injection Engine</span>
            <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>SOC Simulation</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Trigger pre-configured multi-vector attacks into the ingestion pipeline to test automated playbooks and containment.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {[
            { id: 'phishing', label: '🎣 Phishing', color: '#f97316' },
            { id: 'ransomware', label: '🛑 Ransomware', color: '#f43f5e' },
            { id: 'brute_force', label: '💥 Brute Force', color: '#eab308' },
            { id: 'impossible_travel', label: '✈️ Impossible Travel', color: '#06b6d4' },
            { id: 'c2', label: '📡 C2 Beaconing', color: '#8b5cf6' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => onSimulate(btn.id)}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: `${btn.color}44`,
                background: `${btn.color}11`,
                color: btn.color,
                fontWeight: 600,
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Middle Row: Severity Distribution & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
        {/* Severity Visualizer */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📊</span> Alert Severity Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Critical', count: severityBreakdown.critical || 0, color: 'var(--severity-critical)' },
              { label: 'High', count: severityBreakdown.high || 0, color: 'var(--severity-high)' },
              { label: 'Medium', count: severityBreakdown.medium || 0, color: 'var(--severity-medium)' },
              { label: 'Low', count: severityBreakdown.low || 0, color: 'var(--severity-low)' },
            ].map((sev) => {
              const pct = totalAlertsCount > 0 ? Math.round((sev.count / totalAlertsCount) * 100) : 0;
              return (
                <div key={sev.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{sev.label}</span>
                    <span style={{ color: sev.color, fontWeight: 700 }}>
                      {sev.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(pct, sev.count > 0 ? 5 : 0)}%`,
                        height: '100%',
                        background: sev.color,
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* High Priority Active Cases */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🚨</span> Active Incidents Under Response
            </h3>
            <button onClick={() => onNavigate('incidents')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.725rem' }}>
              View All Cases →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidents.slice(0, 3).map((inc) => (
              <div
                key={inc.id}
                onClick={() => onNavigate('incidents')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{inc.title}</span>
                  <span className={`badge badge-${inc.severity}`}>{inc.severity}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  <span>Status: <strong style={{ color: 'var(--text-secondary)' }}>{inc.status}</strong></span>
                  <span>Risk Score: <strong style={{ color: inc.risk_score > 70 ? 'var(--severity-critical)' : 'var(--accent-amber)' }}>{inc.risk_score}/100</strong></span>
                  <span>Alerts: {inc.alerts?.length || 0}</span>
                </div>
              </div>
            ))}
            {incidents.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active incidents. SOC queue is clear!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Live Alert Telemetry Stream */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📡</span> Live Security Ingestion Stream
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Chronological log of alerts ingested from SIEM, EDR, and Network sensors
            </p>
          </div>
          <button onClick={() => onNavigate('alerts')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.725rem' }}>
            Open Alert Feed →
          </button>
        </div>

        <div className="table-container">
          <table className="soar-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Severity</th>
                <th>Source Sensor</th>
                <th>Category</th>
                <th>Detection Rule</th>
                <th>Host / User</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: '#38bdf8' }}>{a.event_id}</td>
                  <td>
                    <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{a.source_product}</td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.75rem' }}>
                      {a.category}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.detection_rule || 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {a.hostname || a.user || a.source_ip || '–'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    No alerts received yet. Click "Simulate Attack" to generate test telemetry!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
