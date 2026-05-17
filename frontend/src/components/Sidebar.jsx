import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, CheckSquare, LogOut, User, Sun, Moon, BarChart2, FileText, ChevronRight } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      {/* Logo / Brand */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #3b6ef5, #7c5af0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(59,110,245,0.4)'
          }}>
            <Target size={18} color="white" />
          </div>
          <div>
            <div style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#e8edf5',
              letterSpacing: '-0.02em'
            }}>AtomQuest</div>
            <div style={{ fontSize: '0.65rem', color: '#3d4f72', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              Performance
            </div>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="theme-switch-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Nav Section */}
      <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.65rem', color: '#2e3d5c', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Main Menu
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={17} />
            Dashboard
          </NavLink>

          <NavLink to="/goals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Target size={17} />
            {user.role === 'Employee' ? 'My Goals' : 'Team Goals'}
          </NavLink>

          <NavLink to="/check-ins" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CheckSquare size={17} />
            Quarterly Check-ins
          </NavLink>

          {(user.role === 'Admin' || user.role === 'Manager') && (
            <>
              <div style={{ height: '1px', background: 'var(--sidebar-border)', margin: '10px 20px 10px 0' }} />
              <div style={{ padding: '0 20px 8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.65rem', color: '#2e3d5c', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Management
                </span>
              </div>
              <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BarChart2 size={17} />
                Analytics
              </NavLink>
              <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FileText size={17} />
                Reports & Escalations
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* User Footer */}
      <div style={{
        borderTop: '1px solid var(--sidebar-border)',
        padding: '16px 20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--sidebar-border)',
          marginBottom: '10px'
        }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b6ef5, #7c5af0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: '0.8rem',
            color: 'white',
            flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#c8d4e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#3d4f72', fontWeight: 500 }}>
              {user.role}
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-secondary" style={{
          width: '100%',
          fontSize: '0.8rem',
          padding: '8px 14px',
          color: '#5c6a8a',
          borderColor: 'var(--sidebar-border)',
          justifyContent: 'center',
          gap: '7px'
        }}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
