import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
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
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showLinkHelper, setShowLinkHelper] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { fetchPages(); }, [projectId]);

  const fetchPages = async () => {
    try {
      const res = await fetch(`https://stingy-spew-spout.ngrok-free.dev/api/wiki/project/${projectId}`, {
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

  const fetchHistory = async (pageId) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`https://stingy-spew-spout.ngrok-free.dev/api/wiki/${pageId}/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Enter a page title'); return; }
    try {
      const res = await fetch('https://stingy-spew-spout.ngrok-free.dev/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          project_id: parseInt(projectId),
          title: newTitle,
          content: `# ${newTitle}\n\nStart writing here...\n\nTip: Use [[Page Name]] to link to another wiki page.`,
        }),
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
      await fetch(`https://stingy-spew-spout.ngrok-free.dev/api/wiki/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title: editForm.title, content: editForm.content }),
      });
      toast.success('Page saved');
      setEditing(false);
      setShowHistory(false);
      fetchPages();
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await fetch(`https://stingy-spew-spout.ngrok-free.dev/api/wiki/${selected.id}`, {
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
      const response = await fetch('https://stingy-spew-spout.ngrok-free.dev/api/upload/image', {
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

  const handleRestoreVersion = (version) => {
    setEditForm({ title: version.title, content: version.content });
    setShowHistory(false);
    setEditing(true);
    toast.success('Version restored — click Save to apply');
  };

  const handleViewHistory = async () => {
    setShowHistory(true);
    setEditing(false);
    await fetchHistory(selected.id);
  };

  const insertPageLink = (pageName) => {
    const linkText = `[[${pageName}]]`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = editForm.content.slice(0, start) + linkText + editForm.content.slice(start);
      setEditForm(prev => ({ ...prev, content: newContent }));
    } else {
      setEditForm(prev => ({ ...prev, content: prev.content + linkText }));
    }
    setShowLinkHelper(false);
    toast.success(`Link to "${pageName}" inserted`);
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

      if (line.includes('[[') && line.includes(']]')) {
        const parts = line.split(/(\[\[.*?\]\])/g);
        return (
          <p key={i} style={{ fontSize: '14px', color: theme.textSecondary, lineHeight: 1.7, marginBottom: '6px' }}>
            {parts.map((part, j) => {
              const linkMatch = part.match(/^\[\[(.*?)\]\]$/);
              if (linkMatch) {
                const pageName = linkMatch[1];
                const linkedPage = pages.find(p => p.title.toLowerCase() === pageName.toLowerCase());
                return (
                  <span
                    key={j}
                    onClick={() => {
                      if (linkedPage) {
                        setSelected(linkedPage);
                        setEditing(false);
                        setShowHistory(false);
                      } else {
                        toast.error(`Page "${pageName}" not found`);
                      }
                    }}
                    style={{
                      color: linkedPage ? '#6C5CE7' : '#E8572A',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textDecorationStyle: linkedPage ? 'solid' : 'dashed',
                      padding: '0 2px',
                    }}
                    title={linkedPage ? `Go to: ${pageName}` : `Page not found: ${pageName}`}
                  >
                    📄 {pageName}
                  </span>
                );
              }
              return part;
            })}
          </p>
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
              <div key={page.id} onClick={() => { setSelected(page); setEditing(false); setShowHistory(false); }} style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selected?.id === page.id ? theme.navActive : 'transparent', borderLeft: selected?.id === page.id ? `2px solid ${theme.navActiveBorder}` : '2px solid transparent', fontSize: '12px', fontWeight: selected?.id === page.id ? 600 : 400, color: selected?.id === page.id ? theme.accent : theme.textSecondary }}>
                📄 {page.title}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '12px', padding: '10px', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tips</div>
          <div style={{ fontSize: '11px', color: theme.textMuted, lineHeight: 1.8, fontFamily: 'JetBrains Mono, monospace' }}>
            # Heading 1<br />
            ## Heading 2<br />
            - Bullet point<br />
            ![alt](url) Image<br />
            [[Page Name]] Link
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selected ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
              {editing ? (
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={{ ...inputStyle, fontSize: '15px', fontWeight: 600, padding: '6px 10px', flex: 1 }} />
              ) : (
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, color: theme.text, flex: 1 }}>{selected.title}</div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                {editing ? (
                  <>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowLinkHelper(!showLinkHelper)}
                        style={{ background: 'rgba(240,165,0,0.1)', border: '0.5px solid rgba(240,165,0,0.3)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 600, color: '#F0A500', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        🔗 Link page
                      </button>
                      {showLinkHelper && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: theme.sidebar, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '10px', padding: '8px', zIndex: 100, minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '6px', padding: '0 4px' }}>Link to page</div>
                          {pages.filter(p => p.id !== selected.id).length === 0 ? (
                            <div style={{ fontSize: '12px', color: theme.textMuted, padding: '6px 4px' }}>No other pages yet</div>
                          ) : (
                            pages.filter(p => p.id !== selected.id).map(p => (
                              <div
                                key={p.id}
                                onClick={() => insertPageLink(p.title)}
                                style={{ padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: theme.text, display: 'flex', alignItems: 'center', gap: '6px' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(108,92,231,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <span style={{ fontSize: '12px' }}>📄</span>
                                {p.title}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ background: 'rgba(108,92,231,0.15)', border: '0.5px solid rgba(108,92,231,0.3)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 600, color: '#6C5CE7', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {uploading ? '⏳' : '🖼 Image'}
                    </button>
                    <button onClick={handleSave} style={{ background: '#0D9E8A', border: 'none', borderRadius: '8px', padding: '6px 14px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setEditing(false); setShowLinkHelper(false); }} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : showHistory ? (
                  <button onClick={() => setShowHistory(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>← Back</button>
                ) : (
                  <>
                    <button onClick={handleViewHistory} style={{ background: 'rgba(240,165,0,0.1)', border: '0.5px solid rgba(240,165,0,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#F0A500', cursor: 'pointer' }}>🕐 History</button>
                    <button onClick={() => { setEditing(true); setEditForm({ title: selected.title, content: selected.content || '' }); }} style={{ background: 'rgba(232,87,42,0.1)', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '6px 14px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '12px', fontWeight: 700, color: '#E8572A', cursor: 'pointer' }}>Edit</button>
                    <button onClick={handleDelete} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: theme.textMuted, cursor: 'pointer' }}>Delete</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              {showHistory ? (
                <div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '16px' }}>Version history</div>
                  {loadingHistory ? (
                    <div style={{ color: theme.textMuted, fontSize: '13px' }}>Loading history...</div>
                  ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🕐</div>
                      <div style={{ fontSize: '14px' }}>No version history yet. Edit and save the page to start tracking changes.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {history.map((version, i) => (
                        <div key={version.id} style={{ background: theme.bg, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text, marginBottom: '2px' }}>{version.title}</div>
                              <div style={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
                                {new Date(version.created_at).toLocaleString('en-IN')} · by {version.updated_by_name}
                                {i === 0 && <span style={{ marginLeft: '8px', background: 'rgba(13,158,138,0.15)', color: '#0D9E8A', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>Latest saved</span>}
                              </div>
                            </div>
                            <button onClick={() => handleRestoreVersion(version)} style={{ background: 'rgba(232,87,42,0.1)', border: '0.5px solid rgba(232,87,42,0.3)', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: '#E8572A', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              Restore
                            </button>
                          </div>
                          <div style={{ fontSize: '12px', color: theme.textMuted, lineHeight: 1.5, maxHeight: '60px', overflow: 'hidden' }}>
                            {version.content?.slice(0, 200)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : editing ? (
                <textarea
                  ref={textareaRef}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  style={{ ...inputStyle, height: '100%', resize: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', lineHeight: 1.7, minHeight: '400px' }}
                  placeholder="Write in markdown...&#10;# Heading&#10;## Subheading&#10;- Bullet point&#10;[[Page Name]] to link to another page"
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
              <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '20px', lineHeight: 1.7, maxWidth: '320px' }}>
                Document your architecture and decisions. Supports markdown, image uploads, version history, and page linking with [[Page Name]].
              </div>
              <button onClick={() => setShowNew(true)} style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Create first page</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


