import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ShieldAlert, AlertTriangle, Info, Wrench } from 'lucide-react';

const SEVERITY = {
  critical: {
    label: 'Critical',
    color: 'var(--danger)',
    dim: 'var(--danger-dim)',
    border: 'rgba(239,68,68,0.2)',
    Icon: ShieldAlert,
  },
  warning: {
    label: 'Warning',
    color: 'var(--warning)',
    dim: 'var(--warning-dim)',
    border: 'rgba(245,158,11,0.2)',
    Icon: AlertTriangle,
  },
  info: {
    label: 'Info',
    color: 'var(--cyan)',
    dim: 'var(--cyan-dim)',
    border: 'rgba(0,212,255,0.15)',
    Icon: Info,
  },
};

const BugRow = ({ bug }) => {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY[bug.severity] || SEVERITY.info;
  const { Icon } = sev;

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
        background: open ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}
    >
      {/* Summary Row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '13px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Severity icon */}
        <Icon size={15} color={sev.color} style={{ flexShrink: 0 }} />

        {/* File + line */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-2)',
            flexShrink: 0,
            minWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {bug.filename}
        </span>

        {/* Line badge */}
        <span
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)',
            borderRadius: 5,
            padding: '1px 7px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-3)',
            flexShrink: 0,
          }}
        >
          L{bug.line}
        </span>

        {/* Bug type chip */}
        <span
          style={{
            background: sev.dim,
            border: `1px solid ${sev.border}`,
            borderRadius: 99,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: sev.color,
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          {bug.bug_type}
        </span>

        {/* Message */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: 'var(--text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {bug.message}
        </span>

        {/* Expand toggle */}
        {open
          ? <ChevronDown size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />
          : <ChevronRight size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />}
      </button>

      {/* Expanded Fix Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {bug.code_snippet && (
              <div
                style={{
                  margin: '0 20px 10px 47px',
                  background: '#0d1117',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '12px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-2)',
                  overflowX: 'auto',
                  whiteSpace: 'pre',
                }}
              >
                <span style={{ color: sev.color, opacity: 0.8, marginRight: 8, userSelect: 'none' }}>&gt;</span>
                {bug.code_snippet}
              </div>
            )}
            
            <div
              style={{
                margin: '0 20px 14px 47px',
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.1)',
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Wrench size={14} color="var(--cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Suggested Fix
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  {bug.fix}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BugReportPanel = ({ bugs = [] }) => {
  const [filter, setFilter] = useState('all');

  const counts = bugs.reduce((acc, b) => {
    acc[b.severity] = (acc[b.severity] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter === 'all' ? bugs : bugs.filter(b => b.severity === filter);

  const tabs = [
    { key: 'all',      label: 'All',      count: bugs.length },
    { key: 'critical', label: 'Critical', count: counts.critical || 0 },
    { key: 'warning',  label: 'Warning',  count: counts.warning  || 0 },
    { key: 'info',     label: 'Info',     count: counts.info     || 0 },
  ];

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="card-header">
        <div className="card-title">
          <ShieldAlert size={14} />
          Detected Issues
        </div>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: '4px 12px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                border: filter === t.key
                  ? `1px solid ${t.key === 'critical' ? 'var(--danger)' : t.key === 'warning' ? 'var(--warning)' : 'var(--border-bright)'}`
                  : '1px solid var(--border)',
                background: filter === t.key ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: filter === t.key
                  ? (t.key === 'critical' ? 'var(--danger)' : t.key === 'warning' ? 'var(--warning)' : 'var(--cyan)')
                  : 'var(--text-3)',
                transition: 'all 0.15s',
              }}
            >
              {t.label} {t.count > 0 && <span style={{ opacity: 0.7 }}>({t.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Bug list */}
      <div style={{ maxHeight: 480, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            No issues found for this filter.
          </div>
        ) : (
          filtered.map((bug, i) => <BugRow key={i} bug={bug} />)
        )}
      </div>

      {/* Footer summary */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 20,
        fontSize: 12,
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
      }}>
        {counts.critical > 0 && <span style={{ color: 'var(--danger)' }}>● {counts.critical} critical</span>}
        {counts.warning  > 0 && <span style={{ color: 'var(--warning)' }}>● {counts.warning} warning</span>}
        {counts.info     > 0 && <span>● {counts.info} info</span>}
        <span style={{ marginLeft: 'auto' }}>{bugs.length} total issues</span>
      </div>
    </div>
  );
};

export default BugReportPanel;
