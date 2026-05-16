import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CheckIns({ user }) {
  const [goals, setGoals] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [checkIns, setCheckIns] = useState({}); // goal_id -> checkin data
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedQuarter]);

  const fetchData = async () => {
    try {
      const goalsRes = await axios.get('/api/goals');
      // Only show Approved goals for check-ins
      const approvedGoals = goalsRes.data.filter(g => g.status === 'Approved');
      setGoals(approvedGoals);

      const checkInMap = {};
      for (const goal of approvedGoals) {
        const ciRes = await axios.get(`/api/check-ins/${goal.id}`);
        const ci = ciRes.data.find(c => c.quarter === selectedQuarter);
        if (ci) {
          checkInMap[goal.id] = ci;
        } else {
          checkInMap[goal.id] = { actual_achievement: '', progress_status: 'Not Started', check_in_comment: '', manager_comment: '' };
        }
      }
      setCheckIns(checkInMap);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = (goalId, field, value) => {
    setCheckIns(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }));
  };

  const saveCheckIn = async (goalId) => {
    setSaving(true);
    try {
      await axios.post('/api/check-ins', {
        goal_id: goalId,
        quarter: selectedQuarter,
        ...checkIns[goalId]
      });
      alert('Saved successfully');
    } catch (err) {
      alert('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const renderScore = (goal, actual) => {
    if (!actual || actual === '') return '-';
    let score = 0;
    const a = parseFloat(actual);
    const t = parseFloat(goal.target);
    
    if (isNaN(a) || isNaN(t)) return '-';

    switch(goal.uom_type) {
      case 'Numeric (Min)':
      case 'Percentage':
        score = (a / t) * 100; break;
      case 'Numeric (Max)':
        score = (t / a) * 100; break;
      case 'Zero':
        score = a === 0 ? 100 : 0; break;
      default: return '-';
    }
    return score.toFixed(1) + '%';
  };

  return (
    <div className="animate-fade-in">
      <header className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1>Quarterly Check-ins</h1>
          <p style={{ color: 'var(--text-muted)' }}>Phase 2: Achievement Tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ color: 'var(--text-muted)' }}>Select Quarter:</label>
          <select className="input-control" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
            <option value="Q1">Q1 (July)</option>
            <option value="Q2">Q2 (October)</option>
            <option value="Q3">Q3 (January)</option>
            <option value="Q4">Q4 (April)</option>
          </select>
        </div>
      </header>

      {goals.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No approved goals available for check-ins yet.
        </div>
      ) : (
        <div className="grid-1" style={{ display: 'grid', gap: '24px' }}>
          {goals.map(g => {
            const ci = checkIns[g.id] || {};
            return (
              <div key={g.id} className="glass-panel">
                <div className="flex-between" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0 }}>{g.title}</h3>
                      <span className="badge badge-approved">{ci.progress_status || 'Not Started'}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.role === 'Manager' ? `Employee: ${g.employee_name} | ` : ''}Thrust Area: {g.thrust_area}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: {g.target} ({g.uom_type})</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Weightage: {g.weightage}%</div>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Actual Achievement</label>
                    {user.role === 'Employee' ? (
                      <input 
                        type="text" 
                        className="input-control" 
                        style={{ width: '100%', marginBottom: '16px' }} 
                        value={ci.actual_achievement || ''} 
                        onChange={e => handleUpdate(g.id, 'actual_achievement', e.target.value)} 
                        placeholder={`Enter actual ${g.uom_type}`}
                      />
                    ) : (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '16px' }}>{ci.actual_achievement || '-'}</div>
                    )}
                    
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Progress Status</label>
                    {user.role === 'Employee' ? (
                      <select 
                        className="input-control" 
                        style={{ width: '100%', marginBottom: '16px' }}
                        value={ci.progress_status || 'Not Started'}
                        onChange={e => handleUpdate(g.id, 'progress_status', e.target.value)}
                      >
                        <option>Not Started</option><option>On Track</option><option>Completed</option>
                      </select>
                    ) : (
                       <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '16px' }}>{ci.progress_status || '-'}</div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Computed Score:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{renderScore(g, ci.actual_achievement)}</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Employee Comment</label>
                    {user.role === 'Employee' ? (
                      <textarea 
                        className="input-control" 
                        style={{ width: '100%', height: '80px', resize: 'none', marginBottom: '16px' }} 
                        value={ci.check_in_comment || ''}
                        onChange={e => handleUpdate(g.id, 'check_in_comment', e.target.value)}
                        placeholder="Add your check-in notes..."
                      />
                    ) : (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '16px', minHeight: '80px' }}>{ci.check_in_comment || '-'}</div>
                    )}

                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Manager Feedback</label>
                    {user.role === 'Manager' ? (
                      <textarea 
                        className="input-control" 
                        style={{ width: '100%', height: '80px', resize: 'none' }} 
                        value={ci.manager_comment || ''}
                        onChange={e => handleUpdate(g.id, 'manager_comment', e.target.value)}
                        placeholder="Add your feedback..."
                      />
                    ) : (
                      <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', minHeight: '80px' }}>{ci.manager_comment || '-'}</div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                   <button className="btn btn-primary" onClick={() => saveCheckIn(g.id)} disabled={saving}>
                     Save Update
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
