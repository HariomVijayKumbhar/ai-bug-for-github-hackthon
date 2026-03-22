import React, { useState, useEffect, useRef } from 'react';

const CyberTerminal = ({ message }) => {
  const [lines, setLines] = useState([
    'ANTYGRAVITY v1.1.0 initializing...',
    'Neural risk vectors loaded.',
    'System ready.'
  ]);
  const ref = useRef(null);

  useEffect(() => {
    if (message) {
      setLines(prev => [...prev.slice(-8), message]);
    }
  }, [message]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div className="cyber-terminal" ref={ref}>
      {lines.map((line, i) => (
        <div className="terminal-line" key={i}>
          <span className="terminal-prompt">›</span>
          <span className={i === lines.length - 1 ? 'terminal-text-active' : ''}>{line}</span>
        </div>
      ))}
    </div>
  );
};

export default CyberTerminal;
