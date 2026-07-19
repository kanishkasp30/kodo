const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/project/:project_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as created_by_name
       FROM snippets s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.project_id = $1
       ORDER BY s.created_at DESC`,
      [req.params.project_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { project_id, title, language, code, description, tags } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO snippets (project_id, title, language, code, description, tags, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [project_id, title, language, code, description, tags || [], req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { title, language, code, description, tags } = req.body;
  try {
    const result = await pool.query(
      `UPDATE snippets SET title=$1, language=$2, code=$3, description=$4, tags=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [title, language, code, description, tags, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM snippets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
