import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { createWorkspace, createProject, joinWorkspace } from '../utils/api';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdWorkspace, setCreatedWorkspace] = useState(null);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error('Enter a workspace name');
      return;
    }
    setLoading(true);
    try {
      const res = await createWorkspace({ name: workspaceName });
      setCreatedWorkspace(res.data);
      localStorage.setItem('currentWorkspace', JSON.stringify(res.data));
      toast.success('Workspace created');
      setStep(3);
    } catch (err) {
      toast.error('Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!inviteCode.trim()) {
      toast.error('Enter an invite code');
      return;
    }
    setLoading(true);
    try {
      const res = await joinWorkspace({ invite_code: inviteCode });
      localStorage.setItem('currentWorkspace', JSON.stringify(res.data));
      toast.success('Joined workspace');
      navigate('/app');
    } catch (err) {
      toast.error('Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast.error('Enter a project name');
      return;
    }
    setLoading(true);
    try {
      await createProject({
        workspace_id: createdWorkspace.id,
        name: projectName,
        description: projectDesc,
      });
      toast.success('Project created');
      navigate('/app');
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(245,240,232,0.05)',
    border: '0.5px solid rgba(245,240,232,0.15)',
    borderRadius: '10px',
    padding: '13px 16px',
    fontSize: '14px',
    color: '#F5F0E8',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '12px',
  };

  const btnStyle = {
    width: '100%',
    background: '#E8572A',
    border: 'none', borderRadius: '10px',
    padding: '14px',
    fontFamily: 'Playfair Display, serif',
    fontStyle: 'italic',
    fontSize: '15px', fontWeight: 700,
    color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    marginTop: '8px',
    transition: 'all 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#1C1917',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      backgroundImage: 'linear-gradient(rgba(232,87,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,87,42,0.03) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              height: '6px',
              width: step >= s ? '40px' : '24px',
              borderRadius: '3px',
              background: step >= s ? '#E8572A' : 'rgba(245,240,232,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: 'rgba(245,240,232,0.4)', marginBottom: '8px' }}>Welcome to</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '36px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>Kōdo</div>
            <div style={{ fontSize: '15px', color: 'rgba(245,240,232,0.5)', marginBottom: '40px', lineHeight: 1.6 }}>
              Your team's workspace for tasks, code, docs, and AI — all in one place.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => { setMode('create'); setStep(2); }} style={btnStyle}>
                Create a new workspace
              </button>
              <button
                onClick={() => { setMode('join'); setStep(2); }}
                style={{
                  width: '100%', background: 'transparent',
                  border: '0.5px solid rgba(245,240,232,0.2)',
                  borderRadius: '10px', padding: '14px',
                  fontFamily: 'Playfair Display, serif', fontStyle: 'italic',
                  fontSize: '15px', fontWeight: 700,
                  color: '#F5F0E8', cursor: 'pointer',
                }}
              >
                Join with an invite code
              </button>
            </div>
          </div>
        )}

        {step === 2 && mode === 'create' && (
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>
              Name your workspace
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.4)', marginBottom: '28px' }}>
              This is your team's home. You can always change it later.
            </div>
            <input
              type="text"
              placeholder="e.g. Team Kōdo, Acme Dev, Hackathon Squad"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              style={inputStyle}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace(); }}
            />
            <button onClick={handleCreateWorkspace} style={btnStyle} disabled={loading}>
              {loading ? 'Creating...' : 'Create workspace →'}
            </button>
          </div>
        )}

        {step === 2 && mode === 'join' && (
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>
              Join a workspace
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.4)', marginBottom: '28px' }}>
              Enter the invite code your team leader shared with you.
            </div>
            <input
              type="text"
              placeholder="e.g. AB12CD34"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', fontSize: '18px', textAlign: 'center' }}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoinWorkspace(); }}
            />
            <button onClick={handleJoinWorkspace} style={btnStyle} disabled={loading}>
              {loading ? 'Joining...' : 'Join workspace →'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: '#F5F0E8', marginBottom: '4px' }}>
              Create your first project
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.4)', marginBottom: '6px' }}>
              Workspace <span style={{ color: '#E8572A', fontWeight: 600 }}>{createdWorkspace?.name}</span> is ready.
            </div>
            {createdWorkspace && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '10px 14px', background: 'rgba(13,158,138,0.1)', borderRadius: '10px', border: '0.5px solid rgba(13,158,138,0.2)' }}>
                <span style={{ fontSize: '12px', color: '#0D9E8A', fontWeight: 600 }}>Invite code:</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#0D9E8A', letterSpacing: '0.15em' }}>{createdWorkspace.invite_code}</span>
                <span style={{ fontSize: '11px', color: 'rgba(13,158,138,0.6)', marginLeft: 'auto' }}>Share with teammates</span>
              </div>
            )}
            <input
              type="text"
              placeholder="Project name e.g. Hackathon App"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={inputStyle}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
            />
            <textarea
              placeholder="Brief description (optional)"
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              style={{ ...inputStyle, height: '80px', resize: 'none' }}
            />
            <button onClick={handleCreateProject} style={btnStyle} disabled={loading}>
              {loading ? 'Creating...' : 'Launch Kōdo →'}
            </button>
            <div
              onClick={() => navigate('/app')}
              style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: 'rgba(245,240,232,0.3)', cursor: 'pointer' }}
            >
              Skip for now
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



