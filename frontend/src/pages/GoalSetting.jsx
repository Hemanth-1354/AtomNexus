import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function GoalSetting({ user }) {
  const [goals, setGoals] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get('/api/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addDraft = () => {
    if (goals.length + drafts.length >= 8) {
      setError('Maximum 8 goals allowed.');
      return;
    }
    setDrafts([...drafts, { title: '', description: '', thrust_area: 'Revenue', uom_type: 'Percentage', target: '', weightage: 10 }]);
  };

  const updateDraft = (index, field, value) => {
    const newDrafts = [...drafts];
    newDrafts[index][field] = value;
    setDrafts(newDrafts);
  };

  const removeDraft = (index) => {
    const newDrafts = [...drafts];
    newDrafts.splice(index, 1);
    setDrafts(newDrafts);
  };

  const submitGoals = async () => {
    setError(''); setSuccess('');
    let totalWeightage = goals.reduce((acc, g) => acc + g.weightage, 0) + drafts.reduce((acc, g) => acc + parseInt(g.weightage), 0);
    
    if (drafts.some(d => d.weightage < 10)) {
      setError('Minimum 10% weightage required per goal.');
      return;
    }
    if (totalWeightage !== 100) {
      setError(`Total weightage must be exactly 100%. Current: ${totalWeightage}%`);
      return;
    }

    try {
      await axios.post('/api/goals', { goals: drafts });
      setSuccess('Goals submitted for approval.');
      setDrafts([]);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data || 'Failed to submit goals.');
    }
  };

  const handleManagerAction = async (id, action, target, weightage) => {
    try {
      await axios.put(`/api/goals/${id}`, { status: action, target, weightage });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const renderBadge = (status) => {
    switch(status) {
      case 'Approved': return <span className="badge badge-approved">Approved</span>;
      case 'Pending_Approval': return <span className="badge badge-pending">Pending</span>;
      case 'Returned': return <span className="badge badge-returned">Returned</span>;
      default: return <span className="badge badge-draft">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1>{user.role === 'Employee' ? 'My Goal Sheet' : 'Team Goals Awaiting Approval'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Phase 1: Goal Creation & Approval</p>
        </div>
        {user.role === 'Employee' && (
          <button className="btn btn-primary" onClick={addDraft} disabled={goals.length + drafts.length >= 8}>
            <Plus size={18} /> Add Goal
          </button>
        )}
      </header>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>{success}</div>}

      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              {user.role === 'Manager' && <th>Employee</th>}
              <th>Thrust Area</th>
              <th>Goal Title</th>
              <th>UoM</th>
              <th>Target</th>
              <th>Weightage (%)</th>
              <th>Status</th>
              {user.role === 'Manager' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {goals.map(g => (
              <tr key={g.id}>
                {user.role === 'Manager' && <td>{g.employee_name}</td>}
                <td>{g.thrust_area}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{g.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.description}</div>
                </td>
                <td>{g.uom_type}</td>
                <td>
                  {user.role === 'Manager' && g.status === 'Pending_Approval' ? (
                    <input type="text" className="input-control" style={{ width: '80px', padding: '4px 8px' }} defaultValue={g.target} onBlur={(e) => handleManagerAction(g.id, 'Pending_Approval', e.target.value, g.weightage)} />
                  ) : g.target}
                </td>
                <td>
                  {user.role === 'Manager' && g.status === 'Pending_Approval' ? (
                    <input type="number" className="input-control" style={{ width: '60px', padding: '4px 8px' }} defaultValue={g.weightage} onBlur={(e) => handleManagerAction(g.id, 'Pending_Approval', g.target, parseInt(e.target.value))} />
                  ) : g.weightage}
                </td>
                <td>{renderBadge(g.status)}</td>
                {user.role === 'Manager' && (
                  <td>
                    {g.status === 'Pending_Approval' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-success" style={{ padding: '6px' }} onClick={() => handleManagerAction(g.id, 'Approved', g.target, g.weightage)}><CheckCircle size={16} /></button>
                        <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleManagerAction(g.id, 'Returned', g.target, g.weightage)}><XCircle size={16} /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            
            {drafts.map((d, i) => (
              <tr key={`draft-${i}`} style={{ background: 'rgba(255,255,255,0.02)' }}>
                {user.role === 'Manager' && <td>-</td>}
                <td>
                  <select className="input-control" style={{ width: '120px' }} value={d.thrust_area} onChange={e => updateDraft(i, 'thrust_area', e.target.value)}>
                    <option>Revenue</option><option>Cost</option><option>Quality</option><option>Delivery</option>
                  </select>
                </td>
                <td>
                  <input type="text" className="input-control" placeholder="Title" value={d.title} onChange={e => updateDraft(i, 'title', e.target.value)} style={{ marginBottom: '4px', width: '100%' }} />
                </td>
                <td>
                  <select className="input-control" style={{ width: '120px' }} value={d.uom_type} onChange={e => updateDraft(i, 'uom_type', e.target.value)}>
                    <option>Numeric (Min)</option><option>Numeric (Max)</option><option>Percentage</option><option>Timeline</option><option>Zero</option>
                  </select>
                </td>
                <td><input type="text" className="input-control" style={{ width: '80px' }} value={d.target} onChange={e => updateDraft(i, 'target', e.target.value)} /></td>
                <td><input type="number" className="input-control" style={{ width: '60px' }} value={d.weightage} onChange={e => updateDraft(i, 'weightage', parseInt(e.target.value))} /></td>
                <td><span className="badge badge-draft">Draft</span></td>
                <td><button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => removeDraft(i)}><Trash2 size={16} color="var(--danger)" /></button></td>
              </tr>
            ))}
            
            {goals.length === 0 && drafts.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No goals found.</td></tr>
            )}
          </tbody>
        </table>

        {drafts.length > 0 && (
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button className="btn btn-primary" onClick={submitGoals}>Submit Goals for Approval</button>
          </div>
        )}
      </div>
    </div>
  );
}
