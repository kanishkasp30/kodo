import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

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
    if (currentWorkspace) fetchAll();
  }, [currentWorkspace]);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [activityRes, projectsRes, membersRes] = await Promise.all([
        fetch(`https://kodo-production.up.railway.app/api/activity/workspace/${currentWorkspace.id}`, { headers }),
        fetch(`https://kodo-production.up.railway.app/api/projects/workspace/${currentWorkspace.id}`, { headers }),
        fetch(`https://kodo-production.up.railway.app/api/workspaces/${currentWorkspace.id}/members`, { headers }),
      ]);

      const activityData = await activityRes.json();
      const projectsData = await projectsRes.json();
      const membersData = await membersRes.json();

      setActivity(Array.isArray(activityData) ? activityData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getActionColor = (action) => {
    if (!action) return '#6C5CE7';
    if (action.includes('created')) return '#0D9E8A';
    if (action.includes('moved') || action.includes('updated')) return '#F0A500';
    if (action.includes('deleted')) return '#E8572A';
    return '#6C5CE7';
  };

  const getActionIcon = (action) => {
    if (!action) return '⚡';
    if (action.includes('created')) return '✦';
    if (action.includes('moved')) return '→';
    if (action.includes('deleted')) return '✕';
    if (action.includes('comment')) return '💬';
    if (action.includes('member')) return '👥';
    return '⚡';
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
    padding: '8px 12px',
    fontSize: '12px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    colorScheme: 'dark',
    cursor: 'pointer',
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
          Activity feed
        </div>
        <div style={{ fontSize: '13px', color: theme.textSecondary }}>
          Everything happening across your workspace in real time
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted }}>Filter by project</div>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ ...inputStyle, minWidth: '160px' }}
          >
            <option value="all">All projects</option>
            {projects.map(p => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted }}>Filter by member</div>
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            style={{ ...inputStyle, minWidth: '160px' }}
          >
            <option value="all">All members</option>
            {members.map(m => (
              <option key={m.id} value={String(m.user_id || m.id)}>{m.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-end', paddingBottom: '2px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9E8A' }} />
          <span style={{ fontSize: '12px', color: '#0D9E8A', fontFamily: 'JetBrains Mono, monospace' }}>
            {filtered.length} events
          </span>
          {(filterProject !== 'all' || filterMember !== 'all') && (
            <button
              onClick={() => { setFilterProject('all'); setFilterMember('all'); }}
              style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: theme.textMuted, cursor: 'pointer', marginLeft: '8px' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
          Loading activity...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            {activity.length === 0 ? 'No activity yet' : 'No results for this filter'}
          </div>
          <div style={{ fontSize: '13px', color: theme.textMuted }}>
            {activity.length === 0 ? 'Actions across your workspace will appear here in real time' : 'Try clearing the filters to see all activity'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: theme.card,
                border: `0.5px solid ${theme.cardBorder}`,
                borderLeft: `3px solid ${getActionColor(item.action)}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${getActionColor(item.action)}20`, color: getActionColor(item.action), fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>
                {getActionIcon(item.action)}
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
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: theme.textMuted }}>
                    {formatTime(item.created_at)}
                  </span>
                  {item.project_name && (
                    <span style={{ fontSize: '10px', background: 'rgba(108,92,231,0.1)', color: '#6C5CE7', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                      {item.project_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}