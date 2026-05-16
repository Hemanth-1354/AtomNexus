import React, { useState } from 'react';
import axios from 'axios';
import { Target, Lock, Mail } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError('Invalid credentials or server error.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <Target size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ marginBottom: '8px' }} className="text-gradient">AtomQuest Hackathon</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Microsoft Entra ID Simulation</p>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>Work Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="input-control" 
                style={{ width: '100%', paddingLeft: '40px' }} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@atomquest.com"
                required
              />
            </div>
          </div>
          
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-control" 
                style={{ width: '100%', paddingLeft: '40px' }} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ 
            width: '100%', 
            marginTop: '16px', 
            padding: '12px',
            background: '#00a4ef', 
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: '600'
          }}>
            <svg width="20" height="20" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
            Sign In with Microsoft Entra ID
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <p>Demo Accounts (pw: password123):</p>
          <p>emp1@atomquest.com (Employee)</p>
          <p>manager1@atomquest.com (Manager)</p>
          <p>admin@atomquest.com (Admin)</p>
        </div>
      </div>
    </div>
  );
}
