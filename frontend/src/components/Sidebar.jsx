import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, CheckSquare, LogOut, User } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="sidebar">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <Target size={32} color="var(--primary)" />
          <h2 className="text-gradient">AtomQuest</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          
          <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Target size={20} />
            {user.role === 'Employee' ? 'My Goals' : 'Team Goals'}
          </NavLink>

          <NavLink to="/check-ins" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CheckSquare size={20} />
            Quarterly Check-ins
          </NavLink>

          {(user.role === 'Admin' || user.role === 'Manager') && (
            <>
              <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Target size={20} />
                Analytics
              </NavLink>
              <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} />
                Reports & Escalations
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '50%' }}>
            <User size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.role}</div>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-secondary" style={{ width: '100%' }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
