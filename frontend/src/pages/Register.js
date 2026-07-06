import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { register, login } from '../utils/api';
import toast from 'react-hot-toast';

const BACKEND_URL = 'http://localhost:5000';

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  score = Object.values(checks).filter(Boolean).length;
  if (score <= 1) return { score, label: 'Very weak', color: '#E8572A', checks };
  if (score === 2) return { score, label: 'Weak', color: '#F0A500', checks };
  if (score === 3) return { score, label: 'Fair', color: '#F0A500', checks };
  if (score === 4) return { score, label: 'Strong', color: '#0D9E8A', checks };
  return { score, label: 'Very strong', color: '#0D9E8A', checks };
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});
  const { loginUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const strength = getPasswordStrength(form.password);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (strength.score < 3) {
      toast.error('Your password is too weak. Please create a stronger password before signing up.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      const res = await login({ email: form.email, password: form.password });
      loginUser(res.data.user, res.data.token);
      toast.success(`Welcome to Kōdo, ${res.data.user.name.split(' ')[0]}`);
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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

  const checks = strength.checks || {};

  return (
    <div style={{
      minHeight: '100vh', background: '#1C1917',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(232,87,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,87,42,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'rgba(245,240,232,0.04)',
        border: '0.5px solid rgba(245,240,232,0.1)',
        borderRadius: '20px', padding: '40px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', fontWeight: 600, color: '#F5F0E8', marginBottom: '4px' }}>Kōdo</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, color: '#F5F0E8', marginBottom: '6px' }}>Create your account</div>
          <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.4)' }}>Join your team on Kōdo today</div>
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
            marginBottom: '12px',
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
            marginBottom: '20px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="#F5F0E8">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Continue with GitHub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(245,240,232,0.1)' }} />
          <span style={{ fontSize: '11px', color: 'rgba(245,240,232,0.3)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(245,240,232,0.1)' }} />
        </div>

        <form onSubmit={handleRegister}>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>Full name</div>
            <input
              type="text"
              placeholder="e.g. Kamaleswari S"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>Email</div>
            <input
              type="email"
              placeholder="e.g. kamaleswari@gmail.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>Role</div>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            >
              <option value="member">Student / Developer</option>
              <option value="admin">Team lead / Admin</option>
              <option value="viewer">Viewer (read only)</option>
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>Password</div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setTouched({ ...touched, password: true }); }}
                style={{ ...inputStyle, paddingRight: '44px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '14px' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {touched.password && form.password && (
            <div style={{ marginBottom: '12px' }} className="fade-in">
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength.score ? strength.color : 'rgba(245,240,232,0.1)', transition: 'all 0.3s ease' }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                {strength.score < 3 && (
                  <span style={{ fontSize: '10px', color: '#F0A500' }}>Strengthen your password</span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {[
                  { key: 'length', label: 'At least 8 characters' },
                  { key: 'uppercase', label: 'One uppercase letter' },
                  { key: 'lowercase', label: 'One lowercase letter' },
                  { key: 'number', label: 'One number' },
                  { key: 'special', label: 'One special character' },
                ].map((rule) => (
                  <div key={rule.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '10px', color: checks[rule.key] ? '#0D9E8A' : 'rgba(245,240,232,0.3)' }}>
                      {checks[rule.key] ? '✓' : '○'}
                    </span>
                    <span style={{ fontSize: '10px', color: checks[rule.key] ? '#0D9E8A' : 'rgba(245,240,232,0.35)' }}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>Confirm password</div>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setTouched({ ...touched, confirm: true }); }}
                style={{
                  ...inputStyle,
                  paddingRight: '44px',
                  borderColor: touched.confirm && form.confirmPassword
                    ? form.password === form.confirmPassword
                      ? 'rgba(13,158,138,0.5)'
                      : 'rgba(232,87,42,0.5)'
                    : 'rgba(245,240,232,0.15)',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '14px' }}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {touched.confirm && form.confirmPassword && (
              <div style={{ fontSize: '11px', marginTop: '5px', color: form.password === form.confirmPassword ? '#0D9E8A' : '#E8572A' }}>
                {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(232,87,42,0.5)' : '#E8572A',
              border: 'none', borderRadius: '10px', padding: '13px',
              fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
              fontSize: '15px', fontWeight: 700,
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px', marginTop: '4px',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Creating account...' : 'Create my account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(245,240,232,0.4)' }}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ color: '#E8572A', cursor: 'pointer', fontWeight: 600 }}>
            Sign in
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <span onClick={() => navigate('/')} style={{ fontSize: '12px', color: 'rgba(245,240,232,0.25)', cursor: 'pointer' }}>
            ← Back to home
          </span>
        </div>
      </div>
    </div>
  );
}