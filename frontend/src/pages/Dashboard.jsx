import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: "'Sora', sans-serif" }}>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

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

  const barColors = ['#7a8499', '#f5a623', '#00c896'];

  const stats = [
    {
      label: 'Draft Goals',
      value: draftGoals,
      icon: <Clock size={18} />,
      color: 'var(--text-muted)',
      accent: 'rgba(120,130,155,0.1)',
      iconBg: 'rgba(120,130,155,0.1)'
    },
    {
      label: 'Pending Approval',
      value: pendingGoals,
      icon: <AlertCircle size={18} />,
      color: 'var(--warning)',
      accent: 'var(--warning-bg)',
      iconBg: 'var(--warning-bg)'
    },
    {
      label: 'Approved Goals',
      value: approvedGoals,
      icon: <CheckCircle size={18} />,
      color: 'var(--success)',
      accent: 'var(--success-bg)',
      iconBg: 'var(--success-bg)'
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <header style={{ marginBottom: '36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '6px' }}>
            Overview
          </p>
          <h1 style={{ marginBottom: '4px' }}>Welcome back, {user.name.split(' ')[0]}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Here's a summary of the current goal cycle.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'var(--success-bg)',
            border: '1px solid rgba(0,200,150,0.2)',
            padding: '6px 12px', borderRadius: '20px'
          }}>
            <div className="pulse" style={{ width: '7px', height: '7px', background: 'var(--success)', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', letterSpacing: '0.06em' }}>LIVE</span>
          </div>
          <div className="badge badge-approved" style={{ padding: '6px 13px', fontSize: '0.72rem' }}>
            Goal Cycle Active
          </div>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '10px',
              background: stat.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color, flexShrink: 0
            }}>
              {stat.icon}
            </div>
            <div>
              <p className="stat-label">{stat.label}</p>
              <div style={{
                fontSize: '2rem', fontWeight: 700, color: stat.color,
                fontFamily: "'Sora', sans-serif", letterSpacing: '-0.04em', lineHeight: 1
              }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h3 style={{ marginBottom: '3px' }}>Goal Status Distribution</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {goals.length} total goals in current cycle
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <TrendingUp size={15} />
            <span>All time</span>
          </div>
        </div>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,110,245,0.04)', radius: 6 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
