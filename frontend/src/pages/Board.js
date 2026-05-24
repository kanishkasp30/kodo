import React, { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getTasks, createTask, updateTask, deleteTask, getWorkspaceMembers, getProject, getTaskComments, createComment } from '../utils/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io('http://localhost:5000');

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#9B9890' },
  { key: 'in_progress', label: 'In Progress', color: '#F0A500' },
  { key: 'in_review', label: 'In Review', color: '#6C5CE7' },
  { key: 'done', label: 'Done', color: '#0D9E8A' },
];

const PRIORITIES = [
  { label: 'Critical', value: 'Critical', color: '#E8572A', bg: 'rgba(232,87,42,0.15)' },
  { label: 'Important', value: 'Important', color: '#F0A500', bg: 'rgba(240,165,0,0.15)' },
  { label: 'Low', value: 'Low', color: '#6C5CE7', bg: 'rgba(108,92,231,0.15)' },
];

const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'Critical': return { bg: 'rgba(232,87,42,0.15)', color: '#E8572A' };
    case 'Important': return { bg: 'rgba(240,165,0,0.15)', color: '#F0A500' };
    case 'Low': return { bg: 'rgba(108,92,231,0.15)', color: '#6C5CE7' };
    default: return { bg: 'rgba(155,152,144,0.15)', color: '#9B9890' };
  }
};

export default function Board() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const context = useOutletContext();
  const currentWorkspace = context?.currentWorkspace;
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [presence, setPresence] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const commentsEndRef = useRef(null);
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'Important',
    assignee_id: '', due_date: '', labels: [],
  });

  useEffect(() => {
    fetchData();
    socket.emit('join-project', projectId);
    socket.emit('user-presence', { projectId, userId: user.id, userName: user.name });
    socket.on('task-updated', () => fetchTasks());
    socket.on('presence-update', (users) => setPresence(users.filter(u => u.userId !== user.id)));
    return () => {
      socket.off('task-updated');
      socket.off('presence-update');
    };
  }, [projectId]);

  useEffect(() => {
    if (selectedTask) {
      fetchComments(selectedTask.id);
    }
  }, [selectedTask?.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const fetchData = async () => {
    try {
      const [projectRes, membersRes] = await Promise.all([
        getProject(projectId),
        currentWorkspace ? getWorkspaceMembers(currentWorkspace.id) : Promise.resolve({ data: [] }),
      ]);
      setProject(projectRes.data);
      setMembers(membersRes.data);
      await fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await getTasks(projectId);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async (taskId) => {
    setLoadingComments(true);
    try {
      const res = await getTaskComments(taskId);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment(selectedTask.id, { content: newComment });
      setNewComment('');
      fetchComments(selectedTask.id);
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleCreateTask = async (status) => {
    if (!newTask.title.trim()) {
      toast.error('Enter a task title');
      return;
    }
    try {
      await createTask({
        project_id: parseInt(projectId),
        title: newTask.title,
        description: newTask.description,
        status,
        priority: newTask.priority,
        assignee_id: newTask.assignee_id || null,
        due_date: newTask.due_date || null,
        labels: newTask.labels,
      });
      socket.emit('task-update', { projectId });
      toast.success('Task created');
      setShowNewTask(null);
      setNewTask({ title: '', description: '', priority: 'Important', assignee_id: '', due_date: '', labels: [] });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask(task.id, { ...task, status: newStatus });
      socket.emit('task-update', { projectId });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      socket.emit('task-update', { projectId });
      setSelectedTask(null);
      fetchTasks();
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleDragStart = (task) => setDraggedTask(task);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (status) => {
    if (!draggedTask || draggedTask.status === status) return;
    await handleStatusChange(draggedTask, status);
    setDraggedTask(null);
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

  const getMentions = (content) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} style={{ color: '#6C5CE7', fontWeight: 600 }}>{part}</span>;
      }
      return part;
    });
  };

  const inputStyle = {
    width: '100%',
    background: theme.input,
    border: `0.5px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '12px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '8px',
    colorScheme: 'dark',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#E8572A', fontFamily: 'JetBrains Mono, monospace' }}>
      Loading board...
    </div>
  );

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
            {project?.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9E8A' }} />
              <span style={{ fontSize: '11px', color: '#0D9E8A', fontFamily: 'JetBrains Mono, monospace' }}>
                {1 + presence.length} online
              </span>
            </div>
            {presence.slice(0, 3).map((p, i) => (
              <div key={i} style={{ fontSize: '11px', color: theme.textMuted }}>
                {p.userName} is here
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {members.slice(0, 5).map((m, idx) => (
            <div key={m.id} style={{ width: '28px', height: '28px', borderRadius: '50%', background: ['#E8572A','#0D9E8A','#6C5CE7','#F0A500','#9B7FA6'][idx % 5], color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${theme.bg}`, marginLeft: '-6px' }} title={m.name}>
              {m.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          <div style={{ marginLeft: '8px', fontSize: '12px', color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', flex: 1, overflow: 'hidden' }}>
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} onDragOver={handleDragOver} onDrop={() => handleDrop(col.key)} style={{ display: 'flex', flexDirection: 'column', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: theme.textSecondary }}>{col.label}</span>
                  <span style={{ background: 'rgba(128,128,128,0.15)', borderRadius: '10px', padding: '0 6px', fontSize: '10px', color: theme.textMuted, fontWeight: 600 }}>{colTasks.length}</span>
                </div>
                <div onClick={() => setShowNewTask(col.key)} style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(232,87,42,0.1)', color: '#E8572A', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700 }}>+</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {showNewTask === col.key && (
                  <div style={{ background: theme.bg, border: `0.5px solid rgba(232,87,42,0.3)`, borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
                    <input type="text" placeholder="Task title..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} style={inputStyle} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(col.key); if (e.key === 'Escape') setShowNewTask(null); }} />
                    <input type="text" placeholder="Description (optional)" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} style={inputStyle} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                      <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }}>
                        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <select value={newTask.assignee_id} onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }}>
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => handleCreateTask(col.key)} style={{ flex: 1, background: '#E8572A', border: 'none', borderRadius: '6px', padding: '7px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Add task</button>
                      <button onClick={() => setShowNewTask(null)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {colTasks.map((task) => {
                  const prioStyle = getPriorityStyle(task.priority);
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  return (
                    <div key={task.id} draggable onDragStart={() => handleDragStart(task)} onClick={() => setSelectedTask(task)} style={{ background: theme.bg, border: `0.5px solid ${theme.cardBorder}`, borderLeft: `3px solid ${col.color}`, borderRadius: '10px', padding: '10px 12px', marginBottom: '7px', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: theme.text, marginBottom: '6px', lineHeight: 1.4 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '6px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <span style={{ background: prioStyle.bg, color: prioStyle.color, fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>{task.priority}</span>
                        {task.assignee_name && <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: task.assignee_color || '#E8572A', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={task.assignee_name}>{task.assignee_name?.charAt(0).toUpperCase()}</div>}
                        {task.labels?.slice(0, 2).map((label) => <span key={label} style={{ background: 'rgba(108,92,231,0.15)', color: '#6C5CE7', fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px' }}>{label}</span>)}
                        {isOverdue && <span style={{ background: 'rgba(232,87,42,0.15)', color: '#E8572A', fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px' }}>overdue</span>}
                        {task.due_date && <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedTask(null); }}>
          <div style={{ background: theme.sidebar, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '20px', padding: '28px', width: '560px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>{selectedTask.title}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: theme.textMuted }}>Created {new Date(selectedTask.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
            </div>

            {selectedTask.description && <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '16px', lineHeight: 1.6, padding: '10px', background: theme.bg, borderRadius: '8px' }}>{selectedTask.description}</div>}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '8px' }}>Move to</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {COLUMNS.map((col) => (
                  <button key={col.key} onClick={() => { handleStatusChange(selectedTask, col.key); setSelectedTask({ ...selectedTask, status: col.key }); }} style={{ background: selectedTask.status === col.key ? col.color : 'transparent', border: `0.5px solid ${col.color}`, borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, color: selectedTask.status === col.key ? '#fff' : col.color, cursor: 'pointer' }}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ color: theme.textMuted, marginBottom: '6px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Priority</div>
                <select value={selectedTask.priority} onChange={(e) => { updateTask(selectedTask.id, { ...selectedTask, priority: e.target.value }); setSelectedTask({ ...selectedTask, priority: e.target.value }); }} style={{ background: theme.input, border: `0.5px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: theme.text, outline: 'none', colorScheme: 'dark', width: '100%' }}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ color: theme.textMuted, marginBottom: '6px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Assignee</div>
                <select value={selectedTask.assignee_id || ''} onChange={(e) => { updateTask(selectedTask.id, { ...selectedTask, assignee_id: e.target.value || null }); setSelectedTask({ ...selectedTask, assignee_id: e.target.value }); }} style={{ background: theme.input, border: `0.5px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: theme.text, outline: 'none', colorScheme: 'dark', width: '100%' }}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Comments
                <span style={{ background: 'rgba(128,128,128,0.15)', borderRadius: '10px', padding: '0 6px', fontSize: '10px', color: theme.textMuted }}>{comments.length}</span>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loadingComments ? (
                  <div style={{ fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '10px' }}>Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div style={{ fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '10px' }}>No comments yet. Be the first to comment.</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {comment.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, background: theme.bg, borderRadius: '8px', padding: '8px 10px', border: `0.5px solid ${theme.cardBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: theme.text }}>{comment.user_name}</span>
                          <span style={{ fontSize: '10px', color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>{formatTime(comment.created_at)}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary, lineHeight: 1.5 }}>{getMentions(comment.content)}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Add a comment... use @name to mention"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                    style={{ width: '100%', background: theme.input, border: `0.5px solid ${theme.inputBorder}`, borderRadius: '8px', padding: '8px 40px 8px 12px', fontSize: '12px', color: theme.text, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  />
                  <button onClick={handleAddComment} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: '#E8572A', border: 'none', borderRadius: '5px', width: '24px', height: '24px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleDeleteTask(selectedTask.id)} style={{ background: 'rgba(232,87,42,0.1)', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#E8572A', cursor: 'pointer' }}>
                Delete task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}