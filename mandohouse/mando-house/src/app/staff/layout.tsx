import StaffSidebar from '@/components/layout/StaffSidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', user.id).single()
  const schoolId = profile?.school_id

  // mando (เจ้าของระบบ) ใช้ได้เสมอ — ตรวจเฉพาะสถาบันลูกค้า
  if (schoolId && schoolId !== 'mando') {
    const { data: school } = await supabase
      .from('schools').select('status, expires_at').eq('id', schoolId).single()

    const today = new Date().toISOString().slice(0, 10)
    const expired = !!school?.expires_at && school.expires_at < today

    // ผ่านได้เฉพาะสถานะ active และยังไม่หมดอายุ
    if (!school || school.status !== 'active' || expired) redirect('/status')
  }

  return (
    <div className="flex min-h-screen">
      <StaffSidebar />
      <main className="flex-1 overflow-auto bg-surface dark:bg-[#1a2030] pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
