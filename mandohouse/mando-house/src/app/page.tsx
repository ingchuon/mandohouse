'use client'
// src/app/page.tsx
import Link from 'next/link'
import { useState, useEffect } from 'react'

const PRIMARY = '#79031D'
const ACCENT = '#EDB518'
const DARK = '#000407'
const LIGHT = '#F5F7F7'
const PRIMARY_LIGHT = '#f9e8eb'

const features = [
  {
    title: 'จัดการนักเรียน',
    desc: 'บันทึกข้อมูล ติดตามประวัติการเรียน และดูสถานะคอร์สของนักเรียนแต่ละคนได้ทันที',
    tags: ['เช็กอิน', 'นับครั้ง', 'ความคืบหน้า'],
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="32" fill={PRIMARY_LIGHT}/>
        <circle cx="32" cy="24" r="9" fill={PRIMARY} opacity="0.9"/>
        <ellipse cx="32" cy="46" rx="15" ry="8" fill={PRIMARY} opacity="0.7"/>
        <circle cx="20" cy="26" r="6" fill={ACCENT} opacity="0.8"/>
        <ellipse cx="20" cy="40" rx="10" ry="6" fill={ACCENT} opacity="0.5"/>
        <circle cx="44" cy="26" r="6" fill={PRIMARY} opacity="0.5"/>
        <ellipse cx="44" cy="40" rx="10" ry="6" fill={PRIMARY} opacity="0.3"/>
      </svg>
    ),
  },
  {
    title: 'ตารางสอน',
    desc: 'จัดตารางเรียนรายสัปดาห์ กำหนดห้องและครู ดูภาพรวมทั้งสถาบันในหน้าเดียว',
    tags: ['รายวัน', 'รายสัปดาห์', 'รายเดือน'],
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="32" fill="#fff8e6"/>
        <rect x="12" y="16" width="40" height="34" rx="4" fill={ACCENT} opacity="0.15"/>
        <rect x="12" y="16" width="40" height="10" rx="4" fill={ACCENT}/>
        <rect x="18" y="32" width="8" height="6" rx="2" fill={PRIMARY} opacity="0.7"/>
        <rect x="30" y="32" width="8" height="6" rx="2" fill={ACCENT} opacity="0.9"/>
        <rect x="42" y="32" width="8" height="6" rx="2" fill={PRIMARY} opacity="0.4"/>
        <rect x="18" y="42" width="8" height="6" rx="2" fill={ACCENT} opacity="0.5"/>
        <rect x="30" y="42" width="8" height="6" rx="2" fill={PRIMARY} opacity="0.7"/>
        <circle cx="22" cy="14" r="3" fill={PRIMARY}/>
        <circle cx="42" cy="14" r="3" fill={PRIMARY}/>
      </svg>
    ),
  },
  {
    title: 'ออกใบเสร็จ',
    desc: 'ออกใบเสร็จ PDF ได้ทันที บันทึกรายรับรายจ่าย และดูสรุปการเงินรายเดือน',
    tags: ['PDF', 'Export Excel', 'สรุปรายเดือน'],
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="32" fill={PRIMARY_LIGHT}/>
        <rect x="16" y="12" width="32" height="40" rx="4" fill="white" stroke={PRIMARY} strokeWidth="2"/>
        <rect x="22" y="20" width="20" height="2.5" rx="1.25" fill={ACCENT}/>
        <rect x="22" y="26" width="14" height="2" rx="1" fill={PRIMARY} opacity="0.4"/>
        <rect x="22" y="31" width="16" height="2" rx="1" fill={PRIMARY} opacity="0.4"/>
        <rect x="22" y="36" width="12" height="2" rx="1" fill={PRIMARY} opacity="0.4"/>
        <rect x="20" y="42" width="24" height="4" rx="2" fill={PRIMARY} opacity="0.15"/>
        <rect x="22" y="43" width="10" height="2" rx="1" fill={PRIMARY} opacity="0.6"/>
        <text x="34" y="45.5" fontSize="6" fill={PRIMARY} fontWeight="700">฿</text>
      </svg>
    ),
  },
  {
    title: 'Dashboard',
    desc: 'เห็นภาพรวมสถาบันแบบ real-time ตั้งแต่รายรับวันนี้ไปจนถึงนักเรียนที่คอร์สใกล้หมด',
    tags: ['กราฟรายรับ', 'แยกตามวิชา', 'ยอดคงเหลือ'],
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="32" fill="#fff8e6"/>
        <rect x="12" y="38" width="8" height="14" rx="2" fill={ACCENT} opacity="0.5"/>
        <rect x="24" y="28" width="8" height="24" rx="2" fill={ACCENT} opacity="0.75"/>
        <rect x="36" y="20" width="8" height="32" rx="2" fill={PRIMARY} opacity="0.8"/>
        <rect x="48" y="30" width="8" height="22" rx="2" fill={ACCENT}/>
        <line x1="10" y1="52" x2="58" y2="52" stroke={DARK} strokeWidth="1.5" opacity="0.2"/>
      </svg>
    ),
  },
  {
    title: 'จัดการครู',
    desc: 'บันทึกชั่วโมงสอน คำนวณค่าตอบแทน และดูรายงานการสอนของครูแต่ละคน',
    tags: ['ชั่วโมงสอน', 'ค่าตอบแทน', 'รายงาน'],
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="32" fill={PRIMARY_LIGHT}/>
        <rect x="14" y="36" width="36" height="18" rx="4" fill={PRIMARY} opacity="0.15"/>
        <circle cx="32" cy="24" r="10" fill={PRIMARY} opacity="0.8"/>
        <rect x="24" y="40" width="16" height="2.5" rx="1.25" fill={PRIMARY} opacity="0.5"/>
        <rect x="26" y="45" width="12" height="2" rx="1" fill={PRIMARY} opacity="0.3"/>
        <path d="M44 18 L48 14 L52 18" stroke={ACCENT} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <line x1="48" y1="14" x2="48" y2="28" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'จัดการทีม',
    desc: 'กำหนดสิทธิ์แอดมินและครูแยกกัน ควบคุมการเข้าถึงข้อมูลแต่ละส่วน',
    tags: ['แอดมิน', 'ครู', 'สิทธิ์แยกต่างหาก'],
    svg: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="32" fill="#fff8e6"/>
        <circle cx="20" cy="28" r="7" fill={ACCENT} opacity="0.8"/>
        <ellipse cx="20" cy="42" rx="11" ry="7" fill={ACCENT} opacity="0.5"/>
        <circle cx="44" cy="28" r="7" fill={PRIMARY} opacity="0.8"/>
        <ellipse cx="44" cy="42" rx="11" ry="7" fill={PRIMARY} opacity="0.5"/>
        <circle cx="32" cy="24" r="8" fill={PRIMARY}/>
        <ellipse cx="32" cy="42" rx="13" ry="8" fill={PRIMARY} opacity="0.8"/>
      </svg>
    ),
  },
]

const steps = [
  { n: '01', title: 'สมัครและตั้งค่า', desc: 'กรอกชื่อสถาบัน ใส่โลโก้ และข้อมูลเบื้องต้น ใช้เวลาไม่เกิน 5 นาที' },
  { n: '02', title: 'นำเข้าข้อมูล', desc: 'นำเข้านักเรียน ครู และคอร์สจาก Excel หรือเพิ่มทีละคนก็ได้' },
  { n: '03', title: 'ใช้งานได้เลย', desc: 'เช็กอิน ออกใบเสร็จ และดู Dashboard ได้ทันที ไม่ต้องรอ' },
]

const plans = [
  { id: 'starter', name: 'Starter', price: 490, popular: false, features: ['นักเรียนสูงสุด 50 คน', 'ครูสูงสุด 5 คน', 'ฟีเจอร์ครบทุกอย่าง'] },
  { id: 'growth', name: 'Growth', price: 990, popular: true, features: ['นักเรียนสูงสุด 200 คน', 'ครูสูงสุด 20 คน', 'ฟีเจอร์ครบทุกอย่าง', 'Export Excel'] },
  { id: 'pro', name: 'Pro', price: 1990, popular: false, features: ['นักเรียนไม่จำกัด', 'ครูไม่จำกัด', 'ฟีเจอร์ครบทุกอย่าง', 'Export Excel', 'Priority support'] },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ fontFamily: "'Sarabun', sans-serif", background: LIGHT, color: DARK, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        a{text-decoration:none}
        .nav-a{color:rgba(255,255,255,0.75);font-size:14px;font-weight:500;transition:color .2s}
        .nav-a:hover{color:#fff}
        .btn-accent{background:${ACCENT};color:${DARK};padding:11px 24px;border-radius:6px;font-size:14px;font-weight:700;display:inline-block;transition:opacity .2s}
        .btn-accent:hover{opacity:.88}
        .btn-outline{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.35);padding:11px 24px;border-radius:6px;font-size:14px;display:inline-block;transition:border-color .2s}
        .btn-outline:hover{border-color:rgba(255,255,255,.7)}
        .feat-card{background:#fff;border:1px solid #E4E4E0;border-radius:12px;padding:28px 24px;transition:box-shadow .2s,transform .2s}
        .feat-card:hover{box-shadow:0 8px 28px rgba(121,3,29,.1);transform:translateY(-3px)}
        .plan-card{background:#fff;border:1.5px solid #E4E4E0;border-radius:14px;padding:28px 24px}
        .plan-card.pop{border-color:${PRIMARY};position:relative}
        .tag{display:inline-block;background:${PRIMARY_LIGHT};color:${PRIMARY};font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;margin-right:4px;margin-top:4px}
        .check{width:18px;height:18px;border-radius:50%;background:${PRIMARY_LIGHT};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
        @media(max-width:680px){
          .feat-grid{grid-template-columns:1fr!important}
          .plan-grid{grid-template-columns:1fr!important}
          .step-row{flex-direction:column!important}
          .hero-h1{font-size:34px!important}
          .stat-row{flex-wrap:wrap;gap:24px!important}
          .divider{display:none}
          .footer-inner{flex-direction:column!important;gap:12px!important;text-align:center}
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(121,3,29,0.97)' : PRIMARY,
        backdropFilter: 'blur(8px)',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background .3s',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,.1)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '-0.3px' }}>
            Tutor<span style={{ color: ACCENT }}>cloud</span>
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#features" className="nav-a">ฟีเจอร์</a>
            <a href="#pricing" className="nav-a">ราคา</a>
            <a href="#contact" className="nav-a">ติดต่อ</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" className="nav-a">เข้าสู่ระบบ</Link>
          <Link href="/register" className="btn-accent">เริ่มใช้งานฟรี</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: `linear-gradient(155deg, ${PRIMARY} 0%, #4a0110 55%, #000407 100%)`, padding: '96px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, rgba(237,181,24,0.07) 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        {/* hero illustration */}
        <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.12, pointerEvents: 'none' }}>
          <svg width="340" height="340" viewBox="0 0 340 340" fill="none">
            <circle cx="170" cy="170" r="160" stroke={ACCENT} strokeWidth="2"/>
            <circle cx="170" cy="170" r="110" stroke={ACCENT} strokeWidth="1.5"/>
            <circle cx="170" cy="170" r="60" fill={ACCENT} opacity="0.3"/>
            <circle cx="170" cy="60" r="14" fill={ACCENT}/>
            <circle cx="170" cy="280" r="14" fill={ACCENT}/>
            <circle cx="60" cy="170" r="14" fill={ACCENT}/>
            <circle cx="280" cy="170" r="14" fill={ACCENT}/>
          </svg>
        </div>

        <div style={{ maxWidth: 640, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(237,181,24,0.12)', border: '1px solid rgba(237,181,24,0.3)', color: ACCENT, fontSize: 13, padding: '5px 14px', borderRadius: 99, marginBottom: 28, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
            ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต
          </div>
          <h1 className="hero-h1" style={{ fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1.5px' }}>
            ระบบหลังบ้าน<br />
            <span style={{ color: ACCENT }}>สถาบันสอนพิเศษ</span><br />
            ครบจบในที่เดียว
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 40, maxWidth: 480 }}>
            จัดการนักเรียน ครู ตารางเรียน และการเงิน<br />ใช้งานได้ทันที ไม่ต้องติดตั้ง
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/register" className="btn-accent" style={{ fontSize: 15, padding: '13px 32px' }}>ทดลองใช้ฟรี 30 วัน</Link>
            <Link href="/login" className="btn-outline" style={{ fontSize: 15, padding: '13px 28px' }}>เข้าสู่ระบบ</Link>
          </div>

          {/* stats */}
          <div className="stat-row" style={{ display: 'flex', alignItems: 'center', gap: 0, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 36 }}>
            {[
              { v: '2,400+', l: 'นักเรียนในระบบ' },
              { v: '38', l: 'สถาบันที่ใช้งาน' },
              { v: '99.9%', l: 'Uptime' },
              { v: '< 5 นาที', l: 'ตั้งค่าเริ่มต้น' },
            ].map((s, i, arr) => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '0 28px' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{s.v}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 4 }}>{s.l}</div>
                </div>
                {i < arr.length - 1 && <div className="divider" style={{ width: 1, height: 36, background: 'rgba(255,255,255,.15)' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding: '96px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>ฟีเจอร์</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 12 }}>ทุกอย่างที่สถาบันต้องการ</h2>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 500, lineHeight: 1.7 }}>ออกแบบมาเพื่อสถาบันสอนพิเศษโดยเฉพาะ ไม่ใช่ระบบทั่วไปที่ต้องมานั่งปรับเอง</p>
        </div>
        <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} className="feat-card">
              <div style={{ marginBottom: 16 }}>{f.svg}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, marginBottom: 14 }}>{f.desc}</p>
              <div>{f.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: PRIMARY, padding: '80px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>เริ่มต้น</div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>พร้อมใช้งานใน 3 ขั้นตอน</h2>
          </div>
          <div className="step-row" style={{ display: 'flex', gap: 40 }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ flex: 1, position: 'relative' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: 20, left: '60%', right: '-40%', height: 1, background: `rgba(237,181,24,.2)`, display: 'none' }} />
                )}
                <div style={{ fontSize: 48, fontWeight: 800, color: 'rgba(237,181,24,.2)', lineHeight: 1, marginBottom: 12 }}>{s.n}</div>
                <div style={{ width: 32, height: 3, background: ACCENT, borderRadius: 2, marginBottom: 16 }} />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ padding: '96px 40px', background: LIGHT }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>ราคา</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 12 }}>เลือกแพ็กเกจที่เหมาะกับสถาบัน</h2>
            <p style={{ color: '#666', fontSize: 16 }}>ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต ยกเลิกได้ทุกเมื่อ</p>
          </div>
          <div className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {plans.map(plan => (
              <div key={plan.id} className={`plan-card${plan.popular ? ' pop' : ''}`}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: PRIMARY, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>ยอดนิยม</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 38, fontWeight: 800, color: PRIMARY, letterSpacing: '-1px' }}>฿{plan.price.toLocaleString()}</span>
                  <span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>/เดือน</span>
                </div>
                <div style={{ borderTop: '1px solid #F0F0EC', paddingTop: 16, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                      <div className="check">
                        <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke={PRIMARY} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: 13.5, color: '#333', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{ display: 'block', padding: '11px', borderRadius: 7, fontSize: 14, fontWeight: 700, textAlign: 'center', background: plan.popular ? PRIMARY : LIGHT, color: plan.popular ? '#fff' : PRIMARY, border: `1.5px solid ${plan.popular ? PRIMARY : '#ddd'}`, transition: 'opacity .2s' }}>
                  เริ่มทดลองใช้ฟรี
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{ background: DARK, padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 30% 50%, rgba(237,181,24,0.05) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(121,3,29,0.15) 0%, transparent 60%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-1px' }}>พร้อมเริ่มต้นวันนี้</h2>
          <p style={{ color: 'rgba(255,255,255,.45)', marginBottom: 36, fontSize: 16, lineHeight: 1.8 }}>
            ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกมัด<br />มีทีมช่วย onboarding ให้ตั้งแต่วันแรก
          </p>
          <Link href="/register" className="btn-accent" style={{ fontSize: 15, padding: '14px 36px' }}>ทดลองใช้ฟรี 30 วัน</Link>
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" style={{ background: '#fff', padding: '64px 40px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>ติดต่อเรา</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, letterSpacing: '-0.3px' }}>มีคำถาม? ทีมงานพร้อมช่วยเสมอ</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <a href="https://www.facebook.com/profile.php?id=tutorcloud" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, background: LIGHT, border: `1px solid #E4E4E0`, borderRadius: 12, padding: '18px 28px', textDecoration: 'none', color: DARK, transition: 'box-shadow .2s', minWidth: 200 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#1877F2"/>
                <path d="M18 14h-2.5v8H13v-8h-2v-2.5h2v-1.5c0-2 1-3.5 3-3.5h2V9h-1.5c-.8 0-1 .4-1 1v1.5H18L18 14z" fill="white"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>Facebook</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Tutorcloud ระบบจัดการสถาบัน</div>
              </div>
            </a>
            <a href="tel:0633595978" style={{ display: 'flex', alignItems: 'center', gap: 12, background: LIGHT, border: `1px solid #E4E4E0`, borderRadius: 12, padding: '18px 28px', textDecoration: 'none', color: DARK, transition: 'box-shadow .2s', minWidth: 200 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill={PRIMARY}/>
                <path d="M9 8h3l1.5 4-2 1.5a10 10 0 005 5L18 16.5l4 1.5v3c0 1-1 2-2 2C9 23 5 14 5 10c0-1 1-2 2-2h2z" fill="white"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>โทรศัพท์</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>063-359-5978</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: DARK, padding: '24px 40px' }}>
        <div className="footer-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, fontWeight: 700 }}>
            Tutor<span style={{ color: ACCENT }}>cloud</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,.25)', fontSize: 13 }}>ระบบจัดการสถาบันสอนพิเศษ · 063-359-5978</span>
        </div>
      </div>
    </div>
  )
}
