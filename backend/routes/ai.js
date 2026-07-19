const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');
require('dotenv').config();

const callAI = async (messages) => {
  console.log('Calling Groq API with', messages.length, 'messages');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1000,
      temperature: 0.75,
    }),
  });
  const data = await response.json();
  console.log('Groq response status:', response.status);
  console.log('Groq data:', JSON.stringify(data).slice(0, 300));
  if (!data.choices || !data.choices[0]) {
    throw new Error('No choices in response: ' + JSON.stringify(data));
  }
  return data.choices[0].message.content;
};

router.post('/chat', auth, async (req, res) => {
  const { message, history } = req.body;
  console.log('Chat request received:', message);
  try {
    const systemMessage = {
      role: 'system',
      content: `You are Aura, a friendly and intelligent AI assistant built into Kōdo — a developer collaboration platform. You are personal, warm, and helpful like a senior developer friend. You help with coding questions, project management, debugging, career advice, and anything a developer team needs. Keep responses concise but useful. Use emojis occasionally to feel friendly.`
    };
    const conversationHistory = history || [];
    const messages = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    const reply = await callAI(messages);
    console.log('Reply generated successfully');
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

router.post('/standup', auth, async (req, res) => {
  const { project_id } = req.body;
  try {
    const tasks = await pool.query(
      `SELECT t.title, t.status, t.priority, u.name as assignee
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = $1`,
      [project_id]
    );
    const taskList = tasks.rows.map(t =>
      `${t.title} (${t.status}, ${t.priority}, assigned to ${t.assignee || 'unassigned'})`
    ).join('\n');
    const prompt = `Generate a professional daily standup report based on these tasks:\n${taskList || 'No tasks yet'}\n\nFormat it with sections: Done, In Progress, Blockers. Keep it concise and professional.`;
    const reply = await callAI([{ role: 'user', content: prompt }]);
    res.json({ report: reply });
  } catch (err) {
    console.error('Standup error:', err.message);
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

router.post('/summarize', auth, async (req, res) => {
  const { project_id } = req.body;
  try {
    const tasks = await pool.query(
      `SELECT title, status, priority FROM tasks WHERE project_id = $1`,
      [project_id]
    );
    const taskList = tasks.rows.map(t => `${t.title}: ${t.status} (${t.priority})`).join('\n');
    const prompt = `Summarize the progress of this project based on these tasks:\n${taskList || 'No tasks yet'}\n\nProvide a brief summary of overall progress, what is going well, and what needs attention.`;
    const reply = await callAI([{ role: 'user', content: prompt }]);
    res.json({ summary: reply });
  } catch (err) {
    console.error('Summarize error:', err.message);
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

router.post('/blockers', auth, async (req, res) => {
  const { project_id } = req.body;
  try {
    const tasks = await pool.query(
      `SELECT title, status, updated_at FROM tasks
       WHERE project_id = $1 AND status = 'in_progress'
       ORDER BY updated_at ASC`,
      [project_id]
    );
    const taskList = tasks.rows.map(t =>
      `${t.title} (in progress since ${new Date(t.updated_at).toLocaleDateString()})`
    ).join('\n');
    const prompt = `Identify potential blockers from these in-progress tasks:\n${taskList || 'No tasks in progress'}\n\nHighlight which tasks might be stuck and suggest actions.`;
    const reply = await callAI([{ role: 'user', content: prompt }]);
    res.json({ blockers: reply });
  } catch (err) {
    console.error('Blockers error:', err.message);
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

router.post('/breakdown', auth, async (req, res) => {
  const { feature } = req.body;
  try {
    const prompt = `Break down this feature into specific development tasks: "${feature}"\n\nReturn ONLY a JSON array of task objects with fields: title (string), priority (Critical/Important/Low), status (always "todo"). Return only valid JSON, no markdown, no explanation.`;
    const text = await callAI([{ role: 'user', content: prompt }]);
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tasks = JSON.parse(clean);
    res.json({ tasks });
  } catch (err) {
    console.error('Breakdown error:', err.message);
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

router.post('/review-code', auth, async (req, res) => {
  const { code, language } = req.body;
  try {
    const prompt = `Review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nReturn ONLY a JSON object with: score (1-10), verdict (string), bugs (array of strings), performance (array of strings), security (array of strings), good_practices (array of strings). Return only valid JSON, no markdown.`;
    const text = await callAI([{ role: 'user', content: prompt }]);
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const review = JSON.parse(clean);
    res.json(review);
  } catch (err) {
    console.error('Code review error:', err.message);
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

router.post('/review-pr', auth, async (req, res) => {
  const { pr_url } = req.body;
  try {
    const prompt = `A developer has submitted this GitHub Pull Request URL for review: ${pr_url}\n\nProvide a comprehensive code review guide covering: security vulnerabilities to check, performance bottlenecks, code quality standards, and best practices. Be specific and actionable.`;
    const reply = await callAI([{ role: 'user', content: prompt }]);
    res.json({ review: reply });
  } catch (err) {
    console.error('PR review error:', err.message);
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

module.exports = router;
