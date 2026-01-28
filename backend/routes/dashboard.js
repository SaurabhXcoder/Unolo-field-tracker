const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Dashboard data 🐛 BUG #4: Fixed manager/employee logic
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'manager') {
            const result = await db.query(`
                SELECT 
                    u.id, u.name, 
                    COUNT(c.id) as total_checkins,
                    AVG(c.distance_from_client) as avg_distance,
                    MAX(c.checkin_time) as last_checkin
                FROM users u
                LEFT JOIN checkins c ON u.id = c.employee_id
                WHERE u.manager_id = ?
                GROUP BY u.id, u.name
            `, [req.user.id]);
            res.json({ success: true, data: result.rows });
        } else {
            const result = await db.query(`
                SELECT COUNT(*) as total_checkins, AVG(distance_from_client) as avg_distance
                FROM checkins WHERE employee_id = ?
            `, [req.user.id]);
            res.json({ success: true, data: result.rows[0] });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✨ FEATURE B: Daily Summary Report API
router.get('/reports/daily-summary', auth, async (req, res) => {
    try {
        if (req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Manager access only' });
        }

        const { date } = req.query;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) required' });
        }

        // Team summary
        const teamResult = await db.query(`
            SELECT 
                COUNT(DISTINCT c.employee_id) as active_employees,
                COUNT(*) as total_checkins,
                AVG(c.distance_from_client) as avg_distance
            FROM checkins c
            WHERE DATE(c.checkin_time) = ? AND c.employee_id IN (
                SELECT id FROM users WHERE manager_id = ?
            )
        `, [date, req.user.id]);

        // Per-employee breakdown
        const employeeResult = await db.query(`
            SELECT 
                u.id, u.name,
                COUNT(c.id) as checkins,
                COUNT(DISTINCT c.client_id) as clients_visited,
                SUM(
                    CASE 
                        WHEN c.checkout_time IS NOT NULL 
                        THEN (julianday(c.checkout_time) - julianday(c.checkin_time)) * 24 
                        ELSE 0 
                    END
                ) as total_hours
            FROM users u
            LEFT JOIN checkins c ON u.id = c.employee_id AND DATE(c.checkin_time) = ?
            WHERE u.manager_id = ?
            GROUP BY u.id, u.name
            ORDER BY checkins DESC
        `, [date, req.user.id]);

        res.json({
            success: true,
            date,
            team_summary: teamResult.rows[0],
            employees: employeeResult.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
