import React, { useState } from 'react';
import axios from 'axios';
import { Target, Lock, Mail, ArrowRight, ChevronRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [view, setView] = useState('login');
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
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-darker)',
      overflow: 'hidden'
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, #0d1320 0%, #0a0e1a 50%, #07091a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid #131929'
      }}>
        {/* Decorative grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#3b6ef5 1px, transparent 1px), linear-gradient(90deg, #3b6ef5 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,110,245,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '5%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,90,240,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '56px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '11px',
              background: 'linear-gradient(135deg, #3b6ef5, #7c5af0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(59,110,245,0.4)'
            }}>
              <Target size={20} color="white" />
            </div>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#e8edf5', letterSpacing: '-0.02em' }}>
              AtomQuest
            </span>
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: '2.4rem', fontWeight: 700, color: '#e8edf5', lineHeight: 1.2, letterSpacing: '-0.04em', marginBottom: '20px' }}>
            Align your team.<br />
            <span style={{ background: 'linear-gradient(135deg, #3b6ef5, #7c5af0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Track what matters.
            </span>
          </h1>
          <p style={{ color: '#4a5980', fontSize: '1rem', lineHeight: 1.7, marginBottom: '48px' }}>
            A modern performance management platform for goal-setting, quarterly check-ins, and team analytics.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              'Set and track OKRs across all levels',
              'Quarterly check-ins with structured feedback',
              'Real-time analytics for managers & admins'
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(59,110,245,0.15)',
                  border: '1px solid rgba(59,110,245,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <ChevronRight size={11} color="#3b6ef5" />
                </div>
                <span style={{ color: '#5c7099', fontSize: '0.9rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '440px',
        minWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 44px',
        background: 'var(--bg-dark)',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
            {view === 'login' ? 'Sign in to your account' : view === 'forgot' ? 'Reset your password' : 'Enter verification code'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {view === 'login' ? 'Enter your credentials to continue' : view === 'forgot' ? "We'll send a code to your email" : 'Check your inbox for the code'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', color: 'var(--danger-text)',
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
            fontSize: '0.875rem', border: '1px solid rgba(240,79,90,0.2)'
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: 'var(--success-bg)', color: 'var(--success-text)',
            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
            fontSize: '0.875rem', border: '1px solid rgba(0,200,150,0.2)'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Work Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '13px', top: '13px', color: 'var(--text-muted)', opacity: 0.7 }} />
              <input
                type="email"
                className="input-control"
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          {view === 'login' && (
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '13px', top: '13px', color: 'var(--text-muted)', opacity: 0.7 }} />
                <input
                  type="password"
                  className="input-control"
                  style={{ paddingLeft: '40px' }}
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
              <div className="input-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  className="input-control"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="input-control"
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
            padding: '13px',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginTop: '4px',
            gap: '8px'
          }}>
            {view === 'login' ? 'Sign In' : view === 'forgot' ? 'Send Code' : 'Update Password'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {view === 'login' ? (
            <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setError(''); }}
              style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Forgot your password?
            </a>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); setError(''); }}
              style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              ← Back to Sign In
            </a>
          )}
        </div>

        {view === 'login' && (
          <div style={{
            marginTop: '32px',
            padding: '18px',
            background: 'var(--bg-darker)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Demo Accounts
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Employee', email: 'vikramnani69@gmail.com' },
                { label: 'Manager', email: 'gunturkaaram279@gmail.com' },
                { label: 'Admin', email: 'temporarymailhk@gmail.com' }
              ].map(({ label, email: demoEmail }) => (
                <button
                  key={label}
                  onClick={() => { setEmail(demoEmail); setPassword('password123'); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', padding: '9px 13px', width: '100%', fontSize: '0.8rem' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem' }}>Use →</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center', opacity: 0.7 }}>
              All accounts use password: <code style={{ background: 'var(--bg-dark)', padding: '2px 5px', borderRadius: '4px' }}>password123</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
