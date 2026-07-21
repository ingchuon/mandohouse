// src/app/guide/page.tsx
'use client'
import { useState } from 'react'

const C = {
  bg: '#F5F0E8',
  dark: '#1C3A2A',
  gold: '#E8A020',
  border: '#E2D9CC',
  text: '#2C2C2C',
  textMid: '#6B6B6B',
}

const STORAGE = 'https://bebfmbijwezoyhoedgtt.supabase.co/storage/v1/object/public/tutorcloud-assets/guide'

const chapters = [
  {
    id: 'dashboard', icon: '📊', title: 'Dashboard', image: `${STORAGE}/dashboard.png`,
    sections: [
      { title: 'ภาพรวม Dashboard', content: `Dashboard คือหน้าแรกที่แสดงภาพรวมของสถาบันทั้งหมดในหน้าเดียว ประกอบด้วย:\n\n• **การ์ดการเงิน 4 ใบ** — รายรับเดือนนี้, รายจ่ายเดือนนี้, กำไรเดือนนี้, เงินคงเหลือ\n• **ปฏิทิน** — แสดงวันปัจจุบันและสรุปยอดรายได้ของเดือน\n• **กราฟแท่ง 6 เดือน** — เปรียบเทียบรายรับและรายจ่ายย้อนหลัง 6 เดือน\n• **กราฟวงกลมรายได้ตามวิชา** — สัดส่วนรายได้แต่ละวิชา\n• **เช็คอินวันนี้** — รายชื่อนักเรียนที่เช็คอินวันนี้\n• **ตารางเรียนวันนี้** — ดึงข้อมูลจาก Google Calendar\n• **ใกล้หมดคอร์ส** — นักเรียนที่เหลือคลาสน้อย ควรต่อคอร์ส\n• **รอซื้อคอร์สใหม่** — นักเรียนที่หมดคอร์สแล้วยังไม่ซื้อใหม่` },
      { title: 'เคล็ดลับ', content: `• กด **Refresh** หน้าทำให้ข้อมูลอัปเดต Dashboard ดึงข้อมูล real-time จาก Supabase\n• ตารางเรียนวันนี้ต้องเชื่อมต่อ Google Calendar ก่อน ไปที่ ตารางสอน → เชื่อมต่อบัญชี` },
    ],
  },
  {
    id: 'students', icon: '👨‍🎓', title: 'ข้อมูลนักเรียน', image: `${STORAGE}/students.png`,
    sections: [
      { title: 'การดูข้อมูลนักเรียน', content: `หน้านี้แสดงรายชื่อนักเรียนทั้งหมดในสถาบัน สามารถกรองได้ 3 สถานะ:\n\n• **Active** — นักเรียนที่กำลังเรียนอยู่\n• **Inactive** — นักเรียนที่หยุดเรียนแล้ว\n• **ทั้งหมด** — แสดงทุกคน\n\nข้อมูลที่แสดงในตาราง: ชื่อนักเรียน, โรงเรียน, คอร์สปัจจุบัน, ครูผู้สอน, ความคืบหน้า, เบอร์โทร, สถานะ` },
      { title: 'เพิ่มนักเรียนใหม่', content: `1. กดปุ่ม **+ เพิ่มนักเรียน** มุมขวาบน\n2. กรอกข้อมูล: ชื่อ-นามสกุล, ชื่อเล่น, เบอร์โทร, ผู้ปกครอง, โรงเรียน\n3. เลือกคอร์สและครูผู้สอน\n4. กด **บันทึก**` },
      { title: 'Import/Export Excel', content: `**Export** — กดปุ่ม Export Excel เพื่อดาวน์โหลดรายชื่อนักเรียนทั้งหมด\n\n**Import** — นำเข้านักเรียนจำนวนมากพร้อมกัน:\n1. ไปที่ **Download file** → โหลด Template นักเรียน\n2. กรอกข้อมูลตาม column: full_name, nickname, parent_name, parent_phone, enrolled_at\n3. กลับมาที่ **Download file** → นำเข้ารายชื่อนักเรียน → เลือกไฟล์ .xlsx` },
    ],
  },
  {
    id: 'checkin', icon: '✅', title: 'เช็คอิน / เช็คเอาท์', image: `${STORAGE}/checkin.png`,
    sections: [
      { title: 'การเช็คอินนักเรียน', content: `หน้าเช็คอินใช้บันทึกการเข้าเรียนของนักเรียนแต่ละครั้ง:\n\n1. พิมพ์ชื่อหรือชื่อเล่นในช่องค้นหา\n2. เลือกนักเรียนจาก dropdown\n3. กด **เช็คอิน**\n4. ระบบจะบันทึกเวลาและนับคลาสอัตโนมัติ` },
      { title: 'บันทึกย้อนหลัง', content: `กรณีลืมเช็คอินวันก่อน:\n1. เปิด Toggle **บันทึกย้อนหลัง**\n2. เลือกวันที่และเวลาที่ต้องการ\n3. กด **เช็คอิน**\n\n⚠️ ระบบจะคำนวณลำดับคลาสใหม่อัตโนมัติเมื่อมีการบันทึกย้อนหลัง` },
      { title: 'รายชื่อวันนี้และสรุปรายคน', content: `ฝั่งขวาของหน้าแสดง 2 แท็บ:\n\n• **รายชื่อวันนี้** — ใครเช็คอินแล้วบ้างวันนี้ พร้อมเวลา\n• **สรุปรายคน** — เลือกช่วงวันเพื่อดูสรุปการเข้าเรียนแต่ละคน` },
    ],
  },
  {
    id: 'hours', icon: '⏱️', title: 'ชั่วโมงสอน', image: `${STORAGE}/hours.png`,
    sections: [
      { title: 'รายงานชั่วโมงสอน', content: `หน้านี้สรุปชั่วโมงการสอนของครูแต่ละคน สามารถดูได้ 2 โหมด:\n\n• **รายเดือน** — สรุปชั่วโมงรวมของเดือนที่เลือก\n• **เลือกวัน** — ดูชั่วโมงสอนในช่วงวันที่กำหนด\n\nกรองตามครูได้จาก dropdown และ Export เป็น Excel (.xlsx) ได้` },
    ],
  },
  {
    id: 'teachers', icon: '👩‍🏫', title: 'ครูผู้สอน', image: `${STORAGE}/teachers.png`,
    sections: [
      { title: 'จัดการครูผู้สอน', content: `หน้านี้แสดงรายชื่อครูทั้งหมดในสถาบัน:\n\n• **เพิ่มครูใหม่** — กดปุ่ม + เพิ่มครู กรอกชื่อ, วิชาที่สอน, ตั้ง PIN\n• **แก้ไขข้อมูล** — คลิกที่ชื่อครูเพื่อแก้ไข\n• **PIN** — ใช้สำหรับครูกรอกข้อมูลในหน้า /teach\n\nสถานะครู: ใช้งานอยู่ / ปิดใช้งาน / ทั้งหมด` },
      { title: 'หน้าครูกรอกข้อมูล (/teach)', content: `ครูสามารถกรอกข้อมูลส่วนตัวได้ที่ /teach:\n• บันทึกชั่วโมงสอน\n• ดูตารางนักเรียน\n• ใส่ PIN เพื่อ authenticate` },
    ],
  },
  {
    id: 'schedule', icon: '📅', title: 'ตารางสอน', image: `${STORAGE}/schedule.png`,
    sections: [
      { title: 'ตารางสอนจาก Google Calendar', content: `หน้าตารางสอนดึงข้อมูล event จาก Google Calendar ของครูทุกคนมาแสดงในปฏิทิน\n\nดูได้ 3 โหมด: **วัน / สัปดาห์ / เดือน**\n\nสีของ event แยกตามครู — แต่ละ account Google Calendar จะแสดงสีต่างกัน ทำให้รู้ว่า event นั้นเป็นของครูคนไหน` },
      { title: 'เชื่อมต่อ Google Calendar', content: `ครั้งแรกต้องเชื่อมต่อบัญชี Google:\n1. กดลิ้งก์ **เชื่อมต่อบัญชี** ใต้ชื่อวันที่\n2. เลือก account ที่ต้องการ\n3. กด Allow เพื่อให้สิทธิ์อ่านปฏิทิน\n4. ทำซ้ำสำหรับแต่ละ account ครู` },
    ],
  },
  {
    id: 'courses', icon: '📚', title: 'คอร์สและราคา', image: `${STORAGE}/courses.png`,
    sections: [
      { title: 'จัดการคอร์ส', content: `หน้านี้แบ่งเป็น 2 แท็บ:\n\n**คอร์สเรียน** — เพิ่ม/แก้ไขคอร์สเรียน เช่น ภาษาจีน, คณิตศาสตร์, ภาษาอังกฤษ พร้อมจำนวนครั้งและราคา\n\n**หนังสือและอื่นๆ** — จัดการรายการหนังสือ อุปกรณ์ และค่าอื่นๆ ที่จำหน่ายในสถาบัน` },
      { title: 'เพิ่มคอร์สใหม่', content: `1. กด **+ เพิ่มคอร์ส**\n2. กรอกชื่อคอร์ส, วิชา, จำนวนครั้ง, ราคา\n3. เลือกประเภท: คอร์สปกติ / Special\n4. กด **บันทึก**\n\n⚠️ คอร์ส Special จะไม่นับจำนวนครั้งและไม่มีการ block ซ้ำ` },
    ],
  },
  {
    id: 'receipts', icon: '💰', title: 'รายรับ (ใบเสร็จ)', image: `${STORAGE}/receipts.png`,
    sections: [
      { title: 'ออกใบเสร็จ', content: `หน้ารายรับใช้ออกใบเสร็จรับเงินเมื่อนักเรียนชำระค่าเรียน:\n\n1. กด **+ ออกใบเสร็จ**\n2. เลือกนักเรียน\n3. เลือกคอร์สหรือรายการ\n4. ระบุจำนวนเงินและวิธีชำระ (เงินสด / โอน)\n5. กด **บันทึก**\n\nระบบจะออกเลขใบเสร็จอัตโนมัติและบันทึกลงรายรับ` },
      { title: 'ดาวน์โหลดใบเสร็จ PDF', content: `คลิกที่ใบเสร็จที่ต้องการ → กด **ดาวน์โหลด PDF** ใบเสร็จรองรับภาษาไทยด้วยฟอนต์ Sarabun` },
      { title: 'Import รายรับจาก Excel', content: `1. ไปที่ Download file → โหลด Template รายรับ\n2. กรอก: Date, Name, Subject, Amount, ค่าหนังสือ, Teacher, Payment, Remark\n3. Import ไฟล์ที่หน้า Download file` },
    ],
  },
  {
    id: 'expenses', icon: '💸', title: 'รายจ่าย', image: `${STORAGE}/expenses.png`,
    sections: [
      { title: 'บันทึกรายจ่าย', content: `หน้ารายจ่ายติดตามค่าใช้จ่ายและทำโปรขาดทุน:\n\n1. กด **+ บันทึกรายจ่าย**\n2. เลือกหมวดหมู่ (เงินเดือน, ค่าเช่า, อุปกรณ์ ฯลฯ)\n3. กรอกจำนวนเงินและรายละเอียด\n4. กด **บันทึก**\n\nกราฟรายรับ-รายจ่าย 6 เดือนจะอัปเดตอัตโนมัติ` },
    ],
  },
  {
    id: 'finance', icon: '📈', title: 'Finance', image: `${STORAGE}/finance.png`,
    sections: [
      { title: 'ภาพรวมการเงิน', content: `หน้า Finance รวมข้อมูลการเงินทั้งหมดในที่เดียว:\n\n• **การ์ด 4 ใบ** — รายรับ, รายจ่าย, กำไร, รายได้ทั้งหมดในระบบ\n• **รายรับค่าคอร์ส** — ยอดจากใบเสร็จ\n• **รายรับขายหนังสือ** — ยอดขายหนังสือและอุปกรณ์\n• **ยอดยกนาเดือนนี้** — ยอดคงเหลือยกมา\n\nดูแยกตามแท็บ: **สรุป / รายรับ / รายจ่าย / ตั้งค่า**` },
      { title: 'ตั้งค่ายอดยกนา', content: `แท็บ **ตั้งค่า** ใช้ตั้งยอดยกนาเดือนแรกของระบบ เพื่อให้ยอดคงเหลือถูกต้องตั้งแต่ต้น` },
    ],
  },
  {
    id: 'download', icon: '📥', title: 'Download file', image: `${STORAGE}/download.png`,
    sections: [
      { title: 'Export ข้อมูล', content: `ดาวน์โหลดข้อมูลเป็น Excel ได้ 5 รายการ:\n\n• **รายรับ** — ใบเสร็จ วันที่ ชื่อนักเรียน คอร์ส ยอด\n• **รายจ่าย** — รายการหมวดหมู่ วันที่ ยอด\n• **รายชื่อนักเรียน** — ชื่อ ชื่อเล่น ผู้ปกครอง เบอร์ คอร์ส\n• **เช็คอิน** — นักเรียน คอร์ส วันที่ เวลา ครู\n• **รายรับ-รายจ่าย** — สรุปการเงินรวม 2 sheet` },
      { title: 'Template สำหรับ Import', content: `โหลด Template เปล่าเพื่อกรอกข้อมูลแล้ว Import เข้าระบบ:\n\n• **Template รายรับ** — Date, Name, Subject, Amount, ค่าหนังสือ, Teacher, Payment, Remark\n• **Template รายจ่าย** — Date, List, price, teacher, Remark\n• **Template นักเรียน** — full_name, nickname, parent_name, parent_phone, enrolled_at\n\n⚠️ โหลด Template ก่อนเสมอ เพื่อให้ format ถูกต้อง` },
      { title: 'Import ข้อมูล', content: `นำเข้าข้อมูลจำนวนมากพร้อมกัน:\n1. โหลด Template และกรอกข้อมูล\n2. เลือกประเภท Import ที่ต้องการ\n3. กด **เลือกไฟล์ .xlsx**\n4. ระบบจะตรวจสอบและนำเข้าอัตโนมัติ\n\nรองรับไฟล์ .xlsx และ .xls เท่านั้น` },
    ],
  },
  {
    id: 'team', icon: '👥', title: 'จัดการทีม', image: `${STORAGE}/team.png`,
    sections: [
      { title: 'เพิ่มสมาชิกทีม', content: `หน้าจัดการทีมใช้เพิ่มผู้ใช้งานในระบบ:\n\n1. กด **+ เพิ่มเจ้าหน้าที่**\n2. กรอกอีเมลและกำหนดสิทธิ์\n3. สมาชิกจะได้รับอีเมลเชิญ\n\nสมาชิกทุกคนมีสิทธิ์เท่ากัน — เช็คอิน, บันทึกนักเรียน, เขียนรีวิว, ออกใบเสร็จ, แจ้งเดือน ได้ทุกอย่าง` },
      { title: 'จำนวนสมาชิกตาม Plan', content: `จำนวนสมาชิกที่เพิ่มได้ขึ้นอยู่กับ subscription:\n\n• **Starter** — สูงสุด 5 คน\n• **Growth** — สูงสุด 20 คน\n• **Pro** — ไม่จำกัด` },
    ],
  },
]

export default function GuidePage() {
  const [activeChapter, setActiveChapter] = useState('dashboard')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentChapter = chapters.find((c) => c.id === activeChapter)!
  const currentIndex = chapters.findIndex((c) => c.id === activeChapter)

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectChapter = (id: string) => {
    setActiveChapter(id)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('•')) {
        const parts = line.slice(1).trim().split(/\*\*(.*?)\*\*/g)
        return (
          <div key={i} className="flex gap-2 mb-1">
            <span style={{ color: C.gold, flexShrink: 0 }}>•</span>
            <span>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</span>
          </div>
        )
      }
      if (/^\d+\./.test(line)) {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return <div key={i} className="mb-1 pl-1">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</div>
      }
      if (line.startsWith('⚠️') || line.startsWith('👉')) {
        return (
          <div key={i} className="mt-3 mb-1 p-3 rounded-lg text-sm"
            style={{ background: '#FEF9EC', border: `1px solid ${C.gold}`, color: '#8B6914' }}>
            {line}
          </div>
        )
      }
      if (line === '') return <div key={i} className="h-2" />
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return <div key={i} className="mb-1">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</div>
    })
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Sarabun, sans-serif', color: C.text }}>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out' }}>
          <img src={lightbox} alt="preview" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12 }} />
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.dark, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/" style={{ color: C.gold, fontWeight: 700, fontSize: 18 }}>
              Tutor<span style={{ color: 'white' }}>cloud</span>
            </a>
            <span style={{ color: '#4a7a5a', fontSize: 12 }}>› คู่มือ</span>
          </div>
          <a href="/staff/dashboard"
            style={{ background: C.gold, color: 'white', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            เข้าสู่ระบบ →
          </a>
        </div>

        {/* Mobile chapter selector */}
        <div style={{ borderTop: '1px solid #2a4a38', padding: '0 16px' }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', fontSize: 14
            }}>
            <span>{currentChapter.icon} {currentChapter.title}</span>
            <span style={{ color: C.gold }}>{mobileMenuOpen ? '▲' : '▼'} เลือกหัวข้อ</span>
          </button>
          {mobileMenuOpen && (
            <div style={{ background: '#0f2a1a', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
              {chapters.map((ch) => (
                <button key={ch.id} onClick={() => selectChapter(ch.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: activeChapter === ch.id ? '#1C3A2A' : 'transparent',
                    borderLeft: activeChapter === ch.id ? `3px solid ${C.gold}` : '3px solid transparent',
                    color: activeChapter === ch.id ? C.gold : '#aaa',
                    fontSize: 14, cursor: 'pointer', border: 'none',
                  }}>
                  <span>{ch.icon}</span><span>{ch.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex' }}>

        {/* Sidebar desktop only */}
        <div style={{
          width: 240, flexShrink: 0, borderRight: `1px solid ${C.border}`,
          background: 'white', position: 'sticky', top: 0, height: '100vh',
          overflowY: 'auto', display: 'none'
        }} className="md-sidebar">
          <style>{`@media (min-width: 768px) { .md-sidebar { display: block !important; } }`}</style>
          <div style={{ padding: '16px 16px 8px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMid, fontWeight: 600, letterSpacing: 1 }}>คู่มือการใช้งาน</div>
            <div style={{ fontSize: 12, color: C.textMid }}>TutorCloud — Admin</div>
          </div>
          <nav style={{ padding: '8px 0' }}>
            {chapters.map((ch) => (
              <button key={ch.id} onClick={() => selectChapter(ch.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: activeChapter === ch.id ? '#F0F9F4' : 'transparent',
                  borderLeft: activeChapter === ch.id ? `3px solid ${C.gold}` : '3px solid transparent',
                  color: activeChapter === ch.id ? C.dark : C.textMid,
                  fontWeight: activeChapter === ch.id ? 600 : 400,
                  fontSize: 13, cursor: 'pointer', border: 'none',
                }}>
                <span>{ch.icon}</span><span>{ch.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px 16px', maxWidth: '100%', boxSizing: 'border-box' }}
          className="guide-main">
          <style>{`@media (min-width: 768px) { .guide-main { padding: 40px 48px !important; } }`}</style>

          {/* Chapter header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{currentChapter.icon}</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, margin: 0 }}>{currentChapter.title}</h1>
            <div style={{ width: 40, height: 3, background: C.gold, borderRadius: 2, marginTop: 6 }} />
          </div>

          {/* Chapter image */}
          {currentChapter.image && (
            <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`, cursor: 'zoom-in' }}
              onClick={() => setLightbox(currentChapter.image)}>
              <img src={currentChapter.image} alt={currentChapter.title}
                style={{ width: '100%', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div style={{ padding: '6px 12px', background: '#f8f6f2', fontSize: 11, color: C.textMid }}>
                🔍 คลิกเพื่อขยายภาพ
              </div>
            </div>
          )}

          {/* Sections */}
          {currentChapter.sections.map((section, si) => {
            const key = `${activeChapter}-${si}`
            const isOpen = openSections[key] !== false
            return (
              <div key={si} style={{
                background: 'white', borderRadius: 10, marginBottom: 12,
                border: `1px solid ${C.border}`, overflow: 'hidden',
              }}>
                <button onClick={() => toggleSection(key)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                  }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: C.dark }}>{section.title}</span>
                  <span style={{ color: C.textMid, fontSize: 16, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', fontSize: 14, lineHeight: 1.8, color: C.text, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ paddingTop: 12 }}>{renderContent(section.content)}</div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}`, gap: 12 }}>
            {currentIndex > 0 ? (
              <button onClick={() => selectChapter(chapters[currentIndex - 1].id)}
                style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'white', cursor: 'pointer', fontSize: 13, color: C.textMid, flex: 1 }}>
                ← {chapters[currentIndex - 1].title}
              </button>
            ) : <div style={{ flex: 1 }} />}
            {currentIndex < chapters.length - 1 ? (
              <button onClick={() => selectChapter(chapters[currentIndex + 1].id)}
                style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: C.dark, cursor: 'pointer', fontSize: 13, color: 'white', fontWeight: 600, flex: 1 }}>
                {chapters[currentIndex + 1].title} →
              </button>
            ) : (
              <div style={{ padding: '10px 16px', borderRadius: 8, background: '#F0F9F4', fontSize: 13, color: '#2a7a4a', fontWeight: 600, flex: 1, textAlign: 'center' }}>
                ✅ อ่านครบทุกหัวข้อแล้ว!
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
