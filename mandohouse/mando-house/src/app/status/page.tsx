// src/app/status/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const C = {
  cream: '#F5F0E8',
  green: '#1C3A2A',
  text: '#2C2C2C',
  textMid: '#6B6B6B',
  border: '#E2D9CC',
}

const TEL = '063-359-5978'

export default async function StatusPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', user.id).single()
  const schoolId = profile?.school_id

  // สถาบันเจ้าของระบบใช้งานได้ปกติ ไม่ต้องอยู่หน้านี้
  if (schoolId === 'mando') redirect('/staff')

  const { data: school } = await supabase
    .from('schools').select('name, status, expires_at').eq('id', schoolId ?? '').single()

  const today = new Date().toISOString().slice(0, 10)
  const isExpired = !!school?.expires_at && school.expires_at < today
  const status = school?.status ?? 'unknown'

  let icon = '⏳'
  let title = 'รอการอนุมัติ'
  let message =
    'เราได้รับข้อมูลการสมัครของคุณแล้ว ทีมงานกำลังตรวจสอบสลิปการชำระเงิน ' +
    'ระบบจะเปิดใช้งานภายใน 24 ชั่วโมง และจะแจ้งกลับทางเบอร์ที่คุณลงทะเบียนไว้'

  if (status === 'rejected') {
    icon = '❗'
    title = 'ไม่สามารถยืนยันการชำระเงินได้'
    message =
      'เราตรวจสอบแล้วไม่พบการชำระเงินที่ตรงกับข้อมูลที่ส่งมา ' +
      'กรุณาติดต่อทีมงานเพื่อตรวจสอบอีกครั้ง ข้อมูลของคุณยังอยู่ครบ'
  } else if (status === 'expired' || isExpired) {
    icon = '📅'
    title = 'หมดอายุการใช้งานแล้ว'
    message =
      'แพ็กเกจของสถาบันคุณสิ้นสุดลงแล้ว ต่ออายุเพื่อกลับมาใช้งานระบบจัดการนักเรียน ' +
      'ครู ตารางสอน และการเงินได้ตามปกติ ข้อมูลทั้งหมดของคุณยังอยู่ครบ'
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.cream, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: "'Noto Sans Thai', 'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 24 }}>
          Tutor<em style={{ fontStyle: 'italic', color: C.green }}>cloud</em>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, padding: '36px 28px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 10 }}>{title}</h1>

          {school?.name && (
            <p style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 12 }}>
              {school.name}
            </p>
          )}

          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 24 }}>
            {message}
          </p>

          <a
            href={`tel:${TEL.replace(/-/g, '')}`}
            style={{
              display: 'block', background: C.green, color: '#fff', textDecoration: 'none',
              padding: '13px', borderRadius: 8, fontSize: 15, fontWeight: 600, marginBottom: 12,
            }}
          >
            ติดต่อทีมงาน · {TEL}
          </a>

          <Link href="/login" style={{ display: 'inline-block', fontSize: 13, color: C.textMid, textDecoration: 'none' }}>
            ← กลับหน้าเข้าสู่ระบบ
          </Link>
        </div>

        <p style={{ fontSize: 12, color: C.textMid, marginTop: 20 }}>
          TutorCloud — ระบบจัดการสถาบันสอนพิเศษ
        </p>
      </div>
    </div>
  )
}
