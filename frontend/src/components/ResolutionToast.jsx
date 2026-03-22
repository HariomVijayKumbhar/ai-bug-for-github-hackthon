import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileEdit, X } from 'lucide-react';

const ResolutionToast = ({ report }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show toast when a new report with resolved bugs arrives
  useEffect(() => {
    if (report && (report.resolved_count > 0 || report.modified_files.length > 0)) {
      setIsVisible(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => setIsVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [report]);

  if (!report) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            backdropFilter: 'blur(20px)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            position: 'relative',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
          }}
        >
          <button 
            onClick={() => setIsVisible(false)}
            style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>

          <div style={{ background: 'rgba(16,185,129,0.2)', padding: 10, borderRadius: '50%', color: 'var(--success)' }}>
            <CheckCircle2 size={24} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
              Scan Complete: {report.resolved_count} {report.resolved_count === 1 ? 'bug' : 'bugs'} fixed!
            </h3>
            
            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-2)' }}>
              {report.modified_files.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileEdit size={14} color="var(--cyan)" />
                  <span>{report.modified_files.length} {report.modified_files.length === 1 ? 'file' : 'files'} modified</span>
                </div>
              )}
              {report.new_issues_count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>+{report.new_issues_count} new issues found</span>
                </div>
              )}
            </div>

            {report.resolved_details?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {report.resolved_details.map((detail, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResolutionToast;
