const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/project/:project_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
       to_char(t.due_date, 'YYYY-MM-DD') as due_date
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = $1
       ORDER BY t.position ASC, t.created_at ASC`,
      [req.params.project_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { project_id, title, description, status, priority, assignee_id, due_date, labels } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date, labels, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *,
       to_char(due_date, 'YYYY-MM-DD') as due_date`,
      [project_id, title, description, status || 'todo', priority || 'Important', assignee_id, due_date, labels || [], req.user.id]
    );
    const task = result.rows[0];
    const project = await pool.query('SELECT workspace_id FROM projects WHERE id = $1', [project_id]);
    await pool.query(
      'INSERT INTO activity_log (workspace_id, project_id, user_id, action, entity_type, entity_name) VALUES ($1, $2, $3, $4, $5, $6)',
      [project.rows[0].workspace_id, project_id, req.user.id, 'created task', 'task', title]
    );
    if (assignee_id && assignee_id !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [assignee_id, 'Task assigned to you', `${req.user.name} assigned "${title}" to you`, 'task']
      );
    }
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { title, description, status, priority, assignee_id, due_date, labels, position } = req.body;
  try {
    const current = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const result = await pool.query(
      `UPDATE tasks SET
        title=$1, description=$2, status=$3, priority=$4,
        assignee_id=$5, due_date=$6, labels=$7, position=$8,
        updated_at=NOW()
       WHERE id=$9 RETURNING *,
       to_char(due_date, 'YYYY-MM-DD') as due_date`,
      [title, description, status, priority, assignee_id, due_date, labels, position, req.params.id]
    );
    const task = result.rows[0];
    const project = await pool.query('SELECT workspace_id FROM projects WHERE id = $1', [task.project_id]);
    await pool.query(
      'INSERT INTO activity_log (workspace_id, project_id, user_id, action, entity_type, entity_name) VALUES ($1, $2, $3, $4, $5, $6)',
      [project.rows[0].workspace_id, task.project_id, req.user.id, `moved task to ${status}`, 'task', title]
    );
    if (assignee_id && assignee_id !== req.user.id && current.rows[0]?.assignee_id !== assignee_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [assignee_id, 'Task assigned to you', `${req.user.name} assigned "${title}" to you`, 'task']
      );
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id/comments', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tc.*, u.name as user_name, u.avatar_color
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = $1
       ORDER BY tc.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  const { content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, content]
    );
    const mentions = content.match(/@(\w+)/g) || [];
    for (const mention of mentions) {
      const username = mention.slice(1);
      const mentioned = await pool.query(
        'SELECT id FROM users WHERE name ILIKE $1',
        [username]
      );
      if (mentioned.rows.length > 0 && mentioned.rows[0].id !== req.user.id) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [mentioned.rows[0].id, `${req.user.name} mentioned you`, `"${content}"`, 'mention']
        );
      }
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
