// src/app/staff/subscriptions/layout.tsx
// ยามป้องกันหน้าหลังบ้านของ TutorCloud — เฉพาะเจ้าของระบบ (mando) เท่านั้น
// ซ่อนเมนูอย่างเดียวไม่พอ เพราะลูกค้าพิมพ์ URL ตรงเข้ามาได้
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SubscriptionsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', user.id).single()

  if (profile?.school_id !== 'mando') redirect('/staff')

  return <>{children}</>
}
