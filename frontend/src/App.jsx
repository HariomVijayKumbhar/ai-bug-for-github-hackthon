import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, Flame, Zap, Activity,
  Menu, X, AlertCircle, TrendingUp, Bug, Lock, FileDigit
} from 'lucide-react';

import GravityScoreCard from './components/GravityScoreCard';
import RiskChart from './components/RiskChart';
import FileListItem from './components/FileListItem';
import ChatPanel from './components/ChatPanel';
import CyberTerminal from './components/CyberTerminal';
import BugReportPanel from './components/BugReportPanel';
import PredictionsPanel from './components/PredictionsPanel';
import SecurityPanel from './components/SecurityPanel';
import ResolutionToast from './components/ResolutionToast';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoToken, setRepoToken] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'System online. Enter a public GitHub or GitLab URL and click Stabilize to scan for bugs.' }
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [terminalMsg, setTerminalMsg] = useState('');
  const [activeTab, setActiveTab] = useState('bugs'); // 'bugs' | 'hotspots'

  const startAnalysis = async () => {
    if (!repoUrl) return;
    setLoading(true);
    setTerminalMsg(`Connecting to repository: ${repoUrl} ...`);
    try {
      await new Promise(r => setTimeout(r, 800));
      setTerminalMsg('Fetching file tree and source files...');
      await new Promise(r => setTimeout(r, 600));
      setTerminalMsg('Running static analysis — checking for bugs, secrets, and complexity...');
      const response = await axios.post('/api/analyze', { 
        repo_url: repoUrl,
        token: repoToken || undefined 
      });
      await new Promise(r => setTimeout(r, 400));
      setAnalysisData(response.data);
      const bugCount = response.data.bugs?.length || 0;
      setTerminalMsg(`Scan complete — ${bugCount} issue${bugCount !== 1 ? 's' : ''} detected across ${response.data.scanned_files} files.`);
      setActiveTab('bugs');
    } catch (error) {
      setTerminalMsg('ERROR: Connection to neural core failed. Check if backend is running on :8000');
      console.error('Analysis failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage) return;
    const newHistory = [...chatHistory, { role: 'user', text: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage('');
    try {
      const resp = await axios.post('/api/chat', {
        message: chatMessage,
        context: analysisData ? JSON.stringify(analysisData) : null
      });
      setChatHistory([...newHistory, { role: 'ai', text: resp.data.reply }]);
    } catch {
      setChatHistory([...newHistory, { role: 'ai', text: 'Signal lost. Check backend connection.' }]);
    }
  };

  const getChartData = () => {
    if (!analysisData) return [];
    const s = analysisData.overall_gravity_score;
    const st = analysisData.stability_score;
    return [
      { t: 'T-3h', r: Math.max(0, s - 12), s: Math.min(100, st + 6) },
      { t: 'T-2h', r: Math.max(0, s - 4),  s: Math.min(100, st + 2) },
      { t: 'T-1h', r: Math.min(98, s + 6),  s: Math.max(0, st - 3) },
      { t: 'Now',  r: s, s: st }
    ];
  };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="sidebar"
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">
                <ShieldAlert size={20} color="#000" strokeWidth={2.5} />
              </div>
              <div>
                <div className="sidebar-title">GitHub</div>
                <div className="sidebar-subtitle">v1.2.0 · Stable</div>
              </div>
            </div>

            <div className="nav-section-label">Operations</div>
            <button className="nav-item active"><Activity size={16} /> Dashboard</button>
            <button className="nav-item" onClick={() => setActiveTab('bugs')}><Bug size={16} /> Bug Scanner</button>
            <button className="nav-item" onClick={() => setActiveTab('hotspots')}><Flame size={16} /> Risk Hotspots</button>
            <button className="nav-item" onClick={() => setActiveTab('predictions')}><TrendingUp size={16} /> Predictions</button>
            <button className="nav-item" onClick={() => setActiveTab('security')} style={{ color: analysisData ? 'inherit' : 'var(--text-3)' }}>
              <ShieldCheck size={16} /> Security
            </button>

            <div className="sidebar-footer">
              <div className="user-badge">
                <div className="user-avatar" />
                <div>
                  <div className="user-name">Dev Instance 01</div>
                  <div className="user-status">
                    <span className="status-dot" /> Operational
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <main className={`main-content ${isSidebarOpen ? '' : 'sidebar-closed'}`}>

        {/* Top Bar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="page-title-block">
              <div className="page-eyebrow">
                <span className="eyebrow-line" />
                <span className="eyebrow-text">Predictive Intelligence</span>
              </div>
              <h1 className="page-title">Bug Risk Dashboard</h1>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <div className="search-bar">
              <input
                className="search-input"
                type="text"
                placeholder="github.com/owner/repo  or  gitlab.com/group/project"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startAnalysis()}
              />
              <button className="search-btn" onClick={startAnalysis} disabled={loading}>
                {loading ? <div className="spinner" /> : <Zap size={14} />}
                {loading ? 'Scanning…' : 'Stabilize'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16 }}>
              <Lock size={12} color="var(--text-3)" />
              <input 
                type="password"
                placeholder="Optional: Personal Access Token (for Private Repos)"
                value={repoToken}
                onChange={e => setRepoToken(e.target.value)}
                style={{ 
                  background: 'transparent', border: 'none', outline: 'none', 
                  color: 'var(--text-2)', fontSize: 13, width: 350,
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Status Terminal */}
        <CyberTerminal message={terminalMsg} />

        {analysisData ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* KPI Cards */}
            <div className="kpi-grid">
              <GravityScoreCard score={analysisData.overall_gravity_score} label="Overall Gravity" icon={Flame} color="var(--danger)" dim="var(--danger-dim)" />
              <GravityScoreCard score={analysisData.stability_score} label="Stability Index" icon={ShieldCheck} color="var(--success)" dim="var(--success-dim)" />
              <GravityScoreCard score={Math.round((analysisData.risky_files_count / analysisData.total_files) * 100)} label="Regression Risk" icon={AlertCircle} color="var(--warning)" dim="var(--warning-dim)" />
              <GravityScoreCard score={analysisData.bugs?.length || 0} label="Issues Found" icon={Bug} color="var(--cyan)" dim="var(--cyan-dim)" />
            </div>

            {/* Resolution Diff Toast */}
            <ResolutionToast report={analysisData.resolution_report} />

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { key: 'bugs',        label: `Bug Report (${analysisData.bugs?.length || 0})`,       icon: Bug },
                { key: 'hotspots',    label: `Risk Hotspots (${analysisData.risky_files?.length || 0})`, icon: Flame },
                { key: 'predictions', label: 'Predictions',                                           icon: TrendingUp },
                { key: 'security',    label: `Security (${analysisData.security_score ?? 100})`,      icon: ShieldCheck },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: activeTab === tab.key ? '1px solid var(--border-bright)' : '1px solid var(--border)',
                    background: activeTab === tab.key ? 'var(--cyan-dim)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--cyan)' : 'var(--text-3)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Main Section */}
            <div className="section-grid">
              <div className="left-column">
                {/* Chart */}
                <div className="glass-card">
                  <div className="card-header">
                    <div className="card-title"><TrendingUp size={14} />Risk Metrics Over Time</div>
                    <span className="card-badge">{analysisData.project_name} · {analysisData.scanned_files} files scanned</span>
                  </div>
                  <div className="card-body">
                    <RiskChart data={getChartData()} />
                  </div>
                </div>

                {/* Bug Report / Hotspots / Predictions tab */}
                <AnimatePresence mode="wait">
                  {activeTab === 'bugs' ? (
                    <motion.div key="bugs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <BugReportPanel bugs={analysisData.bugs || []} />
                    </motion.div>
                  ) : activeTab === 'predictions' ? (
                    <motion.div key="predictions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <PredictionsPanel analysisData={analysisData} />
                    </motion.div>
                  ) : activeTab === 'security' ? (
                    <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <SecurityPanel analysisData={analysisData} />
                    </motion.div>
                  ) : (
                    <motion.div key="hotspots" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <div className="glass-card" style={{ overflow: 'hidden' }}>
                        <div className="card-header">
                          <div className="card-title"><Flame size={14} />Risk Hotspots</div>
                          <span className="card-badge">{analysisData.risky_files.length} files</span>
                        </div>
                        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                          {analysisData.risky_files.map((file, i) => (
                            <FileListItem key={i} file={file} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat */}
              <div className="glass-card chat-panel">
                <div className="card-header">
                  <div className="card-title">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', display: 'inline-block' }} />
                    AI Assistant
                  </div>
                </div>
                <ChatPanel
                  chatHistory={chatHistory}
                  chatMessage={chatMessage}
                  setChatMessage={setChatMessage}
                  handleChat={handleChat}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <ShieldAlert size={72} color="rgba(255,255,255,0.08)" />
              <div className="empty-glow" />
            </div>
            <div className="empty-title">Awaiting Target Ingestion</div>
            <p className="empty-subtitle">
              Paste a <strong>public</strong> GitHub or GitLab URL above and click <strong>Stabilize</strong> to scan for real bugs and vulnerabilities.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {['github.com/pallets/flask', 'github.com/django/django', 'gitlab.com/gitlab-org/gitlab-runner'].map(eg => (
                <button
                  key={eg}
                  onClick={() => setRepoUrl(`https://${eg}`)}
                  style={{
                    padding: '6px 14px', borderRadius: 99,
                    border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text-3)',
                    fontSize: 12, cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.target.style.borderColor = 'var(--border-bright)'; e.target.style.color = 'var(--cyan)'; }}
                  onMouseOut={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-3)'; }}
                >
                  {eg}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
