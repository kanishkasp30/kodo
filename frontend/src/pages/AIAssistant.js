import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { generateStandup, summarizeProject, getBlockers, breakdownFeature, reviewCode } from '../utils/api';
import toast from 'react-hot-toast';

const QUICK_ACTIONS = [
  { key: 'standup', icon: '📋', label: 'Generate standup', desc: "Write today's standup from your board" },
  { key: 'summarize', icon: '📊', label: 'Summarise project', desc: 'Get an AI overview of progress' },
  { key: 'blockers', icon: '⚠️', label: "What's blocking us?", desc: 'Find stuck tasks and suggest fixes' },
  { key: 'breakdown', icon: '⚡', label: 'Break down a feature', desc: 'Turn a description into tasks' },
  { key: 'review', icon: '🔍', label: 'Review my code', desc: 'Get a score and actionable feedback' },
  { key: 'pr', icon: '🔗', label: 'Review a PR', desc: 'Paste a GitHub PR URL for AI review' },
];

const AURA_INTROS = [
  "Hey! I'm Aura, your Kōdo AI mentor. Ask me anything about your project, your code, or just say hi. 👋",
  "Aura here. Think of me as your team's smartest member who never sleeps. What do you need? ✦",
  "Hi there! I'm Aura. I can generate standups, review code, break down features, and chat about anything dev-related. 🚀",
];

export default function AIAssistant() {
  const { projectId } = useParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: AURA_INTROS[Math.floor(Math.random() * AURA_INTROS.length)],
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('JavaScript');
  const [featureInput, setFeatureInput] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, time: new Date() }]);
  };

  const callAuraChat = async (message) => {
    const response = await fetch('https://stingy-spew-spout.ngrok-free.dev/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        message: `The user's name is ${user?.name?.split(' ')[0] || 'there'}. They said: ${message}`,
        history: conversationHistory,
      }),
    });
    const data = await response.json();
    return data.reply;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setConversationHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const reply = await callAuraChat(userMessage);
      addMessage('ai', reply);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      addMessage('ai', 'Sorry, I had trouble connecting. Try again in a moment. 🔌');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (key) => {
    setActiveFeature(key);
    if (key === 'breakdown' || key === 'review' || key === 'pr') return;
    setLoading(true);
    const actionLabel = QUICK_ACTIONS.find(a => a.key === key).label;
    addMessage('user', actionLabel);
    try {
      let response = '';
      if (key === 'standup') {
        const res = await generateStandup({ project_id: projectId });
        response = res.data.report;
      } else if (key === 'summarize') {
        const res = await summarizeProject({ project_id: projectId });
        response = res.data.summary;
      } else if (key === 'blockers') {
        const res = await getBlockers({ project_id: projectId });
        response = res.data.blockers;
      }
      addMessage('ai', response);
      setActiveFeature(null);
    } catch (err) {
      addMessage('ai', 'Something went wrong. Please try again. 🔌');
      toast.error('AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdown = async () => {
    if (!featureInput.trim()) {
      toast.error('Enter a feature description');
      return;
    }
    setLoading(true);
    addMessage('user', `Break down: ${featureInput}`);
    try {
      const res = await breakdownFeature({ feature: featureInput, project_id: projectId });
      const tasks = res.data.tasks;
      const formatted = `Here are ${tasks.length} tasks for "${featureInput}":\n\n${tasks.map((t, i) => `${i + 1}. ${t.title} — ${t.priority}`).join('\n')}\n\nWant me to add these to your board?`;
      addMessage('ai', formatted);
      setFeatureInput('');
      setActiveFeature(null);
    } catch (err) {
      addMessage('ai', 'Failed to break down the feature. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeReview = async () => {
    if (!codeInput.trim()) {
      toast.error('Paste some code to review');
      return;
    }
    setLoading(true);
    addMessage('user', `Review my ${codeLanguage} code`);
    try {
      const res = await reviewCode({ code: codeInput, language: codeLanguage });
      const r = res.data;
      const formatted = `Code Review — ${codeLanguage}\n\nScore: ${r.score}/10 — ${r.verdict}\n\n${r.bugs?.length > 0 ? `🐛 Bugs:\n${r.bugs.map(b => `• ${b}`).join('\n')}\n\n` : ''}${r.security?.length > 0 ? `🔒 Security:\n${r.security.map(s => `• ${s}`).join('\n')}\n\n` : ''}${r.performance?.length > 0 ? `⚡ Performance:\n${r.performance.map(p => `• ${p}`).join('\n')}\n\n` : ''}${r.good_practices?.length > 0 ? `✅ Good practices:\n${r.good_practices.map(g => `• ${g}`).join('\n')}` : ''}`;
      addMessage('ai', formatted);
      setCodeInput('');
      setActiveFeature(null);
    } catch (err) {
      addMessage('ai', 'Failed to review code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePRReview = async () => {
    if (!prUrl.trim()) {
      toast.error('Enter a GitHub PR URL');
      return;
    }
    setLoading(true);
    addMessage('user', `Review PR: ${prUrl}`);
    try {
      const response = await fetch('https://stingy-spew-spout.ngrok-free.dev/api/ai/review-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ pr_url: prUrl }),
      });
      const data = await response.json();
      addMessage('ai', data.review);
      setPrUrl('');
      setActiveFeature(null);
    } catch (err) {
      addMessage('ai', 'Failed to review PR. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: theme.input,
    border: `0.5px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    color: theme.text,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    colorScheme: 'dark',
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '16px' }}>

      <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        <div style={{ marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '8px' }}>Quick actions</div>
          <div style={{ background: 'rgba(108,92,231,0.08)', border: '0.5px solid rgba(108,92,231,0.2)', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6C5CE7', marginBottom: '2px', fontFamily: 'Fraunces, serif' }}>✦ Aura</div>
            <div style={{ fontSize: '11px', color: theme.textMuted, lineHeight: 1.5 }}>Your personal dev mentor. Ask me anything.</div>
          </div>
        </div>
        {QUICK_ACTIONS.map((action) => (
          <div
            key={action.key}
            onClick={() => handleQuickAction(action.key)}
            style={{
              background: activeFeature === action.key ? theme.navActive : theme.card,
              border: `0.5px solid ${activeFeature === action.key ? theme.navActiveBorder : theme.cardBorder}`,
              borderRadius: '10px', padding: '10px 12px',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (activeFeature !== action.key) e.currentTarget.style.borderColor = '#E8572A'; }}
            onMouseLeave={(e) => { if (activeFeature !== action.key) e.currentTarget.style.borderColor = theme.cardBorder; }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '15px' }}>{action.icon}</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: theme.text, marginBottom: '1px' }}>{action.label}</div>
                <div style={{ fontSize: '10px', color: theme.textMuted, lineHeight: 1.4 }}>{action.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.card, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '14px', overflow: 'hidden' }}>

        <div style={{ padding: '14px 18px', borderBottom: `0.5px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6C5CE7, #E8572A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✦</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, fontFamily: 'Fraunces, serif' }}>Aura</div>
            <div style={{ fontSize: '10px', color: '#0D9E8A', fontFamily: 'JetBrains Mono, monospace' }}>● Your Kōdo AI mentor — always online</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '11px', color: theme.textMuted }}>
            Powered by Mistral 7B
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
              {msg.role === 'ai' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6C5CE7, #E8572A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>✦</div>
              )}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  background: msg.role === 'user' ? '#E8572A' : theme.bg,
                  border: msg.role === 'ai' ? `0.5px solid ${theme.cardBorder}` : 'none',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  padding: '12px 16px',
                }}>
                  <pre style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: msg.role === 'user' ? '#fff' : theme.text, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    {msg.content}
                  </pre>
                </div>
                {msg.time && (
                  <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', fontFamily: 'JetBrains Mono, monospace', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.role === 'ai' ? 'Aura · ' : ''}{msg.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6C5CE7, #E8572A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>✦</div>
              <div style={{ background: theme.bg, border: `0.5px solid ${theme.cardBorder}`, borderRadius: '4px 14px 14px 14px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6C5CE7', animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                  <span style={{ fontSize: '11px', color: theme.textMuted, marginLeft: '6px' }}>Aura is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {activeFeature === 'breakdown' && (
          <div style={{ padding: '10px 14px', borderTop: `0.5px solid ${theme.cardBorder}`, background: 'rgba(108,92,231,0.05)', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: '#6C5CE7', fontWeight: 600, marginBottom: '6px' }}>⚡ Describe the feature to break down</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="e.g. Build a user authentication system with JWT" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} onKeyDown={(e) => { if (e.key === 'Enter') handleBreakdown(); }} autoFocus />
              <button onClick={handleBreakdown} disabled={loading} style={{ background: '#6C5CE7', border: 'none', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0 }}>→</button>
              <button onClick={() => setActiveFeature(null)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '0 12px', color: theme.textMuted, cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
          </div>
        )}

        {activeFeature === 'review' && (
          <div style={{ padding: '10px 14px', borderTop: `0.5px solid ${theme.cardBorder}`, background: 'rgba(232,87,42,0.05)', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: '#E8572A', fontWeight: 600, marginBottom: '6px' }}>🔍 Paste your code for review</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)} style={{ ...inputStyle, marginBottom: 0, width: 'auto', minWidth: '130px' }}>
                {['JavaScript', 'Python', 'Java', 'C++', 'Go', 'TypeScript'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={() => setActiveFeature(null)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '0 12px', color: theme.textMuted, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea placeholder="Paste your code here..." value={codeInput} onChange={(e) => setCodeInput(e.target.value)} style={{ ...inputStyle, marginBottom: 0, height: '80px', resize: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }} />
              <button onClick={handleCodeReview} disabled={loading} style={{ background: '#E8572A', border: 'none', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0 }}>→</button>
            </div>
          </div>
        )}

        {activeFeature === 'pr' && (
          <div style={{ padding: '10px 14px', borderTop: `0.5px solid ${theme.cardBorder}`, background: 'rgba(13,158,138,0.05)', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: '#0D9E8A', fontWeight: 600, marginBottom: '6px' }}>🔗 Paste a GitHub Pull Request URL</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="https://github.com/owner/repo/pull/123" value={prUrl} onChange={(e) => setPrUrl(e.target.value)} style={{ ...inputStyle, marginBottom: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }} onKeyDown={(e) => { if (e.key === 'Enter') handlePRReview(); }} autoFocus />
              <button onClick={handlePRReview} disabled={loading} style={{ background: '#0D9E8A', border: 'none', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0 }}>→</button>
              <button onClick={() => setActiveFeature(null)} style={{ background: 'transparent', border: `0.5px solid ${theme.cardBorder}`, borderRadius: '8px', padding: '0 12px', color: theme.textMuted, cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
          </div>
        )}

        <div style={{ padding: '12px 14px', borderTop: `0.5px solid ${theme.cardBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aura anything... (Enter to send, Shift+Enter for new line)"
              style={{ ...inputStyle, marginBottom: 0, resize: 'none', height: '44px', lineHeight: 1.5 }}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ background: input.trim() ? '#E8572A' : 'rgba(232,87,42,0.3)', border: 'none', borderRadius: '8px', width: '44px', height: '44px', color: '#fff', fontSize: '18px', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
            >
              ↑
            </button>
          </div>
          <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '5px', fontFamily: 'JetBrains Mono, monospace' }}>
            Aura remembers your conversation · Enter to send
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }`}</style>
    </div>
  );
}


