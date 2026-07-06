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
const BACKEND_URL = 'http://localhost:5000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
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
      loginUser(res.data.user, res.data.token, keepSignedIn);
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

            <div style={{ marginBottom: '16px' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="keepSignedIn"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label
                htmlFor="keepSignedIn"
                style={{ fontSize: '12px', color: 'rgba(245,240,232,0.6)', cursor: 'pointer' }}
              >
                Keep me signed in
              </label>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(245,240,232,0.1)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(245,240,232,0.3)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(245,240,232,0.1)' }} />
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = `${BACKEND_URL}/api/auth/google`)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'rgba(245,240,232,0.06)',
              border: '0.5px solid rgba(245,240,232,0.15)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#F5F0E8',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.9-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l6-6C34.5 5.5 29.5 3.5 24 3.5c-7.6 0-14.1 4.3-17.7 10.6z"/>
              <path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-1.8 14.1-5.1l-6.5-5.5c-2 1.4-4.6 2.3-7.6 2.3-5.3 0-9.8-3.6-11.4-8.4l-6.6 5.1C9.7 40.1 16.3 44.5 24 44.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.5C40.9 36.5 44.5 30.9 44.5 24c0-1.2-.1-2.4-.9-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = `${BACKEND_URL}/api/auth/github`)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'rgba(245,240,232,0.06)',
              border: '0.5px solid rgba(245,240,232,0.15)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#F5F0E8',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="#F5F0E8">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Continue with GitHub
          </button>

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