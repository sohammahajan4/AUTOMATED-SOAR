import React, { useState } from 'react';

export default function Navbar({ onSimulate, pendingApprovalsCount, onNavigate, activeTab }) {
  const [simMenuOpen, setSimMenuOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async (scenario) => {
    setSimulating(true);
    setSimMenuOpen(false);
    try {
      await onSimulate(scenario);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(9, 13, 22, 0.95)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.04em', background: 'linear-gradient(90deg, #f8fafc 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AUTOMATED SOAR
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 700 }}>
              ENTERPRISE SOC
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Autonomous Incident Response & Playbook Engine
          </div>
        </div>
      </div>

      {/* Center status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span className="status-dot live" />
          <span style={{ fontWeight: 500 }}>SOC Engine Online</span>
        </div>

        {pendingApprovalsCount > 0 && (
          <button
            onClick={() => onNavigate('executions')}
            className="badge badge-status-waiting"
            style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>⚠️</span>
            <span>{pendingApprovalsCount} Action{pendingApprovalsCount > 1 ? 's' : ''} Require Approval</span>
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Quick Simulator Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setSimMenuOpen(!simMenuOpen)}
            disabled={simulating}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{simulating ? 'Simulating...' : '⚡ Simulate Attack'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {simMenuOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                width: 260,
                zIndex: 200,
                padding: '8px 0',
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div style={{ padding: '6px 14px', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Attack Scenario:
              </div>
              {[
                { id: 'phishing', label: '🎣 Phishing Credential Harvest', desc: 'Proofpoint Email Alert' },
                { id: 'ransomware', label: '🛑 Ransomware Host Encryption', desc: 'CrowdStrike Falcon Alert' },
                { id: 'brute_force', label: '💥 Brute Force Kerberos Spike', desc: 'Active Directory DC Audit' },
                { id: 'impossible_travel', label: '✈️ Impossible Travel Anomaly', desc: 'Okta Identity Cloud' },
                { id: 'c2', label: '📡 CobaltStrike C2 Beacon', desc: 'Suricata Network IDS' },
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSimulate(s.id)}
                  style={{
                    padding: '8px 14px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            borderRadius: 20,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            A
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>admin</span>
          <span style={{ fontSize: '0.675rem', color: 'var(--accent-cyan)' }}>[Lead]</span>
        </div>
      </div>
    </header>
  );
}
