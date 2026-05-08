// src/routes.js  — REST API
const express      = require('express');
const bcrypt       = require('bcryptjs');
const router       = express.Router();
const db           = require('./db');
const { signToken, requireAuth, requireAdmin, login } = require('./auth');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ── AUTH ──────────────────────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'กรุณากรอก username และ password' });
  const user = await login(username, password);
  if (!user) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  const token = signToken(user);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ token, role: user.role, name: user.name, student_id: user.student_id });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/auth/me', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id,username,role,name,student_id FROM users WHERE id=?').get(req.user.id);
  res.json(u || {});
});

// Change password
router.put('/auth/password', requireAuth, (req, res) => {
  const { current, next: newPass } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password)) return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
  if (!newPass || newPass.length < 6) return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
  db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(newPass, 10), req.user.id);
  res.json({ ok: true });
});

// ── USERS (admin only) ─────────────────────────────────────────────────────
router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id,username,role,name,student_id,created_at FROM users ORDER BY created_at').all();
  res.json(users);
});

router.post('/users', requireAdmin, (req, res) => {
  const { username, password, role, name, student_id } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  if (password.length < 6) return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว' });
  try {
    db.prepare('INSERT INTO users (id,username,password,role,name,student_id) VALUES (?,?,?,?,?,?)').run(
      uid(), username, bcrypt.hashSync(password, 10), role, name || '', student_id || null
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'username นี้มีในระบบแล้ว' });
  }
});

router.delete('/users/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id=? AND username!=?').run(req.params.id, 'admin');
  res.json({ ok: true });
});

// ── TEACHERS ──────────────────────────────────────────────────────────────
router.get('/teachers', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM teachers ORDER BY created_at').all());
});

router.post('/teachers', requireAdmin, (req, res) => {
  const { name, nick } = req.body;
  if (!name || !nick) return res.status(400).json({ error: 'กรอกชื่อและชื่อเล่น' });
  const id = uid();
  db.prepare('INSERT INTO teachers (id,name,nick) VALUES (?,?,?)').run(id, name, nick);
  res.json({ id, name, nick });
});

router.delete('/teachers/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM teachers WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── COURSES ────────────────────────────────────────────────────────────────
router.get('/courses', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM courses ORDER BY created_at').all());
});

router.post('/courses', requireAdmin, (req, res) => {
  const { name, level, age, lessons, price, desc } = req.body;
  if (!name || !lessons || !price) return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  const id = uid();
  db.prepare('INSERT INTO courses (id,name,level,age,lessons,price,desc) VALUES (?,?,?,?,?,?,?)').run(id, name, level||'', age||'', +lessons, +price, desc||'');
  res.json(db.prepare('SELECT * FROM courses WHERE id=?').get(id));
});

router.put('/courses/:id', requireAdmin, (req, res) => {
  const { name, level, age, lessons, price, desc } = req.body;
  db.prepare('UPDATE courses SET name=?,level=?,age=?,lessons=?,price=?,desc=? WHERE id=?').run(name, level||'', age||'', +lessons, +price, desc||'', req.params.id);
  res.json(db.prepare('SELECT * FROM courses WHERE id=?').get(req.params.id));
});

router.delete('/courses/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM courses WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── STUDENTS ───────────────────────────────────────────────────────────────
function getStudentWithStats(studentId) {
  const s = db.prepare('SELECT s.*, c.name as course_name, c.lessons as course_lessons, c.price as course_price FROM students s LEFT JOIN courses c ON s.course_id=c.id WHERE s.id=?').get(studentId);
  if (!s) return null;
  const done = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE student_id=? AND status='present'`).get(studentId).n;
  s.lessons_done = done;
  s.lessons_left = Math.max(0, (s.course_lessons || 0) - done);
  return s;
}

router.get('/students', requireAuth, (req, res) => {
  const { role, student_id } = req.user;
  let rows;
  if (role === 'parent') {
    rows = student_id ? [db.prepare('SELECT s.*, c.name as course_name, c.lessons as course_lessons FROM students s LEFT JOIN courses c ON s.course_id=c.id WHERE s.id=?').get(student_id)].filter(Boolean) : [];
  } else {
    rows = db.prepare('SELECT s.*, c.name as course_name, c.lessons as course_lessons, c.price as course_price FROM students s LEFT JOIN courses c ON s.course_id=c.id ORDER BY s.created_at').all();
  }
  // attach lesson count
  const stmt = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE student_id=? AND status='present'`);
  rows = rows.map(s => {
    const done = stmt.get(s.id).n;
    return { ...s, lessons_done: done, lessons_left: Math.max(0, (s.course_lessons || 0) - done) };
  });
  res.json(rows);
});

router.get('/students/:id', requireAuth, (req, res) => {
  const { role, student_id } = req.user;
  if (role === 'parent' && student_id !== req.params.id) return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
  const s = getStudentWithStats(req.params.id);
  if (!s) return res.status(404).json({ error: 'ไม่พบนักเรียน' });
  res.json(s);
});

router.post('/students', requireAdmin, (req, res) => {
  const { name, nick, age, dob, course_id, start_date, parent, phone, line_id, note } = req.body;
  if (!name || !nick || !parent || !phone || !course_id || !start_date) return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  const id = uid();
  db.prepare('INSERT INTO students (id,name,nick,age,dob,course_id,start_date,parent,phone,line_id,note) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id, name, nick, age||null, dob||null, course_id, start_date, parent, phone, line_id||'', note||'');
  res.json(getStudentWithStats(id));
});

router.put('/students/:id', requireAdmin, (req, res) => {
  const { name, nick, age, dob, course_id, start_date, parent, phone, line_id, note } = req.body;
  db.prepare('UPDATE students SET name=?,nick=?,age=?,dob=?,course_id=?,start_date=?,parent=?,phone=?,line_id=?,note=? WHERE id=?').run(name, nick, age||null, dob||null, course_id, start_date, parent, phone, line_id||'', note||'', req.params.id);
  res.json(getStudentWithStats(req.params.id));
});

router.delete('/students/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── CHECK-INS ──────────────────────────────────────────────────────────────
router.get('/checkins', requireAuth, (req, res) => {
  const { student_id: filterStudent, date } = req.query;
  const { role, student_id: userStudent } = req.user;

  let q = `SELECT ci.*, s.name as student_name, s.nick as student_nick, t.nick as teacher_nick
           FROM checkins ci
           LEFT JOIN students s ON ci.student_id=s.id
           LEFT JOIN teachers t ON ci.teacher_id=t.id`;
  const params = [];
  const where = [];

  if (role === 'parent') { where.push('ci.student_id=?'); params.push(userStudent); }
  else if (filterStudent) { where.push('ci.student_id=?'); params.push(filterStudent); }
  if (date) { where.push('ci.date=?'); params.push(date); }

  if (where.length) q += ' WHERE ' + where.join(' AND ');
  q += ' ORDER BY ci.date DESC, ci.created_at DESC';

  res.json(db.prepare(q).all(...params));
});

router.post('/checkins', requireAdmin, (req, res) => {
  const { student_id, teacher_id, date, time_in, time_out, status, note } = req.body;
  if (!student_id || !date || !status) return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  const id = uid();
  db.prepare('INSERT INTO checkins (id,student_id,teacher_id,date,time_in,time_out,status,note) VALUES (?,?,?,?,?,?,?,?)').run(id, student_id, teacher_id||null, date, time_in||'', time_out||'', status, note||'');
  res.json({ id, ok: true });
});

router.delete('/checkins/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM checkins WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── REVIEWS ────────────────────────────────────────────────────────────────
router.get('/reviews', requireAuth, (req, res) => {
  const { student_id: filterStudent } = req.query;
  const { role, student_id: userStudent } = req.user;

  let q = `SELECT r.*, s.nick as student_nick, t.nick as teacher_nick
           FROM reviews r
           LEFT JOIN students s ON r.student_id=s.id
           LEFT JOIN teachers t ON r.teacher_id=t.id`;
  const where = [];
  const params = [];

  if (role === 'parent') {
    where.push('r.student_id=?'); params.push(userStudent);
    // parent can only see public_note (filter in app, but also exclude private here)
  } else if (filterStudent) {
    where.push('r.student_id=?'); params.push(filterStudent);
  }

  if (where.length) q += ' WHERE ' + where.join(' AND ');
  q += ' ORDER BY r.date DESC, r.created_at DESC';

  let rows = db.prepare(q).all(...params);
  // strip private notes for parent
  if (role === 'parent') rows = rows.map(r => ({ ...r, private_note: '' }));
  res.json(rows);
});

router.post('/reviews', requireAdmin, (req, res) => {
  const { student_id, teacher_id, date, topic, rating, public_note, private_note } = req.body;
  if (!student_id || !date || !topic || !rating || !public_note) return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  const id = uid();
  db.prepare('INSERT INTO reviews (id,student_id,teacher_id,date,topic,rating,public_note,private_note) VALUES (?,?,?,?,?,?,?,?)').run(id, student_id, teacher_id||null, date, topic, +rating, public_note, private_note||'');
  res.json({ id, ok: true });
});

router.delete('/reviews/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ── DASHBOARD SUMMARY ──────────────────────────────────────────────────────
router.get('/dashboard', requireAdmin, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const totalStudents  = db.prepare('SELECT COUNT(*) as n FROM students').get().n;
  const todayPresent   = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE date=? AND status='present'`).get(today).n;
  const todayRecords   = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE date=?`).get(today).n;
  const totalTeachers  = db.prepare('SELECT COUNT(*) as n FROM teachers').get().n;
  const totalCourses   = db.prepare('SELECT COUNT(*) as n FROM courses').get().n;

  // near-end students
  const students = db.prepare('SELECT s.*, c.lessons as course_lessons FROM students s LEFT JOIN courses c ON s.course_id=c.id').all();
  const stmt     = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE student_id=? AND status='present'`);
  let critCount  = 0;
  students.forEach(s => {
    const done = stmt.get(s.id).n;
    const left = Math.max(0, (s.course_lessons || 0) - done);
    if (left <= 5) critCount++;
  });

  res.json({ totalStudents, todayPresent, todayRecords, totalTeachers, totalCourses, critCount, today });
});

// ── ALERTS ────────────────────────────────────────────────────────────────
router.get('/alerts', requireAdmin, (req, res) => {
  const students = db.prepare('SELECT s.*, c.name as course_name, c.lessons as course_lessons FROM students s LEFT JOIN courses c ON s.course_id=c.id').all();
  const stmt = db.prepare(`SELECT COUNT(*) as n FROM checkins WHERE student_id=? AND status='present'`);
  const result = students.map(s => {
    const done = stmt.get(s.id).n;
    const left = Math.max(0, (s.course_lessons || 0) - done);
    return { ...s, lessons_done: done, lessons_left: left };
  }).filter(s => s.lessons_left <= 10).sort((a, b) => a.lessons_left - b.lessons_left);
  res.json(result);
});

module.exports = router;
