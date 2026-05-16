import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function Dashboard({ user }) {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    axios.get('/api/goals').then(res => setGoals(res.data));
  }, []);

  const draftGoals = goals.filter(g => g.status === 'Draft').length;
  const pendingGoals = goals.filter(g => g.status === 'Pending_Approval').length;
  const approvedGoals = goals.filter(g => g.status === 'Approved').length;

  const data = [
    { name: 'Draft', count: draftGoals },
    { name: 'Pending', count: pendingGoals },
    { name: 'Approved', count: approvedGoals },
  ];

  return (
    <div className="animate-fade-in">
      <header className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h1>Welcome, {user.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here's an overview of the current goal cycle.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
            <div className="pulse" style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SYSTEM LIVE</span>
          </div>
          <div className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Goal Setting Active</div>
        </div>
      </header>

      <div className="grid-3" style={{ marginBottom: '40px' }}>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Draft Goals</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{draftGoals}</div>
        </div>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Pending Approval</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>{pendingGoals}</div>
        </div>
        <div className="glass-card">
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Approved Goals</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{approvedGoals}</div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 style={{ marginBottom: '24px' }}>Goal Status Distribution</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
