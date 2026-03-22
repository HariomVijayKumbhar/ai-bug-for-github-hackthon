import React from 'react';

const FileListItem = ({ file }) => {
  const riskClass = file.risk_level === 'High'
    ? 'high' : file.risk_level === 'Medium'
    ? 'medium' : 'low';

  const stripeColor = file.risk_level === 'High'
    ? 'var(--danger)' : file.risk_level === 'Medium'
    ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="file-item">
      <div className="file-item-left">
        <div className="risk-stripe" style={{ background: stripeColor, boxShadow: `0 0 8px ${stripeColor}` }} />
        <div>
          <div className="file-name">{file.filename}</div>
          <div className="file-factors">
            {file.factors.map(f => f.name).join(' · ')}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className={`risk-chip ${riskClass}`}>{file.risk_level}</span>
        <div className="g-score">
          <div className="g-score-value" style={{ color: stripeColor }}>{file.gravity_score}</div>
          <div className="g-score-label">G·FORCE</div>
        </div>
      </div>
    </div>
  );
};

export default FileListItem;
