import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io('https://stingy-spew-spout.ngrok-free.dev');

export default function Notifications() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('https://stingy-spew-spout.ngrok-free.dev/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (user?.id) {
      socket.emit('join-user', user.id);
      socket.on('new-notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        toast(`🔔 ${notif.title}`, { duration: 4000 });
      });
    }
    return () => socket.off('new-notification');
  }, [user, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch('https://stingy-spew-spout.ngrok-free.dev/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const markRead = async (id) => {
    try {
      await fetch(`https://stingy-spew-spout.ngrok-free.dev/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const sendTestNotification = async () => {
    try {
      const res = await fetch('https://stingy-spew-spout.ngrok-free.dev/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: user?.id,
          title: 'Test notification from Kōdo',
          message: 'This is how real-time notifications look. Your team actions will appear here.',
          type: 'info',
        }),
      });
      const newNotif = await res.json();
      if (newNotif && newNotif.id) {
        setNotifications(prev => [newNotif, ...prev]);
        toast.success('Notification sent — scroll up to see it');
      } else {
        await fetchNotifications();
        toast.success('Notification sent');
      }
    } catch (err) {
      toast.error('Failed to send notification');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-IN');
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'task': return { color: '#E8572A', bg: 'rgba(232,87,42,0.1)', icon: '📋' };
      case 'mention': return { color: '#6C5CE7', bg: 'rgba(108,92,231,0.1)', icon: '@' };
      case 'member': return { color: '#0D9E8A', bg: 'rgba(13,158,138,0.1)', icon: '👥' };
      case 'ai': return { color: '#6C5CE7', bg: 'rgba(108,92,231,0.1)', icon: '✦' };
      default: return { color: '#1E90FF', bg: 'rgba(30,144,255,0.1)', icon: '🔔' };
    }
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
            Notifications
          </div>
          <div style={{ fontSize: '13px', color: theme.textSecondary }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: theme.textSecondary, cursor: 'pointer', fontFamily: 'Playfair Display, serif', fontStyle: 'italic' }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ background: filter === f ? '#E8572A' : 'transparent', border: `0.5px solid ${filter === f ? '#E8572A' : theme.cardBorder}`, borderRadius: '6px', padding: '6px 16px', fontSize: '12px', fontWeight: 600, color: filter === f ? '#fff' : theme.textSecondary, cursor: 'pointer', textTransform: 'capitalize' }}
          >
            {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>
            {filter === 'unread' ? 'No unread notifications' : 'All caught up'}
          </div>
          <div style={{ fontSize: '13px', color: theme.textMuted }}>
            {filter === 'unread' ? 'You have read all your notifications' : 'New notifications will appear here'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((notif) => {
            const typeStyle = getTypeStyle(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markRead(notif.id)}
                style={{
                  background: theme.card,
                  border: `0.5px solid ${notif.is_read ? theme.cardBorder : 'rgba(232,87,42,0.3)'}`,
                  borderLeft: `3px solid ${notif.is_read ? theme.cardBorder : '#E8572A'}`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  cursor: notif.is_read ? 'default' : 'pointer',
                  opacity: notif.is_read ? 0.7 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: typeStyle.bg, color: typeStyle.color, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>
                  {typeStyle.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{notif.title}</span>
                    <span style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{formatTime(notif.created_at)}</span>
                  </div>
                  {notif.message && (
                    <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5 }}>{notif.message}</div>
                  )}
                  {!notif.is_read && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E8572A' }} />
                      <span style={{ fontSize: '10px', color: '#E8572A', fontWeight: 600 }}>Unread — click to mark read</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '24px', padding: '16px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted, marginBottom: '6px' }}>Send a test notification</div>
        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '10px', lineHeight: 1.6 }}>
          Click below to send yourself a test notification and see it appear at the top of this page.
        </div>
        <button
          onClick={sendTestNotification}
          style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
        >
          Send test notification
        </button>
      </div>
    </div>
  );
}


