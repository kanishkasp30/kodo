const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.post('/', auth, async (req, res) => {
  const { name } = req.body;
  try {
    const invite_code = uuidv4().slice(0, 8).toUpperCase();
    const result = await pool.query(
      'INSERT INTO workspaces (name, owner_id, invite_code) VALUES ($1, $2, $3) RETURNING *',
      [name, req.user.id, invite_code]
    );
    const workspace = result.rows[0];
    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspace.id, req.user.id, 'owner']
    );
    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, wm.role as member_role,
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count,
        (SELECT COUNT(*) FROM projects WHERE workspace_id = w.id) as project_count
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*,
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count
       FROM workspaces w WHERE w.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/join', auth, async (req, res) => {
  const { invite_code } = req.body;
  try {
    const workspace = await pool.query(
      'SELECT * FROM workspaces WHERE invite_code = $1',
      [invite_code]
    );
    if (workspace.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }
    const ws = workspace.rows[0];
    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [ws.id, req.user.id, 'member']
    );
    res.json(ws);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id/members', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_color, wm.role, wm.joined_at
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.post('/:id/leave', auth, async (req, res) => {
  const workspaceId = req.params.id;
  try {
    const memberCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: 'You are not a member of this workspace' });
    }

    const member = memberCheck.rows[0];
    const memberCountResult = await pool.query(
      'SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1',
      [workspaceId]
    );
    const memberCount = parseInt(memberCountResult.rows[0].count);

    if (member.role === 'owner') {
      if (memberCount === 1) {
        // Owner is the only member - delete the whole workspace
        await pool.query('DELETE FROM workspaces WHERE id = $1', [workspaceId]);
        return res.json({ message: 'Workspace deleted since you were the only member', deleted: true });
      } else {
        return res.status(400).json({
          message: 'You must transfer ownership to another member before leaving',
          needsTransfer: true,
        });
      }
    }

    // Regular member leaving
    await pool.query(
      'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, req.user.id]
    );

    res.json({ message: 'You have left the workspace', deleted: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/transfer-ownership', auth, async (req, res) => {
  const workspaceId = req.params.id;
  const { newOwnerId } = req.body;
  try {
    const workspace = await pool.query('SELECT * FROM workspaces WHERE id = $1', [workspaceId]);
    if (workspace.rows.length === 0) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    if (workspace.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the current owner can transfer ownership' });
    }

    const newOwnerCheck = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, newOwnerId]
    );
    if (newOwnerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'New owner must be a member of this workspace' });
    }

    await pool.query('UPDATE workspaces SET owner_id = $1 WHERE id = $2', [newOwnerId, workspaceId]);
    await pool.query(
      "UPDATE workspace_members SET role = 'owner' WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, newOwnerId]
    );
    await pool.query(
      "UPDATE workspace_members SET role = 'member' WHERE workspace_id = $1 AND user_id = $2",
      [workspaceId, req.user.id]
    );

    res.json({ message: 'Ownership transferred successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;