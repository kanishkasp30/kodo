import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getTasks, createTask, updateTask, deleteTask, getWorkspaceMembers, getProject } from '../utils/api';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const socket = io('https://stingy-spew-spout.ngrok-free.dev');

const PRIORITIES = [
  { label: 'Critical', value: 'Critical', color: '#E8572A' },
  { label: 'Important', value: 'Important', color: '#F0A500' },
  { label: 'Low', value: 'Low', color: '#6C5CE7' },
];

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#9B9890' },
  { key: 'in_progress', label: 'In Progress', color: '#F0A500' },
  { key: 'in_review', label: 'In Review', color: '#6C5CE7' },
  { key: 'done', label: 'Done', color: '#0D9E8A' },
];

export default function CalendarView() {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const context = useOutletContext();
  const currentWorkspace = context?.currentWorkspace;
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Important', assignee_id: '', status: 'todo' });
  const [editForm, setEditForm] = useState({ title: '', priority: '', status: '', assignee_id: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    socket.on('task-updated', () => fetchTasks());
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) { toast.error('Enter a task title'); return; }
    try {
      await createTask({
        project_id: parseInt(projectId),
        title: newTask.title,
        priority: newTask.priority,
        assignee_id: newTask.assignee_id || null,
        due_date: selectedDate,
        status: newTask.status,
        labels: [],
      });
      socket.emit('task-update', { projectId });
      toast.success('Task created');
      setShowNewTask(false);
      setNewTask({ title: '', priority: 'Important', assignee_id: '', status: 'todo' });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await updateTask(selectedTask.id, {
        ...selectedTask,
        title: editForm.title,
        priority: editForm.priority,
        status: editForm.status,
        assignee_id: editForm.assignee_id || null,
      });
      socket.emit('task-update', { projectId });
      toast.success('Task updated');
      setEditingTask(false);
      setSelectedTask(null);
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
      toast.success('Task deleted');
      setSelectedTask(null);
      setEditingTask(false);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const getTasksForDate = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => {
      if (!t.due_date) return false;
      const taskDate = t.due_date.slice(0, 10);
      return taskDate === dateStr;
    });
  };

  const getUnscheduledTasks = () => tasks.filter(t => !t.due_date);

  const formatDateStr = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const formatDisplayDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#E8572A';
      case 'Important': return '#F0A500';
      case 'Low': return '#6C5CE7';
      default: return '#9B9890';
    }
  };

  const getStatusColor = (status) => {
    const col = COLUMNS.find(c => c.key === status);
    return col ? col.color : '#9B9890';
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const inputStyle = {
    width: '100%',
    background: theme.input,
    border: `0.5px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    colorScheme: 'dark',
    marginBottom: '8px',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#E8572A', fontFamily: 'JetBrains Mono, monospace' }}>
      Loading calendar...
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 100px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, color: theme.text, marginBottom: '2px' }}>
              {project?.name} — Calendar
            </div>
            <div style={{ fontSize: '13px', color: theme.textSecondary }}>{monthName}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setCurrentDate(new Date())} style={{ background: 'rgba(232,87,42,0.1)', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: '#E8572A', cursor: 'pointer' }}>Today</button>
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '7px 12px', fontSize: '14px', color: theme.text, cursor: 'pointer' }}>←</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '7px 12px', fontSize: '14px', color: theme.text, cursor: 'pointer' }}>→</button>
          </div>
        </div>

        <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `0.5px solid ${theme.cardBorder}` }}>
            {days.map(day => (
              <div key={day} style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflow: 'auto' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ borderRight: `0.5px solid ${theme.cardBorder}`, borderBottom: `0.5px solid ${theme.cardBorder}`, minHeight: '100px', background: 'rgba(128,128,128,0.03)' }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayTasks = getTasksForDate(day);
              const today = isToday(day);
              const dateStr = formatDateStr(day);
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setShowNewTask(true);
                    setSelectedTask(null);
                    setEditingTask(false);
                  }}
                  style={{
                    borderRight: `0.5px solid ${theme.cardBorder}`,
                    borderBottom: `0.5px solid ${theme.cardBorder}`,
                    minHeight: '100px',
                    padding: '6px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(232,87,42,0.05)' : today ? 'rgba(13,158,138,0.05)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected && !today) e.currentTarget.style.background = 'rgba(128,128,128,0.05)'; }}
                  onMouseLeave={(e) => { if (!isSelected && !today) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: today ? '#0D9E8A' : isSelected ? '#E8572A' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: today ? 700 : 400,
                    color: today || isSelected ? '#fff' : theme.text,
                    marginBottom: '4px',
                  }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                          setEditForm({ title: task.title, priority: task.priority, status: task.status, assignee_id: task.assignee_id || '' });
                          setShowNewTask(false);
                          setEditingTask(false);
                        }}
                        style={{
                          background: `${getPriorityColor(task.priority)}20`,
                          borderLeft: `2px solid ${getPriorityColor(task.priority)}`,
                          borderRadius: '3px',
                          padding: '2px 5px',
                          fontSize: '10px',
                          fontWeight: 500,
                          color: theme.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: '9px', color: theme.textMuted, paddingLeft: '4px' }}>+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
        {showNewTask && selectedDate && (
          <div style={{ background: theme.card, border: `0.5px solid rgba(232,87,42,0.3)`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '2px' }}>Add task</div>
            <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatDisplayDate(selectedDate)}
            </div>
            <form onSubmit={handleCreateTask}>
              <input type="text" placeholder="Task title..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} style={inputStyle} autoFocus />
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
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="submit" style={{ flex: 1, background: '#E8572A', border: 'none', borderRadius: '8px', padding: '8px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Add task</button>
                <button type="button" onClick={() => setShowNewTask(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>✕</button>
              </div>
            </form>
          </div>
        )}

        {selectedTask && (
          <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', fontWeight: 700, color: theme.text }}>Task details</div>
              <button onClick={() => { setSelectedTask(null); setEditingTask(false); }} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            {editingTask ? (
              <form onSubmit={handleUpdateTask}>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} autoFocus />
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} style={inputStyle}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <select value={editForm.assignee_id} onChange={(e) => setEditForm({ ...editForm, assignee_id: e.target.value })} style={inputStyle}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="submit" style={{ flex: 1, background: '#0D9E8A', border: 'none', borderRadius: '8px', padding: '8px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save</button>
                  <button type="button" onClick={() => setEditingTask(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 700, color: theme.text, marginBottom: '10px', lineHeight: 1.4 }}>{selectedTask.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.textMuted }}>Status</span>
                    <span style={{ color: getStatusColor(selectedTask.status), fontWeight: 600, textTransform: 'capitalize' }}>{selectedTask.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: theme.textMuted }}>Priority</span>
                    <span style={{ color: getPriorityColor(selectedTask.priority), fontWeight: 600 }}>{selectedTask.priority}</span>
                  </div>
                  {selectedTask.assignee_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.textMuted }}>Assignee</span>
                      <span style={{ color: theme.text }}>{selectedTask.assignee_name}</span>
                    </div>
                  )}
                  {selectedTask.due_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.textMuted }}>Due</span>
                      <span style={{ color: theme.text, fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDisplayDate(selectedTask.due_date.slice(0, 10))}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setEditingTask(true)}
                    style={{ flex: 1, background: 'rgba(232,87,42,0.1)', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '7px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#E8572A', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    style={{ background: 'rgba(128,128,128,0.1)', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: theme.textMuted, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', padding: '16px', flex: 1, overflow: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '10px' }}>
            Unscheduled ({getUnscheduledTasks().length})
          </div>
          {getUnscheduledTasks().length === 0 ? (
            <div style={{ fontSize: '12px', color: theme.textMuted, textAlign: 'center', padding: '20px 0' }}>All tasks have due dates</div>
          ) : (
            getUnscheduledTasks().map(task => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setEditForm({ title: task.title, priority: task.priority, status: task.status, assignee_id: task.assignee_id || '' });
                  setShowNewTask(false);
                  setEditingTask(false);
                }}
                style={{ background: theme.bg, border: `0.5px solid ${theme.cardBorder}`, borderLeft: `3px solid ${getPriorityColor(task.priority)}`, borderRadius: '8px', padding: '8px 10px', marginBottom: '6px', cursor: 'pointer', fontSize: '12px', color: theme.text, fontWeight: 500 }}
              >
                {task.title}
                <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px' }}>{task.priority}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


