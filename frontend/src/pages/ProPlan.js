import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProPlan() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
      toast.error('Please fill in all card details');
      return;
    }
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    setSuccess(true);
    toast.success('Welcome to Kōdo Pro!');
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) return v.slice(0, 2) + '/' + v.slice(2, 4);
    return v;
  };

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '36px', fontWeight: 700, color: '#0D9E8A', marginBottom: '12px' }}>
          You are on Pro!
        </div>
        <div style={{ fontSize: '15px', color: theme.textSecondary, marginBottom: '32px', lineHeight: 1.7 }}>
          Welcome to Kōdo Pro, {user?.name?.split(' ')[0]}. You now have unlimited workspaces, projects, members, and full AI features.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          {[
            { icon: '🏗', label: 'Unlimited workspaces' },
            { icon: '📁', label: 'Unlimited projects' },
            { icon: '👥', label: 'Unlimited members' },
            { icon: '✦', label: 'Full Aura AI access' },
          ].map((f) => (
            <div key={f.label} style={{ background: 'rgba(13,158,138,0.1)', border: '0.5px solid rgba(13,158,138,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{f.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0D9E8A' }}>{f.label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => window.history.back()}
          style={{ background: '#E8572A', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
        >
          Back to Kōdo
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '36px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
          Upgrade to Kōdo Pro
        </div>
        <div style={{ fontSize: '15px', color: theme.textSecondary }}>
          Everything your team needs to build faster together
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Free</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>₹0</div>
          <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '20px' }}>Forever free</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['1 workspace', '3 projects', '5 members', 'Basic AI features', 'Kanban board', 'Snippets and Wiki'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.textSecondary }}>
                <span style={{ color: '#0D9E8A' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(232,87,42,0.1), rgba(108,92,231,0.1))', border: '1.5px solid #E8572A', borderRadius: '16px', padding: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '16px', background: '#E8572A', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>RECOMMENDED</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#E8572A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pro</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>₹499</div>
          <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '20px' }}>per month</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {['Unlimited workspaces', 'Unlimited projects', 'Unlimited members', 'Full Aura AI — no limits', 'GitHub PR reviews', 'Priority support', 'Advanced analytics', 'Custom workspace branding'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.text }}>
                <span style={{ color: '#E8572A' }}>✦</span> {f}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            style={{ width: '100%', background: '#E8572A', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>

      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowCheckout(false); }}>
          <div style={{ background: theme.sidebar, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '20px', padding: '32px', width: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 700, color: theme.text }}>Checkout</div>
              <button onClick={() => setShowCheckout(false)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: 'rgba(232,87,42,0.08)', border: '0.5px solid rgba(232,87,42,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: theme.text }}>Kōdo Pro — Monthly</div>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>Unlimited everything + Aura AI</div>
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, color: '#E8572A' }}>₹499</div>
            </div>

            <div style={{ background: 'rgba(240,165,0,0.1)', border: '0.5px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: '#F0A500', fontWeight: 600 }}>
              🧪 Sandbox mode — no real payment will be charged
            </div>

            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>Card number</div>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                  maxLength={19}
                  style={{ width: '100%', background: theme.input, border: `0.5px solid ${theme.inputBorder}`, borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: theme.text, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>Expiry</div>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                    maxLength={5}
                    style={{ width: '100%', background: theme.input, border: `0.5px solid ${theme.inputBorder}`, borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: theme.text, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>CVV</div>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    maxLength={3}
                    style={{ width: '100%', background: theme.input, border: `0.5px solid ${theme.inputBorder}`, borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: theme.text, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>Name on card</div>
                <input
                  type="text"
                  placeholder="Kamaleswari S"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  style={{ width: '100%', background: theme.input, border: `0.5px solid ${theme.inputBorder}`, borderRadius: '10px', padding: '11px 14px', fontSize: '13px', color: theme.text, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                style={{ width: '100%', background: processing ? 'rgba(232,87,42,0.5)' : '#E8572A', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: processing ? 'not-allowed' : 'pointer' }}
              >
                {processing ? 'Processing...' : 'Pay ₹499 — Upgrade to Pro'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: theme.textMuted }}>
                🔒 Secured sandbox checkout · No real charges
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


