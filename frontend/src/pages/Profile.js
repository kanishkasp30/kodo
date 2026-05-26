import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { theme } = useTheme();
  const { user, loginUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullUser, setFullUser] = useState(null);
  const [form, setForm] = useState({ name: '', bio: '', github_url: '', skills: [] });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    fetchFullProfile();
  }, []);

  const fetchFullProfile = async () => {
    try {
      const res = await fetch('https://kodo-production.up.railway.app/api/users/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setFullUser(data);
      setForm({
        name: data.name || '',
        bio: data.bio || '',
        github_url: data.github_url || '',
        skills: data.skills || [],
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://kodo-production.up.railway.app/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.user) {
        setFullUser(data.user);
        const updatedUser = { ...user, ...data.user };
        loginUser(updatedUser, localStorage.getItem('token'));
        toast.success('Profile updated');
        setEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('https://kodo-production.up.railway.app/api/users/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.user) {
        setFullUser(data.user);
        const updatedUser = { ...user, ...data.user };
        loginUser(updatedUser, localStorage.getItem('token'));
        toast.success('Profile picture updated');
      }
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    if (form.skills.includes(skillInput.trim())) { toast.error('Skill already added'); return; }
    setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter(s => s !== skill) });
  };

  const avatarColors = ['#E8572A', '#0D9E8A', '#6C5CE7', '#F0A500', '#9B7FA6'];
  const avatarColor = avatarColors[(fullUser?.name?.charCodeAt(0) || 0) % avatarColors.length];

  const inputStyle = {
    width: '100%',
    background: theme.input,
    border: `0.5px solid ${theme.inputBorder}`,
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '12px',
  };

  const roleColors = {
    owner: { bg: 'rgba(232,87,42,0.15)', color: '#E8572A' },
    admin: { bg: 'rgba(108,92,231,0.15)', color: '#6C5CE7' },
    member: { bg: 'rgba(13,158,138,0.15)', color: '#0D9E8A' },
    viewer: { bg: 'rgba(155,152,144,0.15)', color: '#9B9890' },
  };
  const roleStyle = roleColors[fullUser?.role] || roleColors.member;

  const displayUser = fullUser || user;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: theme.text, marginBottom: '24px' }}>
        My profile
      </div>

      <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {displayUser?.avatar_url ? (
              <img
                src={displayUser.avatar_url}
                alt="avatar"
                style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.cardBorder}` }}
              />
            ) : (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: avatarColor, color: '#fff', fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {displayUser?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${theme.card}` }}
              title="Change photo"
            >
              {uploadingAvatar ? '⏳' : '📷'}
            </div>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>{displayUser?.name}</div>
            <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '6px' }}>{displayUser?.email}</div>
            <span style={{ background: roleStyle.bg, color: roleStyle.color, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize' }}>
              {displayUser?.role}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={loading}
              style={{ background: editing ? '#0D9E8A' : 'rgba(232,87,42,0.1)', border: `0.5px solid ${editing ? 'rgba(13,158,138,0.3)' : 'rgba(232,87,42,0.3)'}`, borderRadius: '8px', padding: '8px 18px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '13px', fontWeight: 700, color: editing ? '#fff' : '#E8572A', cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : editing ? 'Save profile' : 'Edit profile'}
            </button>
            {editing && (
              <button onClick={() => setEditing(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: theme.textSecondary, cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>Full name</div>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Your full name" />

            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>Bio</div>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'none' }} placeholder="Tell your team about yourself..." />

            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>GitHub URL</div>
            <input type="text" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} style={inputStyle} placeholder="https://github.com/yourusername" />

            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>Skills</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} placeholder="e.g. React, Node.js (press Enter to add)" />
              <button onClick={addSkill} style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {form.skills.map((skill) => (
                <span key={skill} style={{ background: 'rgba(108,92,231,0.15)', color: '#6C5CE7', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {skill}
                  <span onClick={() => removeSkill(skill)} style={{ cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayUser?.bio && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>Bio</div>
                <div style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.7 }}>{displayUser.bio}</div>
              </div>
            )}
            {displayUser?.github_url && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px' }}>GitHub</div>
                <a href={displayUser.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: '#6C5CE7', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
                  {displayUser.github_url}
                </a>
              </div>
            )}
            {displayUser?.skills && displayUser.skills.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '8px' }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {displayUser.skills.map((skill) => (
                    <span key={skill} style={{ background: 'rgba(108,92,231,0.15)', color: '#6C5CE7', fontSize: '12px', fontWeight: 500, padding: '4px 12px', borderRadius: '20px' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!displayUser?.bio && !displayUser?.github_url && (!displayUser?.skills || displayUser.skills.length === 0) && (
              <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted, fontSize: '13px' }}>
                Your profile is empty. Click Edit profile to add your bio, GitHub, and skills.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '14px' }}>Account details</div>
        {[
          { label: 'Email', value: displayUser?.email },
          { label: 'Role', value: displayUser?.role, capitalize: true },
          {
            label: 'Member since',
            value: displayUser?.created_at
              ? new Date(displayUser.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Loading...'
          },
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `0.5px solid ${theme.cardBorder}` }}>
            <span style={{ fontSize: '13px', color: theme.textMuted }}>{row.label}</span>
            <span style={{ fontSize: '13px', color: theme.text, fontWeight: 500, textTransform: row.capitalize ? 'capitalize' : 'none' }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}