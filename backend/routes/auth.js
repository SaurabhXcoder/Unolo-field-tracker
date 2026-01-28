const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const router = express.Router();

// Login 🐛 FIXED: Added await bcrypt.compare + removed password from JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = result.rows[0];
        
        if (!user || !await bcrypt.compare(password, user.password)) {  // 🐛 FIXED
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 🐛 FIXED: Don't include password in JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
