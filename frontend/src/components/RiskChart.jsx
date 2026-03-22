import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(5,10,22,0.95)',
      border: '1px solid rgba(148,163,184,0.12)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: 'var(--font-mono)'
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const RiskChart = ({ data }) => (
  <div style={{ height: 240 }}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradStab" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="t" stroke="rgba(148,163,184,0.3)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
        <YAxis stroke="rgba(148,163,184,0.3)" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 12 }}
          formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>}
        />
        <Area
          type="monotone" dataKey="r" name="Risk Score"
          stroke="#ef4444" strokeWidth={2}
          fillOpacity={1} fill="url(#gradRisk)"
          dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 1 }}
        />
        <Area
          type="monotone" dataKey="s" name="Stability"
          stroke="#10b981" strokeWidth={2}
          fillOpacity={1} fill="url(#gradStab)"
          dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 1 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default RiskChart;
