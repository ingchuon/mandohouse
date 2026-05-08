// src/db.js  — SQLite schema + seed
const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'mandohouse.db'));

// ── WAL mode for reliability ──
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'admin',   -- admin | parent
  student_id TEXT,                             -- for parent accounts
  name       TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  level    TEXT,
  age      TEXT,
  lessons  INTEGER NOT NULL DEFAULT 20,
  price    INTEGER NOT NULL DEFAULT 0,
  desc     TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  nick       TEXT,
  age        INTEGER,
  dob        TEXT,
  course_id  TEXT REFERENCES courses(id),
  start_date TEXT,
  parent     TEXT,
  phone      TEXT,
  line_id    TEXT,
  note       TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teachers (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nick TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checkins (
  id         TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES teachers(id),
  date       TEXT NOT NULL,
  time_in    TEXT,
  time_out   TEXT,
  status     TEXT NOT NULL DEFAULT 'present',  -- present|absent|late|makeup
  note       TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT PRIMARY KEY,
  student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id   TEXT REFERENCES teachers(id),
  date         TEXT NOT NULL,
  topic        TEXT,
  rating       INTEGER DEFAULT 5,
  public_note  TEXT,
  private_note TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`);

// ── Seed default data if empty ──
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const seeded = db.prepare(`SELECT value FROM settings WHERE key='seeded'`).get();
if (!seeded) {
  const insert = db.transaction(() => {
    // Courses
    const courses = [
      { id:'c1', name:'Mandarin Kids',     level:'เริ่มต้น', age:'4–10 ปี',    lessons:20, price:8000,  desc:'สอนภาษาจีนกลางสำหรับเด็กเล็ก เน้นการฟัง-พูด ผ่านเพลงและเกม' },
      { id:'c2', name:'HSK Prep Level 1',  level:'พื้นฐาน', age:'8+ ปี',      lessons:20, price:9500,  desc:'เตรียมสอบ HSK ระดับ 1 คำศัพท์ 150 คำ ไวยากรณ์พื้นฐาน' },
      { id:'c3', name:'HSK Prep Level 2',  level:'กลาง',    age:'ผ่าน HSK 1', lessons:20, price:10500, desc:'เตรียมสอบ HSK ระดับ 2 คำศัพท์ 300 คำ การอ่านและเขียน' },
      { id:'c4', name:'Business Chinese',  level:'สูง',     age:'ผู้ใหญ่',    lessons:15, price:12000, desc:'ภาษาจีนเพื่อธุรกิจ Email, Meeting, Presentation' },
      { id:'c5', name:'Intensive Summer',  level:'เข้มข้น', age:'ทุกช่วงวัย', lessons:30, price:14000, desc:'คอร์สเข้มข้นช่วงปิดเทอม HSK 1-2 ภายใน 6 สัปดาห์' },
    ];
    const ic = db.prepare(`INSERT OR IGNORE INTO courses (id,name,level,age,lessons,price,desc) VALUES (?,?,?,?,?,?,?)`);
    courses.forEach(c => ic.run(c.id, c.name, c.level, c.age, c.lessons, c.price, c.desc));

    // Teachers
    const teachers = [
      { id:'t1', name:'แนน สอนดี',  nick:'ครูแนน' },
      { id:'t2', name:'นิล เก่งมาก', nick:'ครูนิล' },
      { id:'t3', name:'เจ มือโปร',   nick:'ครูเจ'  },
    ];
    const it = db.prepare(`INSERT OR IGNORE INTO teachers (id,name,nick) VALUES (?,?,?)`);
    teachers.forEach(t => it.run(t.id, t.name, t.nick));

    // Students
    const students = [
      { id:'s1', name:'มิน ขำสุด',  nick:'น้องมิน',  age:8,  course:'c1', start:offsetDate(-60), parent:'คุณแม่สุนี', phone:'089-111-2222', line:'@sunee' },
      { id:'s2', name:'สิริ นาค',   nick:'น้องสิริ', age:12, course:'c4', start:offsetDate(-45), parent:'คุณพ่อสม',   phone:'081-333-4444', line:'@som'   },
      { id:'s3', name:'ปลา ทอง',    nick:'น้องปลา',  age:9,  course:'c2', start:offsetDate(-30), parent:'คุณแม่ปุ้ย', phone:'090-555-6666', line:'@puay'  },
      { id:'s4', name:'บีม สว่าง',  nick:'น้องบีม',  age:14, course:'c4', start:offsetDate(-50), parent:'คุณพ่อบุญ', phone:'081-777-8888', line:'@boon'  },
      { id:'s5', name:'หมิง กลาง',  nick:'น้องหมิง', age:10, course:'c3', start:offsetDate(-40), parent:'คุณแม่เอ',  phone:'090-999-0000', line:'@ae'    },
    ];
    const is = db.prepare(`INSERT OR IGNORE INTO students (id,name,nick,age,course_id,start_date,parent,phone,line_id) VALUES (?,?,?,?,?,?,?,?,?)`);
    students.forEach(s => is.run(s.id, s.name, s.nick, s.age, s.course, s.start, s.parent, s.phone, s.line));

    // Check-ins
    const today = new Date().toISOString().slice(0, 10);
    const checkins = [
      { id:uid(), student:'s1', teacher:'t1', date:today,           time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s2', teacher:'t2', date:today,           time_in:'10:00', time_out:'',      status:'present', note:'' },
      { id:uid(), student:'s3', teacher:'t3', date:today,           time_in:'11:30', time_out:'13:00', status:'present', note:'' },
      { id:uid(), student:'s4', teacher:'t2', date:offsetDate(-3),  time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s5', teacher:'t1', date:offsetDate(-3),  time_in:'10:00', time_out:'11:30', status:'present', note:'' },
      { id:uid(), student:'s1', teacher:'t1', date:offsetDate(-7),  time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s2', teacher:'t2', date:offsetDate(-7),  time_in:'',      time_out:'',      status:'absent',  note:'ติดธุระ' },
      { id:uid(), student:'s3', teacher:'t3', date:offsetDate(-10), time_in:'11:30', time_out:'13:00', status:'present', note:'' },
      { id:uid(), student:'s4', teacher:'t2', date:offsetDate(-10), time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s5', teacher:'t1', date:offsetDate(-14), time_in:'10:00', time_out:'11:30', status:'present', note:'' },
      { id:uid(), student:'s1', teacher:'t1', date:offsetDate(-14), time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s1', teacher:'t1', date:offsetDate(-21), time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s2', teacher:'t2', date:offsetDate(-21), time_in:'10:00', time_out:'11:30', status:'present', note:'' },
      { id:uid(), student:'s1', teacher:'t1', date:offsetDate(-28), time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s4', teacher:'t2', date:offsetDate(-28), time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s5', teacher:'t1', date:offsetDate(-28), time_in:'10:00', time_out:'11:30', status:'present', note:'' },
      { id:uid(), student:'s1', teacher:'t1', date:offsetDate(-35), time_in:'09:00', time_out:'10:30', status:'present', note:'' },
      { id:uid(), student:'s2', teacher:'t2', date:offsetDate(-35), time_in:'10:00', time_out:'11:30', status:'present', note:'' },
    ];
    const ici = db.prepare(`INSERT OR IGNORE INTO checkins (id,student_id,teacher_id,date,time_in,time_out,status,note) VALUES (?,?,?,?,?,?,?,?)`);
    checkins.forEach(c => ici.run(c.id, c.student, c.teacher, c.date, c.time_in, c.time_out, c.status, c.note));

    // Reviews
    const reviews = [
      { id:uid(), student:'s1', teacher:'t1', date:today,          topic:'Tone Practice',  rating:5, pub:'น้องมินทำได้ดีมากวันนี้! ฝึก tone 1–4 อ่านประโยคง่ายได้ถูกต้อง 90% ควรทบทวน pinyin ตัว x, q, zh ที่บ้าน', priv:'' },
      { id:uid(), student:'s2', teacher:'t2', date:today,          topic:'Business Vocab', rating:5, pub:'เรียนรู้คำศัพท์ธุรกิจ 30 คำ ฝึกบทสนทนาการประชุม น้องสิริตั้งใจมากและออกเสียงได้ชัดเจน', priv:'ต้องฝึก tone เพิ่ม' },
      { id:uid(), student:'s1', teacher:'t1', date:offsetDate(-7), topic:'Greetings',      rating:4, pub:'บททักทายผ่านหมดแล้ว ครั้งหน้าเริ่ม Numbers 1-100 น้องมีความมั่นใจมากขึ้น', priv:'' },
    ];
    const ir = db.prepare(`INSERT OR IGNORE INTO reviews (id,student_id,teacher_id,date,topic,rating,public_note,private_note) VALUES (?,?,?,?,?,?,?,?)`);
    reviews.forEach(r => ir.run(r.id, r.student, r.teacher, r.date, r.topic, r.rating, r.pub, r.priv));

    // Default admin + parent accounts
    const hash = bcrypt.hashSync('admin1234', 10);
    const parentHash = bcrypt.hashSync('parent1234', 10);
    db.prepare(`INSERT OR IGNORE INTO users (id,username,password,role,name) VALUES (?,?,?,?,?)`).run(uid(),'admin', hash,       'admin','ผู้ดูแลระบบ');
    db.prepare(`INSERT OR IGNORE INTO users (id,username,password,role,name) VALUES (?,?,?,?,?)`).run(uid(),'admin2',bcrypt.hashSync('admin5678',10),'admin','ครูแนน');
    // parent account linked to student s1
    db.prepare(`INSERT OR IGNORE INTO users (id,username,password,role,student_id,name) VALUES (?,?,?,?,?,?)`).run(uid(),'parent_min', parentHash, 'parent','s1','คุณแม่สุนี');

    db.prepare(`INSERT OR REPLACE INTO settings (key,value) VALUES ('seeded','1')`).run();
  });
  insert();
  console.log('✅ Database seeded');
}

module.exports = db;
