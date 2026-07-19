import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getWorkspaceMembers } from '../utils/api';
import toast from 'react-hot-toast';

export default function Members() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const context = useOutletContext();
  const currentWorkspace = context?.currentWorkspace;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentWorkspace) fetchMembers();
  }, [currentWorkspace]);

  const fetchMembers = async () => {
    try {
      const res = await getWorkspaceMembers(currentWorkspace.id);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/register?invite=${currentWorkspace.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentWorkspace.invite_code);
    toast.success('Invite code copied');
  };

  const handleWhatsAppShare = () => {
    const link = `${window.location.origin}/register?invite=${currentWorkspace.invite_code}`;
    const message = `Hey! Join my workspace "${currentWorkspace.name}" on Kōdo — the real-time dev collaboration platform. Use this link to join: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'owner': return { bg: 'rgba(232,87,42,0.15)', color: '#E8572A' };
      case 'admin': return { bg: 'rgba(108,92,231,0.15)', color: '#6C5CE7' };
      case 'member': return { bg: 'rgba(13,158,138,0.15)', color: '#0D9E8A' };
      case 'viewer': return { bg: 'rgba(155,152,144,0.15)', color: '#9B9890' };
      default: return { bg: 'rgba(13,158,138,0.15)', color: '#0D9E8A' };
    }
  };

  const avatarColors = ['#E8572A', '#0D9E8A', '#6C5CE7', '#F0A500', '#9B7FA6', '#5A7A5E'];

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto' }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: theme.text, marginBottom: '24px' }}>
        Members
      </div>

      <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '6px' }}>Invite to workspace</div>
        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '16px', lineHeight: 1.6 }}>
          Share the invite code or link below to add teammates to <strong style={{ color: theme.text }}>{currentWorkspace?.name}</strong>.
        </div>

        <div style={{ background: theme.bg, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '4px' }}>Invite code</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', fontWeight: 700, color: '#E8572A', letterSpacing: '0.1em' }}>
              {currentWorkspace?.invite_code || '------'}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            style={{ background: 'rgba(232,87,42,0.1)', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: '#E8572A', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Copy code
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyLink}
            style={{ background: copied ? 'rgba(13,158,138,0.1)' : 'rgba(108,92,231,0.1)', border: `0.5px solid ${copied ? 'rgba(13,158,138,0.3)' : 'rgba(108,92,231,0.3)'}`, borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: copied ? '#0D9E8A' : '#6C5CE7', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {copied ? '✓ Link copied' : '🔗 Copy invite link'}
          </button>
          <button
            onClick={handleWhatsAppShare}
            style={{ background: 'rgba(37,211,102,0.1)', border: '0.5px solid rgba(37,211,102,0.3)', borderRadius: '10px', padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: '#25D366', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📱 Share on WhatsApp
          </button>
        </div>
      </div>

      <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>
            Team members
          </div>
          <div style={{ fontSize: '12px', color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>Loading members...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '14px', color: theme.textMuted }}>No members yet. Share the invite code above.</div>
          </div>
        ) : (
          members.map((member, idx) => {
            const roleStyle = getRoleStyle(member.role);
            const avatarColor = avatarColors[idx % avatarColors.length];
            const isYou = member.user_id === user?.id || member.id === user?.id;
            return (
              <div
                key={member.id}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: `0.5px solid ${theme.cardBorder}` }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarColor, color: '#fff', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {member.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{member.name}</span>
                    {isYou && (
                      <span style={{ fontSize: '10px', background: 'rgba(232,87,42,0.1)', color: '#E8572A', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>You</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textMuted }}>{member.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: roleStyle.bg, color: roleStyle.color, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize' }}>
                    {member.role}
                  </span>
                  {member.skills && member.skills.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {member.skills.slice(0, 2).map(skill => (
                        <span key={skill} style={{ background: 'rgba(108,92,231,0.1)', color: '#6C5CE7', fontSize: '10px', padding: '2px 7px', borderRadius: '4px', fontWeight: 500 }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ marginTop: '16px', padding: '14px 16px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '12px', fontSize: '12px', color: theme.textMuted, lineHeight: 1.7 }}>
        <strong style={{ color: theme.text }}>Role permissions:</strong> Owner can manage everything · Admin can manage tasks and members · Member can create and update tasks · Viewer can only view
      </div>
    </div>
  );
}


