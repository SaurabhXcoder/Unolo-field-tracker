const jwt = require("jsonwebtoken");
const db = require("../config/database");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token missing" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET, // ❗ SAME SECRET
    );

    const result = await db.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [decoded.id],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireManager = (req, res, next) => {
  if (req.user.role !== "manager") {
    return res.status(403).json({ message: "Manager access required" });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireManager,
};
