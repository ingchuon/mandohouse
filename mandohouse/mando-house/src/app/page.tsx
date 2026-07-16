'use client'
// src/app/page.tsx
import { TUTORCLOUD_CONFIG } from '@/lib/tutorcloud-config'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const stats = [
  { value: '2,400+', label: 'นักเรียนในระบบ' },
  { value: '38', label: 'สถาบันที่ใช้งาน' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 5 นาที', label: 'ตั้งค่าเริ่มต้น' },
]

const features = [
  {
    title: 'จัดการนักเรียน',
    desc: 'บันทึกข้อมูล ติดตามประวัติการเรียน และดูสถานะคอร์สของนักเรียนแต่ละคนได้ทันที',
    detail: 'เช็กอิน · นับครั้ง · ดูความคืบหน้า',
  },
  {
    title: 'ตารางสอน',
    desc: 'จัดตารางเรียนรายสัปดาห์ กำหนดห้องและครู ดูภาพรวมทั้งสถาบันในหน้าเดียว',
    detail: 'รายวัน · รายสัปดาห์ · รายเดือน',
  },
  {
    title: 'ออกใบเสร็จ',
    desc: 'ออกใบเสร็จ PDF ได้ทันที บันทึกรายรับรายจ่าย และดูสรุปการเงินรายเดือน',
    detail: 'PDF · Export Excel · สรุปรายเดือน',
  },
  {
    title: 'Dashboard',
    desc: 'เห็นภาพรวมสถาบันแบบ real-time ตั้งแต่รายรับวันนี้ไปจนถึงนักเรียนที่คอร์สใกล้หมด',
    detail: 'กราฟรายรับ · แยกตามวิชา · ยอดคงเหลือ',
  },
  {
    title: 'จัดการครู',
    desc: 'บันทึกชั่วโมงสอน คำนวณค่าตอบแทน และดูรายงานการสอนของครูแต่ละคน',
    detail: 'ชั่วโมงสอน · ค่าตอบแทน · รายงาน',
  },
  {
    title: 'จัดการทีม',
    desc: 'กำหนดสิทธิ์แอดมินและครูแยกกัน ควบคุมการเข้าถึงข้อมูลแต่ละส่วน',
    detail: 'แอดมิน · ครู · สิทธิ์แยกต่างหาก',
  },
]

export default function LandingPage() {
  const { plans } = TUTORCLOUD_CONFIG
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ fontFamily: "'Sarabun', 'Inter', sans-serif", background: '#FAFAF8', minHeight: '100vh', color: '#1a1a1a' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav-link { color: rgba(255,255,255,0.75); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .nav-link:hover { color: #fff; }
        .btn-white { background: #fff; color: #1B6B3A; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; transition: opacity 0.2s; display: inline-block; }
        .btn-white:hover { opacity: 0.9; }
        .btn-outline-white { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.35); padding: 11px 24px; border-radius: 6px; font-size: 14px; text-decoration: none; transition: border-color 0.2s; display: inline-block; }
        .btn-outline-white:hover { border-color: rgba(255,255,255,0.7); }
        .feature-card { background: #fff; border: 1px solid #E8E8E4; border-radius: 10px; padding: 28px 24px; transition: box-shadow 0.2s, transform 0.2s; }
        .feature-card:hover { box-shadow: 0 8px 24px rgba(27,107,58,0.08); transform: translateY(-2px); }
        .plan-card { background: #fff; border: 1px solid #E8E8E4; border-radius: 12px; padding: 28px 24px; }
        .plan-card.featured { border: 2px solid #1B6B3A; }
        .btn-plan { display: block; width: 100%; padding: 11px; border-radius: 6px; font-size: 14px; font-weight: 600; text-align: center; text-decoration: none; transition: opacity 0.2s; border: none; cursor: pointer; }
        .btn-plan:hover { opacity: 0.85; }
        .stat-item { text-align: center; padding: 0 24px; }
        .divider { width: 1px; background: rgba(255,255,255,0.2); height: 40px; }
        @media (max-width: 640px) {
          .stats-row { flex-wrap: wrap; gap: 24px !important; }
          .divider { display: none; }
          .features-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          h1 { font-size: 32px !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(27,107,58,0.97)' : '#1B6B3A',
        backdropFilter: 'blur(8px)',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.3s',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>
            Tutor<span style={{ color: '#2ECC8E' }}>cloud</span>
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#features" className="nav-link">ฟีเจอร์</a>
            <a href="#pricing" className="nav-link">ราคา</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" className="nav-link">เข้าสู่ระบบ</Link>
          <Link href="/register" className="btn-white">เริ่มใช้งานฟรี</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #1B6B3A 0%, #0F4D28 60%, #0a3319 100%)', padding: '96px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* subtle grid pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(46,204,142,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(46,204,142,0.12)', border: '1px solid rgba(46,204,142,0.25)', color: '#2ECC8E', fontSize: 13, padding: '5px 14px', borderRadius: 99, marginBottom: 28, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ECC8E', display: 'inline-block' }} />
            ระบบพร้อมใช้งาน — ทดลองฟรี 30 วัน
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
            ระบบหลังบ้าน<br />
            <span style={{ color: '#2ECC8E' }}>สำหรับสถาบันสอนพิเศษ</span>
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            จัดการนักเรียน ครู ตารางเรียน และการเงิน<br />ทุกอย่างในที่เดียว ใช้งานได้ทันที ไม่ต้องติดตั้ง
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/register" className="btn-white" style={{ fontSize: 15, padding: '13px 28px' }}>
              ทดลองใช้ฟรี 30 วัน
            </Link>
            <Link href="/login" className="btn-outline-white" style={{ fontSize: 15, padding: '13px 28px' }}>
              เข้าสู่ระบบ
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 40 }}>
            {stats.map((s, i) => (
              <>
                <div key={s.label} className="stat-item">
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
                </div>
                {i < stats.length - 1 && <div key={`d${i}`} className="divider" />}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div id="features" style={{ padding: '96px 40px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1B6B3A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>ฟีเจอร์</div>
          <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 12 }}>ทุกอย่างที่สถาบันต้องการ</h2>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 480 }}>ออกแบบมาเพื่อสถาบันสอนพิเศษโดยเฉพาะ ไม่ใช่ระบบทั่วไปที่ต้องมานั่งปรับเอง</p>
        </div>

        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>{f.desc}</p>
              <div style={{ fontSize: 12, color: '#1B6B3A', fontWeight: 500, background: '#F0FAF4', padding: '5px 10px', borderRadius: 6, display: 'inline-block' }}>{f.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: '#1B6B3A', padding: '80px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2ECC8E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>เริ่มต้น</div>
          <h2 style={{ fontSize: 32, fontWeight: 600, color: '#fff', marginBottom: 48, letterSpacing: '-0.5px' }}>พร้อมใช้งานใน 3 ขั้นตอน</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { num: '01', title: 'สมัครและตั้งค่า', desc: 'กรอกชื่อสถาบัน ใส่โลโก้ และข้อมูลเบื้องต้น ใช้เวลาไม่เกิน 5 นาที' },
              { num: '02', title: 'เพิ่มข้อมูล', desc: 'นำเข้านักเรียน ครู และคอร์สจาก Excel หรือเพิ่มทีละคนก็ได้' },
              { num: '03', title: 'ใช้งานได้เลย', desc: 'เช็กอิน ออกใบเสร็จ และดู Dashboard ได้ทันที ไม่ต้องรอ' },
            ].map(step => (
              <div key={step.num} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: 'rgba(46,204,142,0.3)', lineHeight: 1, marginBottom: 12 }}>{step.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" style={{ padding: '96px 40px', background: '#FAFAF8' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1B6B3A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>ราคา</div>
            <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 12 }}>เลือกแพ็กเกจที่เหมาะกับสถาบัน</h2>
            <p style={{ color: '#666', fontSize: 16 }}>ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต ยกเลิกได้ทุกเมื่อ</p>
          </div>

          <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {plans.map(plan => (
              <div key={plan.id} className={`plan-card${plan.popular ? ' featured' : ''}`}>
                {plan.popular && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1B6B3A', background: '#E8F5EE', padding: '3px 10px', borderRadius: 99, display: 'inline-block', marginBottom: 16 }}>ยอดนิยม</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: '#1B6B3A', letterSpacing: '-1px' }}>฿{plan.price.toLocaleString()}</span>
                  <span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>/เดือน</span>
                </div>
                <div style={{ borderTop: '1px solid #F0F0EC', paddingTop: 16, marginBottom: 20 }}>
                  {plan.features.filter(f => !f.includes('LINE')).map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="#1B6B3A" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                      </div>
                      <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className="btn-plan" style={{ background: plan.popular ? '#1B6B3A' : '#F5F5F2', color: plan.popular ? '#fff' : '#1B6B3A' }}>
                  เริ่มทดลองใช้ฟรี
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#0F4D28', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 600, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>พร้อมเริ่มต้นวันนี้</h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 32, fontSize: 16, lineHeight: 1.7 }}>
          ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกมัด<br />มีทีมช่วย onboarding ให้ตั้งแต่วันแรก
        </p>
        <Link href="/register" className="btn-white" style={{ fontSize: 15, padding: '13px 32px' }}>
          ทดลองใช้ฟรี 30 วัน
        </Link>
      </div>

      {/* Footer */}
      <div style={{ background: '#0a3319', padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>
          Tutor<span style={{ color: '#2ECC8E' }}>cloud</span>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{TUTORCLOUD_CONFIG.email}</span>
      </div>

    </div>
  )
}
