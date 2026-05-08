// src/auth.js
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db     = require('./db');

const SECRET = process.env.JWT_SECRET || 'mandohouse-super-secret-change-in-production-2024';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, student_id: user.student_id || null }, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

// Middleware: require any valid login
function requireAuth(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  req.user = payload;
  next();
}

// Middleware: require admin role
function requireAdmin(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  if (payload.role !== 'admin') return res.status(403).json({ error: 'สิทธิ์ไม่เพียงพอ' });
  req.user = payload;
  next();
}

async function login(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return null;
  return user;
}

module.exports = { signToken, verifyToken, requireAuth, requireAdmin, login };
