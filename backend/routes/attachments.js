const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/task/:task_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ta.*, u.name as uploaded_by_name
       FROM task_attachments ta
       LEFT JOIN users u ON ta.uploaded_by = u.id
       WHERE ta.task_id = $1
       ORDER BY ta.created_at DESC`,
      [req.params.task_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/task/:task_id', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    const fileUrl = `https://kodo-production.up.railway.app/uploads/${req.file.filename}`;
    const result = await pool.query(
      `INSERT INTO task_attachments (task_id, filename, original_name, file_url, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.task_id, req.file.filename, req.file.originalname, fileUrl, req.file.size, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM task_attachments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;