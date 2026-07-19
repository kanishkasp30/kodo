import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyOtp, resendOtp } from '../utils/api';
import toast from 'react-hot-toast';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const inputRefs = useRef([]);
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
    const initialExpiry = location.state?.expiresIn || 600;
    setTimeLeft(initialExpiry);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  if (!email) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    if (timeLeft <= 0) {
      toast.error('Code expired. Please request a new one');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp({ email, otp: otpCode });
      loginUser(res.data.user, res.data.token);
      toast.success(`Welcome to Kōdo, ${res.data.user.name.split(' ')[0]}`);
      navigate('/onboarding');
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.message || 'Verification failed');
      if (typeof data?.attemptsLeft === 'number') {
        setAttemptsLeft(data.attemptsLeft);
      }
      if (data?.expired) {
        setTimeLeft(0);
        setAttemptsLeft(null);
      }
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await resendOtp({ email });
      toast.success('New code sent to your email');
      setTimeLeft(res.data.expiresIn || 600);
      setAttemptsLeft(null);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const inputStyle = {
    width: '48px',
    height: '56px',
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: 700,
    background: 'rgba(245,240,232,0.05)',
    border: '0.5px solid rgba(245,240,232,0.15)',
    borderRadius: '10px',
    color: '#F5F0E8',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#1C1917',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(232,87,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,87,42,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(245,240,232,0.04)',
        border: '0.5px solid rgba(245,240,232,0.1)',
        borderRadius: '20px', padding: '40px',
        position: 'relative', zIndex: 1,
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', fontWeight: 600, color: '#F5F0E8', marginBottom: '16px' }}>
          Kōdo
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>
          Verify your email
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.4)', marginBottom: '20px' }}>
          We sent a 6-digit code to <strong style={{ color: '#F5F0E8' }}>{email}</strong>
        </div>

        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: timeLeft > 0 ? '#0D9E8A' : '#E8572A',
          marginBottom: '20px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code expired'}
        </div>

        <form onSubmit={handleVerify}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={timeLeft <= 0}
                style={{
                  ...inputStyle,
                  opacity: timeLeft <= 0 ? 0.4 : 1,
                  cursor: timeLeft <= 0 ? 'not-allowed' : 'text',
                }}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {attemptsLeft !== null && attemptsLeft > 0 && (
            <div style={{ fontSize: '12px', color: '#F0A500', marginBottom: '12px' }}>
              {attemptsLeft} attempt(s) remaining
            </div>
          )}

          <button
            type="submit"
            disabled={loading || timeLeft <= 0}
            style={{
              width: '100%',
              background: (loading || timeLeft <= 0) ? 'rgba(232,87,42,0.5)' : '#E8572A',
              border: 'none', borderRadius: '10px', padding: '13px',
              fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
              fontSize: '15px', fontWeight: 700,
              color: '#fff', cursor: (loading || timeLeft <= 0) ? 'not-allowed' : 'pointer',
              marginBottom: '16px', marginTop: '4px',
            }}
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        {timeLeft > 0 ? (
          <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.4)' }}>
            Didn't get the code? You can resend once the timer ends.
          </div>
        ) : (
          <button
            type="button"
            onClick={!resending ? handleResend : undefined}
            disabled={resending}
            style={{
              width: '100%',
              background: 'rgba(245,240,232,0.06)',
              border: '0.5px solid rgba(245,240,232,0.15)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#F5F0E8',
              cursor: resending ? 'default' : 'pointer',
            }}
          >
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        )}
      </div>
    </div>
  );
}



