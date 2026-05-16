import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Analytics({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/summary');
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user.role === 'Admin' || user.role === 'Manager') {
      fetchAnalytics();
    }
  }, [user]);

  if (user.role !== 'Admin' && user.role !== 'Manager') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>Only Admins and Managers can view the Analytics Dashboard.</p>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading Analytics...</div>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1>Analytics Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of goal distribution and metrics.</p>
      </header>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <h3>Total Goals Set</h3>
          <div className="stat-value">{data.total_goals}</div>
          <div className="stat-label">Across the organization</div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '16px' }}>Thrust Area Distribution</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Thrust Area</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.thrust_area_distribution).map(([area, count]) => (
              <tr key={area}>
                <td>{area}</td>
                <td style={{ fontWeight: 'bold' }}>{count}</td>
                <td>{((count / data.total_goals) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            {Object.keys(data.thrust_area_distribution).length === 0 && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
