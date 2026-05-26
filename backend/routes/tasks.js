import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getActivity, getProjects, getWorkspaceMembers } from '../utils/api';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function Activity() {
  const { theme } = useTheme();
  const context = useOutletContext();
  const currentWorkspace = context?.currentWorkspace;
  const [activity, setActivity] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  useEffect(() => {
    if (currentWorkspace) {
      fetchAll();
      socket.emit('join-workspace', currentWorkspace.id);
    }
  }, [currentWorkspace]);

  const fetchAll = async () => {
    try {
      const [activityRes, projectsRes, membersRes] = await Promise.all([
        getActivity(currentWorkspace.id),
        getProjects(currentWorkspace.id),
        getWorkspaceMembers(currentWorkspace.id),
      ]);
      setActivity(activityRes.data);
      setProjects(projectsRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const getActionColor = (action) => {
    if (action.includes('created')) return '#0D9E8A';
    if (action.includes('moved') || action.includes('updated')) return '#F0A500';
    if (action.includes('deleted')) return '#E8572A';
    return '#6C5CE7';
  };

  const filtered = activity.filter(a => {
    const projectMatch = filterProject === 'all' || String(a.project_id) === filterProject;
    const memberMatch = filterMember === 'all' || String(a.user_id) === filterMember;
    return projectMatch && memberMatch;
  });

  const inputStyle = {
    background: theme.input,
    border: `0.5px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '12px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    colorScheme: 'dark',
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
          Activity feed
        </div>
        <div style={{ fontSize: '13px', color: theme.textSecondary }}>
          Everything happening across your workspace
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={inputStyle}>
          <option value="all">All projects</option>
          {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
        </select>
        <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} style={inputStyle}>
          <option value="all">All members</option>
          {members.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: theme.textMuted }}>
          {filtered.length} events
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '6px' }}>No activity yet</div>
          <div style={{ fontSize: '13px', color: theme.textMuted }}>Actions across your workspace will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.user_name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: theme.text, lineHeight: 1.5, marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{item.user_name}</span>
                  {' '}
                  <span style={{ color: theme.textSecondary }}>{item.action}</span>
                  {item.entity_name && (
                    <span style={{ fontWeight: 600, color: getActionColor(item.action) }}> {item.entity_name}</span>
                  )}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: theme.textMuted }}>
                  {formatTime(item.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}