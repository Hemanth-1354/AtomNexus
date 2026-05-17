import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function GoalSetting({ user }) {
  const [goals, setGoals] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Shared Goals States
  const [employees, setEmployees] = useState([]);
  const [sharedThrustArea, setSharedThrustArea] = useState('Revenue');
  const [sharedTitle, setSharedTitle] = useState('');
  const [sharedDesc, setSharedDesc] = useState('');
  const [sharedUOM, setSharedUOM] = useState('Percentage');
  const [sharedTarget, setSharedTarget] = useState('');
  const [sharedWeightage, setSharedWeightage] = useState(10);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  useEffect(() => {
    fetchGoals();
    if (user.role === 'Manager' || user.role === 'Admin') {
      fetchEmployees();
    }
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get('/api/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const saveAsDraft = async () => {
    setError(''); setSuccess('');
    try {
      if (drafts.length > 0) {
        await axios.post('/api/goals', { goals: drafts, status: 'Draft' });
      }
      setSuccess('Draft goals saved successfully.');
      setDrafts([]);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save drafts.');
    }
  };

  const handleAdminUnlock = async (id) => {
    setError(''); setSuccess('');
    try {
      await axios.put(`/api/goals/${id}`, { is_locked: false, status: 'Draft' });
      setSuccess('Goal successfully unlocked for employee rework.');
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to unlock goal.');
    }
  };

  const handlePushSharedGoal = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (selectedEmployees.length === 0) {
      setError('Please select at least one employee recipient.');
      return;
    }
    try {
      await axios.post('/api/goals/shared', {
        title: sharedTitle,
        description: sharedDesc,
        thrust_area: sharedThrustArea,
        uom_type: sharedUOM,
        target: sharedTarget,
        weightage: sharedWeightage,
        employee_ids: selectedEmployees
      });
      setSuccess('Shared goal successfully distributed to employees.');
      setSharedTitle('');
      setSharedDesc('');
      setSharedTarget('');
      setSelectedEmployees([]);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to distribute shared goal.');
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

  const handleEmployeeUpdate = async (id, updates) => {
    try {
      await axios.put(`/api/employee/goals/${id}`, updates);
      fetchGoals();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update goal');
    }
  };

  const submitGoals = async () => {
    setError(''); setSuccess('');
    
    // Validate current state (Saved Goals + Drafts)
    let totalWeightage = goals.reduce((acc, g) => acc + g.weightage, 0) + drafts.reduce((acc, g) => acc + parseInt(g.weightage), 0);
    
    if (totalWeightage !== 100) {
      setError(`Total weightage must be exactly 100%. Current: ${totalWeightage}%`);
      return;
    }

    try {
      // 1. Submit local drafts
      if (drafts.length > 0) {
        await axios.post('/api/goals', { goals: drafts });
      }
      
      // 2. Move any 'Draft' or 'Returned' database goals to 'Pending_Approval'
      const goalsToSubmit = goals.filter(g => g.status === 'Draft' || g.status === 'Returned');
      for (const g of goalsToSubmit) {
        await axios.put(`/api/employee/goals/${g.id}`, { status: 'Pending_Approval' });
      }

      setSuccess('All goals submitted for approval.');
      setDrafts([]);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data || 'Failed to submit goals.');
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
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {(user.role === 'Manager' || user.role === 'Admin') && <th>Employee</th>}
                <th>Thrust Area</th>
                <th>Goal Title</th>
                <th>UoM</th>
                <th>Target</th>
                <th>Weightage (%)</th>
                <th>Status</th>
                {(user.role === 'Manager' || user.role === 'Admin') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {goals.map((g, idx) => {
                const isEditable = user.role === 'Employee' && (g.status === 'Draft' || g.status === 'Returned');
                const isManagerReview = user.role === 'Manager' && g.status === 'Pending_Approval';
                
                return (
                  <tr key={g.id}>
                    {(user.role === 'Manager' || user.role === 'Admin') && <td>{g.employee_name}</td>}
                    <td>
                      {isEditable && !g.is_shared ? (
                        <select className="input-control" value={g.thrust_area} onChange={e => handleEmployeeUpdate(g.id, { thrust_area: e.target.value })}>
                          <option>Revenue</option><option>Cost</option><option>Quality</option><option>Delivery</option>
                        </select>
                      ) : g.thrust_area}
                    </td>
                    <td>
                      {isEditable && !g.is_shared ? (
                        <input type="text" className="input-control" value={g.title} onChange={e => handleEmployeeUpdate(g.id, { title: e.target.value })} />
                      ) : (
                        <>
                          <div style={{ fontWeight: 500 }}>{g.title} {g.is_shared && <span style={{ fontSize: '0.6rem', background: 'var(--primary)', padding: '2px 4px', borderRadius: '4px' }}>SHARED</span>}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.description}</div>
                        </>
                      )}
                    </td>
                    <td>
                      {isEditable && !g.is_shared ? (
                        <select className="input-control" value={g.uom_type} onChange={e => handleEmployeeUpdate(g.id, { uom_type: e.target.value })}>
                          <option>Numeric (Min)</option><option>Numeric (Max)</option><option>Percentage</option><option>Timeline</option><option>Zero</option>
                        </select>
                      ) : g.uom_type}
                    </td>
                    <td>
                      {isManagerReview ? (
                        <input type="text" className="input-control" style={{ width: '80px' }} defaultValue={g.target} onBlur={(e) => handleManagerAction(g.id, 'Pending_Approval', e.target.value, g.weightage)} />
                      ) : (isEditable && !g.is_shared) ? (
                        <input type="text" className="input-control" style={{ width: '80px' }} value={g.target} onChange={e => handleEmployeeUpdate(g.id, { target: e.target.value })} />
                      ) : g.target}
                    </td>
                    <td>
                      {isManagerReview ? (
                        <input type="number" className="input-control" style={{ width: '60px' }} defaultValue={g.weightage} onBlur={(e) => handleManagerAction(g.id, 'Pending_Approval', g.target, parseInt(e.target.value))} />
                      ) : isEditable ? (
                        <input type="number" className="input-control" style={{ width: '60px' }} value={g.weightage} onChange={e => handleEmployeeUpdate(g.id, { weightage: parseInt(e.target.value) })} />
                      ) : g.weightage}
                    </td>
                    <td>{renderBadge(g.status)}</td>
                    {(user.role === 'Manager' || user.role === 'Admin') && (
                      <td>
                        {user.role === 'Manager' && g.status === 'Pending_Approval' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-success" style={{ padding: '6px' }} onClick={() => handleManagerAction(g.id, 'Approved', g.target, g.weightage)} title="Approve"><CheckCircle size={16} /></button>
                            <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleManagerAction(g.id, 'Returned', g.target, g.weightage)} title="Return for Rework"><XCircle size={16} /></button>
                          </div>
                        )}
                        {user.role === 'Admin' && g.is_locked && (
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleAdminUnlock(g.id)} title="Unlock Goal">
                            Unlock
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              
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
        </div>

        {user.role === 'Employee' && (drafts.length > 0 || goals.some(g => g.status === 'Draft' || g.status === 'Returned')) && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={saveAsDraft}>Save Drafts</button>
            <button className="btn btn-primary" onClick={submitGoals}>Submit All Goals for Approval</button>
          </div>
        )}
      </div>

      {(user.role === 'Manager' || user.role === 'Admin') && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginTop: '32px' }}>
          <h3 style={{ marginBottom: '8px', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>
            Push Departmental KPI (Shared Goal)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Create a standardized shared goal and assign it to multiple employees. Title and Target will be read-only for recipients.
          </p>
          <form onSubmit={handlePushSharedGoal} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label>Thrust Area</label>
              <select className="input-control" value={sharedThrustArea} onChange={e => setSharedThrustArea(e.target.value)}>
                <option>Revenue</option><option>Cost</option><option>Quality</option><option>Delivery</option>
              </select>
            </div>
            <div className="input-group">
              <label>Goal Title</label>
               <input type="text" className="input-control" value={sharedTitle} onChange={e => setSharedTitle(e.target.value)} required placeholder="e.g. Q1 Sales Target" />
            </div>
            <div className="input-group">
              <label>UoM Type</label>
              <select className="input-control" value={sharedUOM} onChange={e => setSharedUOM(e.target.value)}>
                <option>Numeric (Min)</option><option>Numeric (Max)</option><option>Percentage</option><option>Timeline</option><option>Zero</option>
              </select>
            </div>
            <div className="input-group">
              <label>Target</label>
              <input type="text" className="input-control" value={sharedTarget} onChange={e => setSharedTarget(e.target.value)} required placeholder="e.g. 500000" />
            </div>
            <div className="input-group">
              <label>Weightage (%)</label>
              <input type="number" className="input-control" min="10" max="100" value={sharedWeightage} onChange={e => setSharedWeightage(parseInt(e.target.value))} required />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Goal Description</label>
              <input type="text" className="input-control" value={sharedDesc} onChange={e => setSharedDesc(e.target.value)} placeholder="Provide short context..." />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ marginBottom: '8px', display: 'block' }}>Recipient Employees</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {employees.map(emp => (
                  <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, emp.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                        }
                      }}
                    />
                    {emp.name} ({emp.department})
                  </label>
                ))}
                {employees.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No eligible employees found.</span>}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', textAlign: 'right', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                Distribute Shared Goal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
