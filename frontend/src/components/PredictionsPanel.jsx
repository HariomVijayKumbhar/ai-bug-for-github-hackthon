import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, ShieldCheck, Target, Zap, Clock } from 'lucide-react';

const PredictionsPanel = ({ analysisData }) => {
  if (!analysisData) return null;

  const { overall_gravity_score, stability_score, bugs = [], risky_files = [], scanned_files, project_name } = analysisData;

  // ── Derived Predictions ──────────────────────────────────────────────────
  const criticalBugs  = bugs.filter(b => b.severity === 'critical').length;
  const warningBugs   = bugs.filter(b => b.severity === 'warning').length;
  const highRiskFiles = risky_files.filter(f => f.risk_level === 'High').length;

  // Failure probability formula: weighted sum of signals (0–100)
  const failureProb = Math.min(
    100,
    Math.round(
      (criticalBugs * 8) +
      (warningBugs  * 3) +
      (highRiskFiles * 5) +
      (overall_gravity_score * 0.3)
    )
  );

  const stabilityForecast = Math.max(0, 100 - failureProb);

  // Top files most likely to cause failures
  const topRiskyFiles = [...risky_files]
    .sort((a, b) => b.gravity_score - a.gravity_score)
    .slice(0, 5);

  // Prediction confidence (more files → more confidence)
  const confidence = Math.min(95, Math.round(40 + scanned_files * 1.5));

  // Prioritised recommendations
  const recommendations = [];
  if (criticalBugs > 0)
    recommendations.push({ priority: 'P0', label: `Fix ${criticalBugs} critical issue${criticalBugs > 1 ? 's' : ''} immediately`, color: 'var(--danger)' });
  if (highRiskFiles > 0)
    recommendations.push({ priority: 'P1', label: `Refactor ${highRiskFiles} high-gravity file${highRiskFiles > 1 ? 's' : ''} to reduce complexity`, color: 'var(--warning)' });
  if (warningBugs > 0)
    recommendations.push({ priority: 'P2', label: `Address ${warningBugs} code-quality warning${warningBugs > 1 ? 's' : ''}`, color: 'var(--warning)' });
  recommendations.push({ priority: 'P3', label: 'Add unit tests for high-complexity functions', color: 'var(--cyan)' });
  recommendations.push({ priority: 'P4', label: 'Enable linting in CI pipeline to prevent regressions', color: 'var(--cyan)' });

  // Risk level label
  const riskLabel = failureProb >= 70 ? 'HIGH' : failureProb >= 40 ? 'MEDIUM' : 'LOW';
  const riskColor = failureProb >= 70 ? 'var(--danger)' : failureProb >= 40 ? 'var(--warning)' : 'var(--success)';

  const GaugeBar = ({ value, color, label }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: '100%', background: color, borderRadius: 99, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero: Failure Probability ─────────────────────────────────────── */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          {/* Big number */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
              Predicted Failure Probability
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: riskColor }}>
              {failureProb}%
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '4px 14px', borderRadius: 99,
              background: `${riskColor}15`, border: `1px solid ${riskColor}40`,
              fontSize: 12, fontWeight: 700, color: riskColor,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
            }}>
              <AlertTriangle size={12} /> {riskLabel} RISK
            </div>
          </div>

          {/* Confidence + gauges */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
              Analysis confidence: <span style={{ color: 'var(--cyan)' }}>{confidence}%</span> · {scanned_files} files · {bugs.length} issues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <GaugeBar value={failureProb}       color={riskColor}       label="Failure Probability" />
              <GaugeBar value={stabilityForecast} color="var(--success)"  label="Predicted Stability" />
              <GaugeBar value={confidence}        color="var(--cyan)"     label="Model Confidence" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Two columns ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Top Risky Files */}
        <motion.div
          className="glass-card" style={{ overflow: 'hidden' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <div className="card-title"><Target size={14} /> Failure Candidates</div>
            <span className="card-badge">Top {topRiskyFiles.length} files</span>
          </div>
          {topRiskyFiles.map((f, i) => {
            const pct = Math.min(100, f.gravity_score);
            const col = f.risk_level === 'High' ? 'var(--danger)' : f.risk_level === 'Medium' ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{f.filename}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay: i * 0.08 }}
                    style={{ height: '100%', background: col, borderRadius: 99 }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Recommendations */}
        <motion.div
          className="glass-card" style={{ overflow: 'hidden' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div className="card-header">
            <div className="card-title"><Zap size={14} /> Action Plan</div>
            <span className="card-badge">Prioritised</span>
          </div>
          {recommendations.map((r, i) => (
            <div key={i} style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                padding: '2px 7px', borderRadius: 4,
                background: `${r.color}18`, border: `1px solid ${r.color}35`, color: r.color
              }}>{r.priority}</span>
              <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Forecast timeline ─────────────────────────────────────────────── */}
      <motion.div
        className="glass-card" style={{ padding: 24 }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        <div className="card-title" style={{ marginBottom: 20 }}><Clock size={14} /> Risk Forecast</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { horizon: 'Next 24h', risk: failureProb, label: 'If no action taken' },
            { horizon: 'After P0–P1 fixes', risk: Math.max(5, failureProb - criticalBugs * 8 - highRiskFiles * 5), label: 'Estimated after critical fixes' },
            { horizon: 'After full plan', risk: Math.max(5, failureProb - 40), label: 'Projected stable state' },
          ].map((f, i) => {
            const c = f.risk >= 70 ? 'var(--danger)' : f.risk >= 40 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{f.horizon}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: c, letterSpacing: '-0.04em', fontFamily: 'var(--font-mono)' }}>{Math.max(0, f.risk)}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{f.label}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
};

export default PredictionsPanel;
