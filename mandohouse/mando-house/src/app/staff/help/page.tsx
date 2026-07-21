'use client'
// src/app/staff/help/page.tsx
import { useState } from 'react'

const sections = [
  {
    id: 'dashboard', title: 'Dashboard', color: '#0F6E56', darkBg: 'rgba(15,110,86,0.15)', desc: 'ภาพรวมของระบบทั้งหมด',
    features: [
      { title: 'การ์ดการเงิน 4 ใบ', icon: '💰', steps: ['รายรับเดือนนี้ — ยอดรวมจากใบเสร็จเดือนนี้ คลิกไปหน้ารายรับ','รายจ่ายเดือนนี้ — ยอดรวมรายจ่ายเดือนนี้ คลิกไปหน้ารายจ่าย','กำไร/ขาดทุนเดือนนี้ — รายรับ ลบ รายจ่าย คลิกไปหน้า Finance','เงินคงเหลือ — ยอดยกมา บวก รายรับ ลบ รายจ่าย คลิกไปหน้า Finance'] },
      { title: 'ปฏิทิน', icon: '📅', steps: ['แสดงปฏิทินเดือนปัจจุบัน','วันที่มีตารางสอนจะถูก highlight','คลิกวันเพื่อดูตารางสอนของวันนั้น'] },
      { title: 'กราฟแท่ง 6 เดือน', icon: '📊', steps: ['แสดงรายรับ (สีน้ำเงิน) และรายจ่าย (สีส้ม) ย้อนหลัง 6 เดือน','ดูแนวโน้มรายรับ-รายจ่ายของสถาบัน'] },
      { title: 'กราฟวงกลมรายได้ตามวิชา', icon: '🎯', steps: ['แสดงสัดส่วนรายได้แยกตามวิชา — จีน / คณิต / อังกฤษ / อื่นๆ','คำนวณจากใบเสร็จในเดือนปัจจุบัน'] },
      { title: 'เช็กอินวันนี้', icon: '🕐', steps: ['แสดงรายชื่อนักเรียนที่เช็กอินวันนี้ล่าสุด 10 คน','จุดเขียว = ยังอยู่ในสถาบัน ไม่มีจุด = ออกแล้ว','คลิก "จัดการ" เพื่อไปหน้าเช็กอิน'] },
      { title: 'ตารางเรียนวันนี้', icon: '🗓', steps: ['แสดงตารางสอนจาก Google Calendar ของวันนี้','อัปเดตแบบ real-time'] },
      { title: 'ใกล้หมดคอร์ส', icon: '⚠️', steps: ['แสดงนักเรียนที่เหลือ 0-1 ครั้งอัตโนมัติ','badge แดง = หมดแล้ว, badge เหลือง = เหลือ 1 ครั้ง'] },
      { title: 'รอซื้อคอร์สใหม่', icon: '🔄', steps: ['แสดงนักเรียนที่เรียนครบทุกครั้งแล้ว (status = completed)','เฉพาะคนที่ไม่มีคอร์ส active เหลืออยู่เลย','คลิกชื่อเพื่อไปหน้านักเรียน แล้วกด "+ ซื้อคอร์ส"'] },
    ],
  },
  {
    id: 'students', title: 'ข้อมูลนักเรียน', color: '#7C3AED', darkBg: 'rgba(124,58,237,0.15)', desc: 'จัดการข้อมูลนักเรียนทั้งหมด',
    features: [
      { title: 'ดูข้อมูลนักเรียน', icon: '👤', steps: ['กรองดู Active / Inactive / ทั้งหมด','ค้นหาด้วยชื่อ ชื่อเล่น หรือผู้ปกครอง','คลิกชื่อนักเรียนเพื่อดูรายละเอียด ประวัติคอร์ส และประวัติเช็กอิน'] },
      { title: 'เพิ่มนักเรียนใหม่', icon: '➕', steps: ['กดปุ่ม "+ เพิ่มนักเรียน" มุมขวาบน','กรอกชื่อ-นามสกุล ชื่อเล่น โรงเรียน เบอร์โทร','กด "บันทึก"'] },
      { title: 'ซื้อคอร์ส', icon: '📚', steps: ['คลิกชื่อนักเรียน แล้วกดปุ่ม "+ ซื้อคอร์ส"','เลือกคอร์สและครูผู้สอน','กรอกจำนวนครั้ง ราคา และวันที่','ระบบสร้างใบเสร็จอัตโนมัติถ้ากรอกราคา','enrollment เปลี่ยนเป็น active ทันที พร้อมเช็กอินได้เลย'] },
      { title: 'Import/Export Excel', icon: '📥', steps: ['Export — ดาวน์โหลดรายชื่อนักเรียนทั้งหมดพร้อมครูผู้สอน','Import — อัปโหลดไฟล์ Excel ที่มีคอลัมน์ตามแบบฟอร์มที่กำหนด'] },
    ],
  },
  {
    id: 'checkin', title: 'เช็กอิน / เช็กเอาท์', color: '#0369A1', darkBg: 'rgba(3,105,161,0.15)', desc: 'บันทึกเวลาเข้าออกของนักเรียน',
    features: [
      { title: 'เช็กอินด่วน', icon: '✓', steps: ['พิมพ์ชื่อหรือชื่อเล่นในช่องค้นหา แล้วเลือกนักเรียน','เลือกครูผู้สอน (จำเป็น)','เลือกวิชา ระยะเวลา หัวข้อ และการบ้าน (ถ้ามี)','กดปุ่ม "เช็กอิน"','ระบบแสดง popup สรุปพร้อม progress bar ครั้งที่เรียน'] },
      { title: 'ระบบ block เมื่อครบจำนวนครั้ง', icon: '🚫', steps: ['ถ้าเรียนครบแล้ว ระบบแสดงแถบแดง "เรียนครบ X ครั้งแล้ว"','ปุ่มเช็กอินถูก disable อัตโนมัติ กดไม่ได้','ต้องไปซื้อคอร์สใหม่ที่หน้านักเรียนก่อน จึงจะเช็กอินได้','เมื่อเช็กอินครั้งสุดท้าย ระบบเปลี่ยน status เป็น completed อัตโนมัติ'] },
      { title: 'บันทึกย้อนหลัง', icon: '📅', steps: ['เปิด toggle "บันทึกย้อนหลัง" ใต้ฟอร์มเช็กอิน','เลือกวันที่และเวลาที่ต้องการบันทึก','เลือกนักเรียนและครู แล้วกด "บันทึกย้อนหลัง"','ระบบจัดเรียงลำดับครั้งที่เรียนใหม่ให้ถูกต้องอัตโนมัติ'] },
      { title: 'จัดการรายการ', icon: '📝', steps: ['"บันทึก" — บันทึกหัวข้อที่สอนหรือการบ้านหลังเช็กอินแล้ว','"แก้ไข" — แก้ไขเวลาเช็กอิน/เช็กเอาท์','"ลบ" — ลบรายการ (มี Undo 6 วินาที)','"สรุป" — ดูสรุปทุกคอร์สของนักเรียน พร้อมคัดลอกส่งผู้ปกครอง'] },
      { title: 'คัดลอกสรุปส่งผู้ปกครอง', icon: '📋', steps: ['กดปุ่ม "สรุป" ในแถวรายชื่อ หรือจาก popup หลังเช็กอิน','ระบบแสดงประวัติการเรียนทุกคอร์สที่ active','กด "คัดลอกส่งผู้ปกครอง" — ได้ข้อความสรุปพร้อมวาง LINE ทันที','ข้อความรวมชื่อนักเรียน คอร์ส ประวัติทุกครั้ง และสถานะเหลือกี่ครั้ง'] },
      { title: 'Tab สรุปรายคน', icon: '🔍', steps: ['คลิก tab "สรุปรายคน" ในฝั่งรายชื่อ','พิมพ์ชื่อหรือชื่อเล่นนักเรียน','ระบบแสดงสรุปทุกคอร์สที่กำลังเรียน พร้อม progress และประวัติ','กด "คัดลอกส่งผู้ปกครอง" ได้เลยโดยไม่ต้องรอ popup'] },
    ],
  },
  {
    id: 'teaching', title: 'ชั่วโมงสอน', color: '#0F6E56', darkBg: 'rgba(15,110,86,0.15)', desc: 'ติดตามการสอนของครูแต่ละคน',
    features: [
      { title: 'บันทึกชั่วโมงการสอน', icon: '➕', steps: ['กดปุ่ม "+ บันทึกชั่วโมงการสอน"','เลือกครูผู้สอน (หรือกด "+ เพิ่มครูใหม่")','เลือกนักเรียน/คอร์ส วันที่ และระยะเวลา (30/45/60/90/120 นาที)','กรอกหัวข้อที่สอนและการบ้าน แล้วกด "บันทึก"'] },
      { title: 'เพิ่มครูใหม่', icon: '👩‍🏫', steps: ['ใน Modal บันทึกชั่วโมง กดปุ่ม "+ เพิ่มครูใหม่"','กรอกชื่อครูและวิชาที่สอน','กด "เพิ่มครู" — ครูจะขึ้นใน dropdown ทันที'] },
      { title: 'ดูประวัติการสอน', icon: '📋', steps: ['เลือกเดือนและครูที่ต้องการดู','คลิกแถวเพื่อดูรายละเอียดหัวข้อและการบ้าน','กด "แก้ไข" เพื่อแก้ไขข้อมูล'] },
      { title: 'Export Excel', icon: '📊', steps: ['กด "Export Excel (.xlsx)" มุมขวาบน','ไฟล์รวมชั่วโมงสอนของทุกครูในเดือนที่เลือก'] },
    ],
  },
  {
    id: 'teachers', title: 'ครูผู้สอน', color: '#D97706', darkBg: 'rgba(217,119,6,0.15)', desc: 'จัดการข้อมูลครูและ PIN',
    features: [
      { title: 'เพิ่มครูใหม่', icon: '➕', steps: ['กดปุ่ม "+ เพิ่มครู" มุมขวาบน','กรอกชื่อครู วิชาที่สอน และตั้ง PIN 4 หลัก','กด "บันทึก" — ครูจะขึ้นใน dropdown ทุกหน้าทันที'] },
      { title: 'แก้ไขข้อมูลครู', icon: '✎', steps: ['คลิกชื่อครูเพื่อเปิด Modal แก้ไข','แก้ไขชื่อ วิชา หรือ PIN','กด "บันทึก"'] },
      { title: 'ปิดใช้งานครู', icon: '🔒', steps: ['กดปุ่ม "ปิดใช้งาน" ในการ์ดครู','ครูที่ปิดใช้งานจะไม่ขึ้นใน dropdown เช็กอิน','กด "เปิดใช้งาน" เพื่อเปิดอีกครั้ง'] },
    ],
  },
  {
    id: 'schedule', title: 'ตารางสอน', color: '#0369A1', darkBg: 'rgba(3,105,161,0.15)', desc: 'ตารางสอนจาก Google Calendar',
    features: [
      { title: 'ดูตารางสอน', icon: '📅', steps: ['ตารางดึงข้อมูลจาก Google Calendar อัตโนมัติ','ดูได้ 3 โหมด: วัน / สัปดาห์ / เดือน','กด "รีเฟรช" เพื่ออัปเดตข้อมูลล่าสุด'] },
      { title: 'เชื่อมต่อ Google Calendar', icon: '🔗', steps: ['กดลิ้งก์ "เชื่อมต่อบัญชี" ใต้ชื่อวันที่','เลือก Google account ที่ต้องการ','กด Allow เพื่อให้สิทธิ์อ่านปฏิทิน','ทำซ้ำสำหรับแต่ละ account ครู'] },
    ],
  },
  {
    id: 'courses', title: 'คอร์สและราคา', color: '#0F6E56', darkBg: 'rgba(15,110,86,0.15)', desc: 'จัดการคอร์สเรียนและหนังสือ',
    features: [
      { title: 'เพิ่มคอร์สใหม่', icon: '➕', steps: ['กด "+ เพิ่มคอร์ส"','กรอกชื่อคอร์ส วิชา จำนวนครั้ง ราคา','เลือกประเภท: คอร์สปกติ / Special','กด "บันทึก"'] },
      { title: 'คอร์ส Special', icon: '⭐', steps: ['ไม่นับจำนวนครั้ง ไม่มีการ block','เหมาะสำหรับคอร์สรายเดือนหรือ package พิเศษ'] },
      { title: 'จัดการหนังสือ', icon: '📚', steps: ['กดแท็บ "หนังสือและอื่นๆ"','เพิ่มหนังสือหรืออุปกรณ์พร้อมราคา','รายการจะขึ้นใน dropdown ออกใบเสร็จ'] },
    ],
  },
  {
    id: 'receipts', title: 'รายรับ (ใบเสร็จ)', color: '#0F6E56', darkBg: 'rgba(15,110,86,0.15)', desc: 'ออกและจัดการใบเสร็จรับเงิน',
    features: [
      { title: 'ออกใบเสร็จใหม่', icon: '🧾', steps: ['กด "+ ออกใบเสร็จ"','เลือกนักเรียน — ระบบดึงราคาคอร์สอัตโนมัติ','เลือกวันที่และช่องทางชำระ แล้วกด "ออกใบเสร็จ"'] },
      { title: 'พิมพ์ใบเสร็จ', icon: '🖨', steps: ['กดปุ่มพิมพ์ในแถวใบเสร็จ','หน้าต่างพิมพ์จะเปิดขึ้นอัตโนมัติ','ใบเสร็จมีโลโก้ ชื่อสถาบัน เบอร์โทร'] },
      { title: 'แก้ไขใบเสร็จ', icon: '✎', steps: ['กดปุ่มแก้ไขเพื่อแก้ไขจำนวนเงิน วันที่ หรือช่องทางชำระ','กด "บันทึก"'] },
    ],
  },
  {
    id: 'expenses', title: 'รายจ่าย', color: '#DC2626', darkBg: 'rgba(220,38,38,0.15)', desc: 'บันทึกและติดตามค่าใช้จ่าย',
    features: [
      { title: 'บันทึกรายจ่าย', icon: '➕', steps: ['กด "+ บันทึกรายจ่าย"','เลือกหมวดหมู่ (ค่าครู / ค่าเช่า / ค่าไฟ ฯลฯ)','กรอกชื่อรายจ่าย จำนวนเงิน วันที่ และช่องทางชำระ','ติ๊ก "รายจ่ายประจำทุกเดือน" ถ้าต้องการ'] },
      { title: 'ดูสรุปรายจ่าย', icon: '📊', steps: ['เลือกเดือนที่ต้องการดูจาก dropdown มุมขวาบน','กราฟ 6 เดือนแสดงรายรับ-รายจ่าย','ฝั่งขวาแสดงสัดส่วนแยกตามหมวดหมู่','เลื่อนดูตารางรายการซ้ายขวาบนมือถือได้'] },
    ],
  },
  {
    id: 'finance', title: 'Finance', color: '#0F6E56', darkBg: 'rgba(15,110,86,0.15)', desc: 'ภาพรวมการเงินและตั้งค่ายอดยกมา',
    features: [
      { title: 'ตั้งค่ายอดยกมา', icon: '💰', steps: ['กดปุ่ม "แก้ไข" ที่การ์ดยอดยกมา','กรอกยอดเงินคงเหลือจากเดือนที่แล้ว','กด "บันทึก" — ระบบใช้ตัวเลขนี้คำนวณเงินคงเหลือใน Dashboard'] },
      { title: 'Export รายงานรายเดือน', icon: '📥', steps: ['เลือกเดือนที่ต้องการ Export','กด "Download" เพื่อดาวน์โหลดไฟล์ Excel','ไฟล์รวมรายรับ รายจ่าย และกำไรของเดือนนั้น'] },
    ],
  },
  {
    id: 'team', title: 'จัดการทีม', color: '#7C3AED', darkBg: 'rgba(124,58,237,0.15)', desc: 'จัดการสมาชิกทีมงาน',
    features: [
      { title: 'ดูข้อมูลทีมงาน', icon: '👥', steps: ['แสดงรายชื่อทุกคนพร้อมสถิติ — นักเรียน, Active, รีวิว, เช็กอิน 30 วัน','สถิติอัปเดตอัตโนมัติจากข้อมูลจริงในระบบ'] },
      { title: 'เพิ่มเจ้าหน้าที่ใหม่', icon: '➕', steps: ['กดปุ่ม "+ เพิ่มเจ้าหน้าที่" มุมขวาบน','เพิ่ม user ใน Supabase Authentication → คัดลอก User ID → รัน SQL ที่ระบบสร้างให้','ทุกคนในทีมมีสิทธิ์เท่ากัน — เช็กอิน บันทึกบทเรียน ออกใบเสร็จ ได้ทุกอย่าง'] },
      { title: 'แก้ไขข้อมูล', icon: '✎', steps: ['กดปุ่ม "แก้ไข" ในการ์ดสมาชิก','แก้ไขชื่อ เบอร์โทร LINE ID แล้วกด "บันทึก"'] },
    ],
  },
]

const tips: Record<string, string> = {
  dashboard: 'กด Refresh หน้าถ้าข้อมูลไม่อัปเดต Dashboard ดึงข้อมูล real-time จาก Supabase',
  students: 'ถ้าต้องการ import นักเรียนหลายคนพร้อมกัน ใช้ปุ่ม "Import Excel" จะเร็วกว่าเพิ่มทีละคนมาก',
  checkin: 'กดปุ่ม "สรุป" ในแถวรายชื่อเพื่อดูและคัดลอกสรุปส่งผู้ปกครองได้เลย โดยไม่ต้องรอ popup หลังเช็กอิน',
  teaching: 'บันทึกหัวข้อและการบ้านทุกครั้ง จะช่วยให้ Export Excel มีข้อมูลครบถ้วนสำหรับสรุปรายเดือน',
  teachers: 'ครูที่เพิ่มในหน้านี้จะขึ้นใน dropdown ของหน้าเช็กอินและบันทึกชั่วโมงสอนทันที',
  schedule: 'ตารางสอนดึงจาก Google Calendar อัตโนมัติ ถ้าไม่ขึ้นให้ตรวจสอบการเชื่อมต่อ Google Calendar',
  courses: 'คอร์สที่ลบแล้วไม่กระทบ enrollment ที่มีอยู่แล้ว นักเรียนยังเรียนต่อได้ปกติ',
  receipts: 'ถ้าซื้อคอร์สผ่านหน้านักเรียน ระบบสร้างใบเสร็จอัตโนมัติ ไม่ต้องออกใบเสร็จซ้ำ',
  expenses: 'ใช้ฟีเจอร์ "รายจ่ายประจำทุกเดือน" สำหรับค่าเช่า ค่าเงินเดือน ที่จ่ายซ้ำทุกเดือน',
  finance: 'ตั้งค่ายอดยกมาทุกต้นเดือน เพื่อให้ยอดเงินคงเหลือใน Dashboard แม่นยำ',
  team: 'ทุกคนในทีมมีสิทธิ์เท่ากันหมด ไม่มีระดับ admin/staff แยกกัน',
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [openFeature, setOpenFeature] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const current = sections.find(s => s.id === activeSection)!

  const selectSection = (id: string) => {
    setActiveSection(id)
    setOpenFeature(null)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] dark:bg-[#1a2030]">

      {/* Header */}
      <div className="bg-white dark:bg-[#242d3f] border-b border-gray-100 dark:border-[#2a3245]">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">คู่มือการใช้งาน</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Mando House — ระบบหลังบ้านสำหรับเจ้าหน้าที่</p>
        </div>

        {/* Mobile section selector */}
        <div className="md:hidden border-t border-gray-100 dark:border-[#2a3245]">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm"
            style={{ color: current.color }}
          >
            <span className="font-semibold">{current.title}</span>
            <span className="text-gray-400 text-xs">{mobileMenuOpen ? '▲' : '▼'} เลือกหัวข้อ</span>
          </button>
          {mobileMenuOpen && (
            <div className="border-t border-gray-100 dark:border-[#2a3245] max-h-60 overflow-y-auto">
              {sections.map(s => (
                <button key={s.id} onClick={() => selectSection(s.id)}
                  className="w-full text-left px-4 py-2.5 text-sm border-l-2"
                  style={activeSection === s.id
                    ? { color: s.color, borderColor: s.color, background: s.darkBg, fontWeight: 600 }
                    : { borderColor: 'transparent', color: '#6b7280' }
                  }>
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-73px)]">

        {/* Sidebar desktop only */}
        <aside className="hidden md:block w-56 flex-shrink-0 bg-white dark:bg-[#242d3f] border-r border-gray-100 dark:border-[#2a3245] py-4">
          {sections.map(s => (
            <button key={s.id} onClick={() => selectSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left border-l-2`}
              style={activeSection === s.id
                ? { color: s.color, borderColor: s.color, background: s.darkBg, fontWeight: 600 }
                : { borderColor: 'transparent', color: '#6b7280' }
              }>
              {s.title}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 max-w-3xl w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ background: current.darkBg }}>
              <span className="text-lg font-bold" style={{ color: current.color }}>
                {current.title.slice(0, 1)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{current.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{current.desc}</p>
            </div>
          </div>

          <div className="space-y-3">
            {current.features.map((f, i) => {
              const key = `${current.id}-${i}`
              const isOpen = openFeature === key
              return (
                <div key={key} className="bg-white dark:bg-[#242d3f] rounded-2xl border border-gray-100 dark:border-[#2a3245] overflow-hidden shadow-sm">
                  <button onClick={() => setOpenFeature(isOpen ? null : key)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50/50 dark:hover:bg-[#2a3245]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{f.icon}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{f.title}</span>
                    </div>
                    <span className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <div className="border-t border-gray-100 dark:border-[#2a3245] pt-3">
                        <ol className="space-y-2.5">
                          {f.steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                                style={{ background: current.color }}>
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

          <div className="mt-6 rounded-2xl p-4" style={{ background: current.darkBg }}>
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: current.color }}>เคล็ดลับ</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{tips[current.id]}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
