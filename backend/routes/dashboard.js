const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

/**
 * MANAGER DASHBOARD
 * GET /api/dashboard/stats
 */
router.get('/stats', authenticateToken, requireManager, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const teamMembers = await db.query(
            'SELECT id, name, email FROM users WHERE manager_id = ?',
            [req.user.id]
        );

        const todayCheckins = await db.query(`
            SELECT ch.*, u.name AS employee_name, c.name AS client_name
            FROM checkins ch
            JOIN users u ON ch.employee_id = u.id
            JOIN clients c ON ch.client_id = c.id
            WHERE u.manager_id = ? AND date(ch.checkin_time) = ?
            ORDER BY ch.checkin_time DESC
        `, [req.user.id, today]);

        const activeCount = await db.query(`
            SELECT COUNT(*) AS count
            FROM checkins ch
            JOIN users u ON ch.employee_id = u.id
            WHERE u.manager_id = ? AND ch.status = 'checked_in'
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                team_size: teamMembers.rows.length,
                team_members: teamMembers.rows,
                today_checkins: todayCheckins.rows,
                active_checkins: activeCount.rows[0].count
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to load manager dashboard' });
    }
});

/**
 * EMPLOYEE DASHBOARD
 * GET /api/dashboard/employee
 */
router.get('/employee', authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const todayCheckins = await db.query(`
            SELECT ch.*, c.name AS client_name
            FROM checkins ch
            JOIN clients c ON ch.client_id = c.id
            WHERE ch.employee_id = ? AND date(ch.checkin_time) = ?
            ORDER BY ch.checkin_time DESC
        `, [req.user.id, today]);

        const clients = await db.query(`
            SELECT c.*
            FROM clients c
            JOIN employee_clients ec ON c.id = ec.client_id
            WHERE ec.employee_id = ?
        `, [req.user.id]);

        const weekStats = await db.query(`
            SELECT 
                COUNT(*) AS total_checkins,
                COUNT(DISTINCT client_id) AS unique_clients
            FROM checkins
            WHERE employee_id = ?
              AND checkin_time >= datetime('now', '-7 days')
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                today_checkins: todayCheckins.rows,
                assigned_clients: clients.rows,
                week_stats: weekStats.rows[0]
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to load employee dashboard' });
    }
});

module.exports = router;
