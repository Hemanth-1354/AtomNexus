import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';

export default function Reports({ user }) {
  const [escalations, setEscalations] = useState([]);
  const [completion, setCompletion] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (user.role === 'Admin') {
        const escRes = await axios.get('/api/admin/escalations');
        setEscalations(escRes.data.escalations || []);
        
        const auditRes = await axios.get('/api/audit-logs');
        setAuditLogs(auditRes.data || []);
      }
      
      const compRes = await axios.get('/api/reports/completion');
      setCompletion(compRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadAchievementReport = async () => {
    try {
      const response = await axios({
        url: '/api/reports/achievement',
        method: 'GET',
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'achievement_report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert("Error downloading report.");
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1>Reports & Escalations</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organization-wide compliance tracking.</p>
        </div>
        <button className="btn btn-primary" onClick={downloadAchievementReport}>
          <Download size={18} /> Download Achievement Report (CSV)
        </button>
      </header>

      {completion && (
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <h3>No Goals</h3>
            <div className="stat-value">{completion.no_goals}</div>
          </div>
          <div className="stat-card">
            <h3>Not Approved</h3>
            <div className="stat-value">{completion.goals_not_approved}</div>
          </div>
          <div className="stat-card">
            <h3>Check-in Pending</h3>
            <div className="stat-value">{completion.checkin_pending}</div>
          </div>
          <div className="stat-card">
            <h3>Check-in Completed</h3>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{completion.checkin_completed}</div>
          </div>
        </div>
      )}

      {user.role === 'Admin' && (
        <div className="grid-2" style={{ gap: '24px' }}>
          <div className="glass-panel">
            <h3 style={{ marginBottom: '16px', color: 'var(--danger)' }}>Active Escalations</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee / Goal ID</th>
                  <th>Issue</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map((esc, i) => (
                  <tr key={i}>
                    <td>{esc.name || `Goal ID: ${esc.goal_id}`}</td>
                    <td style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-returned">{esc.issue}</span>
                      {esc.user_id && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={async () => {
                            await axios.post(`/api/admin/escalate/${esc.user_id}`);
                            alert('Escalation notification triggered!');
                          }}
                        >
                          Trigger Alert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {escalations.length === 0 && (
                  <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No escalations at this time.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="glass-panel" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Recent Audit Logs</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Goal ID</th>
                  <th>Action</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice().reverse().map(log => (
                  <tr key={log.id}>
                    <td>{log.goal_id}</td>
                    <td>{log.action}</td>
                    <td>{log.old_value} &rarr; {log.new_value}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
