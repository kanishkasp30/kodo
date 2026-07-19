const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/workspace/:workspace_id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.name as user_name, u.avatar_color
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.workspace_id = $1
       ORDER BY al.created_at DESC
       LIMIT 50`,
      [req.params.workspace_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
