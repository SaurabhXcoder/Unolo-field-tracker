const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET assigned clients (EMPLOYEE)
 */
router.get('/clients', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT c.id, c.name, c.address
      FROM clients c
      JOIN employee_clients ec ON c.id = ec.client_id
      WHERE ec.employee_id = ?
      `,
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load clients' });
  }
});

/**
 * GET active check-in
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT ch.*, c.name AS client_name
      FROM checkins ch
      JOIN clients c ON ch.client_id = c.id
      WHERE ch.employee_id = ? AND ch.status = 'checked_in'
      LIMIT 1
      `,
      [req.user.id]
    );

    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load active check-in' });
  }
});

/**
 * CREATE check-in
 */
router.post('/', authenticateToken, async (req, res) => {
  const { client_id, latitude, longitude, notes } = req.body;

  if (!client_id || !latitude || !longitude) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const active = await db.query(
    `SELECT id FROM checkins WHERE employee_id = ? AND status = 'checked_in'`,
    [req.user.id]
  );

  if (active.rows.length > 0) {
    return res.status(400).json({ message: 'Already checked in' });
  }

  await db.query(
    `
    INSERT INTO checkins (employee_id, client_id, latitude, longitude, notes, status)
    VALUES (?, ?, ?, ?, ?, 'checked_in')
    `,
    [req.user.id, client_id, latitude, longitude, notes || null]
  );

  res.json({ success: true });
});

/**
 * CHECK OUT
 */
router.put('/checkout', authenticateToken, async (req, res) => {
  const result = await db.query(
    `
    SELECT id FROM checkins
    WHERE employee_id = ? AND status = 'checked_in'
    `,
    [req.user.id]
  );

  if (!result.rows.length) {
    return res.status(400).json({ message: 'No active check-in' });
  }

  await db.query(
    `
    UPDATE checkins
    SET status = 'checked_out', checkout_time = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [result.rows[0].id]
  );

  res.json({ success: true });
});

/**
 * GET HISTORY
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT ch.*, c.name AS client_name, c.address AS client_address
      FROM checkins ch
      JOIN clients c ON ch.client_id = c.id
      WHERE ch.employee_id = ?
      ORDER BY ch.checkin_time DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load history' });
  }
});

module.exports = router;
