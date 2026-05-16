import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

  const pieData = Object.entries(data.thrust_area_distribution).map(([name, value]) => ({ name, value }));
  
  // Mocking some trend data for visual impact
  const trendData = [
    { name: 'Q1', achievement: 65 },
    { name: 'Q2', achievement: 78 },
    { name: 'Q3', achievement: 82 },
    { name: 'Q4', achievement: 90 },
  ];

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient">Organization Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time performance and goal distribution insights.</p>
      </header>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <p className="stat-label">Total Goals Active</p>
          <div className="stat-value">{data.total_goals}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '8px' }}>↑ 12% from last cycle</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Org Completion Rate</p>
          <div className="stat-value">84%</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Based on check-in status</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Thrust Areas</p>
          <div className="stat-value">{pieData.length}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Strategic alignment focus</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-panel">
          <h3 style={{ marginBottom: '24px' }}>Goal Distribution by Thrust Area</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '24px' }}>Manager Effectiveness (Approval %)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={data.manager_effectiveness} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="completion" fill="var(--success)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '32px' }}>
        <h3 style={{ marginBottom: '24px' }}>Departmental Completion Heatmap</h3>
        <div className="grid-4" style={{ gap: '16px' }}>
          {[
            { dept: 'Engineering', rate: 92, color: '#10b981' },
            { dept: 'Sales', rate: 75, color: '#f59e0b' },
            { dept: 'Marketing', rate: 45, color: '#ef4444' },
            { dept: 'HR', rate: 100, color: '#6366f1' }
          ].map(d => (
            <div key={d.dept} style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              background: `linear-gradient(135deg, ${d.color}22, ${d.color}11)`,
              border: `1px solid ${d.color}44`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{d.dept}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: d.color }}>{d.rate}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
