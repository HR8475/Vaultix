import { Link } from 'react-router-dom';

export default function StatCard({ icon, value, label, color = 'purple', delay = 0 }) {
  return (
    <div className={`glass-card stat-card stat-card--${color} animate-slide-up delay-${delay}`}>
      <div className={`stat-icon stat-icon--${color}`}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
