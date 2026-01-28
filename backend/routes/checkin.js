const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const haversine = require('haversine-distance');
const router = express.Router();

// 🐛 BUG #3: Wrong column names + Feature A: Distance
router.post('/', auth, async (req, res) => {
    try {
        const { client_id, latitude, longitude, notes } = req.body;
        const user_id = req.user.id;

        if (!client_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Client ID, latitude, and longitude required' });
        }

        // Get client location
        const clientResult = await db.query(
            'SELECT latitude, longitude FROM clients WHERE id = ?', 
            [client_id]
        );
        
        if (clientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const clientLat = parseFloat(clientResult.rows[0].latitude);
        const clientLng = parseFloat(clientResult.rows[0].longitude);
        
        // Calculate distance (Haversine) ✨ FEATURE A
        const distance = haversine(
            { latitude, longitude },
            { latitude: clientLat, longitude: clientLng }
        ) / 1000; // km

        // 🐛 FIXED: Correct column names
        const result = await db.query(
            `INSERT INTO checkins (employee_id, client_id, latitude, longitude, distance_from_client, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, 'checked_in')`,
            [user_id, client_id, latitude.toString(), longitude.toString(), distance.toFixed(2), notes || null]
        );

        res.json({
            success: true,
            checkin: { id: result.lastID, distance_km: distance.toFixed(2) },
            warning: distance > 0.5 ? 'You are far from the client location' : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get clients (fixed employee assignment check)
router.get('/clients', auth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.* FROM clients c
            INNER JOIN employee_clients ec ON c.id = ec.client_id
            WHERE ec.employee_id = ?
        `, [req.user.id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/active', auth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ch.*, c.name as client_name 
            FROM checkins ch
            INNER JOIN clients c ON ch.client_id = c.id
            WHERE ch.employee_id = ? AND ch.status = 'checked_in'
            ORDER BY ch.checkin_time DESC LIMIT 1
        `, [req.user.id]);
        res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Line 45: SQLite doesn't support RETURNING in UPDATE
router.put('/checkout', auth, async (req, res) => {
    try {
        // 🐛 FIX: Separate SELECT + UPDATE
        const activeResult = await db.query(
            'SELECT id FROM checkins WHERE employee_id = ? AND status = "checked_in" ORDER BY checkin_time DESC LIMIT 1',
            [req.user.id]
        );
        
        if (activeResult.rows.length === 0) {
            return res.status(400).json({ error: 'No active check-in found' });
        }

        const updateResult = await db.query(
            'UPDATE checkins SET checkout_time = CURRENT_TIMESTAMP, status = "checked_out" WHERE id = ?',
            [activeResult.rows[0].id]
        );
        
        res.json({ success: true, message: 'Checked out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
