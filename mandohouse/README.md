# 🏫 Mando House — ระบบหลังบ้านสถาบันภาษาจีน

Web app เต็มรูปแบบ: Node.js + SQLite + Login แยก Admin / ผู้ปกครอง

---

## 🚀 วิธี Deploy บน Render.com (ฟรี ไม่ต้องจ่ายเงิน)

### ขั้นตอนที่ 1 — สมัคร GitHub
1. ไปที่ https://github.com และสมัครบัญชีฟรี (ถ้ายังไม่มี)
2. สร้าง Repository ใหม่ชื่อ `mandohouse` (กด **New** → กรอกชื่อ → **Create repository**)

### ขั้นตอนที่ 2 — อัปโหลดโค้ด
อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub โดย:

**วิธีง่ายที่สุด (ลาก-วาง):**
1. เปิด repository ที่สร้างไว้
2. กด **uploading an existing file**
3. ลากโฟลเดอร์ `mandohouse` ทั้งหมดเข้าไป
4. กด **Commit changes**

**หรือใช้ Git (ถ้ามี):**
```bash
cd mandohouse
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/mandohouse.git
git push -u origin main
```

### ขั้นตอนที่ 3 — Deploy บน Render.com
1. ไปที่ https://render.com และสมัครบัญชีฟรี
2. กด **New** → **Web Service**
3. เลือก **Connect a repository** → เชื่อมกับ GitHub → เลือก `mandohouse`
4. Render จะอ่าน `render.yaml` อัตโนมัติ
5. กด **Create Web Service**
6. รอ 2–3 นาที → ได้ URL เช่น `https://mandohouse.onrender.com`

**หมายเหตุ:** Render free tier จะ sleep หลังไม่ใช้งาน 15 นาที
ครั้งแรกที่เปิดอาจรอ 30 วินาที ถ้าต้องการเปิดตลอดใช้ plan Starter ($7/เดือน)

---

## 🔐 บัญชีเริ่มต้น

| บัญชี | Username | Password | สิทธิ์ |
|-------|----------|----------|--------|
| ผู้ดูแลหลัก | `admin` | `admin1234` | Admin เต็มรูปแบบ |
| ครูแนน | `admin2` | `admin5678` | Admin |
| ผู้ปกครองน้องมิน | `parent_min` | `parent1234` | ผู้ปกครอง |

⚠️ **เปลี่ยนรหัสผ่านทันทีหลัง deploy** ที่เมนู ตั้งค่า → เปลี่ยนรหัสผ่าน

---

## 📋 ฟีเจอร์ทั้งหมด

### Admin / ครู
- **ภาพรวม** — สถิติวันนี้ แจ้งเตือนใกล้หมดคอร์ส timeline บทเรียน
- **นักเรียน** — เพิ่ม/แก้ไข/ลบ ค้นหา กรอง ดูความคืบหน้า
- **เข้า-ออกเรียน** — บันทึกเวลา กรองตามวัน ประวัติทั้งหมด
- **รีวิวบทเรียน** — บันทึกหลังสอน แยกสาธารณะ/ภายใน ให้ดาว
- **คอร์ส & ราคา** — เพิ่ม/แก้ไข/ลบคอร์ส ตารางเปรียบเทียบ
- **แจ้งเตือน** — 3 ระดับ (วิกฤต/เร่งด่วน/เฝ้าระวัง) คัดลอกข้อความ LINE
- **บัญชีผู้ใช้** — เพิ่ม Admin และ Parent แยกต่างหาก
- **ตั้งค่า** — จัดการครู เปลี่ยนรหัสผ่าน

### ผู้ปกครอง
- ดูข้อมูลลูก ครั้งที่เรียน คงเหลือ อัตราเข้าเรียน
- ปฏิทินการเข้าเรียนรายเดือน
- อ่านรีวิวจากครู (เฉพาะส่วนสาธารณะ)
- ดูข้อมูลคอร์สและราคา

---

## 🛠 โครงสร้างโปรเจค

```
mandohouse/
├── src/
│   ├── server.js      — Express server
│   ├── db.js          — SQLite schema + seed data
│   ├── auth.js        — JWT authentication
│   └── routes.js      — REST API ทั้งหมด
├── public/
│   └── index.html     — Frontend (Single Page App)
├── data/              — SQLite database (auto-created)
├── package.json
├── render.yaml        — Deploy config สำหรับ Render.com
└── README.md
```

---

## 🔧 รันในเครื่องเอง (Local)

ต้องมี Node.js 18+ ติดตั้งแล้ว

```bash
cd mandohouse
npm install
npm start
# เปิด http://localhost:3000
```

---

## 💾 Backup ข้อมูล

ข้อมูลทั้งหมดอยู่ในไฟล์ `data/mandohouse.db`

**บน Render.com:** ไปที่ Dashboard → Service → Disks → Download
**Local:** คัดลอกไฟล์ `data/mandohouse.db` เก็บไว้ได้เลย

---

## ❓ ปัญหาที่พบบ่อย

**Q: เปิดหน้าเว็บแล้วรอนาน**
A: Render free tier จะ sleep เมื่อไม่มีคนใช้ รอ 30-60 วินาทีครั้งแรก

**Q: ข้อมูลหาย**
A: ตรวจสอบว่า Disk ใน render.yaml ถูกตั้งค่าแล้ว ถ้า deploy ใหม่โดยไม่มี Disk ข้อมูลจะหาย

**Q: ต้องการ custom domain**
A: ใน Render Dashboard → Settings → Custom Domains ใส่ domain ของตัวเองได้

**Q: ต้องการ LINE Notify จริงๆ**
A: แจ้งทีมพัฒนาเพื่อเพิ่ม LINE Notify API ได้
