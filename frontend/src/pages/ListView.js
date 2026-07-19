import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getTasks, createTask, updateTask, deleteTask, getWorkspaceMembers, getProject } from '../utils/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io('https://stingy-spew-spout.ngrok-free.dev');

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#9B9890' },
  { key: 'in_progress', label: 'In Progress', color: '#F0A500' },
  { key: 'in_review', label: 'In Review', color: '#6C5CE7' },
  { key: 'done', label: 'Done', color: '#0D9E8A' },
];

const PRIORITIES = [
  { label: 'Critical', value: 'Critical', color: '#E8572A' },
  { label: 'Important', value: 'Important', color: '#F0A500' },
  { label: 'Low', value: 'Low', color: '#6C5CE7' },
];

const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'Critical': return { bg: 'rgba(232,87,42,0.15)', color: '#E8572A' };
    case 'Important': return { bg: 'rgba(240,165,0,0.15)', color: '#F0A500' };
    case 'Low': return { bg: 'rgba(108,92,231,0.15)', color: '#6C5CE7' };
    default: return { bg: 'rgba(155,152,144,0.15)', color: '#9B9890' };
  }
};

export default function ListView() {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const context = useOutletContext();
  const currentWorkspace = context?.currentWorkspace;
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Important', assignee_id: '', due_date: '', status: 'todo' });
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    fetchData();
    socket.on('task-updated', fetchTasks);
    return () => socket.off('task-updated');
  }, [projectId]);

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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask(task.id, { ...task, status: newStatus });
      socket.emit('task-update', { projectId });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      socket.emit('task-update', { projectId });
      fetchTasks();
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) { toast.error('Enter a task title'); return; }
    try {
      await createTask({
        project_id: parseInt(projectId),
        title: newTask.title,
        priority: newTask.priority,
        assignee_id: newTask.assignee_id || null,
        due_date: newTask.due_date || null,
        status: newTask.status,
        labels: [],
      });
      socket.emit('task-update', { projectId });
      toast.success('Task created');
      setShowNewTask(false);
      setNewTask({ title: '', priority: 'Important', assignee_id: '', due_date: '', status: 'todo' });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const getSortedTasks = (taskList) => {
    return [...taskList].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'priority') {
        const order = { Critical: 0, Important: 1, Low: 2 };
        valA = order[a.priority] ?? 3;
        valB = order[b.priority] ?? 3;
      }
      if (sortBy === 'due_date') {
        valA = a.due_date ? new Date(a.due_date) : new Date('9999');
        valB = b.due_date ? new Date(b.due_date) : new Date('9999');
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const inputStyle = {
    background: theme.input,
    border: `0.5px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    padding: '7px 10px',
    fontSize: '12px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    colorScheme: 'dark',
  };

  const SortIcon = ({ field }) => (
    <span style={{ fontSize: '10px', color: sortBy === field ? '#E8572A' : theme.textMuted, marginLeft: '4px' }}>
      {sortBy === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#E8572A', fontFamily: 'JetBrains Mono, monospace' }}>
      Loading list...
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, color: theme.text, marginBottom: '4px' }}>
            {project?.name} — List view
          </div>
          <div style={{ fontSize: '13px', color: theme.textSecondary }}>{tasks.length} tasks total</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle }}>
            <option value="all">All statuses</option>
            {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button onClick={() => setShowNewTask(!showNewTask)} style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '8px 16px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
            + Add task
          </button>
        </div>
      </div>

      {showNewTask && (
        <div style={{ background: theme.card, border: `0.5px solid rgba(232,87,42,0.3)`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Task title..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: '200px' }} autoFocus />
            <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })} style={inputStyle}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} style={inputStyle}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select value={newTask.assignee_id} onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })} style={inputStyle}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
            <button type="submit" style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '7px 16px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Create</button>
            <button type="button" onClick={() => setShowNewTask(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>Cancel</button>
          </form>
        </div>
      )}

      <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', gap: '0', background: 'rgba(128,128,128,0.06)', borderBottom: `0.5px solid ${theme.cardBorder}` }}>
          {[
            { label: 'Title', field: 'title' },
            { label: 'Status', field: 'status' },
            { label: 'Priority', field: 'priority' },
            { label: 'Assignee', field: 'assignee_name' },
            { label: 'Due date', field: 'due_date' },
            { label: '', field: null },
          ].map((col) => (
            <div
              key={col.label}
              onClick={() => col.field && handleSort(col.field)}
              style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, cursor: col.field ? 'pointer' : 'default', userSelect: 'none' }}
            >
              {col.label}{col.field && <SortIcon field={col.field} />}
            </div>
          ))}
        </div>

        {COLUMNS.map((col) => {
          const colTasks = getSortedTasks(filteredTasks.filter(t => t.status === col.key));
          if (filterStatus !== 'all' && filterStatus !== col.key) return null;
          if (colTasks.length === 0 && filterStatus !== col.key) return null;

          return (
            <div key={col.key}>
              <div
                onClick={() => setCollapsed({ ...collapsed, [col.key]: !collapsed[col.key] })}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(128,128,128,0.04)', borderBottom: `0.5px solid ${theme.cardBorder}`, cursor: 'pointer' }}
              >
                <span style={{ fontSize: '10px', color: theme.textMuted }}>{collapsed[col.key] ? '▸' : '▾'}</span>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</span>
                <span style={{ fontSize: '10px', color: theme.textMuted, background: 'rgba(128,128,128,0.15)', borderRadius: '10px', padding: '0 6px' }}>{colTasks.length}</span>
              </div>

              {!collapsed[col.key] && colTasks.map((task) => {
                const prioStyle = getPriorityStyle(task.priority);
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                return (
                  <div
                    key={task.id}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px', borderBottom: `0.5px solid ${theme.cardBorder}`, transition: 'background 0.1s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(128,128,128,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: col.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: theme.text }}>{task.title}</span>
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        style={{ ...inputStyle, fontSize: '11px', padding: '3px 6px', background: 'transparent', border: 'none', color: col.color, fontWeight: 600, cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ background: prioStyle.bg, color: prioStyle.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>{task.priority}</span>
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {task.assignee_name ? (
                        <>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {task.assignee_name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '12px', color: theme.textSecondary }}>{task.assignee_name}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: theme.textMuted }}>Unassigned</span>
                      )}
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
                      {task.due_date ? (
                        <span style={{ fontSize: '11px', color: isOverdue ? '#E8572A' : theme.textMuted, fontFamily: 'JetBrains Mono, monospace', fontWeight: isOverdue ? 600 : 400 }}>
                          {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>—</span>
                      )}
                    </div>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button onClick={() => handleDelete(task.id)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '14px', padding: '2px 6px', borderRadius: '4px' }} title="Delete task">🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>
            No tasks found. Click "+ Add task" to create one.
          </div>
        )}
      </div>
    </div>
  );
}


