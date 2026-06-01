'use client'
// src/app/staff/help/page.tsx
import { useState } from 'react'

const sections = [
  {
    id: 'dashboard',
    icon: '⊞',
    title: 'Dashboard',
    color: '#0F6E56',
    bg: '#E8F5F1',
    desc: 'ภาพรวมของระบบทั้งหมด',
    features: [
      {
        title: 'ยอดสรุปการเงิน',
        icon: '💰',
        steps: [
          'รายได้ทั้งหมด — ยอดรวมจากใบเสร็จตั้งแต่เปิดกิจการ',
          'ยกยอดจากเดือนที่แล้ว — กดแก้ไขเพื่อตั้งค่ายอด',
          'รายรับเดือนนี้ — คลิกเพื่อไปหน้าใบเสร็จ',
        ],
      },
      {
        title: 'กราฟรายได้แยกตามวิชา',
        icon: '📊',
        steps: [
          'แสดงรายได้แยกเป็น ภาษาจีน / คณิตศาสตร์ / อังกฤษ / อื่นๆ',
          'คำนวณจากใบเสร็จในเดือนปัจจุบัน',
        ],
      },
      {
        title: 'นักเรียนใกล้หมดคอร์ส',
        icon: '⚠️',
        steps: [
          'แสดงนักเรียนที่เหลือไม่เกิน 5 ครั้ง',
          'กด "แจ้งเตือน" เพื่อส่ง LINE แจ้งผู้ปกครอง',
        ],
      },
      {
        title: 'เช็กอินวันนี้',
        icon: '🕐',
        steps: [
          'แสดงรายชื่อนักเรียนที่เช็กอินวันนี้แบบ real-time',
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
    bg: '#F3F0FF',
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
          'กดปุ่ม "ซื้อคอร์ส" ในแถวนักเรียน',
          'เลือกคอร์สและครูผู้สอน',
          'กรอกจำนวนครั้ง ราคา และวันที่',
          'ระบบสร้างใบเสร็จอัตโนมัติถ้ากรอกราคา',
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
    bg: '#E0F2FE',
    desc: 'บันทึกเวลาเข้าออกของนักเรียน',
    features: [
      {
        title: 'เช็กอินด่วน',
        icon: '✓',
        steps: [
          'พิมพ์ชื่อหรือชื่อเล่นในช่องค้นหา',
          'เลือกนักเรียนจาก dropdown',
          'กดปุ่ม "✓ เช็กอิน"',
        ],
      },
      {
        title: 'บันทึกย้อนหลัง',
        icon: '📅',
        steps: [
          'เปิด toggle "บันทึกย้อนหลัง"',
          'เลือกวันที่และเวลาที่ต้องการ',
          'เลือกนักเรียน แล้วกด "📅 บันทึกย้อนหลัง"',
        ],
      },
      {
        title: 'จัดการรายการวันนี้',
        icon: '📝',
        steps: [
          '📝 — บันทึกหัวข้อที่สอน',
          '✎ — แก้ไขเวลาเช็กอิน/เช็กเอาท์',
          '✕ — ลบรายการ',
        ],
      },
    ],
  },
  {
    id: 'teaching',
    icon: '⏱',
    title: 'ชั่วโมงการสอน',
    color: '#0F6E56',
    bg: '#E8F5F1',
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
          'กด "✎ แก้ไข" เพื่อแก้ไขหัวข้อหรือการบ้าน',
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
    bg: '#FEF3C7',
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
          'กดปุ่ม 🖨 ในแถวใบเสร็จ',
          'หน้าต่างพิมพ์จะเปิดขึ้นอัตโนมัติ',
          'ใบเสร็จมีโลโก้ ชื่อสถาบัน เบอร์โทร',
        ],
      },
      {
        title: 'แก้ไขใบเสร็จ',
        icon: '✎',
        steps: [
          'กดปุ่ม ✎ เพื่อแก้ไขจำนวนเงิน วันที่ หรือช่องทางชำระ',
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
    bg: '#FEE2E2',
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
        ],
      },
    ],
  },
  {
    id: 'alerts',
    icon: '🔔',
    title: 'แจ้งเตือน LINE',
    color: '#059669',
    bg: '#D1FAE5',
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
          'ระบบส่งข้อความไปยัง LINE ของผู้ปกครอง',
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
    bg: '#F3F0FF',
    desc: 'ติดตามจำนวนครั้งที่เรียนของนักเรียน',
    features: [
      {
        title: 'ดูความคืบหน้า',
        icon: '📈',
        steps: [
          'แสดงจำนวนครั้งที่ใช้ไป / ทั้งหมด',
          'Progress bar แสดงสัดส่วน',
          'สีแดง = ใกล้หมด, สีเขียว = ปกติ',
        ],
      },
    ],
  },
  {
    id: 'team',
    icon: '🎓',
    title: 'จัดการทีม',
    color: '#0369A1',
    bg: '#E0F2FE',
    desc: 'จัดการครูและทีมงาน',
    features: [
      {
        title: 'เพิ่ม/แก้ไขครู',
        icon: '👩‍🏫',
        steps: [
          'ดูรายชื่อครูทั้งหมดในระบบ',
          'เพิ่มครูใหม่หรือแก้ไขข้อมูล',
          'ปิดใช้งานครูที่ลาออก',
        ],
      },
    ],
  },
]

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [openFeature, setOpenFeature] = useState<string | null>(null)

  const current = sections.find(s => s.id === activeSection)!

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">📖 คู่มือการใช้งาน</h1>
        <p className="text-sm text-gray-500 mt-1">Mando House — ระบบหลังบ้านสำหรับเจ้าหน้าที่</p>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-73px)]">
        {/* Sidebar nav */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 py-4">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setOpenFeature(null) }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all text-left ${
                activeSection === s.id
                  ? 'font-semibold border-l-2'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-l-2 border-transparent'
              }`}
              style={activeSection === s.id ? { color: s.color, borderColor: s.color, background: s.bg } : {}}
            >
              <span className="text-base w-5 text-center">{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 max-w-3xl">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
              style={{ background: current.bg }}
            >
              {current.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{current.title}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{current.desc}</p>
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
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFeature(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{f.icon}</span>
                      <span className="font-semibold text-gray-800">{f.title}</span>
                    </div>
                    <span className={`text-gray-400 transition-transform text-sm ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="border-t border-gray-50 pt-4">
                        <ol className="space-y-3">
                          {f.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span
                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                                style={{ background: current.color }}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
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
          <div
            className="mt-8 rounded-2xl p-5"
            style={{ background: current.bg }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: current.color }}>เคล็ดลับ</div>
                {current.id === 'dashboard' && <p className="text-sm text-gray-600">กด Refresh หน้าถ้าข้อมูลไม่อัปเดต Dashboard ดึงข้อมูล real-time จาก Supabase</p>}
                {current.id === 'students' && <p className="text-sm text-gray-600">ถ้าต้องการ import นักเรียนหลายคนพร้อมกัน ใช้ปุ่ม "Import Excel" จะเร็วกว่าเพิ่มทีละคนมาก</p>}
                {current.id === 'checkin' && <p className="text-sm text-gray-600">พิมพ์แค่ 1-2 ตัวอักษรแรกของชื่อเล่น ระบบจะกรอง dropdown ให้ทันที หาเร็วกว่า scroll</p>}
                {current.id === 'teaching' && <p className="text-sm text-gray-600">บันทึกหัวข้อและการบ้านทุกครั้ง จะช่วยให้ Export Excel มีข้อมูลครบถ้วนสำหรับสรุปรายเดือน</p>}
                {current.id === 'receipts' && <p className="text-sm text-gray-600">ถ้าซื้อคอร์สผ่านหน้านักเรียน ระบบสร้างใบเสร็จอัตโนมัติ ไม่ต้องออกใบเสร็จซ้ำ</p>}
                {current.id === 'expenses' && <p className="text-sm text-gray-600">ใช้ฟีเจอร์ "รายจ่ายประจำทุกเดือน" สำหรับค่าเช่า ค่าเงินเดือน ที่จ่ายซ้ำทุกเดือน</p>}
                {current.id === 'alerts' && <p className="text-sm text-gray-600">แนะนำให้เช็กหน้านี้ทุกต้นสัปดาห์ เพื่อแจ้งเตือนผู้ปกครองล่วงหน้าก่อนคอร์สหมด</p>}
                {current.id === 'lessons' && <p className="text-sm text-gray-600">จำนวนครั้งอัปเดตอัตโนมัติเมื่อบันทึกชั่วโมงการสอนหรือเช็กอิน</p>}
                {current.id === 'team' && <p className="text-sm text-gray-600">ครูที่เพิ่มในหน้าจัดการทีมจะขึ้นใน dropdown ของหน้าบันทึกชั่วโมงการสอนและซื้อคอร์ส</p>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
