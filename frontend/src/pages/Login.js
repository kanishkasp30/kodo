import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { login } from '../utils/api';
import toast from 'react-hot-toast';

const KodoLogo = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <line x1="20" y1="14" x2="20" y2="66" stroke="#F5F0E8" strokeWidth="7" strokeLinecap="round"/>
    <line x1="20" y1="40" x2="52" y2="14" stroke="#E8572A" strokeWidth="7" strokeLinecap="round"/>
    <line x1="20" y1="40" x2="52" y2="66" stroke="#E8572A" strokeWidth="7" strokeLinecap="round"/>
    <circle cx="58" cy="14" r="9" fill="#0D9E8A"/>
    <circle cx="58" cy="14" r="4" fill="#1C1917"/>
    <circle cx="58" cy="14" r="1.5" fill="#0D9E8A"/>
  </svg>
);

const greetings = [
  'Welcome back',
  'Good to see you',
  'Ready to build?',
  'Let\'s get coding',
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ email, password });
      loginUser(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}`);
      const workspaces = await fetch('https://kodo-production.up.railway.app/api/workspaces/my', {
        headers: { Authorization: `Bearer ${res.data.token}` }
      }).then(r => r.json());
      if (workspaces.length === 0) {
        navigate('/onboarding');
      } else {
        navigate('/app');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(245,240,232,0.05)',
    border: '0.5px solid rgba(245,240,232,0.15)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#F5F0E8',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1C1917',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .task-card { background: rgba(245,240,232,0.06); border: 0.5px solid rgba(245,240,232,0.1); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
      `}</style>

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(232,87,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,87,42,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        width: '440px', background: '#141210',
        borderRight: '0.5px solid rgba(245,240,232,0.06)',
        display: 'flex', flexDirection: 'column',
        padding: '48px 40px',
        position: 'relative', zIndex: 1,
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
            <KodoLogo size={36} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: 600, color: '#F5F0E8' }}>Kōdo</span>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px', lineHeight: 1.2 }}>
              The developer's<br />
              <span style={{ color: '#E8572A' }}>way.</span>
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(245,240,232,0.45)', lineHeight: 1.6 }}>
              Tasks, code, docs, and AI — one workspace your team never wants to close.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '⚡', title: 'Real-time board', desc: 'Tasks update live for your whole team', color: '#E8572A' },
              { icon: '✦', title: 'AI assistant', desc: 'Standups, blockers, code review powered by Llama', color: '#6C5CE7' },
              { icon: '💻', title: 'Snippet library', desc: 'Save and share reusable code instantly', color: '#0D9E8A' },
              { icon: '📄', title: 'Wiki', desc: 'Documentation that lives next to your code', color: '#F0A500' },
            ].map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F5F0E8', marginBottom: '2px' }}>{f.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '40px' }}>
          <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9E8A', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', color: 'rgba(245,240,232,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>System online</span>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: '400px',
          background: 'rgba(245,240,232,0.04)',
          border: '0.5px solid rgba(245,240,232,0.1)',
          borderRadius: '20px', padding: '40px',
        }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: '#F5F0E8', marginBottom: '6px' }}>
            {greeting}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.4)', marginBottom: '28px' }}>
            Sign in to your Kōdo workspace
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>
                Email
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@team.dev"
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>
                Password
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(232,87,42,0.5)' : '#E8572A',
                border: 'none', borderRadius: '10px',
                padding: '13px',
                fontFamily: 'Playfair Display, serif',
                fontStyle: 'italic',
                fontSize: '15px', fontWeight: 700,
                color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in to Kōdo'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(245,240,232,0.4)' }}>
            No account?{' '}
            <span
              onClick={() => navigate('/register')}
              style={{ color: '#E8572A', cursor: 'pointer', fontWeight: 600 }}
            >
              Create one free
            </span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span
              onClick={() => navigate('/')}
              style={{ fontSize: '12px', color: 'rgba(245,240,232,0.25)', cursor: 'pointer' }}
            >
              ← Back to home
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}