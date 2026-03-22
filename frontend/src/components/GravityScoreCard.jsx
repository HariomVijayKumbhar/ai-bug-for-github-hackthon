import React from 'react';
import { motion } from 'framer-motion';

const GravityScoreCard = ({ score, label, icon: Icon, color, dim }) => (
  <motion.div
    className="kpi-card"
    whileHover={{ y: -5, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    style={{ '--accent': color }}
  >
    <div
      className="kpi-icon-wrap"
      style={{ background: dim }}
    >
      <Icon size={22} color={color} strokeWidth={2} />
    </div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value" style={{ color }}>{score}</div>
    <div className="kpi-bar-track">
      <div
        className="kpi-bar-fill"
        style={{
          width: `${Math.min(score, 100)}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`
        }}
      />
    </div>
  </motion.div>
);

export default GravityScoreCard;
