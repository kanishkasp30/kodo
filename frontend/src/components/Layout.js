import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyWorkspaces, getProjects } from '../utils/api';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const KodoLogo = ({ size = 36, theme }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <line x1="20" y1="14" x2="20" y2="66" stroke={theme.text} strokeWidth="7" strokeLinecap="round"/>
    <line x1="20" y1="40" x2="52" y2="14" stroke="#E8572A" strokeWidth="7" strokeLinecap="round"/>
    <line x1="20" y1="40" x2="52" y2="66" stroke="#E8572A" strokeWidth="7" strokeLinecap="round"/>
    <circle cx="58" cy="14" r="9" fill="#0D9E8A"/>
    <circle cx="58" cy="14" r="4" fill={theme.bg}/>
    <circle cx="58" cy="14" r="1.5" fill="#0D9E8A"/>
  </svg>
);

export default function Layout() {
  const { user, logoutUser } = useAuth();
  const { theme, themeName, switchTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [expandedProject, setExpandedProject] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchWorkspaces();
    fetchUnreadCount();
    if (user?.id) {
      socket.emit('join-user', user.id);
      socket.on('new-notification', () => {
        setUnreadCount(prev => prev + 1);
      });
    }
    return () => socket.off('new-notification');
  }, [user]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchProjects(currentWorkspace.id);
    }
  }, [currentWorkspace]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setUnreadCount(Array.isArray(data) ? data.filter(n => !n.is_read).length : 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await getMyWorkspaces();
      const saved = localStorage.getItem('currentWorkspace');
      if (saved) {
        setCurrentWorkspace(JSON.parse(saved));
      } else if (res.data.length > 0) {
        setCurrentWorkspace(res.data[0]);
        localStorage.setItem('currentWorkspace', JSON.stringify(res.data[0]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async (workspaceId) => {
    try {
      const res = await getProjects(workspaceId);
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;
  const isProjectActive = (projectId, section) => location.pathname === `/app/${section}/${projectId}`;

  const navItem = (label, path, icon, badge) => (
    <div
      onClick={() => { navigate(path); if (badge) setUnreadCount(0); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '8px 12px', marginBottom: '2px',
        borderRadius: isActive(path) ? '0 8px 8px 0' : '8px',
        cursor: 'pointer',
        background: isActive(path) ? theme.navActive : 'transparent',
        borderLeft: isActive(path) ? `2px solid ${theme.navActiveBorder}` : '2px solid transparent',
        color: isActive(path) ? theme.accent : theme.textSecondary,
        fontSize: '12px', fontWeight: 500,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!isActive(path)) e.currentTarget.style.background = 'rgba(128,128,128,0.08)'; }}
      onMouseLeave={(e) => { if (!isActive(path)) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '15px' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{ background: '#E8572A', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>
          {badge}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg }}>
      <div style={{
        width: '240px', background: theme.sidebar,
        borderRight: `0.5px solid ${theme.cardBorder}`,
        display: 'flex', flexDirection: 'column',
        flexShrink: 0, overflowY: 'auto',
      }}>
        <div style={{ padding: '16px 14px', borderBottom: `0.5px solid ${theme.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <KodoLogo size={36} theme={theme} />
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 600, color: theme.text }}>Kōdo</div>
              <div style={{ fontSize: '10px', color: theme.textMuted }}>The developer's way</div>
            </div>
          </div>
          {currentWorkspace && (
            <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '2px' }}>Workspace</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{currentWorkspace.name}</div>
            </div>
          )}
        </div>

        <div style={{ padding: '8px 6px', flex: 1 }}>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.textMuted, padding: '8px 10px 4px' }}>Overview</div>
          {navItem('Dashboard', '/app', '📊')}
          {navItem('Notifications', '/app/notifications', '🔔', unreadCount)}
          {navItem('Activity feed', '/app/activity', '⚡')}
          {navItem('Members', '/app/members', '👥')}

          {projects.length > 0 && (
            <>
              <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.textMuted, padding: '12px 10px 4px' }}>Projects</div>
              {projects.map((project) => (
                <div key={project.id}>
                  <div
                    onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', color: theme.textSecondary, fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(128,128,128,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>📁</span>
                      <span style={{ color: theme.text }}>{project.name}</span>
                    </div>
                    <span style={{ color: theme.textMuted, fontSize: '11px' }}>{expandedProject === project.id ? '▾' : '▸'}</span>
                  </div>
                  {expandedProject === project.id && (
                    <div style={{ paddingLeft: '12px' }}>
                      {[
                        { label: 'Board', icon: '📋', section: 'board' },
                        { label: 'List view', icon: '📝', section: 'list' },
                        { label: 'Snippets', icon: '💻', section: 'snippets' },
                        { label: 'Wiki', icon: '📄', section: 'wiki' },
                        { label: '✦ AI Assistant', icon: '', section: 'ai' },
                      ].map((item) => (
                        <div
                          key={item.section}
                          onClick={() => navigate(`/app/${item.section}/${project.id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '7px 12px', cursor: 'pointer', borderRadius: '8px',
                            fontSize: '12px', fontWeight: 500, marginBottom: '2px',
                            background: isProjectActive(project.id, item.section) ? theme.navActive : 'transparent',
                            borderLeft: isProjectActive(project.id, item.section) ? `2px solid ${theme.navActiveBorder}` : '2px solid transparent',
                            color: isProjectActive(project.id, item.section) ? theme.accent : theme.textSecondary,
                          }}
                          onMouseEnter={(e) => { if (!isProjectActive(project.id, item.section)) e.currentTarget.style.background = 'rgba(128,128,128,0.06)'; }}
                          onMouseLeave={(e) => { if (!isProjectActive(project.id, item.section)) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {item.icon && <span style={{ fontSize: '13px' }}>{item.icon}</span>}
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ padding: '10px', borderTop: `0.5px solid ${theme.cardBorder}` }}>
          <div
            onClick={() => navigate('/app/pro')}
            style={{ background: 'linear-gradient(135deg, rgba(232,87,42,0.15), rgba(108,92,231,0.15))', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '14px' }}>✦</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#E8572A' }}>Upgrade to Pro</div>
              <div style={{ fontSize: '10px', color: theme.textMuted }}>Unlimited everything</div>
            </div>
          </div>

          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '8px', paddingLeft: '4px' }}>Theme</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', paddingLeft: '4px' }}>
            {[
              { key: 'parchment', color: '#F5F0E8', border: '#1C1917' },
              { key: 'navy', color: '#1B2A4A', border: '#E8572A' },
              { key: 'carbon', color: '#1C1917', border: '#6C5CE7' },
            ].map((t) => (
              <div
                key={t.key}
                onClick={() => switchTheme(t.key)}
                style={{ width: '22px', height: '22px', borderRadius: '50%', background: t.color, border: themeName === t.key ? `3px solid ${t.border}` : `1.5px solid ${theme.cardBorder}`, cursor: 'pointer', transition: 'all 0.15s' }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: theme.card, border: `0.5px solid ${theme.cardBorder}` }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '10px', color: theme.textMuted }}>{user?.email}</div>
            </div>
            <div onClick={() => navigate('/app/profile')} style={{ fontSize: '15px', cursor: 'pointer', color: theme.textMuted }} title="Profile">👤</div>
            <div onClick={logoutUser} style={{ fontSize: '15px', cursor: 'pointer', color: theme.textMuted }} title="Logout">🚪</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: theme.topbar, borderBottom: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: theme.textMuted }}>
            {currentWorkspace?.name || 'Kōdo'} /
            <span style={{ color: theme.textSecondary }}> {location.pathname.split('/')[2] || 'dashboard'}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9E8A' }} />
            <span style={{ fontSize: '11px', color: '#0D9E8A', fontFamily: 'JetBrains Mono, monospace' }}>Live</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet context={{ currentWorkspace, projects, fetchProjects, theme }} />
        </div>
      </div>
    </div>
  );
}