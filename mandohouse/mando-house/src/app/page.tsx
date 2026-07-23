'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const EMAILJS_SERVICE = 'service_h7wjciz'
const EMAILJS_TEMPLATE = 'template_s43bj5f'
const EMAILJS_KEY = 'nqHnnP_lMHfSwx1sw'

const C = {
  bg: '#F5F0E8',
  dark: '#1C2B1A',
  green: '#1C3A2A',
  gold: '#E8A020',
  goldLight: '#FEF3D0',
  text: '#2C2C2C',
  textMid: '#6B6B6B',
  border: '#E2D9CC',
}

const features = [
  { n: '01', title: 'ข้อมูลนักเรียน', desc: 'บันทึกข้อมูล ติดตามประวัติการเรียน และดูสถานะคอร์สแต่ละคนได้ทันที', featured: true },
  { n: '02', title: 'ตารางสอน', desc: 'จัดตารางเรียนรายสัปดาห์ กำหนดห้องและครู ดูภาพรวมทั้งสถาบันในหน้าเดียว', featured: false },
  { n: '03', title: 'จัดการครู', desc: 'บันทึกชั่วโมงสอน คำนวณค่าตอบแทน และดูรายงานการสอนของครูแต่ละคน', featured: false },
  { n: '04', title: 'เช็กอิน / เช็กเอาท์', desc: 'บันทึกการเข้าเรียน นับครั้งอัตโนมัติ แจ้งเตือนเมื่อคอร์สใกล้หมด', featured: false },
  { n: '05', title: 'ออกใบเสร็จ PDF', desc: 'ออกใบเสร็จได้ทันที บันทึกรายรับรายจ่าย ดาวน์โหลดเป็น PDF ได้เลย', featured: false },
  { n: '06', title: 'รายงานรายเดือน', desc: 'สรุปรายรับรายจ่ายแยกตามวิชา ดูแนวโน้มรายได้ย้อนหลัง 12 เดือน', featured: false },
  { n: '07', title: 'Export Excel', desc: 'ส่งออกข้อมูลการเงินเป็นไฟล์ Excel สำหรับทำบัญชีหรือส่งนักบัญชี', featured: false },
  { n: '08', title: 'Dashboard การเงิน', desc: 'เห็นภาพรวมรายรับ รายจ่าย และยอดคงเหลือแบบ real-time ในหน้าเดียว', featured: false },
]

const plans = [
  {
    id: '3m', name: '3 เดือน', months: 3, total: 2190, perMonth: 730, save: 180, popular: false,
    desc: 'เริ่มต้นใช้งานระยะสั้น',
  },
  {
    id: '6m', name: '6 เดือน', months: 6, total: 3990, perMonth: 665, save: 750, popular: true,
    desc: 'คุ้มค่าที่สุดสำหรับสถาบันทั่วไป',
  },
  {
    id: '12m', name: '1 ปี', months: 12, total: 6990, perMonth: 583, save: 2490, popular: false,
    desc: 'ประหยัดสูงสุด เหมือนได้ฟรี 3 เดือน',
  },
]

const allFeatures = [
  'นักเรียนไม่จำกัด',
  'ครูไม่จำกัด',
  'เช็กอิน / ออกใบเสร็จ',
  'Dashboard & รายงาน',
  'Export Excel',
  'ตารางสอน + Google Calendar',
  'Priority support',
]

function DashboardIllustration() {
  return (
    <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 520, filter: 'drop-shadow(0 20px 40px rgba(28,58,42,0.18))' }}>
      {/* bg */}
      <rect width="480" height="380" rx="14" fill="#F8F7F4"/>
      {/* sidebar */}
      <rect width="88" height="380" rx="14" fill="#1C3A2A"/>
      <rect width="12" height="380" fill="#1C3A2A"/>
      {/* logo */}
      <circle cx="44" cy="28" r="11" fill="#2D5A3D"/>
      <text x="44" y="33" textAnchor="middle" fill="#E8A020" fontSize="9" fontWeight="700">TC</text>
      {/* menu */}
      <rect x="6" y="52" width="76" height="22" rx="5" fill="#E8A020"/>
      <text x="44" y="67" textAnchor="middle" fill="#1C3A2A" fontSize="8" fontWeight="700">Dashboard</text>
      {['นักเรียน','เช็กอิน','ตารางสอน','การเงิน'].map((m,i) => (
        <text key={m} x="44" y={100 + i*20} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7.5">{m}</text>
      ))}

      {/* === ROW 1: stat cards === */}
      <rect x="100" y="12" width="118" height="60" rx="8" fill="#EBF4FF"/>
      <text x="112" y="29" fill="#6B9DC2" fontSize="7">รายรับเดือนนี้</text>
      <text x="112" y="48" fill="#1C3A2A" fontSize="13" fontWeight="700">฿ ●●,●●●</text>
      <text x="112" y="62" fill="#4A9B6F" fontSize="7">↑ +12.4%</text>

      <rect x="224" y="12" width="118" height="60" rx="8" fill="#FEF3D0"/>
      <text x="236" y="29" fill="#B8860B" fontSize="7">รายจ่ายเดือนนี้</text>
      <text x="236" y="48" fill="#1C3A2A" fontSize="13" fontWeight="700">฿ ●●,●●●</text>
      <text x="236" y="62" fill="#E8A020" fontSize="7">↓ -8.7%</text>

      <rect x="348" y="12" width="122" height="60" rx="8" fill="#E8F5EE"/>
      <text x="360" y="29" fill="#4A9B6F" fontSize="7">เงินคงเหลือ</text>
      <text x="360" y="48" fill="#1C3A2A" fontSize="13" fontWeight="700">฿ ●●,●●●</text>

      {/* === ROW 2: charts === */}
      {/* bar chart */}
      <rect x="100" y="82" width="218" height="148" rx="8" fill="white" opacity="0.85"/>
      <text x="112" y="98" fill="#2C2C2C" fontSize="8" fontWeight="600">รายรับ-รายจ่าย 6 เดือน</text>
      {[
        {x:118,h1:38,h2:28},{x:138,h1:55,h2:40},{x:158,h1:45,h2:58},
        {x:178,h1:72,h2:52},{x:198,h1:88,h2:65},{x:218,h1:62,h2:48},
      ].map((b,i) => (
        <g key={i}>
          <rect x={b.x} y={214-b.h1} width="9" height={b.h1} rx="2" fill="#1C3A2A" opacity="0.8"/>
          <rect x={b.x+11} y={214-b.h2} width="9" height={b.h2} rx="2" fill="#E8A020" opacity="0.8"/>
        </g>
      ))}
      <line x1="110" y1="214" x2="308" y2="214" stroke="#E2D9CC" strokeWidth="0.8"/>

      {/* donut chart */}
      <rect x="324" y="82" width="146" height="148" rx="8" fill="white" opacity="0.85"/>
      <text x="336" y="98" fill="#2C2C2C" fontSize="8" fontWeight="600">รายได้ตามวิชา</text>
      <circle cx="397" cy="168" r="34" fill="none" stroke="#E8A020" strokeWidth="20" strokeDasharray="85 129"/>
      <circle cx="397" cy="168" r="34" fill="none" stroke="#1C3A2A" strokeWidth="20" strokeDasharray="50 164" strokeDashoffset="-85"/>
      <circle cx="397" cy="168" r="34" fill="none" stroke="#4A9B6F" strokeWidth="20" strokeDasharray="29 185" strokeDashoffset="-135"/>
      <circle cx="397" cy="168" r="20" fill="white"/>
      <text x="397" y="165" textAnchor="middle" fill="#6B6B6B" fontSize="6">รวม</text>
      <text x="397" y="175" textAnchor="middle" fill="#1C3A2A" fontSize="8" fontWeight="700">฿●●●K</text>

      {/* === ROW 3: checkin + near expire === */}
      {/* checkin */}
      <rect x="100" y="240" width="162" height="128" rx="8" fill="white" opacity="0.85"/>
      <text x="112" y="257" fill="#2C2C2C" fontSize="8" fontWeight="600">เช็กอินวันนี้</text>
      {['A','B','C'].map((l,i) => (
        <g key={l}>
          <circle cx="120" cy={274+i*28} r="9" fill="#E8A020" opacity="0.22"/>
          <text x="120" y={278+i*28} textAnchor="middle" fill="#1C3A2A" fontSize="7" fontWeight="600">{l}</text>
          <text x="136" y={278+i*28} fill="#2C2C2C" fontSize="8">นักเรียน {l}</text>
          <circle cx="250" cy={274+i*28} r="4" fill="#4A9B6F"/>
        </g>
      ))}

      {/* near expire */}
      <rect x="270" y="240" width="200" height="128" rx="8" fill="white" opacity="0.85"/>
      <text x="282" y="257" fill="#2C2C2C" fontSize="8" fontWeight="600">ใกล้หมดคอร์ส</text>
      {['X','Y','Z'].map((l,i) => (
        <g key={l}>
          <circle cx="290" cy={274+i*28} r="9" fill="#1C3A2A" opacity="0.12"/>
          <text x="290" y={278+i*28} textAnchor="middle" fill="#1C3A2A" fontSize="7" fontWeight="600">{l}</text>
          <text x="306" y={278+i*28} fill="#2C2C2C" fontSize="8">นักเรียน {l}</text>
          <rect x="410" y={266+i*28} width="48" height="14" rx="7" fill="#FEF3D0"/>
          <text x="434" y={276+i*28} textAnchor="middle" fill="#B8860B" fontSize="6.5">เหลือ ● ครั้ง</text>
        </g>
      ))}
    </svg>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [form, setForm] = useState({ name: '', school: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const emailjsLoaded = useRef(false)
  const dashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (emailjsLoaded.current) return
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    script.onload = () => { ;(window as any).emailjs.init(EMAILJS_KEY); emailjsLoaded.current = true }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(el => el.classList.add('in')); return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.15 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  function openModal(plan: string) {
    setSelectedPlan(plan); setShowModal(true); setSubmitted(false)
    setForm({ name: '', school: '', phone: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSending(true)
    try {
      await (window as any).emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        name: form.name, school: form.school, phone: form.phone, plan: selectedPlan || 'ทดลองใช้ฟรี 30 วัน',
      })
      setSubmitted(true)
    } catch { alert('เกิดข้อผิดพลาด กรุณาลองใหม่หรือติดต่อ 063-359-5978') }
    finally { setSending(false) }
  }

  return (
    <div style={{ fontFamily: "'Noto Sans Thai', 'Inter', sans-serif", background: C.bg, color: C.text, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none}
        .nav-a{color:${C.text};font-size:14px;font-weight:500;opacity:.65;transition:opacity .15s}
        .nav-a:hover{opacity:1}
        .btn-dark{background:${C.dark};color:#fff;padding:11px 24px;border-radius:99px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;font-family:inherit;transition:opacity .15s}
        .btn-dark:hover{opacity:.85}
        .btn-outline-dark{background:transparent;color:${C.dark};border:1.5px solid ${C.dark};padding:10px 22px;border-radius:99px;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-family:inherit;transition:all .15s}
        .btn-outline-dark:hover{background:${C.dark};color:#fff}
        .feat-card{background:#fff;border:1px solid ${C.border};border-radius:14px;padding:24px 20px;transition:box-shadow .2s}
        .feat-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.08)}
        .feat-card-featured{background:${C.green};border-radius:14px;padding:24px 20px}
        input[type=text],input[type=tel]{width:100%;padding:10px 14px;border:1.5px solid ${C.border};border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s;background:#fff;color:${C.text}}
        input:focus{border-color:${C.green}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        html{scroll-behavior:smooth}
        #features,#pricing,#how,#contact{scroll-margin-top:80px}
        .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s ease}
        .reveal.in{opacity:1;transform:none}
        .plan-card{transition:transform .2s ease,box-shadow .2s ease}
        .plan-card:hover{transform:translateY(-6px);box-shadow:0 14px 34px rgba(28,58,42,.16)}
        .pop-badge{animation:badgepulse 1.8s ease-in-out infinite}
        @keyframes badgepulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.08)}}
        @media(prefers-reduced-motion:reduce){.reveal{opacity:1!important;transform:none!important}.pop-badge{animation:none}html{scroll-behavior:auto}}
        @media(max-width:900px){
          .hero-grid{grid-template-columns:1fr!important}
          .dash-img{display:none}
          .hero-h1{font-size:38px!important}
        }
        @media(max-width:768px){
          .feat-grid{grid-template-columns:1fr 1fr!important}
          .plan-grid{grid-template-columns:1fr!important}
          .nav-links{display:none!important}
          .nav-login{display:none!important}
          .step-grid{grid-template-columns:1fr!important}
          .contact-row{flex-direction:column!important}
          .section-pad{padding-left:16px!important;padding-right:16px!important}
          .hero-pad{padding:48px 16px 64px!important}
          .footer-pad{padding:16px!important}
        }
        @media(max-width:480px){
          .feat-grid{grid-template-columns:1fr!important}
          .hero-h1{font-size:28px!important}
          .plan-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,43,26,.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400 }}>
            {!submitted ? (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>ทดลองใช้ฟรี 30 วัน</h2>
                <p style={{ fontSize: 13, color: C.textMid, marginBottom: 22, lineHeight: 1.6 }}>
                  {selectedPlan ? <>แพ็กเกจ <strong style={{ color: C.green }}>{selectedPlan}</strong> — </> : null}ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'ชื่อผู้ติดต่อ', key: 'name', placeholder: 'ชื่อ-นามสกุล', type: 'text' },
                    { label: 'ชื่อสถาบัน', key: 'school', placeholder: 'ชื่อสถาบันของคุณ', type: 'text' },
                    { label: 'เบอร์โทรศัพท์', key: 'phone', placeholder: '0XX-XXX-XXXX', type: 'tel' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6 }}>{f.label}</label>
                      <input type={f.type} required placeholder={f.placeholder}
                        value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="submit" disabled={sending} className="btn-dark" style={{ flex: 1, justifyContent: 'center', opacity: sending ? .6 : 1, borderRadius: 8 }}>
                      {sending ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)}
                      style={{ flex: 1, padding: '11px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', color: C.text, fontSize: 14 }}>
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>ส่งข้อมูลสำเร็จ</h2>
                <p style={{ fontSize: 14, color: C.textMid, marginBottom: 22, lineHeight: 1.75 }}>
                  ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง<br />
                  <span style={{ color: C.green, fontWeight: 500 }}>063-359-5978</span>
                </p>
                <button onClick={() => setShowModal(false)} className="btn-dark" style={{ padding: '11px 32px', borderRadius: 8 }}>ปิด</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(245,240,232,.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        padding: '0 16px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
        transition: 'all .2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Inter',sans-serif", color: C.gold, fontWeight: 900, fontSize: 13 }}>T</span>
            </div>
            <span style={{ fontFamily: "'Inter',sans-serif", color: C.text, fontWeight: 700, fontSize: 17, letterSpacing: '-.3px' }}>
              Tutor<em style={{ fontStyle: 'italic', color: C.green }}>cloud</em>
            </span>
          </div>
          <div className="nav-links" style={{ display: 'flex', gap: 28 }}>
            <a href="#features" className="nav-a">Features</a>
            <a href="#pricing" className="nav-a">Pricing</a>
            <a href="/guide" className="nav-a">Guide</a>
            <a href="#contact" className="nav-a">Contact</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" className="nav-a nav-login">Login</Link>
          <button onClick={() => openModal('')} className="btn-dark nav-login">Try Free ↗</button>
        </div>
      </nav>

      {/* HERO — cream bg + shimmer TUTORCLOUD */}
      <div className="hero-pad" style={{ position: 'relative', overflow: 'hidden', background: C.bg, padding: '80px 48px 96px' }}>
        {/* shimmer text */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Inter',sans-serif",
          fontSize: 'clamp(100px, 18vw, 200px)',
          fontWeight: 900, letterSpacing: -12,
          whiteSpace: 'nowrap', userSelect: 'none',
          textTransform: 'uppercase',
          background: 'linear-gradient(105deg, transparent 15%, rgba(28,58,42,0.1) 35%, rgba(28,58,42,0.18) 50%, rgba(28,58,42,0.1) 65%, transparent 85%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          backgroundSize: '300% 100%',
          animation: 'shimmer 5s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }}>TUTORCLOUD</div>

        {/* vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 28% 50%, transparent 10%, rgba(245,240,232,0.75) 55%, #F5F0E8 80%)',
          pointerEvents: 'none', zIndex: 1,
        }} />

        <div className="hero-grid" style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
          {/* left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border}`, color: C.textMid, fontSize: 12, padding: '5px 14px', borderRadius: 99, marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4A9B6F', display: 'inline-block' }} />
              ทดลองใช้ฟรี 30 วัน · ไม่ต้องใส่บัตรเครดิต
            </div>
            <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2, marginBottom: 20, letterSpacing: '-1px' }}>
              <span style={{ color: C.dark }}>ระบบหลังบ้าน</span><br />
              <span style={{ color: C.dark }}>สถาบันสอนพิเศษ</span><br />
              <em style={{ fontStyle: 'italic', color: C.gold }}>ครบ จบ</em>
              <span style={{ color: C.dark }}> ในที่เดียว</span>
            </h1>
            <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.85, marginBottom: 36, maxWidth: 420 }}>
              จัดการนักเรียน ครู ตารางเรียน และการเงิน<br />ใช้งานได้ทันที บนมือถือและคอมพิวเตอร์
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => openModal('')} className="btn-dark" style={{ fontSize: 15, padding: '13px 28px' }}>ทดลองใช้ฟรี 30 วัน ↗</button>
              <Link href="/login" className="btn-outline-dark" style={{ fontSize: 15, padding: '12px 24px' }}>เข้าสู่ระบบ →</Link>
            </div>
          </div>

          {/* right — dashboard */}
          <div className="dash-img" style={{ perspective: 900 }}
            onMouseMove={(e) => {
              const el = dashRef.current; if (!el) return
              const r = e.currentTarget.getBoundingClientRect()
              const x = (e.clientX - r.left) / r.width - 0.5
              const y = (e.clientY - r.top) / r.height - 0.5
              el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`
            }}
            onMouseLeave={() => { if (dashRef.current) dashRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)' }}>
            <div ref={dashRef} style={{ transition: 'transform .15s ease-out', transformStyle: 'preserve-3d' }}>
              <DashboardIllustration />
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="section-pad reveal" style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>ฟีเจอร์</div>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.5px', lineHeight: 1.2 }}>
            ทุกอย่างที่สถาบัน<br />
            <em style={{ fontStyle: 'italic', color: C.gold }}>ต้องการจริง ๆ</em>
          </h2>
        </div>
        <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {features.map((f, i) => (
            <div key={f.n} className={i === 0 ? 'feat-card-featured' : 'feat-card'}>
              <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? 'rgba(255,255,255,.4)' : C.textMid, letterSpacing: '.1em', marginBottom: 12 }}>{f.n}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: i === 0 ? '#fff' : C.dark }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: i === 0 ? 'rgba(255,255,255,.65)' : C.textMid, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="section-pad reveal" style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: C.green, borderRadius: 24, padding: '64px 56px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>เริ่มต้น</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 48, letterSpacing: '-.5px' }}>
            พร้อมใช้งานใน <em style={{ fontStyle: 'italic', color: C.gold }}>3 ขั้นตอน</em>
          </h2>
          <div className="step-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {[
              { n: '01', title: 'สมัครและตั้งค่า', desc: 'กรอกชื่อสถาบัน ใส่โลโก้ และข้อมูลเบื้องต้น ใช้เวลาไม่เกิน 5 นาที' },
              { n: '02', title: 'นำเข้าข้อมูล', desc: 'นำเข้านักเรียน ครู และคอร์สจาก Excel หรือเพิ่มทีละคนก็ได้' },
              { n: '03', title: 'ใช้งานได้เลย', desc: 'เช็กอิน ออกใบเสร็จ และดู Dashboard ได้ทันที ไม่ต้องรอ' },
            ].map(s => (
              <div key={s.n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.gold, display: 'inline-block' }} />
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,.2)' }}>{s.n}</span>
                </div>
                <div style={{ width: 32, height: 2, background: C.gold, borderRadius: 2, marginBottom: 14, opacity: .5 }} />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" className="section-pad reveal" style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>ราคา</div>
          <h2 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8 }}>
            เลือกแพ็กเกจที่<br />
            <em style={{ fontStyle: 'italic', color: C.gold }}>เหมาะกับสถาบัน</em>
          </h2>
          <p style={{ color: C.textMid, fontSize: 15 }}>ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต · ยกเลิกได้ทุกเมื่อ</p>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 14, color: C.textMid }}>
          ราคาปกติ <span style={{ textDecoration: 'line-through' }}>฿790/เดือน</span> — ยิ่งซื้อนาน ยิ่งถูกลง
        </div>
        <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 900, margin: '0 auto' }}>
          {plans.map(plan => (
            <div key={plan.id} className="plan-card" style={{ background: plan.popular ? C.green : '#fff', border: `1.5px solid ${plan.popular ? C.green : C.border}`, borderRadius: 20, padding: '28px 22px', position: 'relative' }}>
              {plan.popular && (
                <div className="pop-badge" style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: C.gold, color: C.dark, fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>★ คุ้มที่สุด</div>
              )}
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, color: plan.popular ? 'rgba(255,255,255,.7)' : C.dark, marginBottom: 12 }}>{plan.name}</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 38, fontWeight: 800, color: plan.popular ? '#fff' : C.dark, letterSpacing: '-1.5px' }}>฿{plan.perMonth}</span>
                <span style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,.6)' : C.textMid, marginLeft: 4 }}>/เดือน</span>
              </div>
              <div style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,.65)' : C.textMid, marginBottom: 6 }}>
                จ่าย ฿{plan.total.toLocaleString()} ครั้งเดียว
              </div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: plan.popular ? C.gold : '#0F6E56', background: plan.popular ? 'rgba(232,160,32,.15)' : '#E8F5EE', padding: '3px 10px', borderRadius: 99, marginBottom: 18 }}>
                ประหยัด ฿{plan.save.toLocaleString()}
              </div>
              <p style={{ fontSize: 12.5, color: plan.popular ? 'rgba(255,255,255,.55)' : C.textMid, marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${plan.popular ? 'rgba(255,255,255,.1)' : C.border}`, minHeight: 34 }}>{plan.desc}</p>
              <div style={{ marginBottom: 22 }}>
                {allFeatures.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: plan.popular ? 'rgba(232,160,32,.2)' : '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke={plan.popular ? C.gold : '#4A9B6F'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: 12.5, color: plan.popular ? '#fff' : C.dark }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => openModal(plan.name)} style={{ width: '100%', padding: '12px', borderRadius: 99, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: plan.popular ? C.gold : C.bg, color: plan.popular ? C.dark : C.text }}>
                ทดลองใช้ฟรี 30 วัน
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="section-pad reveal" style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: '56px 40px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.4 7.4H21l-6.2 4.5 2.4 7.4L11 17l-6.2 4.3 2.4-7.4L1 9.4h7.6z" fill={C.gold}/></svg>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-.5px', marginBottom: 10 }}>
            พร้อมเริ่มต้น <em style={{ fontStyle: 'italic', color: C.gold }}>วันนี้</em>
          </h2>
          <p style={{ color: C.textMid, fontSize: 15, marginBottom: 28, lineHeight: 1.75 }}>ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกมัด มีทีมช่วย onboarding ตั้งแต่วันแรก</p>
          <button onClick={() => openModal('')} className="btn-dark" style={{ fontSize: 15, padding: '13px 32px' }}>ทดลองใช้ฟรี 30 วัน ↗</button>
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" className="section-pad reveal" style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>ติดต่อเรา</div>
          <h2 style={{ fontSize: 30, fontWeight: 700 }}>มีคำถาม? ทีมงานพร้อมช่วยเสมอ</h2>
        </div>
        <div className="contact-row" style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <a href="https://www.facebook.com/profile.php?id=61591839025304" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 24px', color: C.text, minWidth: 240 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 10H10.8v6H8.8v-6H7V8h1.8V6.8c0-1.5.7-2.8 2.3-2.8H13V6h-1.2c-.6 0-.8.3-.8.8V8H13l-.3 2z" fill="white"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textMid, marginBottom: 2 }}>Facebook</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Tutorcloud ระบบจัดการสถาบัน</div>
            </div>
            <span style={{ marginLeft: 'auto', color: C.textMid }}>↗</span>
          </a>
          <a href="tel:0633595978"
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 24px', color: C.text, minWidth: 240 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.goldLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 3h3.5l1.5 4-2 1.5a10 10 0 005 5L11.5 11.5l4 1.5V16c0 .8-.7 1.2-1.5 1C4 15 1 8 1 4.5c0-.8.5-1.5 1-1.5z" fill={C.gold}/></svg>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.textMid, marginBottom: 2 }}>โทรศัพท์</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>063-359-5978</div>
            </div>
            <span style={{ marginLeft: 'auto', color: C.textMid }}>↗</span>
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <div className="footer-pad" style={{ borderTop: `1px solid ${C.border}`, padding: '24px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Inter',sans-serif", color: C.gold, fontWeight: 900, fontSize: 10 }}>T</span>
            </div>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid }}>Tutor<em style={{ fontStyle: 'italic' }}>cloud</em></span>
          </div>
          <span style={{ fontSize: 12, color: C.textMid }}>© 2026 Tutorcloud · ระบบจัดการสถาบันสอนพิเศษ</span>
        </div>
      </div>
    </div>
  )
}
