'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const EMAILJS_SERVICE = 'service_h7wjciz'
const EMAILJS_TEMPLATE = 'template_s43bj5f'
const EMAILJS_KEY = 'nqHnnP_lMHfSwx1sw'

const C = {
  cream: '#F7F1F0',
  rose: '#C3A6A0',
  brown: '#A15C38',
  dark: '#262220',
  brownLight: '#f5ede9',
  brownMid: '#e8d5cc',
}

const features = [
  {
    group: 'จัดการสถาบัน',
    items: [
      { title: 'ข้อมูลนักเรียน', desc: 'บันทึกข้อมูล ติดตามประวัติการเรียน และดูสถานะคอร์สของนักเรียนแต่ละคนได้ทันที' },
      { title: 'ตารางสอน', desc: 'จัดตารางเรียนรายสัปดาห์ กำหนดห้องและครู ดูภาพรวมทั้งสถาบันในหน้าเดียว' },
      { title: 'จัดการครู', desc: 'บันทึกชั่วโมงสอน คำนวณค่าตอบแทน และดูรายงานการสอนของครูแต่ละคน' },
      { title: 'เช็กอิน / เช็กเอาท์', desc: 'บันทึกการเข้าเรียน นับครั้งอัตโนมัติ แจ้งเตือนเมื่อคอร์สใกล้หมด' },
    ],
  },
  {
    group: 'การเงิน',
    items: [
      { title: 'ออกใบเสร็จ PDF', desc: 'ออกใบเสร็จได้ทันที บันทึกรายรับรายจ่าย ดาวน์โหลดเป็น PDF ได้เลย' },
      { title: 'รายงานรายเดือน', desc: 'สรุปรายรับรายจ่ายแยกตามวิชา ดูแนวโน้มรายได้ย้อนหลัง 12 เดือน' },
      { title: 'Export Excel', desc: 'ส่งออกข้อมูลการเงินเป็นไฟล์ Excel สำหรับทำบัญชีหรือส่งนักบัญชี' },
      { title: 'Dashboard การเงิน', desc: 'เห็นภาพรวมรายรับ รายจ่าย และยอดคงเหลือแบบ real-time ในหน้าเดียว' },
    ],
  },
]

const plans = [
  {
    id: 'starter', name: 'Starter', price: 490, popular: false,
    desc: 'สำหรับสถาบันที่เพิ่งเริ่มต้น',
    features: [
      { text: 'นักเรียนสูงสุด 50 คน', included: true },
      { text: 'ครูสูงสุด 5 คน', included: true },
      { text: 'เช็กอิน / ออกใบเสร็จ', included: true },
      { text: 'Dashboard', included: true },
      { text: 'Export Excel', included: false },
      { text: 'รายงานรายเดือน', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'growth', name: 'Growth', price: 790, popular: true,
    desc: 'สำหรับสถาบันที่กำลังขยาย',
    features: [
      { text: 'นักเรียนสูงสุด 200 คน', included: true },
      { text: 'ครูสูงสุด 20 คน', included: true },
      { text: 'เช็กอิน / ออกใบเสร็จ', included: true },
      { text: 'Dashboard', included: true },
      { text: 'Export Excel', included: true },
      { text: 'รายงานรายเดือน', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro', name: 'Pro', price: 1990, popular: false,
    desc: 'สำหรับสถาบันขนาดใหญ่',
    features: [
      { text: 'นักเรียนไม่จำกัด', included: true },
      { text: 'ครูไม่จำกัด', included: true },
      { text: 'เช็กอิน / ออกใบเสร็จ', included: true },
      { text: 'Dashboard', included: true },
      { text: 'Export Excel', included: true },
      { text: 'รายงานรายเดือน', included: true },
      { text: 'Priority support', included: true },
    ],
  },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [form, setForm] = useState({ name: '', school: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const emailjsLoaded = useRef(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (emailjsLoaded.current) return
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    script.onload = () => {
      ;(window as any).emailjs.init(EMAILJS_KEY)
      emailjsLoaded.current = true
    }
    document.head.appendChild(script)
  }, [])

  function openModal(plan: string) {
    setSelectedPlan(plan)
    setShowModal(true)
    setSubmitted(false)
    setForm({ name: '', school: '', phone: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      await (window as any).emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
        name: form.name,
        school: form.school,
        phone: form.phone,
        plan: selectedPlan,
      })
      setSubmitted(true)
    } catch (err) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่หรือติดต่อ 063-359-5978')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Noto Sans Thai', 'Inter', sans-serif", background: C.cream, color: C.dark, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none}
        .nav-a{color:rgba(38,34,32,0.55);font-size:14px;font-weight:500;transition:color .15s}
        .nav-a:hover{color:${C.dark}}
        .btn-primary{background:${C.brown};color:#fff;padding:11px 24px;border-radius:6px;font-size:14px;font-weight:600;display:inline-block;transition:opacity .15s;border:none;cursor:pointer;font-family:inherit}
        .btn-primary:hover{opacity:.88}
        .btn-ghost{background:transparent;color:rgba(247,241,240,0.7);border:1px solid rgba(247,241,240,0.2);padding:10px 22px;border-radius:6px;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:6px;transition:all .15s;cursor:pointer;font-family:inherit}
        .btn-ghost:hover{border-color:rgba(247,241,240,0.5);color:#fff}
        .btn-outline{background:transparent;color:${C.brown};border:1.5px solid ${C.brown};padding:10px 22px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;width:100%;font-family:inherit;transition:background .15s,color .15s}
        .btn-outline:hover{background:${C.brown};color:#fff}
        .feat-card{background:#fff;border:1px solid ${C.brownMid};border-radius:10px;padding:22px 20px;transition:box-shadow .2s}
        .feat-card:hover{box-shadow:0 6px 20px rgba(161,92,56,.1)}
        .plan-card{background:#fff;border:1.5px solid ${C.brownMid};border-radius:14px;padding:28px 22px;position:relative}
        .plan-card.pop{border-color:${C.brown}}
        input[type=text],input[type=tel]{width:100%;padding:10px 12px;border:1.5px solid ${C.brownMid};border-radius:6px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s;background:#fff;color:${C.dark}}
        input:focus{border-color:${C.brown}}
        @media(max-width:680px){
          .feat-grid{grid-template-columns:1fr 1fr!important}
          .plan-grid{grid-template-columns:1fr!important}
          .hero-h1{font-size:36px!important;line-height:1.45!important}
          .contact-row{flex-direction:column!important}
          .nav-links{display:none}
          .footer-row{flex-direction:column!important;text-align:center;gap:8px!important}
          .step-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .feat-grid{grid-template-columns:1fr!important}
          .hero-h1{font-size:30px!important}
        }
      `}</style>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,34,32,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 400 }}>
            {!submitted ? (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>ทดลองใช้ฟรี 30 วัน</h2>
                <p style={{ fontSize: 13.5, color: '#9a8a86', marginBottom: 24, lineHeight: 1.6 }}>
                  แพ็กเกจ <strong style={{ color: C.brown }}>{selectedPlan}</strong> — ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>ชื่อผู้ติดต่อ</label>
                    <input type="text" required placeholder="ชื่อ-นามสกุล" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>ชื่อสถาบัน</label>
                    <input type="text" required placeholder="ชื่อสถาบันของคุณ" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.dark, display: 'block', marginBottom: 6 }}>เบอร์โทรศัพท์</label>
                    <input type="tel" required placeholder="0XX-XXX-XXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <button type="submit" disabled={sending} className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: 14, opacity: sending ? 0.6 : 1 }}>
                      {sending ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', fontSize: 14, background: C.cream, border: `1px solid ${C.brownMid}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', color: C.dark }}>
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.brownLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke={C.brown} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>ส่งข้อมูลสำเร็จ</h2>
                <p style={{ fontSize: 14, color: '#9a8a86', marginBottom: 24, lineHeight: 1.75 }}>
                  ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมงครับ<br />
                  <span style={{ fontSize: 13, color: C.brown }}>063-359-5978</span>
                </p>
                <button onClick={() => setShowModal(false)} className="btn-primary" style={{ padding: '11px 36px' }}>ปิด</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: scrolled ? 'rgba(247,241,240,0.97)' : C.cream, backdropFilter: 'blur(8px)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${scrolled ? C.brownMid : 'transparent'}`, transition: 'border-color .2s, background .2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", color: C.dark, fontWeight: 700, fontSize: 19, letterSpacing: '-0.3px' }}>
            Tutor<span style={{ color: C.brown }}>cloud</span>
          </span>
          <div className="nav-links" style={{ display: 'flex', gap: 24 }}>
            <a href="#features" className="nav-a">ฟีเจอร์</a>
            <a href="#pricing" className="nav-a">ราคา</a>
            <a href="#contact" className="nav-a">ติดต่อ</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" className="nav-a">เข้าสู่ระบบ</Link>
          <button onClick={() => openModal('Growth')} className="btn-primary">ทดลองใช้ฟรี</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: `linear-gradient(160deg, ${C.dark} 0%, #3d2e2a 100%)`, padding: '100px 40px 88px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, rgba(195,166,160,0.05) 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(161,92,56,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(195,166,160,0.1)', border: `1px solid rgba(195,166,160,0.2)`, color: C.rose, fontSize: 13, padding: '5px 14px', borderRadius: 99, marginBottom: 36, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.rose, display: 'inline-block' }} />
            ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต
          </div>
          <div className="hero-h1" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.45, marginBottom: 24, letterSpacing: '-0.5px' }}>
            <div style={{ color: '#fff' }}>ระบบหลังบ้าน</div>
            <div style={{ color: C.rose }}>สถาบันสอนพิเศษ</div>
            <div style={{ color: '#fff' }}>ครบจบในที่เดียว</div>
          </div>
          <p style={{ fontSize: 16, color: 'rgba(247,241,240,0.5)', lineHeight: 1.85, marginBottom: 40, maxWidth: 440, margin: '0 auto 40px' }}>
            จัดการนักเรียน ครู ตารางเรียน และการเงิน<br />ใช้งานได้ทันที บนมือถือและคอมพิวเตอร์
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => openModal('Growth')} className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>ทดลองใช้ฟรี 30 วัน</button>
            <Link href="/login" className="btn-ghost" style={{ fontSize: 15, padding: '12px 24px' }}>
              เข้าสู่ระบบ
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding: '88px 40px', maxWidth: 1060, margin: '0 auto' }}>
        {features.map((group, gi) => (
          <div key={group.group} style={{ marginBottom: gi < features.length - 1 ? 72 : 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
                <span style={{ display: 'inline-block', width: 32, height: 2, background: C.brownMid, borderRadius: 2 }} />
                <h2 style={{ fontSize: 22, fontWeight: 700, color: C.dark }}>{group.group}</h2>
                <span style={{ display: 'inline-block', width: 32, height: 2, background: C.brownMid, borderRadius: 2 }} />
              </div>
            </div>
            <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {group.items.map(f => (
                <div key={f.title} className="feat-card">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.brownLight, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: C.brown, opacity: 0.6 }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: C.dark }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#8a7a76', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: C.brown, padding: '72px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(247,241,240,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>เริ่มต้น</div>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: '#fff', marginBottom: 48 }}>พร้อมใช้งานใน 3 ขั้นตอน</h2>
          <div className="step-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, textAlign: 'left' }}>
            {[
              { n: '01', title: 'สมัครและตั้งค่า', desc: 'กรอกชื่อสถาบัน ใส่โลโก้ และข้อมูลเบื้องต้น ใช้เวลาไม่เกิน 5 นาที' },
              { n: '02', title: 'นำเข้าข้อมูล', desc: 'นำเข้านักเรียน ครู และคอร์สจาก Excel หรือเพิ่มทีละคนก็ได้' },
              { n: '03', title: 'ใช้งานได้เลย', desc: 'เช็กอิน ออกใบเสร็จ และดู Dashboard ได้ทันที ไม่ต้องรอ' },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 44, fontWeight: 800, color: 'rgba(247,241,240,0.15)', lineHeight: 1, marginBottom: 14 }}>{s.n}</div>
                <div style={{ width: 28, height: 2, background: 'rgba(247,241,240,0.35)', borderRadius: 2, marginBottom: 14 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(247,241,240,0.48)', lineHeight: 1.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ padding: '88px 40px', background: C.cream }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.brown, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>ราคา</div>
            <h2 style={{ fontSize: 34, fontWeight: 700, marginBottom: 10 }}>เลือกแพ็กเกจที่เหมาะกับสถาบัน</h2>
            <p style={{ color: '#9a8a86', fontSize: 15 }}>ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต ยกเลิกได้ทุกเมื่อ</p>
          </div>
          <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {plans.map(plan => (
              <div key={plan.id} className={`plan-card${plan.popular ? ' pop' : ''}`}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: C.brown, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>ยอดนิยม</div>
                )}
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#b8a8a4', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{plan.name}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 36, fontWeight: 800, color: C.brown, letterSpacing: '-1px' }}>฿{plan.price.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: '#c0b0ac', marginLeft: 4 }}>/เดือน</span>
                </div>
                <p style={{ fontSize: 13, color: '#9a8a86', marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${C.brownMid}` }}>{plan.desc}</p>
                <div style={{ marginBottom: 22 }}>
                  {plan.features.map(f => (
                    <div key={f.text} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: f.included ? C.brownLight : '#f2eeec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {f.included
                          ? <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke={C.brown} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <svg width="8" height="8" viewBox="0 0 8 8"><path d="M2 2l4 4M6 2l-4 4" stroke="#d0c4c0" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        }
                      </div>
                      <span style={{ fontSize: 13.5, color: f.included ? C.dark : '#c8b8b4' }}>{f.text}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => openModal(plan.name)} className={plan.popular ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', padding: '11px', fontSize: 14, borderRadius: 7 }}>
                  ทดลองใช้ฟรี 30 วัน
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: C.dark, padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 10 }}>พร้อมเริ่มต้นวันนี้</h2>
        <p style={{ color: 'rgba(247,241,240,0.38)', marginBottom: 32, fontSize: 15, lineHeight: 1.85 }}>
          ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกมัด<br />มีทีมช่วย onboarding ตั้งแต่วันแรก
        </p>
        <button onClick={() => openModal('Growth')} className="btn-primary" style={{ fontSize: 15, padding: '13px 36px' }}>
          ทดลองใช้ฟรี 30 วัน
        </button>
      </div>

      {/* CONTACT */}
      <div id="contact" style={{ background: '#fff', padding: '64px 40px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.brown, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>ติดต่อเรา</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 32 }}>มีคำถาม? ทีมงานพร้อมช่วยเสมอ</h2>
          <div className="contact-row" style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a href="https://www.facebook.com/profile.php?id=61591839025304" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.cream, border: `1px solid ${C.brownMid}`, borderRadius: 12, padding: '16px 22px', color: C.dark, minWidth: 210 }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect width="26" height="26" rx="6" fill="#1877F2"/>
                <path d="M16.5 13h-2.3v7.5H11.8V13H10v-2.3h1.8V9.3c0-1.8.9-3.3 2.8-3.3H16.5V8h-1.4c-.7 0-.9.4-.9 1v1.7h2.3L16.5 13z" fill="white"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: '#9a8a86', marginBottom: 2 }}>Facebook</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Tutorcloud ระบบจัดการสถาบัน</div>
              </div>
            </a>
            <a href="tel:0633595978"
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.cream, border: `1px solid ${C.brownMid}`, borderRadius: 12, padding: '16px 22px', color: C.dark, minWidth: 210 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: C.brown, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 2h2.8l1 2.8-1.5 1a7.5 7.5 0 003.4 3.4l1-1.5 2.8 1V11c0 .5-.4.9-1 .9C3.8 11.9 1 6.2 1 3c0-.6.4-1 1-1h-.5z" fill="white"/></svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: '#9a8a86', marginBottom: 2 }}>โทรศัพท์</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>063-359-5978</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: C.dark, padding: '22px 40px' }}>
        <div className="footer-row" style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", color: 'rgba(247,241,240,0.35)', fontSize: 14, fontWeight: 700 }}>
            Tutor<span style={{ color: C.rose }}>cloud</span>
          </span>
          <span style={{ fontSize: 12, color: 'rgba(247,241,240,0.22)' }}>ระบบจัดการสถาบันสอนพิเศษ · 063-359-5978</span>
        </div>
      </div>
    </div>
  )
}
