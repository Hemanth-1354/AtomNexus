import React, { useState } from 'react';
import axios from 'axios';
import { Target, Lock, Mail } from 'lucide-react';

export default function Login({ onLogin }) {
  const [view, setView] = useState('login'); // login, forgot, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (view === 'login') {
        const res = await axios.post('/api/auth/login', { email, password });
        onLogin(res.data.user, res.data.token);
      } else if (view === 'forgot') {
        await axios.post('/api/auth/forgot-password', { email });
        setSuccess('Verification code sent to your email.');
        setView('reset');
      } else if (view === 'reset') {
        await axios.post('/api/auth/reset-password', { email, code, new_password: newPassword });
        setSuccess('Password updated successfully. You can now log in.');
        setView('login');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <Target size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ marginBottom: '8px' }} className="text-gradient">AtomQuest</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          {view === 'login' ? 'Sign In' : view === 'forgot' ? 'Reset Password' : 'Enter Code'}
        </p>
        
        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{success}</div>}

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
          
          {view === 'login' && (
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
          )}

          {view === 'reset' && (
            <>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Verification Code</label>
                <input 
                  type="text" 
                  className="input-control" 
                  style={{ width: '100%' }} 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>New Password</label>
                <input 
                  type="password" 
                  className="input-control" 
                  style={{ width: '100%' }} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ 
            width: '100%', 
            marginTop: '16px', 
            padding: '12px',
            background: '#00a4ef', 
            fontWeight: '600'
          }}>
            {view === 'login' ? 'Sign In' : view === 'forgot' ? 'Send Code' : 'Update Password'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.85rem' }}>
          {view === 'login' ? (
            <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setError(''); }} style={{ color: 'var(--primary)' }}>
              Forgot Password?
            </a>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); setError(''); }} style={{ color: 'var(--primary)' }}>
              Back to Login
            </a>
          )}
        </div>

        {view === 'login' && (
          <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <p>Test Accounts (pw: password123):</p>
            <p>Employee: vikramnani69@gmail.com</p>
            <p>Manager: gunturkaaram279@gmail.com</p>
            <p>Admin: temporarymailhk@gmail.com</p>
          </div>
        )}
      </div>
    </div>
  );
}

