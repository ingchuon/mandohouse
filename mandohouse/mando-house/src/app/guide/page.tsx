// src/app/guide/page.tsx
'use client'
import { useState } from 'react'

const C = {
  bg: '#F5F0E8',
  dark: '#1C3A2A',
  green: '#1C3A2A',
  gold: '#E8A020',
  border: '#E2D9CC',
  text: '#2C2C2C',
  textMid: '#6B6B6B',
}

const STORAGE = 'https://bebfmbijwezoyhoedgtt.supabase.co/storage/v1/object/public/tutorcloud-assets/guide'

const chapters = [
  {
    id: 'dashboard',
    icon: '📊',
    title: 'Dashboard',
    image: `${STORAGE}/dashboard.png`,
    sections: [
      {
        title: 'ภาพรวม Dashboard',
        content: `Dashboard คือหน้าแรกที่แสดงภาพรวมของสถาบันทั้งหมดในหน้าเดียว ประกอบด้วย:

• **การ์ดการเงิน 4 ใบ** — รายรับเดือนนี้, รายจ่ายเดือนนี้, กำไรเดือนนี้, เงินคงเหลือ
• **ปฏิทิน** — แสดงวันปัจจุบันและสรุปยอดรายได้ของเดือน
• **กราฟแท่ง 6 เดือน** — เปรียบเทียบรายรับและรายจ่ายย้อนหลัง 6 เดือน
• **กราฟวงกลมรายได้ตามวิชา** — สัดส่วนรายได้แต่ละวิชา
• **เช็คอินวันนี้** — รายชื่อนักเรียนที่เช็คอินวันนี้
• **ตารางเรียนวันนี้** — ดึงข้อมูลจาก Google Calendar
• **ใกล้หมดคอร์ส** — นักเรียนที่เหลือคลาสน้อย ควรต่อคอร์ส
• **รอซื้อคอร์สใหม่** — นักเรียนที่หมดคอร์สแล้วยังไม่ซื้อใหม่`,
      },
      {
        title: 'เคล็ดลับ',
        content: `• กด **Refresh** หน้าทำให้ข้อมูลอัปเดต Dashboard ดึงข้อมูล real-time จาก Supabase
• ตารางเรียนวันนี้ต้องเชื่อมต่อ Google Calendar ก่อน ไปที่ ตารางสอน → เชื่อมต่อบัญชี`,
      },
    ],
  },
  {
    id: 'students',
    icon: '👨‍🎓',
    title: 'ข้อมูลนักเรียน',
    image: `${STORAGE}/students.png`,
    sections: [
      {
        title: 'การดูข้อมูลนักเรียน',
        content: `หน้านี้แสดงรายชื่อนักเรียนทั้งหมดในสถาบัน สามารถกรองได้ 3 สถานะ:

• **Active** — นักเรียนที่กำลังเรียนอยู่
• **Inactive** — นักเรียนที่หยุดเรียนแล้ว
• **ทั้งหมด** — แสดงทุกคน

ข้อมูลที่แสดงในตาราง: ชื่อนักเรียน, โรงเรียน, คอร์สปัจจุบัน, ครูผู้สอน, ความคืบหน้า, เบอร์โทร, สถานะ`,
      },
      {
        title: 'เพิ่มนักเรียนใหม่',
        content: `1. กดปุ่ม **+ เพิ่มนักเรียน** มุมขวาบน
2. กรอกข้อมูล: ชื่อ-นามสกุล, ชื่อเล่น, เบอร์โทร, ผู้ปกครอง, โรงเรียน
3. เลือกคอร์สและครูผู้สอน
4. กด **บันทึก**`,
      },
      {
        title: 'Import/Export Excel',
        content: `**Export** — กดปุ่ม Export Excel เพื่อดาวน์โหลดรายชื่อนักเรียนทั้งหมด

**Import** — นำเข้านักเรียนจำนวนมากพร้อมกัน:
1. ไปที่ **Download file** → โหลด Template นักเรียน
2. กรอกข้อมูลตาม column: full_name, nickname, parent_name, parent_phone, enrolled_at
3. กลับมาที่ **Download file** → นำเข้ารายชื่อนักเรียน → เลือกไฟล์ .xlsx`,
      },
    ],
  },
  {
    id: 'checkin',
    icon: '✅',
    title: 'เช็คอิน / เช็คเอาท์',
    image: `${STORAGE}/checkin.png`,
    sections: [
      {
        title: 'การเช็คอินนักเรียน',
        content: `หน้าเช็คอินใช้บันทึกการเข้าเรียนของนักเรียนแต่ละครั้ง:

1. พิมพ์ชื่อหรือชื่อเล่นในช่องค้นหา
2. เลือกนักเรียนจาก dropdown
3. กด **เช็คอิน**
4. ระบบจะบันทึกเวลาและนับคลาสอัตโนมัติ`,
      },
      {
        title: 'บันทึกย้อนหลัง',
        content: `กรณีลืมเช็คอินวันก่อน:
1. เปิด Toggle **บันทึกย้อนหลัง**
2. เลือกวันที่และเวลาที่ต้องการ
3. กด **เช็คอิน**

⚠️ ระบบจะคำนวณลำดับคลาสใหม่อัตโนมัติเมื่อมีการบันทึกย้อนหลัง`,
      },
      {
        title: 'รายชื่อวันนี้และสรุปรายคน',
        content: `ฝั่งขวาของหน้าแสดง 2 แท็บ:

• **รายชื่อวันนี้** — ใครเช็คอินแล้วบ้างวันนี้ พร้อมเวลา
• **สรุปรายคน** — เลือกช่วงวันเพื่อดูสรุปการเข้าเรียนแต่ละคน`,
      },
    ],
  },
  {
    id: 'hours',
    icon: '⏱️',
    title: 'ชั่วโมงสอน',
    image: `${STORAGE}/hours.png`,
    sections: [
      {
        title: 'รายงานชั่วโมงสอน',
        content: `หน้านี้สรุปชั่วโมงการสอนของครูแต่ละคน สามารถดูได้ 2 โหมด:

• **รายเดือน** — สรุปชั่วโมงรวมของเดือนที่เลือก
• **เลือกวัน** — ดูชั่วโมงสอนในช่วงวันที่กำหนด

กรองตามครูได้จาก dropdown และ Export เป็น Excel (.xlsx) ได้`,
      },
    ],
  },
  {
    id: 'teachers',
    icon: '👩‍🏫',
    title: 'ครูผู้สอน',
    image: `${STORAGE}/teachers.png`,
    sections: [
      {
        title: 'จัดการครูผู้สอน',
        content: `หน้านี้แสดงรายชื่อครูทั้งหมดในสถาบัน:

• **เพิ่มครูใหม่** — กดปุ่ม + เพิ่มครู กรอกชื่อ, วิชาที่สอน, ตั้ง PIN
• **แก้ไขข้อมูล** — คลิกที่ชื่อครูเพื่อแก้ไข
• **PIN** — ใช้สำหรับครูกรอกข้อมูลในหน้า /teach

สถานะครู: ใช้งานอยู่ / ปิดใช้งาน / ทั้งหมด`,
      },
      {
        title: 'หน้าครูกรอกข้อมูล (/teach)',
        content: `ครูสามารถกรอกข้อมูลส่วนตัวได้ที่ /teach:
• บันทึกชั่วโมงสอน
• ดูตารางนักเรียน
• ใส่ PIN เพื่อ authenticate`,
      },
    ],
  },
  {
    id: 'schedule',
    icon: '📅',
    title: 'ตารางสอน',
    image: `${STORAGE}/schedule.png`,
    sections: [
      {
        title: 'ตารางสอนจาก Google Calendar',
        content: `หน้าตารางสอนดึงข้อมูล event จาก Google Calendar ของครูทุกคนมาแสดงในปฏิทิน

ดูได้ 3 โหมด: **วัน / สัปดาห์ / เดือน**

สีของ event แยกตามครู — แต่ละ account Google Calendar จะแสดงสีต่างกัน ทำให้รู้ว่า event นั้นเป็นของครูคนไหน`,
      },
      {
        title: 'เชื่อมต่อ Google Calendar',
        content: `ครั้งแรกต้องเชื่อมต่อบัญชี Google:
1. กดลิ้งก์ **เชื่อมต่อบัญชี** ใต้ชื่อวันที่
2. เลือก account ที่ต้องการ
3. กด Allow เพื่อให้สิทธิ์อ่านปฏิทิน
4. ทำซ้ำสำหรับแต่ละ account ครู`,
      },
    ],
  },
  {
    id: 'courses',
    icon: '📚',
    title: 'คอร์สและราคา',
    image: `${STORAGE}/courses.png`,
    sections: [
      {
        title: 'จัดการคอร์ส',
        content: `หน้านี้แบ่งเป็น 2 แท็บ:

**คอร์สเรียน** — เพิ่ม/แก้ไขคอร์สเรียน เช่น ภาษาจีน, คณิตศาสตร์, ภาษาอังกฤษ พร้อมจำนวนครั้งและราคา

**หนังสือและอื่นๆ** — จัดการรายการหนังสือ อุปกรณ์ และค่าอื่นๆ ที่จำหน่ายในสถาบัน`,
      },
      {
        title: 'เพิ่มคอร์สใหม่',
        content: `1. กด **+ เพิ่มคอร์ส**
2. กรอกชื่อคอร์ส, วิชา, จำนวนครั้ง, ราคา
3. เลือกประเภท: คอร์สปกติ / Special
4. กด **บันทึก**

⚠️ คอร์ส Special จะไม่นับจำนวนครั้งและไม่มีการ block ซ้ำ`,
      },
    ],
  },
  {
    id: 'receipts',
    icon: '💰',
    title: 'รายรับ (ใบเสร็จ)',
    image: `${STORAGE}/receipts.png`,
    sections: [
      {
        title: 'ออกใบเสร็จ',
        content: `หน้ารายรับใช้ออกใบเสร็จรับเงินเมื่อนักเรียนชำระค่าเรียน:

1. กด **+ ออกใบเสร็จ**
2. เลือกนักเรียน
3. เลือกคอร์สหรือรายการ
4. ระบุจำนวนเงินและวิธีชำระ (เงินสด / โอน)
5. กด **บันทึก**

ระบบจะออกเลขใบเสร็จอัตโนมัติและบันทึกลงรายรับ`,
      },
      {
        title: 'ดาวน์โหลดใบเสร็จ PDF',
        content: `คลิกที่ใบเสร็จที่ต้องการ → กด **ดาวน์โหลด PDF** ใบเสร็จรองรับภาษาไทยด้วยฟอนต์ Sarabun`,
      },
      {
        title: 'Import รายรับจาก Excel',
        content: `1. ไปที่ Download file → โหลด Template รายรับ
2. กรอก: Date, Name, Subject, Amount, ค่าหนังสือ, Teacher, Payment, Remark
3. Import ไฟล์ที่หน้า Download file`,
      },
    ],
  },
  {
    id: 'expenses',
    icon: '💸',
    title: 'รายจ่าย',
    image: `${STORAGE}/expenses.png`,
    sections: [
      {
        title: 'บันทึกรายจ่าย',
        content: `หน้ารายจ่ายติดตามค่าใช้จ่ายและทำโปรขาดทุน:

1. กด **+ บันทึกรายจ่าย**
2. เลือกหมวดหมู่ (เงินเดือน, ค่าเช่า, อุปกรณ์ ฯลฯ)
3. กรอกจำนวนเงินและรายละเอียด
4. กด **บันทึก**

กราฟรายรับ-รายจ่าย 6 เดือนจะอัปเดตอัตโนมัติ`,
      },
    ],
  },
  {
    id: 'finance',
    icon: '📈',
    title: 'Finance',
    image: `${STORAGE}/finance.png`,
    sections: [
      {
        title: 'ภาพรวมการเงิน',
        content: `หน้า Finance รวมข้อมูลการเงินทั้งหมดในที่เดียว:

• **การ์ด 4 ใบ** — รายรับ, รายจ่าย, กำไร, รายได้ทั้งหมดในระบบ
• **รายรับค่าคอร์ส** — ยอดจากใบเสร็จ
• **รายรับขายหนังสือ** — ยอดขายหนังสือและอุปกรณ์
• **ยอดยกนาเดือนนี้** — ยอดคงเหลือยกมา

ดูแยกตามแท็บ: **สรุป / รายรับ / รายจ่าย / ตั้งค่า**`,
      },
      {
        title: 'ตั้งค่ายอดยกนา',
        content: `แท็บ **ตั้งค่า** ใช้ตั้งยอดยกนาเดือนแรกของระบบ เพื่อให้ยอดคงเหลือถูกต้องตั้งแต่ต้น`,
      },
    ],
  },
  {
    id: 'download',
    icon: '📥',
    title: 'Download file',
    image: `${STORAGE}/download.png`,
    sections: [
      {
        title: 'Export ข้อมูล',
        content: `ดาวน์โหลดข้อมูลเป็น Excel ได้ 5 รายการ:

• **รายรับ** — ใบเสร็จ วันที่ ชื่อนักเรียน คอร์ส ยอด
• **รายจ่าย** — รายการหมวดหมู่ วันที่ ยอด
• **รายชื่อนักเรียน** — ชื่อ ชื่อเล่น ผู้ปกครอง เบอร์ คอร์ส
• **เช็คอิน** — นักเรียน คอร์ส วันที่ เวลา ครู
• **รายรับ-รายจ่าย** — สรุปการเงินรวม 2 sheet`,
      },
      {
        title: 'Template สำหรับ Import',
        content: `โหลด Template เปล่าเพื่อกรอกข้อมูลแล้ว Import เข้าระบบ:

• **Template รายรับ** — Date, Name, Subject, Amount, ค่าหนังสือ, Teacher, Payment, Remark
• **Template รายจ่าย** — Date, List, price, teacher, Remark
• **Template นักเรียน** — full_name, nickname, parent_name, parent_phone, enrolled_at

⚠️ โหลด Template ก่อนเสมอ เพื่อให้ format ถูกต้อง`,
      },
      {
        title: 'Import ข้อมูล',
        content: `นำเข้าข้อมูลจำนวนมากพร้อมกัน:
1. โหลด Template และกรอกข้อมูล
2. เลือกประเภท Import ที่ต้องการ
3. กด **เลือกไฟล์ .xlsx**
4. ระบบจะตรวจสอบและนำเข้าอัตโนมัติ

รองรับไฟล์ .xlsx และ .xls เท่านั้น`,
      },
    ],
  },
  {
    id: 'team',
    icon: '👥',
    title: 'จัดการทีม',
    image: `${STORAGE}/team.png`,
    sections: [
      {
        title: 'เพิ่มสมาชิกทีม',
        content: `หน้าจัดการทีมใช้เพิ่มผู้ใช้งานในระบบ:

1. กด **+ เพิ่มเจ้าหน้าที่**
2. กรอกอีเมลและกำหนดสิทธิ์
3. สมาชิกจะได้รับอีเมลเชิญ

สมาชิกทุกคนมีสิทธิ์เท่ากัน — เช็คอิน, บันทึกนักเรียน, เขียนรีวิว, ออกใบเสร็จ, แจ้งเดือน ได้ทุกอย่าง`,
      },
      {
        title: 'จำนวนสมาชิกตาม Plan',
        content: `จำนวนสมาชิกที่เพิ่มได้ขึ้นอยู่กับ subscription:

• **Starter** — สูงสุด 5 คน
• **Growth** — สูงสุด 20 คน
• **Pro** — ไม่จำกัด`,
      },
    ],
  },
]

export default function GuidePage() {
  const [activeChapter, setActiveChapter] = useState('dashboard')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentChapter = chapters.find((c) => c.id === activeChapter)!

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('•')) {
        const parts = line.slice(1).trim().split(/\*\*(.*?)\*\*/g)
        return (
          <div key={i} className="flex gap-2 mb-1">
            <span style={{ color: C.gold }}>•</span>
            <span>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</span>
          </div>
        )
      }
      if (/^\d+\./.test(line)) {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <div key={i} className="mb-1 pl-1">
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          </div>
        )
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
      return (
        <div key={i} className="mb-1">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </div>
      )
    })
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Sarabun, sans-serif', color: C.text }}>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
          <img src={lightbox} alt="preview" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.dark, borderBottom: '1px solid #2a4a38' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" style={{ color: C.gold, fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>
              Tutor<span style={{ color: 'white' }}>cloud</span>
            </a>
            <span style={{ color: '#4a7a5a' }}>›</span>
            <span style={{ color: '#aaa', fontSize: 14 }}>คู่มือการใช้งาน</span>
          </div>
          <a href="/staff/dashboard"
            style={{ background: C.gold, color: 'white', padding: '6px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            เข้าสู่ระบบ →
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex" style={{ minHeight: 'calc(100vh - 60px)' }}>

        {/* Sidebar desktop */}
        <div className="hidden md:block" style={{
          width: 260, flexShrink: 0, borderRight: `1px solid ${C.border}`,
          background: 'white', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
        }}>
          <div style={{ padding: '20px 16px 8px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.textMid, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>คู่มือการใช้งาน</div>
            <div style={{ fontSize: 13, color: C.textMid }}>TutorCloud — Admin</div>
          </div>
          <nav style={{ padding: '8px 0' }}>
            {chapters.map((ch) => (
              <button key={ch.id} onClick={() => setActiveChapter(ch.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 20px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: activeChapter === ch.id ? '#F0F9F4' : 'transparent',
                  borderLeft: activeChapter === ch.id ? `3px solid ${C.gold}` : '3px solid transparent',
                  color: activeChapter === ch.id ? C.dark : C.textMid,
                  fontWeight: activeChapter === ch.id ? 600 : 400,
                  fontSize: 14, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                }}>
                <span>{ch.icon}</span>
                <span>{ch.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile sidebar toggle */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: C.dark, color: 'white', borderRadius: '50%', width: 48, height: 48, fontSize: 20, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            ☰
          </button>
        </div>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)}>
            <div style={{ width: 260, height: '100%', background: 'white', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '20px 16px 8px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.textMid }}>คู่มือการใช้งาน</div>
              </div>
              <nav style={{ padding: '8px 0' }}>
                {chapters.map((ch) => (
                  <button key={ch.id} onClick={() => { setActiveChapter(ch.id); setSidebarOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 20px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: activeChapter === ch.id ? '#F0F9F4' : 'transparent',
                      borderLeft: activeChapter === ch.id ? `3px solid ${C.gold}` : '3px solid transparent',
                      color: activeChapter === ch.id ? C.dark : C.textMid,
                      fontWeight: activeChapter === ch.id ? 600 : 400,
                      fontSize: 15, cursor: 'pointer', border: 'none',
                    }}>
                    <span>{ch.icon}</span>
                    <span>{ch.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, padding: '40px 48px', maxWidth: 800 }}>

          {/* Chapter header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{currentChapter.icon}</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: 0 }}>{currentChapter.title}</h1>
            <div style={{ width: 48, height: 3, background: C.gold, borderRadius: 2, marginTop: 8 }} />
          </div>

          {/* Chapter image */}
          {currentChapter.image && (
            <div style={{ marginBottom: 28, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, cursor: 'zoom-in', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              onClick={() => setLightbox(currentChapter.image)}>
              <img src={currentChapter.image} alt={currentChapter.title}
                style={{ width: '100%', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <div style={{ padding: '8px 12px', background: '#f8f6f2', fontSize: 12, color: C.textMid, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔍</span> คลิกเพื่อขยายภาพ
              </div>
            </div>
          )}

          {/* Sections */}
          {currentChapter.sections.map((section, si) => {
            const key = `${activeChapter}-${si}`
            const isOpen = openSections[key] !== false
            return (
              <div key={si} style={{
                background: 'white', borderRadius: 12, marginBottom: 16,
                border: `1px solid ${C.border}`, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <button onClick={() => toggleSection(key)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                  }}>
                  <span style={{ fontWeight: 600, fontSize: 16, color: C.dark }}>{section.title}</span>
                  <span style={{ color: C.textMid, fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 20px', fontSize: 15, lineHeight: 1.8, color: C.text, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ paddingTop: 16 }}>{renderContent(section.content)}</div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
            {chapters.findIndex(c => c.id === activeChapter) > 0 ? (
              <button onClick={() => setActiveChapter(chapters[chapters.findIndex(c => c.id === activeChapter) - 1].id)}
                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'white', cursor: 'pointer', fontSize: 14, color: C.textMid }}>
                ← {chapters[chapters.findIndex(c => c.id === activeChapter) - 1].title}
              </button>
            ) : <div />}
            {chapters.findIndex(c => c.id === activeChapter) < chapters.length - 1 ? (
              <button onClick={() => setActiveChapter(chapters[chapters.findIndex(c => c.id === activeChapter) + 1].id)}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: C.dark, cursor: 'pointer', fontSize: 14, color: 'white', fontWeight: 600 }}>
                {chapters[chapters.findIndex(c => c.id === activeChapter) + 1].title} →
              </button>
            ) : (
              <div style={{ padding: '10px 20px', borderRadius: 8, background: '#F0F9F4', fontSize: 14, color: '#2a7a4a', fontWeight: 600 }}>
                ✅ อ่านครบทุกหัวข้อแล้ว!
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
