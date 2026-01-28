const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
        const result = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
        
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid token' });
        req.user = result.rows[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
