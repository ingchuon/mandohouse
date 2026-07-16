// src/app/page.tsx
import { TUTORCLOUD_CONFIG } from '@/lib/tutorcloud-config'
import Link from 'next/link'

export default function LandingPage() {
  const { plans } = TUTORCLOUD_CONFIG
  return (
    <div style={{ fontFamily: 'var(--font-sans)', background: '#fff', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ background: '#1B6B3A', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/tutorcloud-logo.png" alt="TutorCloud" style={{ height: 36 }} onError={e => (e.currentTarget.style.display = 'none')} />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 20 }}>
            Tutor<span style={{ color: '#2ECC8E' }}>cloud</span>
          </span>
        </div>
        <Link href="/login" style={{ background: '#fff', color: '#1B6B3A', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
          เข้าสู่ระบบ →
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1B6B3A 0%, #0d4a26 100%)', padding: '72px 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(46,204,142,0.2)', color: '#2ECC8E', fontSize: 13, padding: '4px 16px', borderRadius: 99, marginBottom: 20 }}>
          ระบบจัดการสถาบันสอนพิเศษ
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 600, color: '#fff', marginBottom: 16, lineHeight: 1.3 }}>
          บริหารสถาบันของคุณ<br />
          <span style={{ color: '#2ECC8E' }}>ครบจบในที่เดียว</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
          จัดการนักเรียน ครู ตารางเรียน และการเงิน — ทุกอย่างในระบบเดียว ใช้งานง่าย ไม่ต้องติดตั้ง
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ background: '#fff', color: '#1B6B3A', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            ทดลองใช้ฟรี 30 วัน ↗
          </Link>
          <Link href="/login" style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', padding: '12px 28px', borderRadius: 8, fontSize: 15, textDecoration: 'none' }}>
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '64px 32px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#1B6B3A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>ฟีเจอร์</div>
          <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8 }}>ทุกอย่างที่สถาบันต้องการ</h2>
          <p style={{ color: '#666', fontSize: 15 }}>ออกแบบมาเพื่อสถาบันสอนพิเศษโดยเฉพาะ</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: '👥', title: 'จัดการนักเรียน', desc: 'เช็กอิน/เช็กเอาท์ และนับครั้งการเรียนอัตโนมัติ' },
            { icon: '🗓', title: 'ตารางสอน', desc: 'จัดตารางเรียนและติดตามชั่วโมงการสอน' },
            { icon: '🧾', title: 'ออกใบเสร็จ', desc: 'ออกใบเสร็จ PDF และดูรายงานการเงิน' },
            { icon: '📊', title: 'Dashboard', desc: 'ภาพรวมสถาบันแบบ real-time' },
            { icon: '🔔', title: 'แจ้งเตือน LINE', desc: 'ส่ง Flex Message เมื่อคอร์สใกล้หมด' },
            { icon: '🎓', title: 'จัดการทีม', desc: 'กำหนดสิทธิ์พนักงานตามบทบาท' },
          ].map(f => (
            <div key={f.title} style={{ background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: 20 }}>
              <div style={{ width: 40, height: 40, background: '#E8F5EE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: '#f9fafb', padding: '64px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#1B6B3A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>ราคา</div>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8 }}>เลือกแพ็กเกจที่เหมาะกับสถาบัน</h2>
            <p style={{ color: '#666', fontSize: 15 }}>ทดลองใช้ฟรี 30 วัน ไม่ต้องใส่บัตรเครดิต</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ background: '#fff', border: plan.popular ? '2px solid #1B6B3A' : '0.5px solid #e0e0e0', borderRadius: 12, padding: '24px 20px' }}>
                {plan.popular && (
                  <div style={{ display: 'inline-block', background: '#E8F5EE', color: '#1B6B3A', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, marginBottom: 12 }}>ยอดนิยม</div>
                )}
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#1B6B3A', marginBottom: 16 }}>
                  ฿{plan.price.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: '#888' }}>/เดือน</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#555', padding: '4px 0', borderBottom: '0.5px solid #f0f0f0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: '#1B6B3A', fontWeight: 600 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: 'block', width: '100%', padding: 10, borderRadius: 8, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none', background: plan.popular ? '#1B6B3A' : 'transparent', color: plan.popular ? '#fff' : '#1B6B3A', border: `1.5px solid #1B6B3A` }}>
                  เริ่มทดลองใช้
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#1B6B3A', padding: '56px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginBottom: 10 }}>พร้อมเริ่มต้นวันนี้</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 28, fontSize: 15 }}>ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกมัด ยกเลิกได้ทุกเมื่อ</p>
        <Link href="/register" style={{ background: '#fff', color: '#1B6B3A', padding: '12px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          ทดลองใช้ฟรี 30 วัน ↗
        </Link>
      </div>

      {/* Footer */}
      <div style={{ background: '#f9fafb', padding: '24px 32px', textAlign: 'center', fontSize: 13, color: '#888' }}>
        TutorCloud · ระบบจัดการสถาบันสอนพิเศษ · {TUTORCLOUD_CONFIG.email}
      </div>
    </div>
  )
}
