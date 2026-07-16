'use client'
// src/app/staff/help/page.tsx
import { useState } from 'react'

const sections = [
  {
    id: 'dashboard',
    icon: '⊞',
    title: 'Dashboard',
    color: '#0F6E56',
    darkBg: 'rgba(15,110,86,0.15)',
    desc: 'ภาพรวมของระบบทั้งหมด',
    features: [
      {
        title: 'การ์ดการเงิน',
        icon: '💰',
        steps: [
          'รายรับเดือนนี้ — คลิกเพื่อไปหน้าใบเสร็จ',
          'รายจ่ายเดือนนี้ — คลิกเพื่อไปหน้ารายจ่าย',
          'กำไร/ขาดทุนเดือนนี้ — รายรับ ลบ รายจ่าย',
          'เงินคงเหลือ — ยกมาจากเดือนที่แล้ว บวก รายรับ ลบ รายจ่าย',
        ],
      },
      {
        title: 'กราฟรายได้แยกตามวิชา',
        icon: '📊',
        steps: [
          'แสดงรายได้แยกเป็น ภาษาจีน / คณิตศาสตร์ / อังกฤษ / อื่นๆ',
          'คำนวณจากใบเสร็จในเดือนปัจจุบัน',
          'กราฟแท่ง 6 เดือนแสดงรายรับ-รายจ่ายย้อนหลัง',
        ],
      },
      {
        title: 'ใกล้หมดคอร์ส',
        icon: '⚠️',
        steps: [
          'แสดงนักเรียนที่เหลือ 0-1 ครั้ง อัตโนมัติ',
          'คลิกเพื่อไปหน้าเช็กอินจัดการต่อ',
        ],
      },
      {
        title: 'รอซื้อคอร์สใหม่',
        icon: '🔄',
        steps: [
          'แสดงนักเรียนที่เรียนครบทุกครั้งแล้ว (status = completed)',
          'เฉพาะนักเรียนที่ไม่มีคอร์ส active เหลืออยู่',
          'คลิกเพื่อไปหน้านักเรียนและกด "+ ซื้อคอร์ส"',
        ],
      },
      {
        title: 'เช็กอินวันนี้',
        icon: '🕐',
        steps: [
          'แสดงรายชื่อนักเรียนที่เช็กอินวันนี้แบบ real-time',
          'จุดเขียว = ยังอยู่ในสถาบัน',
          'คลิกเพื่อไปจัดการหน้าเช็กอิน',
        ],
      },
    ],
  },
  {
    id: 'students',
    icon: '👥',
    title: 'ข้อมูลนักเรียน',
    color: '#7C3AED',
    darkBg: 'rgba(124,58,237,0.15)',
    desc: 'จัดการข้อมูลนักเรียนทั้งหมด',
    features: [
      {
        title: 'ดูข้อมูลนักเรียน',
        icon: '👤',
        steps: [
          'กรองดู Active / Inactive / ทั้งหมด',
          'ค้นหาด้วยชื่อ ชื่อเล่น หรือผู้ปกครอง',
          'คลิกชื่อนักเรียนเพื่อดูรายละเอียด ประวัติคอร์ส และประวัติเช็กอิน',
        ],
      },
      {
        title: 'เพิ่มนักเรียนใหม่',
        icon: '➕',
        steps: [
          'กดปุ่ม "+ เพิ่มนักเรียน" มุมขวาบน',
          'กรอกชื่อ-นามสกุล ชื่อเล่น โรงเรียน เบอร์โทร',
          'กด "บันทึก"',
        ],
      },
      {
        title: 'ซื้อคอร์ส',
        icon: '📚',
        steps: [
          'กดปุ่ม "+ ซื้อคอร์ส" ในหน้ารายละเอียดนักเรียน',
          'เลือกคอร์สและครูผู้สอน',
          'กรอกจำนวนครั้ง ราคา และวันที่',
          'ระบบสร้างใบเสร็จอัตโนมัติถ้ากรอกราคา',
          'enrollment จะเปลี่ยนเป็น active ทันที พร้อมเช็กอินได้เลย',
        ],
      },
      {
        title: 'Import/Export Excel',
        icon: '📥',
        steps: [
          'Export — ดาวน์โหลดรายชื่อนักเรียนทั้งหมดพร้อมครูผู้สอน',
          'Import — อัปโหลดไฟล์ Excel ที่มี column: ลำดับที่, วันสมัคร, ชื่อ, ชื่อเล่น, โรงเรียน, อายุ, วิชาที่เรียน, เบอร์โทร, study type, remark',
        ],
      },
    ],
  },
  {
    id: 'checkin',
    icon: '🕐',
    title: 'เช็กอิน / เช็กเอาท์',
    color: '#0369A1',
    darkBg: 'rgba(3,105,161,0.15)',
    desc: 'บันทึกเวลาเข้าออกของนักเรียน',
    features: [
      {
        title: 'เช็กอินด่วน',
        icon: '✓',
        steps: [
          'พิมพ์ชื่อหรือชื่อเล่นในช่องค้นหา แล้วเลือกนักเรียน',
          'เลือกครูผู้สอน (จำเป็น)',
          'เลือกวิชาที่สอน ระยะเวลา หัวข้อ และการบ้าน (ถ้ามี)',
          'กดปุ่ม "เช็กอิน"',
          'ระบบแสดง popup สรุปพร้อม progress bar ครั้งที่เรียน',
        ],
      },
      {
        title: 'ระบบ block เมื่อครบจำนวนครั้ง',
        icon: '🚫',
        steps: [
          'ถ้านักเรียนเรียนครบจำนวนครั้งแล้ว ระบบจะแสดงแถบแดง "เรียนครบ X ครั้งแล้ว"',
          'ปุ่มเช็กอินจะถูก disable อัตโนมัติ ไม่สามารถกดได้',
          'ต้องไปซื้อคอร์สใหม่ที่หน้านักเรียนก่อน จึงจะเช็กอินได้',
          'เมื่อเช็กอินครั้งสุดท้าย ระบบเปลี่ยน status เป็น completed อัตโนมัติ',
        ],
      },
      {
        title: 'บันทึกย้อนหลัง',
        icon: '📅',
        steps: [
          'เปิด toggle "บันทึกย้อนหลัง" ใต้ฟอร์มเช็กอิน',
          'เลือกวันที่และเวลาที่ต้องการบันทึก',
          'เลือกนักเรียนและครู แล้วกด "บันทึกย้อนหลัง"',
          'ระบบจะจัดเรียงลำดับครั้งที่เรียนใหม่ให้ถูกต้องอัตโนมัติ',
        ],
      },
      {
        title: 'จัดการรายการวันนี้',
        icon: '📝',
        steps: [
          '"บันทึก" — บันทึกหัวข้อที่สอนหรือการบ้านหลังเช็กอินแล้ว',
          '"แก้ไข" — แก้ไขเวลาเช็กอิน/เช็กเอาท์',
          '"ลบ" — ลบรายการ (มี Undo 6 วินาที)',
          '"สรุป" — ดูสรุปทุกคอร์สของนักเรียนคนนั้น พร้อมคัดลอกส่งผู้ปกครอง',
        ],
      },
      {
        title: 'สรุปและคัดลอกส่งผู้ปกครอง',
        icon: '📋',
        steps: [
          'กดปุ่ม "สรุป" ในแถวรายชื่อ หรือ popup หลังเช็กอินสำเร็จ',
          'ระบบแสดงประวัติการเรียนทุกคอร์สที่ active',
          'กด "คัดลอกส่งผู้ปกครอง" — ได้ข้อความสรุปพร้อมวาง LINE ทันที',
          'ข้อความรวมชื่อนักเรียน คอร์ส ประวัติทุกครั้ง และสถานะเหลือกี่ครั้ง',
        ],
      },
      {
        title: 'Tab สรุปรายคน',
        icon: '🔍',
        steps: [
          'คลิก tab "สรุปรายคน" ในฝั่งรายชื่อ',
          'พิมพ์ชื่อหรือชื่อเล่นนักเรียน',
          'ระบบแสดงสรุปทุกคอร์สที่กำลังเรียนอยู่ พร้อม progress และประวัติ',
          'กด "คัดลอกส่งผู้ปกครอง" เพื่อส่ง LINE ได้เลย',
        ],
      },
    ],
  },
  {
    id: 'teaching',
    icon: '⏱',
    title: 'ชั่วโมงการสอน',
    color: '#0F6E56',
    darkBg: 'rgba(15,110,86,0.15)',
    desc: 'ติดตามการสอนของครูแต่ละคน',
    features: [
      {
        title: 'บันทึกชั่วโมงการสอน',
        icon: '➕',
        steps: [
          'กดปุ่ม "+ บันทึกชั่วโมงการสอน"',
          'เลือกครูผู้สอน (หรือกด "+ เพิ่มครูใหม่")',
          'เลือกนักเรียน/คอร์ส',
          'เลือกวันที่และระยะเวลา (30/45/60/90/120 นาที)',
          'กรอกหัวข้อที่สอนและการบ้าน',
          'กด "บันทึก"',
        ],
      },
      {
        title: 'เพิ่มครูใหม่',
        icon: '👩‍🏫',
        steps: [
          'ใน Modal บันทึกชั่วโมง กดปุ่ม "+ เพิ่มครูใหม่"',
          'กรอกชื่อครูและวิชาที่สอน',
          'กด "เพิ่มครู" — ครูจะขึ้นใน dropdown ทันที',
        ],
      },
      {
        title: 'ดูประวัติการสอน',
        icon: '📋',
        steps: [
          'เลือกเดือนและครูที่ต้องการดู',
          'คลิกแถวเพื่อดูรายละเอียด (หัวข้อ/การบ้าน)',
          'กด "แก้ไข" เพื่อแก้ไขหัวข้อหรือการบ้าน',
        ],
      },
      {
        title: 'Export Excel',
        icon: '📊',
        steps: [
          'กดปุ่ม "Export Excel"',
          'ได้ไฟล์แยก Sheet ตามครูทุกคนในเดือนนั้น',
          'แต่ละ Sheet มีแถวสรุปรวมชั่วโมงท้าย',
        ],
      },
    ],
  },
  {
    id: 'receipts',
    icon: '🧾',
    title: 'ออกใบเสร็จ',
    color: '#B45309',
    darkBg: 'rgba(180,83,9,0.15)',
    desc: 'จัดการใบเสร็จรับเงิน',
    features: [
      {
        title: 'ออกใบเสร็จใหม่',
        icon: '🖨',
        steps: [
          'กด "+ ออกใบเสร็จ"',
          'เลือกนักเรียน — ระบบดึงราคาคอร์สอัตโนมัติ',
          'เลือกวันที่และช่องทางชำระ',
          'กด "ออกใบเสร็จ"',
        ],
      },
      {
        title: 'พิมพ์ใบเสร็จ',
        icon: '🖨',
        steps: [
          'กดปุ่มพิมพ์ในแถวใบเสร็จ',
          'หน้าต่างพิมพ์จะเปิดขึ้นอัตโนมัติ',
          'ใบเสร็จมีโลโก้ ชื่อสถาบัน เบอร์โทร',
        ],
      },
      {
        title: 'แก้ไขใบเสร็จ',
        icon: '✎',
        steps: [
          'กดปุ่มแก้ไขเพื่อแก้ไขจำนวนเงิน วันที่ หรือช่องทางชำระ',
          'กด "บันทึก"',
        ],
      },
    ],
  },
  {
    id: 'expenses',
    icon: '📤',
    title: 'รายจ่าย',
    color: '#DC2626',
    darkBg: 'rgba(220,38,38,0.15)',
    desc: 'บันทึกและติดตามค่าใช้จ่าย',
    features: [
      {
        title: 'บันทึกรายจ่าย',
        icon: '➕',
        steps: [
          'กด "+ บันทึกรายจ่าย"',
          'เลือกหมวดหมู่ (ค่าครู / ค่าเช่า / ค่าไฟ ฯลฯ)',
          'กรอกชื่อรายจ่าย จำนวนเงิน วันที่',
          'เลือกช่องทางชำระ',
          'ติ๊ก "รายจ่ายประจำทุกเดือน" ถ้าต้องการ',
        ],
      },
      {
        title: 'ดูสรุปรายจ่าย',
        icon: '📊',
        steps: [
          'เลือกเดือนที่ต้องการดูจาก dropdown มุมขวาบน',
          'กราฟ 6 เดือนแสดงรายรับ-รายจ่าย',
          'ฝั่งขวาแสดงสัดส่วนแยกตามหมวดหมู่',
          'เลื่อนดูตารางรายการซ้ายขวาบนมือถือได้',
        ],
      },
    ],
  },
  {
    id: 'alerts',
    icon: '🔔',
    title: 'แจ้งเตือน LINE',
    color: '#059669',
    darkBg: 'rgba(5,150,105,0.15)',
    desc: 'ส่งแจ้งเตือนต่อคอร์สผ่าน LINE',
    features: [
      {
        title: 'ดูนักเรียนใกล้หมดคอร์ส',
        icon: '⚠️',
        steps: [
          'ระบบแสดงนักเรียนที่เหลือ ≤ 3 ครั้งอัตโนมัติ',
          'แถบสีแดง = เหลือ 1-2 ครั้ง (เร่งด่วน)',
          'แถบสีเหลือง = เหลือ 3 ครั้ง',
        ],
      },
      {
        title: 'ส่งแจ้งเตือน LINE',
        icon: '📱',
        steps: [
          'กดปุ่ม "แจ้งเตือน LINE" ในแถวนักเรียน',
          'ระบบส่งข้อความไปยัง LINE Group สถาบัน',
          'กด "แจ้งเตือนทั้งหมด" เพื่อส่งพร้อมกัน',
        ],
      },
    ],
  },
  {
    id: 'lessons',
    icon: '📅',
    title: 'นับครั้งการเรียน',
    color: '#7C3AED',
    darkBg: 'rgba(124,58,237,0.15)',
    desc: 'ติดตามจำนวนครั้งที่เรียนของนักเรียน',
    features: [
      {
        title: 'ดูความคืบหน้า',
        icon: '📈',
        steps: [
          'แสดงจำนวนครั้งที่ใช้ไป / ทั้งหมด',
          'Progress bar แสดงสัดส่วน — สีแดง = ใกล้หมด, สีเขียว = ปกติ',
          'อัปเดตอัตโนมัติทุกครั้งที่เช็กอิน',
        ],
      },
      {
        title: 'auto-complete คอร์ส',
        icon: '✅',
        steps: [
          'เมื่อเช็กอินครั้งสุดท้าย ระบบเปลี่ยน status เป็น completed อัตโนมัติ',
          'popup แสดง "จบคอร์สแล้ว!" พร้อมแจ้งให้ซื้อคอร์สใหม่',
          'นักเรียนจะขึ้นใน card "รอซื้อคอร์สใหม่" บน Dashboard',
          'ถ้าลบ checkin ครั้งสุดท้าย status จะกลับเป็น active อัตโนมัติ',
        ],
      },
    ],
  },
  {
    id: 'team',
    icon: '🎓',
    title: 'จัดการทีม',
    color: '#0369A1',
    darkBg: 'rgba(3,105,161,0.15)',
    desc: 'จัดการสมาชิกทีมงาน',
    features: [
      {
        title: 'ดูข้อมูลทีมงาน',
        icon: '👥',
        steps: [
          'แสดงรายชื่อทุกคนพร้อมสถิติ — นักเรียน, Active, รีวิว, เช็กอิน 30 วัน',
          'สถิติอัปเดตอัตโนมัติจากข้อมูลจริงในระบบ',
        ],
      },
      {
        title: 'เพิ่มเจ้าหน้าที่ใหม่',
        icon: '➕',
        steps: [
          'กดปุ่ม "+ เพิ่มเจ้าหน้าที่" มุมขวาบน',
          'ทำตามขั้นตอน: เพิ่ม user ใน Supabase Authentication → คัดลอก User ID → รัน SQL ที่ระบบสร้างให้',
          'ทุกคนในทีมมีสิทธิ์เท่ากัน — เช็กอิน บันทึกบทเรียน ออกใบเสร็จ ได้ทุกอย่าง',
        ],
      },
      {
        title: 'แก้ไขข้อมูล',
        icon: '✎',
        steps: [
          'กดปุ่ม "แก้ไข" ในการ์ดสมาชิก',
          'แก้ไขชื่อ เบอร์โทร LINE ID',
          'กด "บันทึก"',
        ],
      },
    ],
  },
]

const tips: Record<string, string> = {
  dashboard: 'card "รอซื้อคอร์สใหม่" แสดงเฉพาะคนที่ไม่มีคอร์ส active เหลืออยู่เลย ถ้านักเรียนยังมีคอร์สอื่นอยู่จะไม่ขึ้นที่นี่',
  students: 'ถ้าต้องการ import นักเรียนหลายคนพร้อมกัน ใช้ปุ่ม "Import Excel" จะเร็วกว่าเพิ่มทีละคนมาก',
  checkin: 'กดปุ่ม "สรุป" ในแถวรายชื่อเพื่อดูและคัดลอกสรุปส่งผู้ปกครองได้เลยโดยไม่ต้องรอ popup หลังเช็กอิน',
  teaching: 'บันทึกหัวข้อและการบ้านทุกครั้ง จะช่วยให้ Export Excel มีข้อมูลครบถ้วนสำหรับสรุปรายเดือน',
  receipts: 'ถ้าซื้อคอร์สผ่านหน้านักเรียน ระบบสร้างใบเสร็จอัตโนมัติ ไม่ต้องออกใบเสร็จซ้ำ',
  expenses: 'ใช้ฟีเจอร์ "รายจ่ายประจำทุกเดือน" สำหรับค่าเช่า ค่าเงินเดือน ที่จ่ายซ้ำทุกเดือน',
  alerts: 'แนะนำให้เช็กหน้านี้ทุกต้นสัปดาห์ เพื่อแจ้งเตือนผู้ปกครองล่วงหน้าก่อนคอร์สหมด',
  lessons: 'ระบบ auto-complete คอร์สเมื่อเช็กอินครั้งสุดท้าย ไม่ต้องมาเปลี่ยน status เอง',
  team: 'ทุกคนในทีมมีสิทธิ์เท่ากัน ไม่มีระดับ admin/staff แยกกัน',
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [openFeature, setOpenFeature] = useState<string | null>(null)

  const current = sections.find(s => s.id === activeSection)!

  return (
    <div className="min-h-screen bg-[#F5F4F0] dark:bg-[#1a2030]">
      {/* Header */}
      <div className="bg-white dark:bg-[#242d3f] border-b border-gray-100 dark:border-[#2a3245] px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">คู่มือการใช้งาน</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mando House — ระบบหลังบ้านสำหรับเจ้าหน้าที่</p>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-73px)]">
        {/* Sidebar nav */}
        <aside className="w-56 flex-shrink-0 bg-white dark:bg-[#242d3f] border-r border-gray-100 dark:border-[#2a3245] py-4">
          {sections.map(s => {
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); setOpenFeature(null) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left border-l-2 ${
                  isActive
                    ? 'font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a3245] border-transparent'
                }`}
                style={isActive ? { color: s.color, borderColor: s.color, background: s.darkBg } : {}}
              >
                <span className="text-base w-5 text-center">{s.icon}</span>
                <span>{s.title}</span>
              </button>
            )
          })}
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 max-w-3xl">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
              style={{ background: current.darkBg }}
            >
              {current.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{current.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{current.desc}</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {current.features.map((f, i) => {
              const key = `${current.id}-${i}`
              const isOpen = openFeature === key
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-[#242d3f] rounded-2xl border border-gray-100 dark:border-[#2a3245] overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFeature(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 dark:hover:bg-[#2a3245]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{f.icon}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{f.title}</span>
                    </div>
                    <span className={`text-gray-400 dark:text-gray-500 transition-transform text-sm ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="border-t border-gray-100 dark:border-[#2a3245] pt-4">
                        <ol className="space-y-3">
                          {f.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span
                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                                style={{ background: current.color }}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Tips box */}
          <div className="mt-8 rounded-2xl p-5" style={{ background: current.darkBg }}>
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: current.color }}>
                  เคล็ดลับ
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {tips[current.id]}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
