import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getSnippets, createSnippet, deleteSnippet } from '../utils/api';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import toast from 'react-hot-toast';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('bash', bash);

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'TypeScript', 'SQL', 'Bash', 'Other'];

const getLang = (language) => {
  const map = {
    'JavaScript': 'javascript', 'Python': 'python', 'Java': 'java',
    'C++': 'cpp', 'Go': 'go', 'TypeScript': 'typescript',
    'SQL': 'sql', 'Bash': 'bash', 'Other': 'javascript',
  };
  return map[language] || 'javascript';
};

export default function Snippets() {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const [snippets, setSnippets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', language: 'JavaScript', code: '', description: '', tags: '' });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchSnippets(); }, [projectId]);

  const fetchSnippets = async () => {
    try {
      const res = await getSnippets(projectId);
      setSnippets(res.data);
      if (res.data.length > 0) setSelected(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) { toast.error('Title and code are required'); return; }
    try {
      await createSnippet({
        project_id: parseInt(projectId),
        title: form.title,
        language: form.language,
        code: form.code,
        description: form.description,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Snippet saved');
      setShowForm(false);
      setForm({ title: '', language: 'JavaScript', code: '', description: '', tags: '' });
      fetchSnippets();
    } catch (err) {
      toast.error('Failed to save snippet');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this snippet?')) return;
    try {
      await deleteSnippet(id);
      toast.success('Snippet deleted');
      setSelected(null);
      fetchSnippets();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selected.code);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = snippets.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    s.language?.toLowerCase().includes(search.toLowerCase())
  );

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
    marginBottom: '10px',
    colorScheme: 'dark',
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '16px' }}>
      <div style={{ width: '260px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input type="text" placeholder="Search snippets..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 0, paddingLeft: '30px' }} />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: theme.textMuted }}>🔍</span>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '18px', cursor: 'pointer', flexShrink: 0 }}>+</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading ? (
            <div style={{ color: theme.textMuted, fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: theme.textMuted, fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              {snippets.length === 0 ? 'No snippets yet' : 'No results'}
            </div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} onClick={() => setSelected(s)} style={{ background: selected?.id === s.id ? theme.navActive : theme.card, border: `0.5px solid ${selected?.id === s.id ? theme.navActiveBorder : theme.cardBorder}`, borderLeft: selected?.id === s.id ? `3px solid ${theme.navActiveBorder}` : '3px solid transparent', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.text, marginBottom: '4px' }}>{s.title}</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(108,92,231,0.15)', color: '#6C5CE7', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px' }}>{s.language}</span>
                  {s.tags?.slice(0, 2).map(t => (
                    <span key={t} style={{ background: 'rgba(128,128,128,0.1)', color: theme.textMuted, fontSize: '10px', padding: '1px 5px', borderRadius: '4px' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {showForm ? (
          <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', padding: '20px', overflowY: 'auto' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: theme.text, marginBottom: '16px' }}>New snippet</div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <input type="text" placeholder="Snippet title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} autoFocus />
                </div>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} style={inputStyle}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} style={inputStyle} />
                <div style={{ gridColumn: '1 / -1' }}>
                  <input type="text" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <textarea placeholder="Paste your code here..." value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ ...inputStyle, height: '200px', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', lineHeight: 1.6 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '9px 20px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Save snippet</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '9px 16px', fontSize: '12px', color: theme.textSecondary, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        ) : selected ? (
          <div style={{ background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, color: theme.text }}>{selected.title}</div>
                <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                  <span style={{ background: 'rgba(108,92,231,0.15)', color: '#6C5CE7', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px' }}>{selected.language}</span>
                  {selected.tags?.map(t => (
                    <span key={t} style={{ background: 'rgba(128,128,128,0.1)', color: theme.textMuted, fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>{t}</span>
                  ))}
                </div>
              </div>
              <button onClick={handleCopy} style={{ background: copied ? 'rgba(13,158,138,0.15)' : 'rgba(232,87,42,0.1)', border: `0.5px solid ${copied ? 'rgba(13,158,138,0.3)' : 'rgba(232,87,42,0.3)'}`, borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: copied ? '#0D9E8A' : '#E8572A', cursor: 'pointer' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button onClick={() => handleDelete(selected.id)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: theme.textMuted, cursor: 'pointer' }}>Delete</button>
            </div>
            {selected.description && (
              <div style={{ padding: '12px 20px', borderBottom: `0.5px solid ${theme.cardBorder}`, fontSize: '13px', color: theme.textSecondary, flexShrink: 0 }}>{selected.description}</div>
            )}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <SyntaxHighlighter
                language={getLang(selected.language)}
                style={atomOneDark}
                customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px', lineHeight: 1.8, minHeight: '100%', background: '#141210' }}
                showLineNumbers={true}
                lineNumberStyle={{ color: 'rgba(245,240,232,0.2)', fontSize: '11px' }}
              >
                {selected.code}
              </SyntaxHighlighter>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💻</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, color: theme.text, marginBottom: '6px' }}>No snippets yet</div>
              <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: '16px' }}>Save reusable code your whole team can find instantly</div>
              <button onClick={() => setShowForm(true)} style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Add first snippet</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



