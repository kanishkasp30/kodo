import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getWikiPages, createWikiPage, updateWikiPage, deleteWikiPage } from '../utils/api';
import toast from 'react-hot-toast';

export default function Wiki() {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchPages();
  }, [projectId]);

  const fetchPages = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/wiki/project/${projectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setPages(data);
      if (data.length > 0) setSelected(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Enter a page title'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ project_id: parseInt(projectId), title: newTitle, content: `# ${newTitle}\n\nStart writing here...` }),
      });
      const data = await res.json();
      toast.success('Page created');
      setShowNew(false);
      setNewTitle('');
      await fetchPages();
      setSelected(data);
      setEditing(true);
      setEditForm({ title: data.title, content: data.content });
    } catch (err) {
      toast.error('Failed to create page');
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`http://localhost:5000/api/wiki/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title: editForm.title, content: editForm.content }),
      });
      toast.success('Page saved');
      setEditing(false);
      fetchPages();
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await fetch(`http://localhost:5000/api/wiki/${selected.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Page deleted');
      setSelected(null);
      fetchPages();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        const imageMarkdown = `\n![${file.name}](${data.url})\n`;
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const newContent = editForm.content.slice(0, start) + imageMarkdown + editForm.content.slice(start);
          setEditForm(prev => ({ ...prev, content: newContent }));
        } else {
          setEditForm(prev => ({ ...prev, content: prev.content + imageMarkdown }));
        }
        toast.success('Image uploaded and inserted');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const inputStyle = {
    width: '100%',
    background: theme.input,
    border: `0.5px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  };

  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, i) => {
      const imgMatch = line.match(/^!\[(.*)\]\((.*)\)$/);
      if (imgMatch) {
        return (
          <div key={i} style={{ marginBottom: '12px' }}>
            <img src={imgMatch[2]} alt={imgMatch[1]} style={{ maxWidth: '100%', borderRadius: '8px', border: `0.5px solid ${theme.cardBorder}` }} onError={(e) => { e.target.style.display = 'none'; }} />
            {imgMatch[1] && <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px', textAlign: 'center', fontStyle: 'italic' }}>{imgMatch[1]}</div>}
          </div>
        );
      }
      if (line.startsWith('# ')) return <h1 key={i} style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 700, color: theme.text, marginBottom: '12px', marginTop: '8px' }}>{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '8px', marginTop: '16px' }}>{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '15px', fontWeight: 600, color: theme.text, marginBottom: '6px', marginTop: '12px' }}>{line.slice(4)}</h3>;
      if (line.startsWith('- ')) return <li key={i} style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px', marginLeft: '16px', lineHeight: 1.6 }}>{line.slice(2)}</li>;
      if (line === '') return <div key={i} style={{ height: '8px' }} />;
      return <p key={i} style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.7, marginBottom: '6px' }}>{line}</p>;
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '16px' }}>
      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted }}>Pages</div>
          <button onClick={() => setShowNew(true)} style={{ background: '#E8572A', border: 'none', borderRadius: '6px', width: '22px', height: '22px', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>

        {showNew && (
          <div style={{ marginBottom: '10px' }}>
            <input type="text" placeholder="Page title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '6px', fontSize: '12px', padding: '7px 10px' }} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false); }} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={handleCreate} style={{ flex: 1, background: '#E8572A', border: 'none', borderRadius: '6px', padding: '5px', fontSize: '11px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Create</button>
              <button onClick={() => setShowNew(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '6px', padding: '5px 8px', fontSize: '11px', color: theme.textMuted, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {loading ? (
            <div style={{ color: theme.textMuted, fontSize: '12px', padding: '10px' }}>Loading...</div>
          ) : pages.length === 0 ? (
            <div style={{ color: theme.textMuted, fontSize: '12px', padding: '10px', lineHeight: 1.6 }}>No pages yet. Click + to create.</div>
          ) : (
            pages.map((page) => (
              <div key={page.id} onClick={() => { setSelected(page); setEditing(false); }} style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selected?.id === page.id ? theme.navActive : 'transparent', borderLeft: selected?.id === page.id ? `2px solid ${theme.navActiveBorder}` : '2px solid transparent', fontSize: '12px', fontWeight: selected?.id === page.id ? 600 : 400, color: selected?.id === page.id ? theme.accent : theme.textSecondary }}>
                📄 {page.title}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '12px', padding: '10px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Markdown tips</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, lineHeight: 1.8, fontFamily: 'JetBrains Mono, monospace' }}>
            # Heading 1<br />
            ## Heading 2<br />
            - Bullet point<br />
            ![alt](url) Image
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selected ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {editing ? (
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={{ ...inputStyle, fontSize: '15px', fontWeight: 600, padding: '6px 10px', flex: 1 }} />
              ) : (
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, color: theme.text, flex: 1 }}>{selected.title}</div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {editing ? (
                  <>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background: 'rgba(108,92,231,0.15)', border: '0.5px solid rgba(108,92,231,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#6C5CE7', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {uploading ? '⏳ Uploading...' : '🖼 Image'}
                    </button>
                    <button onClick={handleSave} style={{ background: '#0D9E8A', border: 'none', borderRadius: '8px', padding: '6px 14px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditing(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditing(true); setEditForm({ title: selected.title, content: selected.content || '' }); }} style={{ background: 'rgba(232,87,42,0.1)', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '6px 14px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#E8572A', cursor: 'pointer' }}>Edit</button>
                    <button onClick={handleDelete} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: theme.textMuted, cursor: 'pointer' }}>Delete</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              {editing ? (
                <textarea
                  ref={textareaRef}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  style={{ ...inputStyle, height: '100%', resize: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', lineHeight: 1.7, minHeight: '400px' }}
                  placeholder="Write in markdown...&#10;# Heading&#10;## Subheading&#10;- Bullet point&#10;&#10;Click 🖼 Image button above to upload images"
                />
              ) : (
                <div>{renderContent(selected.content)}</div>
              )}
            </div>

            <div style={{ padding: '8px 16px', borderTop: `0.5px solid ${theme.cardBorder}`, fontSize: '11px', color: theme.textMuted, flexShrink: 0, fontFamily: 'JetBrains Mono, monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>Last updated {new Date(selected.updated_at).toLocaleString('en-IN')}</span>
              <span>by {selected.created_by_name}</span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 700, color: theme.text, marginBottom: '8px' }}>Your project wiki</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px', lineHeight: 1.7, maxWidth: '320px' }}>Document your architecture, API references, and decisions. Supports markdown and image uploads.</div>
              <button onClick={() => setShowNew(true)} style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Create first page</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}