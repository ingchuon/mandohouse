// src/app/status/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLANS, LINE_ID, LINE_URL, isTrial } from '@/lib/plans'

const C = {
  cream: '#F5F0E8',
  green: '#1C3A2A',
  gold: '#E8A020',
  text: '#2C2C2C',
  textMid: '#6B6B6B',
  border: '#E2D9CC',
}

export default async function StatusPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', user.id).single()
  const schoolId = profile?.school_id

  if (schoolId === 'mando') redirect('/staff')

  const { data: school } = await supabase
    .from('schools').select('name, status, plan, expires_at').eq('id', schoolId ?? '').single()

  const today = new Date().toISOString().slice(0, 10)
  const expired = !!school?.expires_at && school.expires_at < today
  const wasTrial = isTrial(school?.plan ?? '')

  let icon = '📅'
  let title = expired && wasTrial ? 'หมดช่วงทดลองใช้ฟรีแล้ว' : 'หมดอายุการใช้งานแล้ว'
  let message = wasTrial
    ? 'ขอบคุณที่ทดลองใช้ TutorCloud เลือกแพ็กเกจด้านล่างเพื่อใช้งานต่อ — ข้อมูลนักเรียน ตารางสอน และการเงินของคุณยังอยู่ครบทุกอย่าง'
    : 'แพ็กเกจของสถาบันคุณสิ้นสุดลงแล้ว ต่ออายุเพื่อกลับมาใช้งานได้ตามปกติ ข้อมูลทั้งหมดของคุณยังอยู่ครบ'

  if (school?.status === 'rejected') {
    icon = '❗'
    title = 'บัญชีถูกระงับ'
    message = 'กรุณาติดต่อทีมงานเพื่อตรวจสอบสถานะบัญชีของคุณ'
  } else if (school?.status === 'pending') {
    icon = '⏳'
    title = 'รอการยืนยันการชำระเงิน'
    message = 'เราได้รับแจ้งการชำระเงินของคุณแล้ว ทีมงานกำลังตรวจสอบ ระบบจะเปิดใช้งานภายใน 24 ชั่วโมง'
  }

  const showPlans = school?.status !== 'pending'

  return (
    <div style={{
      minHeight: '100vh', background: C.cream, padding: '40px 24px',
      fontFamily: "'Noto Sans Thai', 'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 24 }}>
          Tutor<em style={{ fontStyle: 'italic', color: C.green }}>cloud</em>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: '32px 28px', textAlign: 'center', marginBottom: showPlans ? 20 : 0 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</h1>
          {school?.name && (
            <p style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 12 }}>{school.name}</p>
          )}
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, maxWidth: 460, margin: '0 auto' }}>
            {message}
          </p>
        </div>

        {showPlans && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
              {PLANS.map(p => (
                <div key={p.id} style={{
                  background: p.popular ? C.green : '#fff',
                  border: `1.5px solid ${p.popular ? C.green : C.border}`,
                  borderRadius: 14, padding: '22px 18px', textAlign: 'center', position: 'relative',
                }}>
                  {p.popular && (
                    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: C.gold, color: C.green, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                      ★ คุ้มที่สุด
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.popular ? 'rgba(255,255,255,.75)' : C.textMid, marginBottom: 6 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: p.popular ? '#fff' : C.text }}>
                    ฿{p.total.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: p.popular ? C.gold : C.textMid, marginTop: 4 }}>
                    เฉลี่ย ฿{p.perMonth.toLocaleString()}/เดือน
                  </div>
                  {p.save > 0 && (
                    <div style={{ fontSize: 11, color: p.popular ? 'rgba(255,255,255,.7)' : '#8a8478', marginTop: 6 }}>
                      ประหยัด ฿{p.save.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: '26px 24px', textAlign: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                สั่งซื้อหรือสอบถามได้ทาง LINE
              </h2>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.8, marginBottom: 18 }}>
                ทักมาบอกแพ็กเกจที่ต้องการ ทีมงานจะส่งช่องทางชำระเงินให้<br />
                เปิดใช้งานต่อทันทีหลังยืนยันการชำระเงิน
              </p>
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', background: '#06C755', color: '#fff', textDecoration: 'none', padding: '13px', borderRadius: 8, fontSize: 15, fontWeight: 600, maxWidth: 320, margin: '0 auto 14px' }}>
                เพิ่มเพื่อน LINE {LINE_ID}
              </a>
              <Link href="/login" style={{ fontSize: 13, color: C.textMid, textDecoration: 'none' }}>
                ← กลับหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </>
        )}

        {!showPlans && (
          <p style={{ textAlign: 'center', marginTop: 18 }}>
            <Link href="/login" style={{ fontSize: 13, color: C.textMid, textDecoration: 'none' }}>
              ← กลับหน้าเข้าสู่ระบบ
            </Link>
          </p>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: C.textMid, marginTop: 24 }}>
          TutorCloud — ระบบจัดการสถาบันสอนพิเศษ
        </p>
      </div>
    </div>
  )
}
