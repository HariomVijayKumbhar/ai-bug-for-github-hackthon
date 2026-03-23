import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldOff, AlertTriangle, Info, Lock } from 'lucide-react';

const RULES = [
  { type: 'HardcodedSecret',  label: 'Hardcoded Secrets',      desc: 'Passwords / tokens / API keys in source code' },
  { type: 'DangerousEval',    label: 'Dangerous e' + 'val/ex' + 'ec',    desc: 'Code execution via e' + 'val() or ex' + 'ec()' },
  { type: 'SqlInjection',     label: 'SQL Injection',          desc: 'User input interpolated into SQL queries' },
  { type: 'CommandInjection', label: 'Command Injection',      desc: 'Shell commands with user-controlled input' },
  { type: 'InsecurePickle',   label: 'Insecure Deserialization', desc: 'pic' + 'kle.load() on untrusted data' },
  { type: 'InsecureRandom',   label: 'Insecure Randomness',    desc: 'random module used for secrets/tokens' },
  { type: 'PathTraversal',    label: 'Path Traversal',         desc: 'Dynamic file paths that may be user-controlled' },
  { type: 'WeakHash',         label: 'Weak Hashing (M' + 'D5/S' + 'HA1)', desc: 'Cryptographically broken hash algorithms' },
  { type: 'InsecureYaml',     label: 'Insecure YAML Load',     desc: 'yaml.load() without SafeLoader' },
  { type: 'HttpUrl',          label: 'Unencrypted HTTP',       desc: 'Plaintext HTTP URLs in production code' },
];

const SecurityPanel = ({ analysisData }) => {
  if (!analysisData) return null;

  const {
    security_score = 100,
    security_status = 'Secure',
    security_critical = 0,
    security_warnings = 0,
    bugs = [],
  } = analysisData;

  const statusColor =
    security_status === 'Secure' ? 'var(--success)' :
    security_status === 'Moderate Risk' ? 'var(--warning)' : 'var(--danger)';

  const StatusIcon =
    security_status === 'Secure' ? ShieldCheck :
    security_status === 'Moderate Risk' ? ShieldAlert : ShieldOff;

  // Count hits per rule type
  const hitCounts = bugs.reduce((acc, b) => {
    acc[b.bug_type] = (acc[b.bug_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Security Score Hero ─────────────────────────────────────────── */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          {/* Left: score */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
              Security Score
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: statusColor }}>
              {security_score}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              out of 100
            </div>
          </div>

          {/* Center: status badge */}
          <div style={{ textAlign: 'center' }}>
            <StatusIcon size={56} color={statusColor} style={{ marginBottom: 12 }} />
            <div style={{
              display: 'inline-block', padding: '6px 20px', borderRadius: 99,
              background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
              fontSize: 14, fontWeight: 700, color: statusColor, letterSpacing: '0.06em',
            }}>
              {security_status.toUpperCase()}
            </div>
          </div>

          {/* Right: breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--danger)' }}>
                <ShieldOff size={14} /> Critical Issues
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{security_critical}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--warning-dim)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--warning)' }}>
                <AlertTriangle size={14} /> Warnings
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>{security_warnings}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${security_score}%` }}
                transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ height: '100%', background: statusColor, borderRadius: 99, boxShadow: `0 0 10px ${statusColor}` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Rule Checklist ─────────────────────────────────────────────────── */}
      <motion.div
        className="glass-card" style={{ overflow: 'hidden' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      >
        <div className="card-header">
          <div className="card-title"><Lock size={14} /> Security Ruleset</div>
          <span className="card-badge">{RULES.length} rules checked</span>
        </div>

        {RULES.map((rule, i) => {
          const count = hitCounts[rule.type] || 0;
          const isClean = count === 0;
          const isCritical = ['HardcodedSecret','DangerousEval','SqlInjection','CommandInjection','InsecurePickle','InsecureYaml'].includes(rule.type);
          const rowColor = isClean ? 'var(--success)' : isCritical ? 'var(--danger)' : 'var(--warning)';

          return (
            <div
              key={rule.type}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 20px',
                borderBottom: i < RULES.length - 1 ? '1px solid var(--border)' : 'none',
                background: !isClean ? `${rowColor}08` : 'transparent',
              }}
            >
              {isClean
                ? <ShieldCheck size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                : isCritical
                  ? <ShieldOff size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                  : <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0 }} />}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isClean ? 'var(--text-1)' : rowColor }}>{rule.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{rule.desc}</div>
              </div>

              {isClean ? (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>PASS</span>
              ) : (
                <span style={{
                  padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: `${rowColor}18`, border: `1px solid ${rowColor}35`,
                  color: rowColor
                }}>
                  {count} {count === 1 ? 'hit' : 'hits'}
                </span>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ── Security Bugs List ─────────────────────────────────────────────── */}
      {bugs.filter(b => RULES.map(r => r.type).includes(b.bug_type)).length > 0 && (
        <motion.div
          className="glass-card" style={{ overflow: 'hidden' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <div className="card-title"><Info size={14} /> Security Issue Details</div>
          </div>
          {bugs
            .filter(b => RULES.map(r => r.type).includes(b.bug_type))
            .map((bug, i) => {
              const isCrit = bug.severity === 'critical';
              const col = isCrit ? 'var(--danger)' : 'var(--warning)';
              return (
                <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{bug.filename}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '0 6px', borderRadius: 4, color: 'var(--text-3)' }}>L{bug.line}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', background: `${col}18`, padding: '0 8px', borderRadius: 99 }}>{bug.bug_type}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>{bug.message}</div>
                  {bug.code_snippet && (
                    <div style={{
                      background: '#0d1117', border: '1px solid var(--border)', borderRadius: 6,
                      padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 11,
                      color: 'var(--text-2)', overflowX: 'auto', whiteSpace: 'pre', marginBottom: 8
                    }}>
                      <span style={{ color: col, opacity: 0.8, marginRight: 8 }}>&gt;</span>
                      {bug.code_snippet}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--cyan)', opacity: 0.8, display: 'flex', gap: 6 }}>
                    <span style={{ flexShrink: 0 }}>→</span>
                    <span>{bug.fix}</span>
                  </div>
                </div>
              );
            })}
        </motion.div>
      )}
    </div>
  );
};

export default SecurityPanel;
