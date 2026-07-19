const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/project/:project_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wp.*, u.name as created_by_name
       FROM wiki_pages wp
       LEFT JOIN users u ON wp.created_by = u.id
       WHERE wp.project_id = $1
       ORDER BY wp.created_at ASC`,
      [req.params.project_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM wiki_pages WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wh.*, u.name as updated_by_name
       FROM wiki_history wh
       LEFT JOIN users u ON wh.updated_by = u.id
       WHERE wh.page_id = $1
       ORDER BY wh.created_at DESC
       LIMIT 20`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { project_id, title, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO wiki_pages (project_id, title, content, created_by, updated_by) VALUES ($1, $2, $3, $4, $4) RETURNING *',
      [project_id, title, content, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { title, content } = req.body;
  try {
    const current = await pool.query(
      'SELECT * FROM wiki_pages WHERE id = $1',
      [req.params.id]
    );
    if (current.rows.length > 0) {
      await pool.query(
        'INSERT INTO wiki_history (page_id, title, content, updated_by) VALUES ($1, $2, $3, $4)',
        [req.params.id, current.rows[0].title, current.rows[0].content, req.user.id]
      );
    }
    const result = await pool.query(
      'UPDATE wiki_pages SET title=$1, content=$2, updated_by=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [title, content, req.user.id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM wiki_pages WHERE id = $1', [req.params.id]);
    res.json({ message: 'Page deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
